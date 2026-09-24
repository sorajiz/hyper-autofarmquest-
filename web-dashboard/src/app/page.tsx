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
  const [orbsCount, setOrbsCount] = useState<number>(350);
  const [proxyStatus, setProxyStatus] = useState<string>('127.0.0.1:1080 (Dual-Stack IPv6 /64 Active)');
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
    notify('🚀 Auto Farm launched across all eligible quests!');
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
      notify(`🎁 Claimed ${gained} Orbs and Discord rewards!`);
    } else {
      notify('ℹ️ No completed quests ready for claiming.');
    }
  };

  const handleRotateProxy = () => {
    setProxyStatus('192.168.1.100:9050 (IPv6 /64 Rotated)');
    setLatency(Math.floor(Math.random() * 20) + 15);
    notify('🔄 SOCKS5 / IPv6 Proxy pool rotated successfully!');
  };

  const handleScanHidden = () => {
    notify('🔍 Platform Matrix scan running (Mobile/Console/Geo)... Found 1 hidden quest!');
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

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <header className="hero-banner">
        <div>
          <h1 className="brand-title">
            <span>⚡</span> Auto Hyper - Farm Orb
          </h1>
          <p className="brand-subtitle">
            Next-Gen Multi-Platform Discord Quests & Orbs Automation Matrix v3.0.0
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Active Connection</div>
          <div style={{ color: '#00D26A', fontWeight: 700, fontSize: '0.95rem' }}>
            ● ONLINE | {latency}ms
          </div>
        </div>
      </header>

      {/* Global Toast Notification */}
      {notification && (
        <div
          style={{
            background: 'rgba(88, 101, 242, 0.9)',
            color: '#FFF',
            padding: '12px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            boxShadow: '0 4px 18px rgba(88, 101, 242, 0.5)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✨</span> {notification}
        </div>
      )}

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>🔮</span> Total Discord Orbs
          </div>
          <div className="stat-value neon-cyan">{orbsCount.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>
            Earned today: +75 Orbs
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>⚔️</span> Quests In Progress
          </div>
          <div className="stat-value neon-emerald">
            {quests.filter((q) => q.status === 'FARMING').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>
            Total active catalog: {quests.length} quests
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>🛡️</span> Dual-Stack Proxy Pool
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginTop: '12px' }}>
            {proxyStatus}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#00F0FF', marginTop: '8px' }}>
            Remote DNS Safe • Zero Leak Verified
          </div>
        </div>
      </section>

      {/* 1-Click Controls */}
      <section className="controls-bar">
        <button className="btn btn-primary" onClick={handleAutoFarmAll}>
          ⚡ Auto Farm All
        </button>
        <button className="btn btn-success" onClick={handleClaimAll}>
          🎁 Claim All Rewards
        </button>
        <button className="btn btn-secondary" onClick={handleRotateProxy}>
          🔄 Rotate Proxy
        </button>
        <button className="btn btn-secondary" onClick={handleScanHidden}>
          🔍 Scan Hidden Quests
        </button>
      </section>

      {/* Active Quests Grid */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Active Missions & Rewards</h2>
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
            Auto-refreshing via Live State Stream
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

                <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '8px' }}>
                  Target Mode: <strong style={{ color: '#F3F4F6' }}>{quest.task_type}</strong>
                </div>

                <div className="progress-container">
                  <div className="progress-info">
                    <span>
                      {quest.progress_seconds}/{quest.target_seconds}s
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
                <span className="orbs-tag">🔮 +{quest.reward_orbs} Orbs</span>
                <span style={{ color: '#D1D5DB', fontSize: '0.82rem' }}>{quest.reward_deco}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
