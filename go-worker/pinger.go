package main

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"
)

// PingResult stores latency and protocol details
type PingResult struct {
	ProxyURL  string        `json:"proxy_url"`
	Alive     bool          `json:"alive"`
	LatencyMs int64         `json:"latency_ms"`
	IPVersion string        `json:"ip_version"`
	Error     string        `json:"error,omitempty"`
}

// DualStackPinger manages high-speed health-checks for IPv4 & IPv6 proxies
type DualStackPinger struct {
	Timeout time.Duration
}

// NewDualStackPinger constructs a pinger instance
func NewDualStackPinger(timeout time.Duration) *DualStackPinger {
	return &DualStackPinger{Timeout: timeout}
}

// PingProxy performs a raw TCP handshake to verify proxy responsiveness and determine DualStack stack
func (p *DualStackPinger) PingProxy(ctx context.Context, proxyURL string) PingResult {
	parsed, err := url.Parse(proxyURL)
	if err != nil {
		return PingResult{ProxyURL: proxyURL, Alive: false, Error: fmt.Sprintf("invalid URL: %v", err)}
	}

	host := parsed.Hostname()
	port := parsed.Port()
	if port == "" {
		if parsed.Scheme == "https" {
			port = "443"
		} else if parsed.Scheme == "http" {
			port = "80"
		} else if strings.HasPrefix(parsed.Scheme, "socks") {
			port = "1080"
		} else {
			port = "80"
		}
	}

	target := net.JoinHostPort(host, port)
	start := time.Now()

	dialer := net.Dialer{Timeout: p.Timeout}
	conn, err := dialer.DialContext(ctx, "tcp", target)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return PingResult{
			ProxyURL:  proxyURL,
			Alive:     false,
			LatencyMs: latency,
			Error:     err.Error(),
		}
	}
	defer conn.Close()

	// Detect whether remote address is IPv4 or IPv6
	ipVer := "IPv4"
	if tcpAddr, ok := conn.RemoteAddr().(*net.TCPAddr); ok {
		if tcpAddr.IP.To4() == nil && tcpAddr.IP.To16() != nil {
			ipVer = "IPv6"
		}
	}

	return PingResult{
		ProxyURL:  proxyURL,
		Alive:     true,
		LatencyMs: latency,
		IPVersion: ipVer,
	}
}
