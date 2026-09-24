<template>
  <div class="vue-container">
    <!-- Header Hero Banner -->
    <header class="hero-banner">
      <div>
        <h1 class="brand-title">
          <span>⚡</span> Auto Hyper - Farm Orb
          <span class="badge-edition">Vue 3 / Vite</span>
        </h1>
        <p class="brand-subtitle">
          High-Speed Mission Control & Markterence Dummy Game Engine Integration
        </p>
      </div>

      <div class="connection-status">
        <div class="sub-text">Native Subsystems</div>
        <div class="online-indicator">
          ● ONLINE | C++ / C# / Rust / Go Active
        </div>
      </div>
    </header>

    <!-- Notification Toast -->
    <div v-if="toastMessage" class="toast-banner">
      <span>✨</span> {{ toastMessage }}
    </div>

    <!-- Quick Stats Grid -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">🔮 Total Discord Orbs</div>
        <div class="stat-value neon-cyan">{{ orbsCount.toLocaleString() }}</div>
        <div class="stat-meta">Claimed today: +{{ claimedToday }} Orbs</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">⚔️ Active Missions</div>
        <div class="stat-value neon-emerald">{{ farmingCount }}</div>
        <div class="stat-meta">Total detectable quests: {{ quests.length }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">🛡️ Dual-Stack Proxy Tunnel</div>
        <div class="stat-value proxy-text">{{ proxyEndpoint }}</div>
        <div class="stat-meta text-cyan">IPv4 / IPv6 Remote DNS Safe</div>
      </div>
    </section>

    <!-- 1-Click Action Buttons -->
    <section class="actions-bar">
      <button class="btn btn-primary" @click="handleAutoFarmAll">
        ⚡ Auto Farm All
      </button>
      <button class="btn btn-success" @click="handleClaimAll">
        🎁 Claim All Rewards
      </button>
      <button class="btn btn-secondary" @click="handleRotateProxy">
        🔄 Rotate Proxy
      </button>
      <button class="btn btn-special" @click="handleLaunchMarkterence">
        🎮 Launch Markterence Dummy Sleeper
      </button>
      <button class="btn btn-secondary" @click="handleRescanHidden">
        🔍 Scan Hidden Quests
      </button>
    </section>

    <!-- Active Quests List -->
    <section class="quests-section">
      <div class="section-header">
        <h2 class="section-title">Active Discord Quests Matrix</h2>
        <div class="sub-text">Continuous Heartbeat Sync & Process Detection</div>
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
            Mode: <strong>{{ q.task_type }}</strong> • App ID: <code>{{ q.app_id }}</code>
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
            <span class="orbs-pill">🔮 +{{ q.reward_orbs }} Orbs</span>
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
  showToast('🚀 Auto Farm launched across all eligible quests!');
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
    showToast(`🎁 Claimed ${earned} Orbs & Avatar Decorations!`);
  } else {
    showToast('ℹ️ No completed quests ready to claim.');
  }
}

function handleRotateProxy() {
  proxyEndpoint.value = '192.168.1.100:9050 (IPv6 /64 Rotated)';
  showToast('🔄 Dual-Stack Proxy pool rotated successfully!');
}

function handleLaunchMarkterence() {
  showToast('🎮 Markterence Dummy Process Sleeper & Discord Named Pipe Handshake triggered!');
}

function handleRescanHidden() {
  showToast('🔍 Hidden Quests Scanner finished: 1 new quest discovered!');
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
</script>

<style scoped>
.vue-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 20px 60px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #F3F4F6;
}

.hero-banner {
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.22) 0%, rgba(0, 240, 255, 0.12) 100%);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 16px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.brand-title {
  font-size: 2.1rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, #FFF, #00F0FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge-edition {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: #00F0FF;
  color: #07090e;
  -webkit-text-fill-color: #07090e;
}

.brand-subtitle {
  color: #9CA3AF;
  font-size: 0.95rem;
  margin-top: 6px;
}

.sub-text {
  font-size: 0.82rem;
  color: #9CA3AF;
}

.online-indicator {
  color: #00D26A;
  font-weight: 700;
  margin-top: 4px;
}

.toast-banner {
  background: rgba(88, 101, 242, 0.9);
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(88, 101, 242, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(18, 24, 38, 0.75);
  border: 1px solid rgba(88, 101, 242, 0.25);
  border-radius: 12px;
  padding: 22px;
  backdrop-filter: blur(10px);
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #9CA3AF;
  font-weight: 600;
}

.stat-value {
  font-size: 2.1rem;
  font-weight: 800;
  margin-top: 8px;
}

.stat-value.neon-cyan {
  color: #00F0FF;
  text-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
}

.stat-value.neon-emerald {
  color: #00D26A;
  text-shadow: 0 0 12px rgba(0, 210, 106, 0.4);
}

.stat-value.proxy-text {
  font-size: 1.1rem;
  color: #FFF;
}

.stat-meta {
  font-size: 0.82rem;
  color: #9CA3AF;
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
  padding: 12px 20px;
  font-size: 0.92rem;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #5865F2;
  color: #FFF;
}

.btn-success {
  background: #00D26A;
  color: #07090e;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #FFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-special {
  background: linear-gradient(135deg, #9D00FF 0%, #5865F2 100%);
  color: #FFF;
}

.btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.quest-card {
  background: rgba(18, 24, 38, 0.75);
  border: 1px solid rgba(88, 101, 242, 0.25);
  border-radius: 12px;
  padding: 20px;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.quest-name {
  font-size: 1.1rem;
  margin: 0;
}

.badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
}

.badge-farming {
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
  border: 1px solid #00F0FF;
}

.badge-completed {
  background: rgba(0, 210, 106, 0.15);
  color: #00D26A;
  border: 1px solid #00D26A;
}

.badge-ready {
  background: rgba(254, 231, 92, 0.15);
  color: #FEE75C;
  border: 1px solid #FEE75C;
}

.badge-claimed {
  background: rgba(157, 0, 255, 0.15);
  color: #9D00FF;
  border: 1px solid #9D00FF;
}

.quest-mode {
  font-size: 0.82rem;
  color: #9CA3AF;
  margin-bottom: 16px;
}

.progress-bar-container {
  margin-bottom: 16px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #9CA3AF;
  margin-bottom: 6px;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5865F2, #00F0FF);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-fill.completed {
  background: #00D26A;
}

.rewards-box {
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.orbs-pill {
  color: #00F0FF;
  font-weight: 700;
}

.deco-text {
  color: #9CA3AF;
}
</style>
