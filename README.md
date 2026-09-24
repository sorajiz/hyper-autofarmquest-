# ⚡ Hyper AutoFarm Quest Discord

<p align="center">
  <b>Tự động hóa hoàn thành nhiệm vụ Discord Quests với giao diện Terminal hiện đại, chống Rate Limit và nhận thưởng tự động.</b><br>
  <i>Automated Discord Quest completion bot with real-time CLI dashboard, rate-limit protection, and auto reward claim.</i>
</p>

---

## ✨ Tính Năng Nổi Bật (Features)

- 🖥️ **Giao diện Terminal trực quan**: Hiển thị bảng trạng thái, thanh tiến độ (Progress Bar), đồng hồ đếm ngược và nhật ký hoạt động theo thời gian thực (Real-time CLI).
- 🎁 **Tự động nhận thưởng (Auto Claim)**: Tự động ghi danh (Auto Enroll) nhiệm vụ mới và tự động nhận phần thưởng (Avatar Decoration, Discord Orbs, Nitro quà tặng...).
- 🛡️ **Bảo vệ chống Rate Limit & Anti-Ban**:
  - Tích hợp `TrafficEngine` tự động điều tiết nhịp gửi request (1.0s - 1.6s).
  - Tự động bắt lỗi HTTP 429 và thử lại thông minh với thuật toán Exponential Backoff + Jitter.
  - Nhịp Heartbeat so le (Staggered Heartbeats) tránh hiện tượng gửi dữ liệu ồ ạt.
- 📺 **Hỗ trợ đa dạng loại nhiệm vụ**:
  - `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE`: Tăng tốc tiến độ video an toàn, mượt mà.
  - `PLAY_ON_DESKTOP` / `STREAM_ON_DESKTOP` / `PLAY_ACTIVITY`: Giả lập client Discord chuẩn xác với đầy đủ super-properties.
- 🌐 **Hỗ trợ Proxy**: Tương thích hoàn toàn với HTTP, HTTPS và SOCKS5 proxy để đổi IP và bảo vệ tài khoản.
- 📜 **Kèm script DevTools Console**: Cung cấp sẵn file `code.js` để chạy trực tiếp trên Console trình duyệt hoặc Discord Desktop Client.

---

## 📦 Yêu Cầu Hệ Thống (Prerequisites)

- [Node.js](https://nodejs.org/) phiên bản **18.0.0** trở lên (Khuyến nghị Node.js 20 hoặc 24).
- [Git](https://git-scm.com/)

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng (Quick Start)

### 1. Cài đặt các gói phụ thuộc (Dependencies)

Mở terminal tại thư mục dự án và chạy:

```bash
npm install
```

### 2. Cấu hình file `.env`

Sao chép file `.env.example` thành `.env`:

```bash
# Trên Windows PowerShell:
Copy-Item .env.example .env

# Hoặc trên Linux/macOS/Git Bash:
cp .env.example .env
```

Mở file `.env` và điền token Discord của bạn:

```env
# Token tài khoản Discord (Bắt buộc)
TOKEN=your_discord_token_here

# Proxy IP bảo vệ (Tùy chọn - nếu muốn đổi IP để tránh limit IP):
# Hỗ trợ HTTP, HTTPS, SOCKS5 (Ví dụ: http://user:pass@ip:port)
PROXY=

# Tự động ghi danh nhiệm vụ mới (Mặc định: true)
AUTO_ENROLL=true

# Tự động nhận thưởng khi xong nhiệm vụ (Mặc định: true)
AUTO_CLAIM=true

# Chu kỳ Heartbeat tính bằng giây (Mặc định: 30)
HEARTBEAT_INTERVAL=30

# Phát âm báo khi hoàn thành nhiệm vụ (Mặc định: true)
PLAY_SOUND=true
```

> ⚠️ **LƯU Ý BẢO MẬT**: File `.env` chứa token cá nhân của bạn đã được cấu hình trong `.gitignore` để **không bao giờ bị đẩy lên GitHub**. Không bao giờ chia sẻ token cho người khác.

### 3. Khởi chạy Bot

```bash
npm start
```

---

## 💡 Phương Pháp Sử Dụng Thay Thế (Discord DevTools Console)

Nếu không muốn chạy bot qua Node.js, bạn có thể hoàn thành nhiệm vụ trực tiếp trên ứng dụng Discord:

1. Mở Discord trên trình duyệt (hoặc mở Discord Desktop bật Developer Tools qua `Ctrl + Shift + I`).
2. Mở tab **Console**.
3. Mở file [`code.js`](code.js), sao chép toàn bộ nội dung và dán vào tab Console rồi nhấn **Enter**.
4. Script sẽ tự động nhận diện nhiệm vụ đang hoạt động và gửi tiến độ hoàn thành.

---

## ⚙️ Cấu Trúc Dự Án (Project Structure)

```
hyper-autofarmquest-/
├── src/
│   ├── client.ts          # Discord REST & WebSocket client với header giả lập client
│   ├── constants.ts       # Super-properties & User Agent Discord client
│   ├── interface.ts       # TypeScript interfaces và types cho Discord Quests API
│   ├── quest.ts           # Lớp Quest xử lý tiến độ, cấu hình và trạng thái nhiệm vụ
│   ├── questManager.ts    # Quản lý danh sách nhiệm vụ, gửi heartbeat, claim thưởng
│   └── traffic.ts         # TrafficEngine điều tiết tốc độ, retry & backoff chống 429
├── bot.ts                 # Điểm khởi chạy chính và Terminal UI Dashboard
├── code.js                # Script chạy qua DevTools Console
├── quest.json             # Dữ liệu mẫu cấu trúc Quest Discord
├── .env.example           # File mẫu biến môi trường
├── .gitignore             # Danh sách loại trừ Git (bảo vệ .env & node_modules)
├── package.json           # Cấu hình dự án & thư viện phụ thuộc
├── tsconfig.json          # Cấu hình TypeScript compiler
└── LICENSE                # Boost Software License 1.0
```

---

## ⚠️ Tuyên Bố Từ Chối Trách Nhiệm (Disclaimer)

> Việc sử dụng Selfbot vi phạm Điều khoản Dịch vụ (Terms of Service) của Discord. Công cụ này được phát triển cho mục đích giáo dục và nghiên cứu. Bạn tự chịu trách nhiệm đối với bất kỳ rủi ro nào liên quan đến tài khoản của mình.

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép [Boost Software License 1.0](LICENSE).
