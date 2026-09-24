package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"runtime"
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
	if token != "" {
		req.Header.Set("Authorization", token)
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
	fmt.Printf("📊 [Go Memory] Alloc: %.2f MB | Sys: %.2f MB | Goroutines: %d (<10MB Target)\n",
		allocMB, sysMB, runtime.NumGoroutine())
}

func main() {
	apiURL := flag.String("api", "https://discord.com/api/v9", "Discord or Proxy Base API URL")
	questID := flag.String("quest-id", "hyper-quest-demo", "Target Discord Quest ID")
	intervalSec := flag.Int("interval", 30, "Heartbeat interval in seconds")
	token := flag.String("token", "", "Discord User Authorization Token")
	flag.Parse()

	fmt.Println("============================================================")
	fmt.Println("   ⚡ HYPER AUTO FARM QUEST - GO WORKER DAEMON v3.0.0 ⚡   ")
	fmt.Println("      Ultra-Low RAM Background Heartbeat Runner (<10MB)     ")
	fmt.Println("============================================================")
	fmt.Printf("🎯 Quest Target: %s\n", *questID)
	fmt.Printf("⏱  Interval    : %d seconds\n", *intervalSec)
	fmt.Printf("🌐 Endpoint    : %s\n", *apiURL)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	ticker := time.NewTicker(time.Duration(*intervalSec) * time.Second)
	defer ticker.Stop()

	// Initial heartbeat immediately
	fmt.Println("🚀 [Go Worker] Dispatching initial heartbeat...")
	resp, err := sendHeartbeat(client, *apiURL, *questID, *token)
	if err != nil {
		fmt.Printf("⚠️  [Go Worker] Initial heartbeat notification: %v\n", err)
	} else if resp.Success {
		fmt.Printf("✅ [Go Worker] Heartbeat accepted: Progress %d%%\n", resp.Progress)
	}
	printMemoryUsage()

	fmt.Println("🔄 [Go Worker] Background daemon running. Press Ctrl+C to terminate.")

	for {
		select {
		case <-ctx.Done():
			fmt.Println("\n🛑 [Go Worker] Termination signal received. Graceful shutdown complete.")
			return
		case <-ticker.C:
			fmt.Printf("📡 [Go Worker] Tick at %s - sending heartbeat...\n", time.Now().Format("15:04:05"))
			resp, err := sendHeartbeat(client, *apiURL, *questID, *token)
			if err != nil {
				fmt.Printf("⚠️  [Go Worker] Send error: %v\n", err)
			} else if resp.Success {
				fmt.Printf("✅ [Go Worker] Heartbeat response: Progress=%d%% Completed=%v\n", resp.Progress, resp.Completed)
			} else {
				fmt.Printf("ℹ️  [Go Worker] Response info: %s\n", resp.Message)
			}
			printMemoryUsage()
		}
	}
}
