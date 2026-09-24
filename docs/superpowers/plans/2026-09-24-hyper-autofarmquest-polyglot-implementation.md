# Hyper AutoFarm Quest Polyglot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai toàn diện hệ sinh thái Polyglot Monorepo v3.0.0 cho Hyper AutoFarm Quest bao gồm: Discord Remote Controller Bot với Discord Components V2, Rust Native Sleeper Engine (kế thừa markterence), Go Ultra-Low RAM Daemon, Python FastAPI Backend & WebSocket, Next.js Cyberpunk Web Dashboard và Docker Compose.

**Architecture:** Kiến trúc Monorepo phân tầng kết hợp Hub Orchestrator: Node.js/TypeScript giữ vai trò điều phối trung tâm và CLI TUI; Rust Engine quản lý Dummy Process giả lập game và Discord IPC Named Pipe; Go Daemon đảm nhiệm Heartbeat nền siêu nhẹ (<10MB RAM); Python FastAPI cung cấp REST & WebSocket API cho Next.js Cyberpunk Web Dashboard; Discord Bot ứng dụng công nghệ Discord Components V2 (Container + Buttons).

**Tech Stack:** Node.js/TypeScript 5.3+, Rust (Cargo), Go 1.21+, Python 3.12 (FastAPI, Uvicorn), Next.js 14+ (React, CSS Glassmorphism), Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-24-hyper-autofarmquest-polyglot-architecture.md`

## Global Constraints

- Mọi module phải chạy độc lập được mà không bắt buộc môi trường phải cài đặt sẵn tất cả ngôn ngữ cùng lúc (Graceful degradation).
- Discord Remote Bot bắt buộc ứng dụng chuẩn **Discord Components V2** (`flags: 1 << 15`) với layout `Container` viền accent Blurple và các `Button` tương tác trực tiếp.
- Thông tin Bot Credentials:
  - Bot Token: `your_discord_bot_token`
  - Client Secret: `your_discord_client_secret`
  - Bot ID: `1552658898937446400`
- Cấu trúc thư mục chuẩn Monorepo: `rust-engine/`, `go-worker/`, `python-service/`, `web-dashboard/`, `src/`, `native/`.
- Toàn bộ mã nguồn phải vượt qua `npm run typecheck` và toàn bộ test suite.

## Review Focus

1. **Discord Components V2 Message Payload**: Đảm bảo payload gửi sang Discord API mang đúng cờ `flags: 32768` (tức `1 << 15`) và cấu trúc component dạng `Container` (type 17 hoặc embed-replacement container) hợp lệ.
2. **Cơ chế Rust Process Sleeper**: Binary sleeper khi chạy trên Windows/Unix phải duy trì tiến trình nền nhẹ nhàng, không chiếm CPU và trả về exit code sạch sẽ.
3. **Go Worker Low RAM Memory**: Daemon Go phải chạy vòng lặp bất đồng bộ với Goroutines và tiêu thụ <10MB RAM.
4. **WebSocket Live Streaming của Python FastAPI**: WebSocket `/ws/live` phải tự động broadcast sự kiện cho Web Dashboard mà không bị block I/O.
5. **Độ thẩm mỹ Web Dashboard Next.js**: Giao diện đạt chuẩn Cyberpunk Neon Dark Mode, hỗ trợ hiển thị Orbs Counter, thẻ tiến độ Quest và nút 1-click Auto Farm.

---

### Task 1: Cấu hình Môi Trường Mở Rộng & Discord Remote Bot với Discord Components V2

**Files:**
- Modify: `.env`
- Modify: `.env.example`
- Modify: `src/remote/discordBot.ts`
- Create: `tests/componentsV2.test.ts`

**Interfaces:**
- Consumes: Discord Bot Token, REST API, WebSocket Gateway.
- Produces: 
  - `buildComponentsV2Payload(data: StatusData): any`
  - Nâng cấp `DiscordRemoteBot` với Components V2 buttons & Slash commands.

- [ ] **Step 1: Viết test cho Components V2 Payload Builder**

Tạo file `tests/componentsV2.test.ts`:
```typescript
import assert from 'node:assert';
import { buildComponentsV2Payload } from '../src/remote/discordBot';

console.log('Testing Discord Components V2 Payload Builder...');
const payload = buildComponentsV2Payload({
	username: 'HyperUser',
	userId: '123456789',
	activeQuests: 2,
	completedQuests: 1,
	orbsCount: 150,
	proxyStatus: '1.2.3.4:8080 (IPv4)',
});

assert.ok(payload.flags && (payload.flags & (1 << 15)) !== 0, 'Payload must include IS_COMPONENTS_V2 flag (1 << 15)');
assert.ok(Array.isArray(payload.components), 'Payload must contain components array');
assert.ok(payload.components.length > 0, 'Components array should not be empty');

console.log('✔ Discord Components V2 Payload test passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/componentsV2.test.ts`
Kết quả: FAIL do `buildComponentsV2Payload` chưa được export.

- [ ] **Step 3: Cập nhật `.env` và `.env.example` với Bot Credentials**

Cập nhật file `.env` và `.env.example` bổ sung:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_ID=1552658898937446400
```

- [ ] **Step 4: Cài đặt Components V2 Builder & Tương Tác Nút trong `src/remote/discordBot.ts`**

Nâng cấp `src/remote/discordBot.ts` để:
1. Export hàm `buildComponentsV2Payload(data)` tạo layout:
   - Root Container (type 1 hoặc container box) với accent color `#5865F2`.
   - Section hiển thị thông tin tài khoản, tiến độ nhiệm vụ và số lượng Orbs.
   - ActionRow chứa 4 Button: `[⚡ Auto Farm]`, `[🎁 Nhận Quà (Claim)]`, `[🔄 Đổi Proxy]`, `[🔍 Quét Ẩn]`.
   - Message flag: `flags: 1 << 15` (tức 32768).
2. Lắng nghe interaction type 3 (MESSAGE_COMPONENT) để khi người dùng bấm nút trên Discord, bot lập tức phản hồi và thực thi tác vụ tương ứng.

- [ ] **Step 5: Chạy test xác nhận PASS**

Chạy: `npx tsx tests/componentsV2.test.ts`
Kết quả: PASS!

- [ ] **Step 6: Commit Task 1**

```bash
git add .env.example src/remote/discordBot.ts tests/componentsV2.test.ts
git commit -m "feat(bot): implement Discord Components V2 Container & Button interactive layout"
```

---

### Task 2: Rust Native Engine (`rust-engine/` - Process Sleeper & Discord IPC Pipe)

**Files:**
- Create: `rust-engine/Cargo.toml`
- Create: `rust-engine/src/main.rs`
- Create: `rust-engine/src/sleeper.rs`
- Create: `tests/rustEngine.test.ts`

**Interfaces:**
- Consumes: Windows Named Pipe `\\.\pipe\discord-ipc-0` / Unix domain socket.
- Produces: 
  - Binary `rust-engine` với các cờ CLI: `--app-id <ID>`, `--game-name <NAME>`, `--duration <SEC>`.
  - Giả lập game process và handshake Discord RPC.

- [ ] **Step 1: Viết test kiểm tra cấu trúc mã nguồn Rust Engine**

Tạo file `tests/rustEngine.test.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Rust Engine files...');
assert.ok(fs.existsSync('rust-engine/Cargo.toml'), 'Cargo.toml must exist');
assert.ok(fs.existsSync('rust-engine/src/main.rs'), 'src/main.rs must exist');
assert.ok(fs.existsSync('rust-engine/src/sleeper.rs'), 'src/sleeper.rs must exist');

const cargo = fs.readFileSync('rust-engine/Cargo.toml', 'utf8');
assert.ok(cargo.includes('hyper-rust-engine'), 'Crate name should be hyper-rust-engine');
console.log('✔ Rust Engine file structure verified!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/rustEngine.test.ts`
Kết quả: FAIL do chưa tạo thư mục `rust-engine/`.

- [ ] **Step 3: Tạo `rust-engine/Cargo.toml`**

Cấu hình crate Rust với `serde`, `serde_json`, `chrono`.

- [ ] **Step 4: Cài đặt `rust-engine/src/sleeper.rs` và `rust-engine/src/main.rs`**

- `sleeper.rs`: Tạo tiến trình mô phỏng game Discord Verified (hỗ trợ đọc tên exe từ Discord Quests config).
- `main.rs`: Kết nối trực tiếp với Discord IPC Named Pipe (`\\.\pipe\discord-ipc-0`) gửi gói tin opcode 1 (`FRAME` với `SET_ACTIVITY`) để Discord Desktop ghi nhận thời gian chơi game.

- [ ] **Step 5: Chạy test xác nhận PASS**

Chạy: `npx tsx tests/rustEngine.test.ts`
Kết quả: PASS!

- [ ] **Step 6: Commit Task 2**

```bash
git add rust-engine/ tests/rustEngine.test.ts
git commit -m "feat(rust): implement Rust Native Process Sleeper & Discord IPC pipe engine"
```

---

### Task 3: Go Worker Daemon (`go-worker/` - Ultra-Low RAM Heartbeat Runner)

**Files:**
- Create: `go-worker/go.mod`
- Create: `go-worker/main.go`
- Create: `tests/goWorker.test.ts`

**Interfaces:**
- Consumes: REST API Heartbeat URL, JSON Quest Configuration.
- Produces: 
  - Binary `go-worker` chạy background gửi heartbeat liên tục với RAM < 10MB.

- [ ] **Step 1: Viết test cho Go Worker structure & syntax**

Tạo file `tests/goWorker.test.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Go Worker daemon...');
assert.ok(fs.existsSync('go-worker/go.mod'), 'go.mod must exist');
assert.ok(fs.existsSync('go-worker/main.go'), 'main.go must exist');

const mainGo = fs.readFileSync('go-worker/main.go', 'utf8');
assert.ok(mainGo.includes('package main'), 'Must be main package');
assert.ok(mainGo.includes('sendHeartbeat'), 'Must define sendHeartbeat logic');
console.log('✔ Go Worker tests passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/goWorker.test.ts`
Kết quả: FAIL.

- [ ] **Step 3: Tạo `go-worker/go.mod` và `go-worker/main.go`**

Viết daemon Go siêu nhẹ:
- Vòng lặp Goroutine quản lý heartbeat đa nhiệm vụ.
- Tự động ngắt khi nhận tín hiệu OS interrupt (SIGINT/SIGTERM).
- Bộ quản lý bộ nhớ tối ưu (memory footprint < 10MB).

- [ ] **Step 4: Chạy test xác nhận PASS**

Chạy: `npx tsx tests/goWorker.test.ts`
Kết quả: PASS!

- [ ] **Step 5: Commit Task 3**

```bash
git add go-worker/ tests/goWorker.test.ts
git commit -m "feat(go): implement Go ultra-low RAM background heartbeat daemon"
```

---

### Task 4: Python FastAPI Service (`python-service/` - REST API & WebSocket)

**Files:**
- Create: `python-service/requirements.txt`
- Create: `python-service/app.py`
- Create: `tests/pythonService.test.ts`

**Interfaces:**
- Consumes: Quest state data, Core Orchestrator.
- Produces: 
  - REST endpoints: `/api/status`, `/api/quests`, `/api/farm`, `/api/claim`, `/api/orbs`.
  - WebSocket: `/ws/live` phát sóng real-time progress.

- [ ] **Step 1: Viết test cho Python Service**

Tạo file `tests/pythonService.test.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Python Service files...');
assert.ok(fs.existsSync('python-service/requirements.txt'), 'requirements.txt must exist');
assert.ok(fs.existsSync('python-service/app.py'), 'app.py must exist');

const appPy = fs.readFileSync('python-service/app.py', 'utf8');
assert.ok(appPy.includes('FastAPI'), 'Must use FastAPI');
assert.ok(appPy.includes('/api/quests'), 'Must expose /api/quests');
assert.ok(appPy.includes('/ws/live'), 'Must expose /ws/live WebSocket');
console.log('✔ Python Service tests passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/pythonService.test.ts`
Kết quả: FAIL.

- [ ] **Step 3: Tạo `python-service/requirements.txt` và `python-service/app.py`**

- `requirements.txt`: `fastapi`, `uvicorn`, `websockets`, `pydantic`.
- `app.py`:
  - Khởi tạo FastAPI app với CORS middleware cho phép kết nối từ Next.js Web Dashboard.
  - Endpoints trả về danh sách Quest, trạng thái cày và số lượng Orbs.
  - WebSocket Manager quản lý kết nối và đẩy bản tin JSON cập nhật thời gian thực.

- [ ] **Step 4: Chạy test xác nhận PASS**

Chạy: `npx tsx tests/pythonService.test.ts`
Kết quả: PASS!

- [ ] **Step 5: Commit Task 4**

```bash
git add python-service/ tests/pythonService.test.ts
git commit -m "feat(python): implement FastAPI REST endpoints and real-time WebSocket broadcaster"
```

---

### Task 5: Next.js Web Dashboard (`web-dashboard/` - Cyberpunk Neon Dark Mode)

**Files:**
- Create: `web-dashboard/package.json`
- Create: `web-dashboard/src/app/layout.tsx`
- Create: `web-dashboard/src/app/page.tsx`
- Create: `web-dashboard/src/app/globals.css`
- Create: `tests/webDashboard.test.ts`

**Interfaces:**
- Consumes: Python REST/WebSocket API (`http://localhost:8000`).
- Produces: 
  - Giao diện Web Cyberpunk Neon Dark Mode.
  - Live Orbs Counter, Quest Grid, Nút 1-Click Auto Farm & Claim.

- [ ] **Step 1: Viết test cho Web Dashboard**

Tạo file `tests/webDashboard.test.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Web Dashboard structure...');
assert.ok(fs.existsSync('web-dashboard/package.json'), 'package.json must exist');
assert.ok(fs.existsSync('web-dashboard/src/app/page.tsx'), 'page.tsx must exist');
assert.ok(fs.existsSync('web-dashboard/src/app/globals.css'), 'globals.css must exist');

const page = fs.readFileSync('web-dashboard/src/app/page.tsx', 'utf8');
assert.ok(page.includes('Auto Hyper - Farm Orb'), 'Page must contain signature title');
assert.ok(page.includes('Orbs'), 'Page must feature Orbs counter');
console.log('✔ Web Dashboard tests passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/webDashboard.test.ts`
Kết quả: FAIL.

- [ ] **Step 3: Xây dựng giao diện Web Dashboard**

- `web-dashboard/package.json`: Cấu hình Next.js 14, React 18, Lucide React.
- `src/app/globals.css`: Thiết kế hệ thống theme Cyberpunk Dark Mode với màu neon xanh tím `#5865F2`, xanh lục `#00D26A`, hiệu ứng glassmorphism và glowing badge.
- `src/app/page.tsx`: Component hiển thị Hero Header `Auto Hyper - Farm Orb`, bảng Orbs Counter phát sáng, danh sách Quest cards và các nút bấm tương tác 1-click.

- [ ] **Step 4: Chạy test xác nhận PASS**

Chạy: `npx tsx tests/webDashboard.test.ts`
Kết quả: PASS!

- [ ] **Step 5: Commit Task 5**

```bash
git add web-dashboard/ tests/webDashboard.test.ts
git commit -m "feat(web): implement Cyberpunk Neon Dark Mode Next.js Web Dashboard"
```

---

### Task 6: Docker Compose Multi-Service Orchestration & Cập Nhật Test Suite Runner

**Files:**
- Create: `docker-compose.yml`
- Modify: `tests/runner.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: Toàn bộ 5 services trong monorepo.
- Produces: 
  - Khởi chạy toàn bộ hệ sinh thái chỉ với 1 lệnh `docker compose up`.
  - Bộ kiểm thử tổng hợp chạy cả 13 bài test thành công 100%.

- [ ] **Step 1: Viết `docker-compose.yml`**

Khai báo các dịch vụ: `ts-core-bot`, `python-api`, `web-dashboard`, `go-worker`.

- [ ] **Step 2: Cập nhật `tests/runner.ts` tích hợp toàn bộ các bộ test mới**

Bổ sung các file test:
- `tests/componentsV2.test.ts`
- `tests/rustEngine.test.ts`
- `tests/goWorker.test.ts`
- `tests/pythonService.test.ts`
- `tests/webDashboard.test.ts`

- [ ] **Step 3: Chạy toàn bộ test runner (`npm test`)**

Chạy: `npm test`
Kết quả: Toàn bộ 13 bộ test đều PASS 100%.

- [ ] **Step 4: Kiểm tra TypeScript Typecheck (`npm run typecheck`)**

Chạy: `npm run typecheck`
Kết quả: EXIT CODE 0 không có bất kỳ lỗi nào.

- [ ] **Step 5: Cập nhật tài liệu `README.md` và thực hiện Git Push**

Commit toàn bộ và đẩy lên kho remote `sorajiz/hyper-autofarmquest-`.
