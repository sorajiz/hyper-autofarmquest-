# 🏛️ Đặc Tả Kiến Trúc Hệ Thống: Hyper AutoFarm Quest (Master Spec)

- **Ngày ban hành**: 2026-09-24
- **Dự án**: `hyper-autofarmquest-`
- **Phiên bản thiết kế**: 2.0.0 (Architectural Overhaul)
- **Tác giả / Duyệt**: Antigravity & User

---

## 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU

Dự án `hyper-autofarmquest-` là hệ thống tự động hóa hoàn thành nhiệm vụ Discord Quests cao cấp, tích hợp ngụy trang TLS, xoay vòng proxy, giải quyết thử thách Captcha và giao diện điều khiển đa kênh.

### Mục tiêu cốt lõi:
1. **Kiến trúc 3-Tier Native Engine**:
   - **Tier 1 (C++ Addon - `native/addon/`)**: Giả lập dấu vân tay TLS (JA3/JA4, HTTP/2 settings, Cipher suites) chuẩn Discord Client và raw TCP SOCKS5 tunnel với Remote DNS.
   - **Tier 2 (Standalone Helper Binary - `native/helper/`)**: File thực thi độc lập kết nối Discord IPC Named Pipe (`\\.\pipe\discord-ipc-0`) và chạy Dummy Game Sleeper mô phỏng Discord Verified Game.
   - **Tier 3 (Pure TypeScript Fallback)**: Tự động kích hoạt khi môi trường thiếu build tools C++, đảm bảo 100% người dùng chạy lệnh `npm start` là hoạt động ngay không bao giờ crash.
2. **Proxy Dual-Stack (IPv4 / IPv6) & Traffic Control**:
   - Quản lý Pool Proxy đa giao thức (HTTP, HTTPS, SOCKS5).
   - Xoay dải IPv6 /64 hoặc IPv4 residential, ping kiểm tra trước khi gửi request nhạy cảm, tự động failover sang proxy dự phòng nếu đứt kết nối.
   - `TrafficEngine` điều tiết nhịp gửi request so le (Staggered Jitter 1.2s - 2.5s) kèm thuật toán Exponential Backoff chống HTTP 429.
3. **Engine Quét Nhiệm Vụ Ẩn (Hidden Quests Scanner)**:
   - Giả lập ma trận nền tảng (Platform Matrix Spoofing): Desktop (Windows, macOS), Mobile (Android, iOS), Console (PlayStation 5, Xbox Series X).
   - Xoay vòng vùng địa lý (Geo-targeting) qua `X-Discord-Locale` và `Accept-Language` để mở khóa nhiệm vụ theo khu vực.
4. **Captcha Pipeline Đa Năng**:
   - Tự động phát hiện lỗi HTTP 400 kèm `captcha_sitekey`, `captcha_rqdata`.
   - Kết nối API Solver: CapSolver, 2Captcha, Anti-Captcha.
   - Dự phòng thủ công (CLI Manual Fallback): Hiển thị URL xác thực hoặc mở web view cục bộ để nhập token khi không dùng solver trả phí.
5. **Giao Diện Đa Chế Độ (Multi-Interface)**:
   - **Terminal Interactive TUI**: ASCII Banner nghệ thuật `Auto Hyper - Farm Orb`, bảng trạng thái real-time, phím tắt hotkeys (`r`: quét ẩn, `p`: đổi proxy, `q`: thoát an toàn).
   - **Discord Remote Controller Bot**: Tự động kích hoạt khi có `DISCORD_BOT_TOKEN`, nhận lệnh Slash Commands (`/status`, `/farm`, `/claim`, `/proxy`) từ Discord riêng tư.
   - **Headless Mode (`--headless`)**: Chạy ngầm tối ưu cho VPS/Server.
   - **Discord DevTools Script**: File [`code.js`](file:///c:/Users/ADMIN/.gemini/antigravity-ide/scratch/hyper-autofarmquest-/code.js) chạy 1-click trực tiếp trong Console Discord Desktop.

---

## 2. KIẾN TRÚC CHI TIẾT & SƠ ĐỒ LUỒNG DỮ LIỆU

```mermaid
graph TD
    subgraph UI_Layer ["Giao Diện Điều Khiển"]
        TUI["Terminal TUI (Banner 'Auto Hyper - Farm Orb' + Hotkeys)"]
        DC_Bot["Discord Remote Controller Bot (Slash Commands)"]
        DevTools["code.js (DevTools Console)"]
    end

    subgraph Core_Engine ["Core Orchestrator (TypeScript)"]
        NativeLoader["Dynamic Native Loader (Tier 1 -> Tier 2 -> Tier 3)"]
        QM["Quest State Machine & Manager"]
        Traffic["TrafficEngine (Staggered Jitter & Backoff)"]
        Scanner["Hidden Quests Discovery Scanner"]
        ProxyMgr["Dual-Stack Proxy Pool (IPv4/IPv6 Failover)"]
        Captcha["Captcha Pipeline (CapSolver/2Captcha/CLI Fallback)"]
    end

    subgraph Execution_Tiers ["Các Tầng Thực Thi"]
        T1["Tier 1: C++ Node-API Addon (TLS JA4 / SOCKS5 Raw)"]
        T2["Tier 2: Standalone Helper Binary (Discord IPC Pipe & Sleeper)"]
        T3["Tier 3: Pure TypeScript Engine (Undici & IPC fallback)"]
    end

    subgraph External_Network ["Hạ Tầng Bên Ngoài"]
        DiscordAPI["Discord REST API & Gateway WSS"]
        Proxies["Proxy Pool (IPv4/IPv6)"]
        SolverAPIs["Captcha Solvers (CapSolver, 2Captcha)"]
    end

    TUI <--> QM
    DC_Bot <--> QM
    QM --> Traffic
    QM --> Scanner
    Traffic --> NativeLoader
    NativeLoader -->|Ưu tiên 1| T1
    NativeLoader -->|Ưu tiên 2| T2
    NativeLoader -->|Dự phòng| T3
    T1 <--> Proxies
    T3 <--> Proxies
    Proxies <--> DiscordAPI
    Captcha <--> SolverAPIs
    QM <--> Captcha
```

---

## 3. CÁC MODULE CHI TIẾT (COMPONENT SPECIFICATIONS)

### 3.1. Dynamic Native Loader & 3-Tier Execution (`src/native/`)
- `NativeLoader.ts`:
  - Kiểm tra xem file addon `native/build/Release/hyper_native.node` có tồn tại không. Nếu có, kích hoạt **Tier 1**.
  - Kiểm tra xem file helper executable `native/bin/discord_helper.exe` (hoặc binary trên Linux) có tồn tại không. Nếu có, kích hoạt **Tier 2**.
  - Nếu cả hai không khả dụng, kích hoạt **Tier 3 (Pure TypeScript Engine)**.
- Giao diện nạp thống nhất: Cả 3 tầng đều implement chung interface `INativeEngine` (hỗ trợ `spoofedFetch`, `simulateActivityIPC`, `launchDummySleeper`).

### 3.2. Proxy Pool & Dual-Stack Manager (`src/network/proxyPool.ts`)
- Quản lý danh sách proxy nạp từ `.env` (chuỗi phân cách bởi dấu phẩy) hoặc file `proxies.txt`.
- Hỗ trợ format: `http://user:pass@host:port`, `socks5://host:port`.
- Phân loại IPv4 / IPv6 tự động.
- Phương thức `getHealthyProxy()`: Trả về proxy có độ trễ tốt nhất và chưa bị rate-limit.
- Phương thức `markBad(proxy, duration)`: Tạm khóa proxy chết trong khoảng thời gian nhất định và kích hoạt failover.

### 3.3. Captcha Challenge Pipeline (`src/security/captcha.ts`)
- Lắng nghe response từ endpoint `/quests/{id}/enroll` và `/quests/{id}/claim`.
- Khi gặp HTTP 400 kèm payload JSON:
  ```json
  {
    "captcha_key": ["response_is_invalid"],
    "captcha_sitekey": "f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34",
    "captcha_service": "hcaptcha",
    "captcha_rqdata": "..."
  }
  ```
- Pipeline kiểm tra cấu hình:
  - Nếu `CAPSOLVER_API_KEY` hoặc `TWOCAPTCHA_API_KEY` có giá trị: Gửi task sang nhà cung cấp và chờ lấy `captcha_key`.
  - Nếu không có API key: In thông báo ra màn hình TUI kèm link giải quyết cục bộ hoặc chờ người dùng dán token trực tiếp.

### 3.4. Hidden Quests Discovery Scanner (`src/core/scanner.ts`)
- Chu kỳ quét: Khi khởi động hoặc khi người dùng bấm phím `r` trên TUI / gõ lệnh `/quests` trên Discord Bot.
- Thuật toán xoay vòng cấu hình siêu thuộc tính (`X-Super-Properties`):
  1. Desktop Client: Windows 11 x64, macOS Apple Silicon.
  2. Mobile Client: Android Discord v250+, iOS iPhone 16.
  3. Console / Handheld: PS5, Xbox Series X.
- Ghép cặp với các locales: `vi`, `en-US`, `ja-JP`, `ko-KR`, `de-DE`, `pt-BR`.
- Lọc các nhiệm vụ unlisted / exclusive và chuyển vào danh sách chờ của `QuestManager`.

### 3.5. Terminal TUI Dashboard (`src/ui/tui.ts` & `bot.ts`)
- Khởi động với ASCII Banner `Auto Hyper - Farm Orb` sử dụng phông chữ nghệ thuật chuyên biệt.
- Bảng hiển thị thông tin tài khoản: Tên Discord, Avatar/ID, trạng thái Proxy hiện tại, Tier Native đang hoạt động.
- Bảng tiến độ nhiệm vụ thời gian thực: Tên Game/Quest, Thể loại (`WATCH_VIDEO`, `PLAY_ON_DESKTOP`, `PLAY_ACTIVITY`), Thanh phần trăm `%`, Thời gian còn lại.
- Dòng nhật ký trực tiếp (Live Activity Stream) ghi nhận heartbeat, rate-limit, captcha, auto-claim.
- Bộ lắng nghe phím tắt bàn phím (Interactive Hotkeys):
  - `r`: Quét lại nhiệm vụ ẩn (Rescan).
  - `p`: Đổi ngay sang Proxy tiếp theo trong Pool (Rotate Proxy).
  - `c`: Kiểm tra trạng thái Captcha solver.
  - `q` / `Ctrl+C`: Thoát ứng dụng an toàn (Graceful Shutdown).

### 3.6. Discord Remote Controller Bot (`src/remote/discordBot.ts`)
- Hoạt động độc lập bằng thư viện Discord chuẩn (`@discordjs/core` & `@discordjs/ws`) sử dụng Official Bot Token từ `DISCORD_BOT_TOKEN`.
- Đăng ký các Slash Commands toàn cục hoặc theo Guild riêng:
  - `/status`: Trả về Embed hiển thị danh sách nhiệm vụ đang cày, % hoàn thành và trạng thái Proxy.
  - `/quests`: Hiển thị toàn bộ nhiệm vụ khả dụng (kể cả nhiệm vụ ẩn vừa quét được).
  - `/farm <quest_id>`: Bắt đầu farm nhiệm vụ chỉ định.
  - `/claim [all]`: Nhận toàn bộ quà tặng nhiệm vụ đã hoàn thành.
  - `/proxy`: Xem thông tin proxy hiện tại và đổi proxy trực tiếp.
- Thông báo chủ động (Webhook / Channel Message): Gửi Embed chúc mừng kèm hình ảnh mỗi khi hoàn thành nhiệm vụ hoặc nhận Nitro / Decoration mới.

### 3.7. Script DevTools Console Nâng Cấp ([`code.js`](file:///c:/Users/ADMIN/.gemini/antigravity-ide/scratch/hyper-autofarmquest-/code.js))
- Cải tiến mã JavaScript DevTools Console để tương thích với cấu trúc Quests API mới nhất của Discord (hỗ trợ cả Video Quests, Desktop Play Quests, Stream Quests và Activity Quests).
- Bổ sung cơ chế tự phát hiện và bypass các kiểm tra nội bộ trong Webpack chunk của Discord Client.

---

## 4. BẢNG PHÂN BỔ THƯ MỤC DỰ ÁN

```text
hyper-autofarmquest-/
├── bot.ts                             # Main CLI Entry (TUI, Multi-Mode Controller)
├── code.js                            # Enhanced 1-Click Discord DevTools Console Script
├── package.json                       # Dependencies & build scripts
├── tsconfig.json                      # TypeScript Configuration
├── .env.example                       # Detailed environment template
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-09-24-hyper-autofarmquest-architecture-design.md
├── native/                            # Native Subsystems
│   ├── addon/                         # Tier 1: C++ Node-API Addon
│   │   ├── binding.gyp / CMakeLists.txt
│   │   └── src/
│   │       ├── tls_fingerprint.cpp
│   │       └── socket_tunnel.cpp
│   └── helper/                        # Tier 2: Standalone Helper Binary
│       └── sleeper.cpp (or sleeper.rs/go)
├── src/                               # TypeScript Core Engine
│   ├── client.ts                      # Discord REST/WS Client wrapper
│   ├── constants.ts                   # Super properties, matrix configs, user-agents
│   ├── interface.ts                   # Type definitions & Quests schema
│   ├── quest.ts                       # Individual Quest lifecycle & heartbeat
│   ├── questManager.ts                # Orchestrator & state machine
│   ├── traffic.ts                     # TrafficEngine (Jitter, Backoff, 429 handler)
│   ├── native/
│   │   ├── nativeLoader.ts            # Tier 1 -> Tier 2 -> Tier 3 resolver
│   │   └── fallbackEngine.ts          # Pure TypeScript Tier 3 implementation
│   ├── network/
│   │   └── proxyPool.ts               # Dual-Stack IPv4/IPv6 Pool & Rotator
│   ├── security/
│   │   └── captcha.ts                 # Captcha challenge pipeline & solvers
│   ├── core/
│   │   └── scanner.ts                 # Hidden Quests & Multi-Platform Scanner
│   ├── ui/
│   │   ├── banner.ts                  # ASCII Banner "Auto Hyper - Farm Orb"
│   │   └── tui.ts                     # Real-time ANSI/Table interactive dashboard
│   └── remote/
│       └── discordBot.ts              # Remote Controller Bot (Slash Commands)
└── README.md                          # Full multi-language setup guide
```

---

## 5. KẾ HOẠCH TRIỂN KHAI THEO TỪNG GIAI ĐOẠN (IMPLEMENTATION PHASES)

1. **Giai đoạn 1: Lõi Dự Phòng & Bộ Nạp Native (Foundation & Native Loader)**
   - Xây dựng `src/native/nativeLoader.ts` và `src/native/fallbackEngine.ts` để đảm bảo hệ thống luôn chạy được ngay.
   - Viết module `src/ui/banner.ts` với chữ nghệ thuật `Auto Hyper - Farm Orb`.
2. **Giai đoạn 2: Quản Lý Mạng Proxy Dual-Stack & Captcha Pipeline**
   - Viết `src/network/proxyPool.ts` hỗ trợ danh sách IPv4/IPv6, health-check và auto-failover.
   - Viết `src/security/captcha.ts` tích hợp API solvers (CapSolver/2Captcha) và CLI fallback.
3. **Giai đoạn 3: Hidden Quests Scanner & Tối Ưu Quản Lý Nhiệm Vụ**
   - Viết `src/core/scanner.ts` quét ma trận nền tảng (Desktop/Mobile/Console) và locales.
   - Nâng cấp `src/questManager.ts` và `src/quest.ts` hỗ trợ tự động farm song song và tự nhận thưởng (Auto Claim).
4. **Giai đoạn 4: Interactive TUI & Discord Remote Controller Bot**
   - Nâng cấp `bot.ts` với giao diện TUI tương tác cao, hỗ trợ hotkeys (`r`, `p`, `q`).
   - Viết `src/remote/discordBot.ts` cho phép điều khiển từ xa qua Slash Commands nếu có `DISCORD_BOT_TOKEN`.
5. **Giai đoạn 5: Cập Nhật Script DevTools Console & Native Subsystem**
   - Nâng cấp file [`code.js`](file:///c:/Users/ADMIN/.gemini/antigravity-ide/scratch/hyper-autofarmquest-/code.js).
   - Thiết lập cấu trúc mã nguồn trong thư mục `native/` và hoàn thiện tài liệu `README.md`.
6. **Giai đoạn 6: Kiểm Thử, Typecheck & Git Push**
   - Kiểm tra toàn bộ mã nguồn với lệnh `npm run typecheck`.
   - Kiểm thử khởi chạy bot ở chế độ dry-run/fallback.
   - Commit toàn bộ và thực hiện `git push` lên GitHub repository `sorajiz/hyper-autofarmquest-`.
