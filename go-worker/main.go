package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"
	"syscall"
	"time"
)

type HeartbeatPayload struct {
	QuestID   string `json:"quest_id"`
	Timestamp int64  `json:"timestamp"`
	Platform  string `json:"platform"`
}

type HeartbeatResponse struct {
	Success   bool   `json:"success"`
	Progress  int    `json:"progress"`
	Completed bool   `json:"completed"`
	Message   string `json:"message,omitempty"`
}

// MultiQuestWorkerPool manages concurrent heartbeat goroutines
type MultiQuestWorkerPool struct {
	client      *http.Client
	apiURL      string
	token       string
	intervalSec int
	questIDs    []string
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
}

func NewWorkerPool(ctx context.Context, apiURL string, token string, intervalSec int, questIDs []string) *MultiQuestWorkerPool {
	subCtx, cancel := context.WithCancel(ctx)
	return &MultiQuestWorkerPool{
		client:      &http.Client{Timeout: 10 * time.Second},
		apiURL:      apiURL,
		token:       token,
		intervalSec: intervalSec,
		questIDs:    questIDs,
		ctx:         subCtx,
		cancel:      cancel,
	}
}

func (wp *MultiQuestWorkerPool) Start() {
	for _, qid := range wp.questIDs {
		wp.wg.Add(1)
		go wp.runQuestWorker(qid)
	}
}

func (wp *MultiQuestWorkerPool) Stop() {
	wp.cancel()
	wp.wg.Wait()
}

func (wp *MultiQuestWorkerPool) runQuestWorker(questID string) {
	defer wp.wg.Done()

	// Initial random jitter to stagger API calls
	jitterMs := rand.Intn(2000) + 500
	time.Sleep(time.Duration(jitterMs) * time.Millisecond)

	ticker := time.NewTicker(time.Duration(wp.intervalSec) * time.Second)
	defer ticker.Stop()

	// First heartbeat
	resp, err := sendHeartbeat(wp.client, wp.apiURL, questID, wp.token)
	if err == nil && resp.Success {
		fmt.Printf("✅ [WorkerPool:%s] Initial Heartbeat: Progress %d%%\n", questID, resp.Progress)
	}

	for {
		select {
		case <-wp.ctx.Done():
			return
		case <-ticker.C:
			// Adaptive Jitter: 1.5s - 3.5s (1500ms - 3500ms) chống Discord WAF
			time.Sleep(time.Duration(rand.Intn(2000)+1500) * time.Millisecond)
			resp, err := sendHeartbeat(wp.client, wp.apiURL, questID, wp.token)
			if err != nil {
				fmt.Printf("⚠️  [WorkerPool:%s] Heartbeat error: %v\n", questID, err)
			} else if resp.Success {
				fmt.Printf("📡 [WorkerPool:%s] Progress: %d%% | Completed: %v\n", questID, resp.Progress, resp.Completed)
			}
		}
	}
}

func sendHeartbeat(client *http.Client, apiURL string, questID string, token string) (*HeartbeatResponse, error) {
	payload := HeartbeatPayload{
		QuestID:   questID,
		Timestamp: time.Now().Unix(),
		Platform:  "desktop",
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal heartbeat payload: %w", err)
	}

	endpoint := fmt.Sprintf("%s/quests/%s/heartbeat", apiURL, questID)
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Discord-Client/v250 (Desktop; Windows 11)")
	cleanToken := strings.Trim(token, "\"' ")
	cleanToken = strings.TrimPrefix(cleanToken, "Bot ")
	if cleanToken != "" {
		req.Header.Set("Authorization", cleanToken)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var hbResp HeartbeatResponse
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		_ = json.Unmarshal(respBody, &hbResp)
		hbResp.Success = true
		return &hbResp, nil
	}

	return &HeartbeatResponse{
		Success: false,
		Message: fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody)),
	}, nil
}

func printMemoryUsage() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	allocMB := float64(m.Alloc) / 1024 / 1024
	sysMB := float64(m.Sys) / 1024 / 1024
	fmt.Printf("📊 [Go Memory] Alloc: %.2f MB | Sys: %.2f MB | Goroutines: %d (<5MB Peak Target)\n",
		allocMB, sysMB, runtime.NumGoroutine())
}

func main() {
	apiURL := flag.String("api", "https://discord.com/api/v9", "Discord or Proxy Base API URL")
	questIDsFlag := flag.String("quest-ids", "hyper-quest-demo,quest_valorant_30m", "Comma-separated Discord Quest IDs")
	proxyCheck := flag.String("proxy", "", "Optional Proxy URL to test with DualStack pinger")
	intervalSec := flag.Int("interval", 30, "Heartbeat interval in seconds")
	token := flag.String("token", "", "Discord User Authorization Token")
	harvestMode := flag.Bool("harvest", false, "Execute Ultra Deep Discord API Harvest and JSON export")
	flag.Parse()

	if *harvestMode {
		fmt.Println("============================================================")
		fmt.Println("   ⚡ HYPER AUTO FARM QUEST - ULTRA DEEP HARVESTER ⚡       ")
		fmt.Println("    Multi-Endpoint Concurrent Discord API Extraction        ")
		fmt.Println("============================================================")

		harvester := NewDeepDiscordHarvester(*apiURL, *token, 12*time.Second)
		res, err := harvester.ExecuteDeepHarvest(context.Background())
		if err != nil {
			fmt.Printf("❌ [Harvester] Extraction failed: %v\n", err)
			os.Exit(1)
		}

		outJSON, _ := json.MarshalIndent(res, "", "  ")
		_ = os.WriteFile("extracted_vault.json", outJSON, 0644)
		fmt.Printf("✔ [Harvester] Deep Harvest completed in %dms!\n", res.ScanDurationMs)
		fmt.Printf("📦 [Harvester] Quests: %d | Hidden: %d | Entitlements: %d | Risk: %s\n",
			len(res.Quests), len(res.HiddenQuests), len(res.Entitlements), res.SecurityStatus.RiskTier)
		fmt.Println("💾 [Harvester] Saved result to extracted_vault.json")
		return
	}

	fmt.Println("============================================================")
	fmt.Println("   ⚡ HYPER AUTO FARM QUEST - GO WORKER DAEMON v3.0.0 ⚡   ")
	fmt.Println("    Ultra-Low RAM WorkerPool & DualStack Proxy Pinger       ")
	fmt.Println("============================================================")

	// If proxy is passed, test with DualStack pinger
	if *proxyCheck != "" {
		pinger := NewDualStackPinger(3 * time.Second)
		res := pinger.PingProxy(context.Background(), *proxyCheck)
		if res.Alive {
			fmt.Printf("🌐 [DualStack Pinger] Proxy %s is ALIVE (%dms, %s)\n", res.ProxyURL, res.LatencyMs, res.IPVersion)
		} else {
			fmt.Printf("⚠️  [DualStack Pinger] Proxy %s FAILED: %s\n", res.ProxyURL, res.Error)
		}
	}

	questList := strings.Split(*questIDsFlag, ",")
	fmt.Printf("🎯 Active WorkerPool Quests: %d\n", len(questList))
	fmt.Printf("⏱  Interval                : %d seconds\n", *intervalSec)
	fmt.Printf("🌐 Base Endpoint           : %s\n", *apiURL)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool := NewWorkerPool(ctx, *apiURL, *token, *intervalSec, questList)
	pool.Start()
	fmt.Println("🚀 [Go Worker] WorkerPool active with concurrent Goroutines.")

	// Periodic garbage collection & memory trimmer
	go func() {
		ticker := time.NewTicker(45 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				debug.FreeOSMemory()
				printMemoryUsage()
			}
		}
	}()

	<-ctx.Done()
	fmt.Println("\n🛑 [Go Worker] Termination signal received. Stopping WorkerPool...")
	pool.Stop()
	fmt.Println("✔ [Go Worker] Graceful shutdown completed cleanly.")
}
