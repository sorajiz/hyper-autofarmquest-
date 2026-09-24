# ⚡ Hyper AutoFarm Quest Discord (v2.0.0)

<p align="center">
  <b>Hệ thống tự động hóa hoàn thành nhiệm vụ Discord Quests cao cấp, tích hợp ngụy trang TLS, xoay vòng proxy Dual-Stack, giải quyết thử thách Captcha và giao diện điều khiển đa kênh.</b><br>
  <i>Advanced Discord Quest automation engine featuring 3-Tier Native architecture, Dual-Stack IPv4/IPv6 proxy pool, Captcha challenges pipeline, Hidden Quests scanner, and Multi-Interface control.</i>
</p>

---

## ✨ Tính Năng Nổi Bật (Features)

- 🏛️ **Kiến trúc 3-Tier Native Engine**:
  - **Tier 1 (C++ Addon - `native/addon/`)**: Giả lập dấu vân tay TLS (JA4, HTTP/2 settings) chuẩn Discord Client và raw TCP SOCKS5 tunnel.
  - **Tier 2 (Standalone Helper Binary - `native/helper/`)**: File thực thi độc lập kết nối Discord IPC Named Pipe và chạy Dummy Game Sleeper.
  - **Tier 3 (Pure TypeScript Fallback)**: Tự động kích hoạt khi môi trường thiếu build tools C++, đảm bảo 100% người dùng chạy lệnh `npm start` là hoạt động ngay không bao giờ crash.
- 🌐 **Dual-Stack Proxy Pool (IPv4 / IPv6) & Failover**:
  - Hỗ trợ danh sách nhiều proxy đa giao thức: HTTP, HTTPS, SOCKS5 (nguyên bản với `socks-proxy-agent`).
  - Phân loại IPv4 / IPv6 tự động, cơ chế phát hiện proxy chết và tự động failover sang proxy dự phòng (`markBad()`).
- 🧩 **Captcha Challenge Pipeline**:
  - Tự động nhận diện thử thách Discord HTTP 400 (`captcha_sitekey`, `captcha_service`).
  - Tích hợp API Solvers: **CapSolver**, **2Captcha**, cùng cơ chế CLI manual fallback.
- 🔍 **Hidden Quests Discovery Scanner**:
  - Giả lập ma trận nền tảng (Platform Matrix Spoofing): Desktop Windows 11, macOS Apple Silicon, Mobile Android v250+, Console Xbox Series X.
  - Xoay vòng vùng địa lý (`X-Discord-Locale` và `Accept-Language`) để mở khóa nhiệm vụ ẩn theo khu vực.
- 🖥️ **Terminal Interactive TUI Dashboard**:
  - Khởi động với Banner nghệ thuật ASCII chữ lớn `Auto Hyper - Farm Orb`.
  - Hiển thị bảng trạng thái real-time, tiến độ từng game, bộ đếm heartbeat.
  - Phím tắt bàn phím (Interactive Hotkeys):
    - `r`: Quét lại nhiệm vụ ẩn (Rescan).
    - `p`: Đổi ngay sang Proxy tiếp theo trong Pool (Rotate Proxy).
    - `c`: Kiểm tra trạng thái Captcha solver.
    - `q` / `Ctrl+C`: Thoát ứng dụng và lưu tiến độ an toàn.
  - Hỗ trợ chế độ chạy ngầm `--headless` an toàn tuyệt đối cho VPS/Docker/Background daemon (tự động nhận diện TTY).
- 🤖 **Discord Remote Controller Bot**:
  - Tùy chọn kích hoạt qua `DISCORD_BOT_TOKEN`, nhận lệnh Slash Commands (`/status`) từ máy chủ Discord riêng tư.
- 📜 **Script DevTools Console ([`code.js`](code.js))**:
  - Cung cấp mã JavaScript 1-click chạy trực tiếp trong Console Discord Desktop Client.

---

## 📦 Cài Đặt & Sử Dụng (Quick Start)

### 1. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 2. Cấu hình file `.env`

Sao chép file `.env.example` thành `.env`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS / Git Bash:
cp .env.example .env
```

Mở file `.env` và điền thông tin:

```env
# Token tài khoản Discord cày Quest (Bắt buộc)
TOKEN=your_discord_user_token

# Danh sách Proxy (Tùy chọn, phân tách bằng dấu phẩy):
# Hỗ trợ HTTP, HTTPS, SOCKS5 (IPv4 và IPv6)
PROXIES=http://user:pass@1.2.3.4:8080,socks5://5.6.7.8:1080

# API Key giải Captcha tự động (Tùy chọn)
CAPSOLVER_API_KEY=
TWOCAPTCHA_API_KEY=

# Official Discord Bot Token để điều khiển từ xa (Tùy chọn)
DISCORD_BOT_TOKEN=

# Tùy chọn cày nhiệm vụ
AUTO_ENROLL=true
AUTO_CLAIM=true
```

### 3. Khởi chạy Bot

```bash
# Chạy giao diện TUI Interactive thông thường:
npm start

# Hoặc chạy ở chế độ Headless (tối ưu cho VPS / Server):
npm start -- --headless
```

### 4. Kiểm tra mã nguồn

```bash
# Kiểm tra TypeScript typecheck:
npm run typecheck

# Chạy toàn bộ Test Suite:
npm test
```

---

## 📄 Bản Quyền & Giấy Phép

Phát hành dưới giấy phép Business Source License (BSL-1.0). Tác giả: **sorajiz**.
