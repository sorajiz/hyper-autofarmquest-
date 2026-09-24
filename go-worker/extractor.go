package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// DeepExtractResult represents full extracted payload from Discord API
type DeepExtractResult struct {
	Timestamp       int64                  `json:"timestamp"`
	User            map[string]interface{} `json:"user"`
	Quests          []interface{}          `json:"quests"`
	HiddenQuests    []interface{}          `json:"hidden_quests"`
	Entitlements    []interface{}          `json:"entitlements"`
	Experiments     []interface{}          `json:"experiments"`
	Connections     []interface{}          `json:"connections"`
	ScanDurationMs  int64                  `json:"scan_duration_ms"`
	SecurityStatus  AccountSecurityStatus  `json:"security_status"`
	TotalDiscovered int                    `json:"total_discovered"`
}

type AccountSecurityStatus struct {
	EnrollmentBlocked bool   `json:"enrollment_blocked"`
	AccessSuspended   bool   `json:"access_suspended"`
	RiskTier          string `json:"risk_tier"`
}

// DeepDiscordHarvester manages high-throughput concurrent extraction
type DeepDiscordHarvester struct {
	client  *http.Client
	baseURL string
	token   string
}

func NewDeepDiscordHarvester(baseURL string, token string, timeout time.Duration) *DeepDiscordHarvester {
	return &DeepDiscordHarvester{
		client: &http.Client{
			Timeout: timeout,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     30 * time.Second,
			},
		},
		baseURL: baseURL,
		token:   token,
	}
}

func (h *DeepDiscordHarvester) fetchEndpoint(ctx context.Context, path string, extraHeaders map[string]string) ([]byte, int, error) {
	url := fmt.Sprintf("%s%s", h.baseURL, path)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, 0, err
	}

	cleanToken := strings.Trim(h.token, "\"' ")
	cleanToken = strings.TrimPrefix(cleanToken, "Bot ")
	req.Header.Set("Authorization", cleanToken)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9,vi;q=0.8")
	req.Header.Set("Referer", "https://discord.com/channels/@me")

	for k, v := range extraHeaders {
		req.Header.Set(k, v)
	}

	resp, err := h.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}

// ExecuteDeepHarvest runs multi-endpoint concurrent probe
func (h *DeepDiscordHarvester) ExecuteDeepHarvest(ctx context.Context) (*DeepExtractResult, error) {
	start := time.Now()
	result := &DeepExtractResult{
		Timestamp:    start.Unix(),
		Quests:       make([]interface{}, 0),
		HiddenQuests: make([]interface{}, 0),
		Entitlements: make([]interface{}, 0),
		Experiments:  make([]interface{}, 0),
		Connections:  make([]interface{}, 0),
		SecurityStatus: AccountSecurityStatus{
			RiskTier: "SAFE",
		},
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	endpoints := []struct {
		name string
		path string
	}{
		{"user", "/users/@me"},
		{"quests", "/quests/@me"},
		{"entitlements", "/users/@me/entitlements"},
		{"experiments", "/experiments"},
		{"connections", "/users/@me/connections"},
	}

	for _, ep := range endpoints {
		wg.Add(1)
		go func(name, path string) {
			defer wg.Done()
			body, code, err := h.fetchEndpoint(ctx, path, nil)
			if err != nil || code != 200 {
				return
			}

			mu.Lock()
			defer mu.Unlock()

			switch name {
			case "user":
				var u map[string]interface{}
				if json.Unmarshal(body, &u) == nil {
					result.User = u
				}
			case "quests":
				var qMap map[string]interface{}
				if json.Unmarshal(body, &qMap) == nil {
					if qList, ok := qMap["quests"].([]interface{}); ok {
						result.Quests = qList
					}
					if blocked, ok := qMap["quest_enrollment_blocked_until"]; ok && blocked != nil {
						result.SecurityStatus.EnrollmentBlocked = true
						result.SecurityStatus.RiskTier = "WARNING"
					}
					if suspended, ok := qMap["quest_access_suspended_until"]; ok && suspended != nil {
						result.SecurityStatus.AccessSuspended = true
						result.SecurityStatus.RiskTier = "CRITICAL"
					}
				}
			case "entitlements":
				var entList []interface{}
				if json.Unmarshal(body, &entList) == nil {
					result.Entitlements = entList
				}
			case "experiments":
				var expMap map[string]interface{}
				if json.Unmarshal(body, &expMap) == nil {
					if exps, ok := expMap["assignments"].([]interface{}); ok {
						result.Experiments = exps
					}
				}
			case "connections":
				var connList []interface{}
				if json.Unmarshal(body, &connList) == nil {
					result.Connections = connList
				}
			}
		}(ep.name, ep.path)
	}

	// Platform matrix probe for unlisted/hidden quests
	platforms := []struct {
		os     string
		locale string
	}{
		{"Windows", "en-US"},
		{"Android", "vi-VN"},
		{"iOS", "ja-JP"},
		{"Xbox", "en-GB"},
	}

	for _, p := range platforms {
		wg.Add(1)
		go func(osVal, locVal string) {
			defer wg.Done()
			headers := map[string]string{
				"x-discord-locale": locVal,
			}
			body, code, err := h.fetchEndpoint(ctx, "/quests/@me", headers)
			if err != nil || code != 200 {
				return
			}

			var qMap map[string]interface{}
			if json.Unmarshal(body, &qMap) == nil {
				if qList, ok := qMap["quests"].([]interface{}); ok {
					mu.Lock()
					for _, rawQ := range qList {
						result.HiddenQuests = append(result.HiddenQuests, rawQ)
					}
					mu.Unlock()
				}
			}
		}(p.os, p.locale)
	}

	wg.Wait()

	result.ScanDurationMs = time.Since(start).Milliseconds()
	result.TotalDiscovered = len(result.Quests) + len(result.HiddenQuests)

	return result, nil
}
