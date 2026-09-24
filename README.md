# ⚡ Hyper AutoFarm Quest Discord (v3.3.0 - Polyglot Ultra Matrix)

<p align="center">
  <b>Hệ thống tự động hóa hoàn thành nhiệm vụ Discord Quests & cày Orbs toàn diện, kiến trúc Polyglot Monorepo đa ngôn ngữ (Node.js/TypeScript, C# .NET 8, C++ Native, Rust, Go, Python FastAPI, Next.js, Vue 3) kết hợp Discord Components V2, ngụy trang TLS, xoay vòng proxy Dual-Stack, giải quyết thử thách Captcha và giao diện điều khiển đa kênh.</b><br>
  <i>State-of-the-art Discord Quest & Orbs automation matrix featuring Polyglot Monorepo architecture, Discord Components V2 Container layout, Markterence C#/C++/Rust native dummy process sleepers, Go ultra-low RAM concurrent worker pool & DualStack pinger, Python FastAPI WebSocket streamer, Next.js + Vue 3 Cyberpunk dashboards, and 1-click Docker Compose.</i>
</p>

---

## 🏗️ Kiến Trúc Hệ Sinh Thái Polyglot (Monorepo Architecture)

```
hyper-autofarmquest-/
├── bot.ts                   # Main CLI (Node.js & TS) - Banner "Auto Hyper - Farm Orb"
├── src/                     # Core TS engine (client, traffic, quest, questManager)
│   ├── core/                # UltraDiscordExtractor & Platform Matrix Scanner
│   ├── remote/              # Discord Remote Controller Bot (Discord Components V2)
│   ├── ui/                  # Interactive Blessed TUI Dashboard
│   └── native/              # 3-Tier Dynamic Native Addon Loader & Markterence Completer
├── code.js                  # One-click Discord DevTools Console Script
├── csharp-runner/           # C# .NET 8 Native WinAPI Game Sleeper & Windows Named Pipe IPC Client
├── native/                  # C++ Native Subsystem (Node-API Addon & Standalone Win32 Named Pipe Helper)
├── rust-engine/             # Rust Native Dummy Game Sleeper & Discord Extractor Vault Parser
├── go-worker/               # Golang Ultra-Low RAM WorkerPool & Deep Discord API Harvester (<5MB RAM)
├── python-service/          # Python 3.12 + FastAPI REST API & Real-Time WebSocket Broadcaster (/ws/live)
├── web-dashboard/           # Next.js 14 Cyberpunk Neon Dark Mode Mission Control UI
├── vue-dashboard/           # Vue 3 / Vite Cyberpunk High-Speed Mission Control Dashboard
├── docker-compose.yml       # 1-Click Multi-Service Orchestration (6 Microservices)
└── tests/                   # 19 Automated Test Suites (100% Pass)
```

---

## ✨ Tính Năng Nổi Bật (Features)

1. 🎯 **C# .NET 8 Native Runner (`csharp-runner/`)**:
   - Sử dụng Win32 Native API (`kernel32.dll` & `psapi.dll`) tối ưu dung lượng RAM cực tiểu.
   - Kết nối trực tiếp Windows Named Pipe `\\.\pipe\discord-ipc-0` xử lý framing nhị phân Opcode 0 (Handshake) và Opcode 1 (`SET_ACTIVITY`).
   - Tự động tạo thư mục game dummy `games/<app_id>/<exe_name>.exe` mô phỏng theo `markterence`.

2. ⚙️ **C++ Native Subsystem (`native/`)**:
   - **Tier 1 (Node-API Addon)**: `SpoofedFetch` (giả lập JA4 TLS Chrome fingerprint) và `TestProxySocket` kiểm tra TCP raw socket latency.
   - **Tier 2 (Standalone Helper)**: `sleeper.cpp` viết bằng Win32 C++ thuần, kết nối Named Pipe Discord qua `CreateFileA` / `WriteFile`.

3. 💚 **Vue 3 / Vite Mission Control (`vue-dashboard/`)**:
   - Giao diện người dùng Web siêu mượt phong cách Cyberpunk Neon Dark Mode.
   - Bảng theo dõi Orbs Counter, thẻ tiến độ nhiệm vụ thời gian thực, nút 1-click kích hoạt Markterence Dummy Process Sleeper.

4. 🐹 **Golang Ultra-Low RAM WorkerPool & DualStack Pinger (`go-worker/`)**:
   - `MultiQuestWorkerPool`: Điều phối đa nhiệm vụ song song bằng Goroutines với độ trễ so le (Staggered Jitter 1.2s - 2.5s).
   - `DualStackPinger`: Đo độ trễ kết nối TCP proxy và tự động nhận diện chuẩn IPv4 hoặc IPv6.
   - Bộ dọn rác chủ động `debug.FreeOSMemory()` duy trì mức tiêu thụ RAM < 5MB.

5. 🤖 **Discord Remote Bot với Discord Components V2**:
   - Ứng dụng cờ `flags: 1 << 15` (`32768`), Container Layout viền Blurple và 4 Button tương tác trực tiếp (`Auto Farm`, `Claim`, `Rotate Proxy`, `Rescan`).

6. 🦀 **Rust Native Engine (`rust-engine/`)**:
   - Kế thừa kỹ thuật từ `markterence/discord-quest-completer`, kết nối Windows Named Pipe và tạo game dummy runner.

7. 🐍 **Python FastAPI & Real-Time WebSocket (`python-service/`)**:
   - REST endpoints: `/api/status`, `/api/quests`, `/api/farm`, `/api/claim`, `/api/orbs`.
   - WebSocket `/ws/live` stream trực tiếp tiến độ cho cả 2 giao diện Next.js và Vue 3.

8. ⚡ **Ultra Deep Discord API Extractor & Vault Harvester (`src/core/ultraExtractor.ts` & `go-worker/extractor.go`)**:
   - **Đa chiều (Multi-Endpoint Scanning)**: Quét đồng thời `/users/@me`, `/quests/@me`, `/users/@me/entitlements`, `/experiments`, `/users/@me/connections`, `/discovery`.
   - **Trích xuất sâu không giới hạn**: Phát hiện các nhiệm vụ ẩn bị khóa vùng/thiết bị, kho quà tặng/keys đã nhận (Nitro, Game Passes, Steam keys), và các tính năng beta thử nghiệm (A/B testing experiments).
   - **Đánh giá rủi ro tài khoản (Security Risk Audit)**: Kiểm tra trạng thái khóa nhiệm vụ (`quest_enrollment_blocked_until`, `quest_access_suspended_until`) và xuất báo cáo an toàn.
   - **Tự động lưu trữ (Vault Export)**: Xuất toàn bộ dữ liệu cấu trúc sạch vào `vault/discord_vault_audit.json`.

---

## 🚀 Khởi Chạy 1 Lệnh Duy Nhất (1-Click Universal Launcher)

Chỉ cần chạy **1 lệnh duy nhất** để hệ thống vừa tự động tải thư viện, vừa nạp module, vừa hiển thị menu 3 chế độ lựa chọn:

### Trên Windows:
Nhấp đúp chuột vào file `start.bat` hoặc chạy:
```cmd
start.bat
```

### Trên Linux / macOS:
```bash
chmod +x start.sh
./start.sh
```

### Qua Node.js / NPM:
```bash
npm start
```

---

### 🎛️ Menu Lựa Chọn 3 Chế Độ Tự Động (Auto-Adaptive):

Khi chạy lệnh trên, màn hình Terminal sẽ hiện Banner nghệ thuật ASCII `Auto Hyper - Farm Orb` cùng 3 chế độ:

1. **`[1] 🤖 Discord Remote Bot`**:
   - Nếu chưa cài Bot Token, Terminal sẽ yêu cầu nhập trực tiếp Bot Token của bạn.
   - Khởi động Bot Discord điều khiển từ xa qua Slash Commands (`/status`, `/farm`, `/claim`, `/proxy`) với chuẩn **Discord Components V2** (Container + Buttons).

2. **`[2] 🖥️  Terminal Interactive Dashboard`**:
   - Hiển thị Banner ASCII `Auto Hyper - Farm Orb`.
   - Nếu chưa nhập User Token trong `.env`, Terminal sẽ xuất hiện hộp nhập `👉 Nhập Discord User Token của bạn:` để bắt đầu ngay lập tức.
   - Bảng TUI real-time, phím tắt `r` (rescan), `p` (rotate proxy), `q` (thoát an toàn).

3. **`[3] 🌐 Localhost Web Dashboard (Tự Thích Nghi)`**:
   - Tự động kiểm tra môi trường PC, khởi động Web Dashboard (Next.js / Vue 3 / Python API) tại `http://localhost:3000`.
   - **Tự động mở trình duyệt mặc định** của bạn ngay lập tức!

---

### 3. Khởi chạy bằng Docker Compose (Đa vi dịch vụ)

```bash
docker compose up -d
```

- **Next.js Web Dashboard**: `http://localhost:3000`
- **Vue 3 Web Dashboard**: `http://localhost:5173`
- **Python REST & WebSocket API**: `http://localhost:8000`

---

### 4. Khởi chạy cục bộ từng thành phần

#### C# .NET 8 Runner
```bash
cd csharp-runner
dotnet run -- --app-id 1098679090623692880 --game Valorant --duration 900
```

#### C++ Helper Binary
```bash
cd native/helper
g++ -O3 sleeper.cpp -o discord_helper.exe
./discord_helper.exe --app-id 1098679090623692880 --game-name Valorant --duration 900
```

#### Vue 3 / Vite Mission Control
```bash
cd vue-dashboard
npm install
npm run dev
# Truy cập http://localhost:5173
```

#### Go Worker Daemon & DualStack Pinger
```bash
cd go-worker
go run . -proxy=http://127.0.0.1:1080 -interval=30
```

#### Rust Native Engine
```bash
cd rust-engine
cargo run -- --app-id 1098679090623692880 --game-name "Valorant" --duration 900
```

#### Node.js Core CLI & Terminal TUI
```bash
npm start
```

---

## 🧪 Kiểm Thử Tự Động (17/17 Test Suites Passed)

```bash
# Chạy toàn bộ 17 bộ test suite:
npm test

# Kiểm tra tĩnh kiểu TypeScript:
npm run typecheck
```

**Danh sách 17 bộ test:**
1. `tests/banner.test.ts` - Kiểm tra Banner ASCII `Auto Hyper - Farm Orb`.
2. `tests/nativeLoader.test.ts` - Kiểm tra Dynamic 3-Tier Native Loader.
3. `tests/proxyPool.test.ts` - Kiểm tra Proxy Pool Dual-Stack IPv4/IPv6 & Failover.
4. `tests/captcha.test.ts` - Kiểm tra Captcha Pipeline & Solver Adapter.
5. `tests/scanner.test.ts` - Kiểm tra Hidden Quests Scanner Platform Matrix.
6. `tests/tui.test.ts` - Kiểm tra Interactive Blessed TUI Dashboard.
7. `tests/discordBot.test.ts` - Kiểm tra Discord Remote Controller Bot logic.
8. `tests/codeScript.test.ts` - Kiểm tra file `code.js` cho Console DevTools.
9. `tests/componentsV2.test.ts` - Kiểm tra Discord Components V2 (`flags: 1 << 15`).
10. `tests/rustEngine.test.ts` - Kiểm tra Rust Native Engine & Discord IPC Named Pipe.
11. `tests/goWorker.test.ts` - Kiểm tra Go WorkerPool & DualStack Pinger.
12. `tests/pythonService.test.ts` - Kiểm tra FastAPI REST & WebSocket Broadcaster.
13. `tests/webDashboard.test.ts` - Kiểm tra Next.js Cyberpunk Web Dashboard.
14. `tests/markterence.test.ts` - Kiểm tra Markterence Dummy Process Completer.
15. `tests/csharpRunner.test.ts` - Kiểm tra C# .NET 8 WinAPI Runner & Named Pipe IPC.
16. `tests/nativeCpp.test.ts` - Kiểm tra C++ Native Addon & Win32 IPC Helper.
17. `tests/vueDashboard.test.ts` - Kiểm tra Vue 3 / Vite Mission Control UI.

---

## ⚙️ Cấu Hình Môi Trường (`.env`)

```env
# Discord User Token (Bắt buộc cho cày nhiệm vụ)
TOKEN=your_discord_user_token

# Dual-Stack Proxy (Tùy chọn)
PROXIES=http://user:pass@1.2.3.4:8080,socks5://5.6.7.8:1080

# Captcha Solver API Key (Tùy chọn)
CAPSOLVER_API_KEY=
TWOCAPTCHA_API_KEY=

# Discord Remote Controller Bot (Official Bot Credentials)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_ID=1552658898937446400

# Tuỳ chọn tự động
AUTO_ENROLL=true
AUTO_CLAIM=true
```

---

## 📄 Bản Quyền & Giấy Phép (License)

Phát triển bởi `sorajiz` - Phát hành dưới giấy phép MIT License.
