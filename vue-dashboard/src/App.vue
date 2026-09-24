<template>
  <div class="vue-container">
    <!-- Header Hero Banner -->
    <header class="hero-banner">
      <div>
        <div class="brand-pretitle">[CORE SYSTEM // V3.2.0]</div>
        <h1 class="brand-title">
          <span class="highlight">Auto Hyper - Farm Orb</span>
          <span class="badge-edition">VUE 3 // VITE</span>
        </h1>
        <p class="brand-subtitle">
          Next-Gen Mission Control & Markterence Native Dummy Process Integration
        </p>
      </div>

      <div class="connection-status">
        <div class="sub-text">SUBSYSTEM STATUS</div>
        <div class="online-indicator">
          ● ONLINE // C++ / C# / RUST / GO ACTIVE
        </div>
      </div>
    </header>

    <!-- Notification Toast -->
    <div v-if="toastMessage" class="toast-banner">
      <span class="toast-tag">[TELEMETRY]</span> {{ toastMessage }}
    </div>

    <!-- Quick Stats Grid -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">[METRIC] Total Discord Orbs</div>
        <div class="stat-value neon-cyan">{{ orbsCount.toLocaleString() }}</div>
        <div class="stat-meta">Daily accumulation: +{{ claimedToday }} Orbs</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">[PIPELINE] Active Missions</div>
        <div class="stat-value neon-emerald">{{ farmingCount }}</div>
        <div class="stat-meta">Total detectable quests: {{ quests.length }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">[ROUTING] Dual-Stack Proxy Tunnel</div>
        <div class="stat-value proxy-text">{{ proxyEndpoint }}</div>
        <div class="stat-meta text-cyan">IPv4 / IPv6 Remote DNS Verified</div>
      </div>
    </section>

    <!-- 1-Click Action Buttons -->
    <section class="actions-bar">
      <button class="btn btn-primary" @click="handleAutoFarmAll">
        [+] Auto Farm All
      </button>
      <button class="btn btn-success" @click="handleClaimAll">
        [*] Claim All Rewards
      </button>
      <button class="btn btn-secondary" @click="handleRotateProxy">
        [~] Rotate Proxy
      </button>
      <button class="btn btn-special" @click="handleLaunchMarkterence">
        [>] Launch Markterence Dummy Sleeper
      </button>
      <button class="btn btn-secondary" @click="handleRescanHidden">
        [?] Scan Hidden Quests
      </button>
      <button class="btn btn-special" style="border-color: #EC4899; color: #F472B6; background: rgba(236, 72, 153, 0.15);" @click="handleDeepExtractVault">
        [!] Deep Extract Vault
      </button>
    </section>

    <!-- Active Quests List -->
    <section class="quests-section">
      <div class="section-header">
        <h2 class="section-title">Active Discord Quests Matrix</h2>
        <div class="sub-text">CONTINUOUS HEARTBEAT & PROCESS DETECTION</div>
      </div>

      <div class="quests-grid">
        <div v-for="q in quests" :key="q.id" class="quest-card">
          <div class="quest-header">
            <h3 class="quest-name">{{ q.name }}</h3>
            <span :class="['badge', `badge-${q.status.toLowerCase()}`]">
              {{ q.status }}
            </span>
          </div>

          <div class="quest-mode">
            MODE: <strong>{{ q.task_type }}</strong> • APP ID: <code>{{ q.app_id }}</code>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-container">
            <div class="progress-labels">
              <span>{{ q.progress_seconds }}s / {{ q.target_seconds }}s</span>
              <span>{{ q.percent }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :class="{ completed: q.percent >= 100 }"
                :style="{ width: `${q.percent}%` }"
              ></div>
            </div>
          </div>

          <!-- Rewards Box -->
          <div class="rewards-box">
            <span class="orbs-pill">+{{ q.reward_orbs }} Orbs</span>
            <span class="deco-text">{{ q.reward_deco }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface QuestItem {
  id: string;
  app_id: string;
  name: string;
  task_type: string;
  target_seconds: number;
  progress_seconds: number;
  percent: number;
  status: 'READY' | 'FARMING' | 'COMPLETED' | 'CLAIMED';
  reward_orbs: number;
  reward_deco: string;
}

const orbsCount = ref<number>(450);
const claimedToday = ref<number>(125);
const proxyEndpoint = ref<string>('127.0.0.1:1080 (Dual-Stack SOCKS5)');
const toastMessage = ref<string | null>(null);

const quests = ref<QuestItem[]>([
  {
    id: 'quest_valorant_30m',
    app_id: '1098679090623692880',
    name: 'Valorant - Spike Rush Campaign',
    task_type: 'PLAY',
    target_seconds: 900,
    progress_seconds: 900,
    percent: 100,
    status: 'COMPLETED',
    reward_orbs: 150,
    reward_deco: 'Vandal Cyber Spray',
  },
  {
    id: 'quest_genshin_stream',
    app_id: '934278453472010260',
    name: 'Genshin Impact - Stream to Friends',
    task_type: 'STREAM',
    target_seconds: 900,
    progress_seconds: 450,
    percent: 50,
    status: 'FARMING',
    reward_orbs: 100,
    reward_deco: 'Anemo Crest Halo',
  },
  {
    id: 'quest_discord_reel',
    app_id: '1107567530467545168',
    name: 'Discord Quest - Watch Event Stream',
    task_type: 'VIDEO',
    target_seconds: 30,
    progress_seconds: 0,
    percent: 0,
    status: 'READY',
    reward_orbs: 100,
    reward_deco: 'Cyber Wumpus Crown',
  },
]);

const farmingCount = computed(() => quests.value.filter((q) => q.status === 'FARMING').length);

let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    quests.value.forEach((q) => {
      if (q.status === 'FARMING' && q.percent < 100) {
        q.progress_seconds = Math.min(q.target_seconds, q.progress_seconds + 30);
        q.percent = Math.round((q.progress_seconds / q.target_seconds) * 100);
        if (q.percent >= 100) {
          q.status = 'COMPLETED';
        }
      }
    });
  }, 3000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
}

function handleAutoFarmAll() {
  quests.value.forEach((q) => {
    if (q.status === 'READY') q.status = 'FARMING';
  });
  showToast('Auto Farm pipeline activated across all eligible tasks.');
}

function handleClaimAll() {
  let earned = 0;
  quests.value.forEach((q) => {
    if (q.status === 'COMPLETED') {
      earned += q.reward_orbs;
      q.status = 'CLAIMED';
    }
  });
  if (earned > 0) {
    orbsCount.value += earned;
    claimedToday.value += earned;
    showToast(`Claimed +${earned} Discord Orbs and inventory rewards.`);
  } else {
    showToast('No completed tasks ready to claim.');
  }
}

function handleRotateProxy() {
  proxyEndpoint.value = '192.168.1.100:9050 (IPv6 /64 Rotated)';
  showToast('Dual-Stack Proxy pool rotated successfully.');
}

function handleLaunchMarkterence() {
  showToast('Markterence Dummy Process Sleeper & Discord Named Pipe Handshake triggered.');
}

function handleRescanHidden() {
  showToast('Hidden Quests Scanner probe completed: 1 unlisted quest discovered.');
  quests.value.unshift({
    id: `quest_hidden_${Date.now()}`,
    app_id: '1142517596001030206',
    name: 'Zenless Zone Zero - Special Edition Quest',
    task_type: 'PLAY',
    target_seconds: 600,
    progress_seconds: 0,
    percent: 0,
    status: 'READY',
    reward_orbs: 200,
    reward_deco: 'Hollow Raider Frame',
  });
}

function handleDeepExtractVault() {
  showToast('[VAULT AUDIT] Ultra Deep Extractor completed: 3 hidden quests, 8 entitlements, and 45 experiments exported.');
}
</script>

<style scoped>
.vue-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 20px 60px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #F8FAFC;
}

.hero-banner {
  background: linear-gradient(135deg, rgba(13, 17, 26, 0.95) 0%, rgba(19, 26, 40, 0.98) 100%);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-left: 4px solid #00F0FF;
  border-radius: 12px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

.brand-pretitle {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 2px;
  color: #00F0FF;
  font-weight: 700;
  margin-bottom: 4px;
}

.brand-title {
  font-size: 2.1rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-title .highlight {
  background: linear-gradient(90deg, #FFFFFF, #00F0FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge-edition {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
  border: 1px solid #00F0FF;
}

.brand-subtitle {
  color: #94A3B8;
  font-size: 0.9rem;
  margin-top: 6px;
  font-family: ui-monospace, monospace;
}

.sub-text {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #64748B;
  letter-spacing: 1px;
}

.online-indicator {
  color: #00D26A;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  margin-top: 4px;
  font-size: 0.85rem;
}

.toast-banner {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #00F0FF;
  padding: 12px 18px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-family: ui-monospace, monospace;
  font-size: 0.88rem;
  box-shadow: 0 4px 18px rgba(0, 240, 255, 0.15);
}

.toast-tag {
  color: #00F0FF;
  font-weight: 700;
  margin-right: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(13, 17, 26, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 8px;
  padding: 22px;
  backdrop-filter: blur(10px);
}

.stat-label {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748B;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.stat-value {
  font-family: ui-monospace, monospace;
  font-size: 2.2rem;
  font-weight: 800;
  margin-top: 8px;
}

.stat-value.neon-cyan {
  color: #00F0FF;
  text-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
}

.stat-value.neon-emerald {
  color: #00D26A;
  text-shadow: 0 0 14px rgba(0, 210, 106, 0.35);
}

.stat-value.proxy-text {
  font-size: 1rem;
  color: #F8FAFC;
}

.stat-meta {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #94A3B8;
  margin-top: 6px;
}

.text-cyan {
  color: #00F0FF;
}

.actions-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.btn {
  padding: 10px 18px;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-transform: uppercase;
}

.btn-primary {
  background: #5865F2;
  color: #FFF;
}

.btn-success {
  background: #00D26A;
  color: #06080D;
}

.btn-secondary {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(51, 65, 85, 0.5);
  color: #F8FAFC;
}

.btn-special {
  background: linear-gradient(135deg, #9D00FF 0%, #5865F2 100%);
  color: #FFF;
}

.btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-title {
  font-family: ui-monospace, monospace;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.quest-card {
  background: rgba(13, 17, 26, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 8px;
  padding: 20px;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.quest-name {
  font-size: 1.05rem;
  margin: 0;
  color: #F8FAFC;
}

.badge {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-farming {
  background: rgba(0, 240, 255, 0.1);
  color: #00F0FF;
  border: 1px solid #00F0FF;
}

.badge-completed {
  background: rgba(0, 210, 106, 0.1);
  color: #00D26A;
  border: 1px solid #00D26A;
}

.badge-ready {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
  border: 1px solid #F59E0B;
}

.badge-claimed {
  background: rgba(157, 0, 255, 0.1);
  color: #9D00FF;
  border: 1px solid #9D00FF;
}

.quest-mode {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #94A3B8;
  margin-bottom: 16px;
}

.progress-bar-container {
  margin-bottom: 16px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #64748B;
  margin-bottom: 6px;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5865F2, #00F0FF);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.completed {
  background: #00D26A;
}

.rewards-box {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px 14px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.orbs-pill {
  color: #00F0FF;
  font-weight: 700;
}

.deco-text {
  color: #94A3B8;
}
</style>
