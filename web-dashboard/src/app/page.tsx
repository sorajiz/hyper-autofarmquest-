'use client';

import React, { useState, useEffect } from 'react';

interface Quest {
  id: string;
  name: string;
  task_type: string;
  target_seconds: number;
  progress_seconds: number;
  percent: number;
  status: 'READY' | 'FARMING' | 'COMPLETED' | 'CLAIMED';
  reward_orbs: number;
  reward_deco: string;
}

const initialQuests: Quest[] = [
  {
    id: 'quest_genshin_30m',
    name: 'Genshin Impact - Journey of Orbs',
    task_type: 'PLAY',
    target_seconds: 900,
    progress_seconds: 900,
    percent: 100,
    status: 'COMPLETED',
    reward_orbs: 100,
    reward_deco: 'Anemo Crest Frame',
  },
  {
    id: 'quest_valorant_stream',
    name: 'Valorant - Stream to Friends',
    task_type: 'STREAM',
    target_seconds: 900,
    progress_seconds: 450,
    percent: 50,
    status: 'FARMING',
    reward_orbs: 150,
    reward_deco: 'Vandal Spray Deco',
  },
  {
    id: 'quest_discord_watch_video',
    name: 'Discord Quest - Watch Highlight Reel',
    task_type: 'VIDEO',
    target_seconds: 30,
    progress_seconds: 0,
    percent: 0,
    status: 'READY',
    reward_orbs: 100,
    reward_deco: 'Wumpus Cyber Crown',
  },
];

export default function DashboardPage() {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [orbsCount, setOrbsCount] = useState<number>(450);
  const [proxyStatus, setProxyStatus] = useState<string>('127.0.0.1:1080 (Dual-Stack IPv6 /64)');
  const [latency, setLatency] = useState<number>(24);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Simulate progress tick every 3 seconds for active quests
  useEffect(() => {
    const timer = setInterval(() => {
      setQuests((prev) =>
        prev.map((q) => {
          if (q.status === 'FARMING' && q.percent < 100) {
            const nextSec = Math.min(q.target_seconds, q.progress_seconds + 30);
            const nextPercent = Math.min(100, Math.round((nextSec / q.target_seconds) * 100));
            return {
              ...q,
              progress_seconds: nextSec,
              percent: nextPercent,
              status: nextPercent >= 100 ? 'COMPLETED' : 'FARMING',
            };
          }
          return q;
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoFarmAll = () => {
    setQuests((prev) =>
      prev.map((q) => (q.status === 'READY' ? { ...q, status: 'FARMING' } : q))
    );
    notify('[COMMAND: OK] Auto Farm pipeline activated across all eligible tasks.');
  };

  const handleClaimAll = () => {
    let gained = 0;
    setQuests((prev) =>
      prev.map((q) => {
        if (q.status === 'COMPLETED') {
          gained += q.reward_orbs;
          return { ...q, status: 'CLAIMED' };
        }
        return q;
      })
    );

    if (gained > 0) {
      setOrbsCount((prev) => prev + gained);
      notify(`[REWARDS: CLAIMED] Received +${gained} Discord Orbs and inventory rewards.`);
    } else {
      notify('[INFO] No completed tasks available for claim.');
    }
  };

  const handleRotateProxy = () => {
    setProxyStatus('192.168.1.100:9050 (IPv6 /64 Rotated)');
    setLatency(Math.floor(Math.random() * 15) + 18);
    notify('[NETWORK: ROTATED] Switched to next healthy Dual-Stack socket.');
  };

  const handleScanHidden = () => {
    notify('[SCANNER] Executed Platform Matrix probe. Discovered 1 unlisted quest.');
    const newQuest: Quest = {
      id: `quest_hidden_${Date.now()}`,
      name: 'Xbox Game Pass - Forza Horizon 5 Secret Quest',
      task_type: 'PLAY',
      target_seconds: 600,
      progress_seconds: 0,
      percent: 0,
      status: 'READY',
      reward_orbs: 200,
      reward_deco: 'Speed Demon Avatar Halo',
    };
    setQuests((prev) => [newQuest, ...prev]);
  };

  const handleDeepExtractVault = () => {
    notify('[VAULT HARVEST] Executed Ultra Deep Discord API Extraction: 3 hidden quests, 8 entitlements, 45 experiments saved to vault/discord_vault_audit.json');
  };

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <header className="hero-banner">
        <div>
          <div className="brand-pretitle">[CORE SYSTEM // v3.2.0]</div>
          <h1 className="brand-title">
            <span className="highlight">Auto Hyper - Farm Orb</span>
          </h1>
          <p className="brand-subtitle">
            Next-Gen Multi-Platform Discord Quests & Orbs Automation Matrix
          </p>
        </div>

        <div className="system-status">
          <div style={{ fontSize: '0.72rem', color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Telemetry Link
          </div>
          <div className="status-badge">
            ● ONLINE // {latency}ms
          </div>
        </div>
      </header>

      {/* Global Status Banner */}
      {notification && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #00F0FF',
            color: '#F8FAFC',
            padding: '12px 18px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.88rem',
            boxShadow: '0 4px 18px rgba(0, 240, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ color: '#00F0FF', fontWeight: 700 }}>[INFO]</span> {notification}
        </div>
      )}

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>[METRIC]</span> Total Discord Orbs
          </div>
          <div className="stat-value neon-cyan">{orbsCount.toLocaleString()}</div>
          <div className="stat-meta">Daily accumulation: +75 Orbs</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>[PIPELINE]</span> Active Quests
          </div>
          <div className="stat-value neon-emerald">
            {quests.filter((q) => q.status === 'FARMING').length}
          </div>
          <div className="stat-meta">Active catalog size: {quests.length} missions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>[NETWORK]</span> Proxy Routing
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginTop: '10px', fontFamily: 'ui-monospace, monospace' }}>
            {proxyStatus}
          </div>
          <div className="stat-meta" style={{ color: '#00F0FF' }}>
            Remote DNS Verified • Anti-Leak
          </div>
        </div>
      </section>

      {/* 1-Click Controls */}
      <section className="controls-bar">
        <button className="btn btn-primary" onClick={handleAutoFarmAll}>
          [+] Auto Farm All
        </button>
        <button className="btn btn-success" onClick={handleClaimAll}>
          [*] Claim All Rewards
        </button>
        <button className="btn btn-secondary" onClick={handleRotateProxy}>
          [~] Rotate Proxy
        </button>
        <button className="btn btn-secondary" onClick={handleScanHidden}>
          [?] Scan Hidden Quests
        </button>
        <button 
          className="btn" 
          style={{ background: 'rgba(236, 72, 153, 0.15)', borderColor: '#EC4899', color: '#F472B6' }}
          onClick={handleDeepExtractVault}
        >
          [!] Deep Extract Vault
        </button>
      </section>

      {/* Active Quests Grid */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Active Missions & Task Matrix</h2>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'ui-monospace, monospace' }}>
            SYNC: REAL-TIME STREAM
          </div>
        </div>

        <div className="quests-grid">
          {quests.map((quest) => (
            <div key={quest.id} className="quest-card">
              <div>
                <div className="quest-card-header">
                  <h3 className="quest-title">{quest.name}</h3>
                  <span className={`badge badge-${quest.status.toLowerCase()}`}>
                    {quest.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '8px', fontFamily: 'ui-monospace, monospace' }}>
                  MODE: <strong style={{ color: '#F8FAFC' }}>{quest.task_type}</strong>
                </div>

                <div className="progress-container">
                  <div className="progress-info">
                    <span>
                      {quest.progress_seconds}s / {quest.target_seconds}s
                    </span>
                    <span>{quest.percent}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${quest.percent === 100 ? 'full' : ''}`}
                      style={{ width: `${quest.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rewards-box">
                <span className="orbs-tag">+{quest.reward_orbs} Orbs</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{quest.reward_deco}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
