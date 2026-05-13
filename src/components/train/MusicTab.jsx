import React from 'react';
import { Music, ExternalLink } from 'lucide-react';

export default function MusicTab() {
  const dailyPlaylists = [
    { title: "Beast Mode", genre: "Heavy Metal / Rock", searchQuery: "beast+mode+gym+workout+playlist", color: "#E24B4A" },
    { title: "Gym Motivation", genre: "Hip Hop / Rap", searchQuery: "gym+motivation+hip+hop+workout+2024", color: "#378ADD" },
    { title: "Phonk Adrenaline", genre: "Phonk / Bass", searchQuery: "phonk+gym+workout+bass+boosted", color: "#7F77DD" },
    { title: "Hip Hop Workout", genre: "Trap / Hip Hop", searchQuery: "hip+hop+trap+workout+gym+playlist", color: "#D4537E" },
    { title: "Heavy Rock", genre: "Metal / Hard Rock", searchQuery: "heavy+rock+metal+gym+workout+playlist", color: "#BA7517" },
    { title: "Dance Workout", genre: "EDM / Dance", searchQuery: "edm+dance+workout+gym+high+energy", color: "#1D9E75" },
    { title: "Top 50 Hits", genre: "Pop / Top Charts", searchQuery: "top+50+workout+hits+gym+2024", color: "#639922" },
  ];

  const todayIdx = new Date().getDay();
  const todaysPick = dailyPlaylists[todayIdx];

  const studyPlaylists = [
    { title: "Lo-Fi Study Beats", searchQuery: "lofi+study+beats+focus+music", color: "#8b5cf6" },
    { title: "Deep Focus Piano", searchQuery: "deep+focus+piano+study+music+concentration", color: "#378ADD" },
  ];

  const openYouTube = (query) => {
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const openYTMusic = (query) => {
    window.open(`https://music.youtube.com/search?q=${query.replace(/\+/g, ' ')}`, '_blank');
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Music size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '18px' }}>Daily Shuffle</h3>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        A fresh workout playlist every day. Tap to open in YouTube.
      </p>

      {/* Today's Pick — Highlighted */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: `2px solid ${todaysPick.color}`, marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: `${todaysPick.color}15` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', padding: '4px 8px', background: `${todaysPick.color}30`, color: todaysPick.color, borderRadius: '12px', fontWeight: 600 }}>✨ TODAY'S PICK</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{todaysPick.genre}</span>
          </div>
          <h4 style={{ margin: '8px 0', fontSize: '18px' }}>{todaysPick.title}</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              onClick={() => openYouTube(todaysPick.searchQuery)} 
              style={{ flex: 1, padding: '10px', background: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              ▶ YouTube <ExternalLink size={14} />
            </button>
            <button 
              onClick={() => openYTMusic(todaysPick.searchQuery)} 
              style={{ flex: 1, padding: '10px', background: '#ff000020', color: '#ff4444', border: '1px solid #ff000040', borderRadius: '8px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              ♪ YT Music <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Other gym playlists */}
      <h4 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>🏋️ Other Gym Playlists</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {dailyPlaylists.filter((_, i) => i !== todayIdx).map((pl, i) => (
          <div key={i} onClick={() => openYouTube(pl.searchQuery)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)', cursor: 'pointer' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{pl.title}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{pl.genre}</p>
            </div>
            <ExternalLink size={16} color="var(--color-text-tertiary)" />
          </div>
        ))}
      </div>

      {/* Study Playlists */}
      <h4 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>📚 VLSI Study Focus</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {studyPlaylists.map((pl, i) => (
          <div key={i} onClick={() => openYouTube(pl.searchQuery)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: `1px solid ${pl.color}40`, cursor: 'pointer' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: pl.color }}>{pl.title}</p>
            </div>
            <ExternalLink size={16} color={pl.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
