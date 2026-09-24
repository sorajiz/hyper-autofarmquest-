# ⚡ Hyper AutoFarm Quest Discord (v3.0.0 - Polyglot Ecosystem)

<p align="center">
  <b>Hệ thống tự động hóa hoàn thành nhiệm vụ Discord Quests & cày Orbs toàn diện, kiến trúc Polyglot đa ngôn ngữ (Node.js/TypeScript, Rust, Go, Python FastAPI, Next.js) kết hợp Discord Components V2, ngụy trang TLS, xoay vòng proxy Dual-Stack, giải quyết thử thách Captcha và giao diện điều khiển đa kênh.</b><br>
  <i>State-of-the-art Discord Quest & Orbs automation engine featuring Polyglot Monorepo architecture, Discord Components V2 Container layout, Rust native dummy process sleeper, Go ultra-low RAM daemon (<10MB), Python FastAPI WebSocket streamer, Next.js Cyberpunk dark dashboard, and 1-click Docker Compose.</i>
</p>

---

## 🏗️ Kiến Trúc Hệ Sinh Thái Polyglot (Monorepo Architecture)

```
hyper-autofarmquest-/
├── bot.ts                   # Main CLI (Node.js & TS) - Banner "Auto Hyper - Farm Orb"
├── src/                     # Core TS engine (client, traffic, quest, questManager)
│   ├── remote/              # Discord Remote Controller Bot (Discord Components V2)
│   ├── ui/                  # Interactive Blessed TUI Dashboard
│   └── native/              # 3-Tier Dynamic Native Addon Loader
├── code.js                  # One-click Discord DevTools Console Script
├── rust-engine/             # Rust Native Dummy Game Sleeper & Discord IPC Named Pipe (\\.\pipe\discord-ipc-0)
├── go-worker/               # Golang Ultra-Low RAM Background Heartbeat Daemon (<10MB RAM)
├── python-service/          # Python 3.12 + FastAPI REST API & Real-Time WebSocket Broadcaster (/ws/live)
├── web-dashboard/           # Next.js 14 Cyberpunk Neon Dark Mode Mission Control UI
├── docker-compose.yml       # 1-Click Multi-Service Orchestration
└── tests/                   # 13 Automated Test Suites (100% Pass)
```

---

## ✨ Tính Năng Nổi Bật (Features)

1. 🤖 **Discord Remote Bot với Discord Components V2**:
   - Ứng dụng chuẩn tương tác mới nhất của Discord: `flags: 1 << 15` (`32768`).
   - Giao diện **Container Layout** viền Blurple hiện đại thay thế Embed truyền thống.
   - 4 ActionRow Buttons tương tác trực tiếp: `[⚡ Auto Farm]`, `[🎁 Nhận Quà (Claim)]`, `[🔄 Đổi Proxy]`, `[🔍 Quét Ẩn]`.

2. 🦀 **Rust Native Engine (`rust-engine/`)**:
   - Kế thừa kỹ thuật mô phỏng tiến trình từ `markterence/discord-quest-completer`.
   - Kết nối trực tiếp với Windows Named Pipe `\\.\pipe\discord-ipc-0` gửi khung tin RPC `SET_ACTIVITY`.
   - Tạo file dummy sleeper giả lập game Verified, tối ưu thời gian chơi không chiếm CPU.

3. 🐹 **Go Ultra-Low RAM Daemon (`go-worker/`)**:
   - Chạy nền bằng Goroutines bất đồng bộ với mức tiêu thụ RAM cực thấp (< 10MB).
   - Tự động duy trì nhịp Heartbeat đều đặn và ngắt an toàn khi nhận tín hiệu OS.

4. 🐍 **Python FastAPI & Real-Time WebSocket (`python-service/`)**:
   - Cung cấp REST endpoints: `/api/status`, `/api/quests`, `/api/farm`, `/api/claim`, `/api/orbs`.
   - WebSocket `/ws/live` phát sóng tiến độ theo từng giây cho Web Dashboard.

5. 🌌 **Next.js Cyberpunk Neon Web Dashboard (`web-dashboard/`)**:
   - Thiết kế giao diện Dark Mode Glassmorphism cao cấp, bảng đếm Orbs phát sáng.
   - Thẻ tiến độ từng nhiệm vụ (STREAM, PLAY, VIDEO) với thanh phần trăm mượt mà.
   - Các nút bấm 1-click thao tác nhanh chóng và responsive trên mọi thiết bị.

6. 🌐 **Dual-Stack Proxy Pool (IPv4 / IPv6) & Failover**:
   - Hỗ trợ HTTP, HTTPS, SOCKS5 (xác thực user/password).
   - Tự động nhận diện IPv4 / IPv6 và failover khi proxy gặp sự cố.

7. 🧩 **Captcha Challenge Pipeline**:
   - Tự động nhận diện HTTP 400 kèm `captcha_sitekey` từ Discord.
   - Tích hợp CapSolver, 2Captcha và CLI manual fallback.

8. 🖥️ **Terminal Interactive TUI Dashboard**:
   - Banner nghệ thuật ASCII `Auto Hyper - Farm Orb`.
   - Phím tắt tương tác trực tiếp (`r` để rescan, `p` để đổi proxy, `q` để thoát an toàn).

---

## 🚀 Khởi Chạy Nhanh (Quick Start)

### Lựa chọn A: Khởi chạy toàn bộ bằng Docker Compose (Khuyên dùng)

Chỉ với 1 câu lệnh duy nhất để khởi động toàn bộ hệ sinh thái:

```bash
docker compose up -d
```

- Web Dashboard sẽ sẵn sàng tại: `http://localhost:3000`
- Python REST & WebSocket API tại: `http://localhost:8000`

---

### Lựa chọn B: Chạy cục bộ từng module

#### 1. Core CLI & TUI Dashboard (Node.js & TypeScript)

```bash
# Cài đặt thư viện
npm install

# Khởi chạy giao diện Terminal TUI:
npm start

# Hoặc chế độ Headless cho VPS:
npm start -- --headless
```

#### 2. Rust Native Game Sleeper & Discord IPC

```bash
cd rust-engine
cargo run -- --app-id 1098679090623692880 --game-name "Valorant" --duration 900
```

#### 3. Go Ultra-Low RAM Daemon

```bash
cd go-worker
go run main.go -quest-id "hyper-quest-demo" -interval 30
```

#### 4. Python FastAPI Backend & WebSocket

```bash
cd python-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

#### 5. Next.js Cyberpunk Web Dashboard

```bash
cd web-dashboard
npm install
npm run dev
# Truy cập http://localhost:3000
```

#### 6. Chạy trực tiếp trên Console DevTools của Discord ([`code.js`](code.js))

Mở Discord Desktop Client, nhấn `Ctrl + Shift + I` (hoặc `F12`), dán nội dung file [`code.js`](code.js) vào Console và bấm Enter để tự động hoàn thành tất cả nhiệm vụ hiện có!

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Verification)

Dự án bao gồm 13 bộ kiểm thử tự động toàn diện:

```bash
# Chạy toàn bộ 13 bộ test suite:
npm test

# Kiểm tra tĩnh kiểu TypeScript:
npm run typecheck
```

**Danh sách 13 bộ test:**
1. `tests/banner.test.ts` - Kiểm tra hiển thị ASCII Banner `Auto Hyper - Farm Orb`.
2. `tests/nativeLoader.test.ts` - Kiểm tra bộ nạp Dynamic 3-Tier Native Loader.
3. `tests/proxyPool.test.ts` - Kiểm tra Proxy Pool Dual-Stack IPv4/IPv6 & Failover.
4. `tests/captcha.test.ts` - Kiểm tra Captcha Challenge Pipeline & Solver Adapter.
5. `tests/scanner.test.ts` - Kiểm tra Hidden Quests Discovery Scanner Platform Matrix.
6. `tests/tui.test.ts` - Kiểm tra Interactive Blessed TUI Dashboard.
7. `tests/discordBot.test.ts` - Kiểm tra Discord Remote Controller Bot logic.
8. `tests/codeScript.test.ts` - Kiểm tra cú pháp và độ hoàn thiện của file `code.js`.
9. `tests/componentsV2.test.ts` - Kiểm tra Discord Components V2 Container & Buttons payload (`flags: 1 << 15`).
10. `tests/rustEngine.test.ts` - Kiểm tra cấu trúc Rust Engine & Game Sleeper binary.
11. `tests/goWorker.test.ts` - Kiểm tra cấu trúc Go daemon & hàm `sendHeartbeat`.
12. `tests/pythonService.test.ts` - Kiểm tra FastAPI endpoints & WebSocket broadcaster.
13. `tests/webDashboard.test.ts` - Kiểm tra cấu trúc giao diện Next.js Web Dashboard.

---

## ⚙️ Cấu Hình Môi Trường (`.env`)

Sao chép file `.env.example` thành `.env` và điền cấu hình:

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
Mọi đóng góp, báo cáo lỗi hoặc yêu cầu tính năng xin vui lòng mở Issue hoặc Pull Request trên GitHub.
