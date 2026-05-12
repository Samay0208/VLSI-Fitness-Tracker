import React from 'react';
import { Music } from 'lucide-react';

export default function MusicTab() {
  // 7 different high-energy Spotify workout playlists for each day of the week
  const dailyPlaylists = [
    { title: "Sunday: Beast Mode", id: "37i9dQZF1DX76Wlfdnj7AP" },
    { title: "Monday: Gym Motivation", id: "37i9dQZF1DWZq91oLsHZvy" },
    { title: "Tuesday: Phonk / Adrenaline", id: "37i9dQZF1DX4eRPd9fM1fN" },
    { title: "Wednesday: Hip Hop Workout", id: "37i9dQZF1DX76t638V6EQ8" },
    { title: "Thursday: Heavy Rock Workout", id: "37i9dQZF1DX8tZsk68tuHI" },
    { title: "Friday: Dance Workout", id: "37i9dQZF1DX8CwnimzNIfz" },
    { title: "Saturday: Top 50 Workout", id: "37i9dQZF1DX70RN3TfR700" },
  ];

  const todayIdx = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todaysPick = dailyPlaylists[todayIdx];

  const lofiStudyId = "37i9dQZF1DWWQRwui0ExPn"; // Lo-Fi Beats

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Music size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '18px' }}>Daily Shuffle</h3>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        A fresh, hard-hitting playlist every day so you never get bored.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Daily Pick */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: `1px solid #1db954` }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#1db954' }}>✨ Today's Gym Pick</h4>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{todaysPick.title.split(': ')[1]}</span>
          </div>
          <iframe 
            style={{ borderRadius: "0 0 12px 12px" }} 
            src={`https://open.spotify.com/embed/playlist/${todaysPick.id}?utm_source=generator&theme=0`} 
            width="100%" 
            height="352" 
            frameBorder="0" 
            allowFullScreen="" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
          />
        </div>

        {/* Study Focus (Always available) */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-secondary)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#8b5cf6' }}>📚 VLSI Deep Focus</h4>
          </div>
          <iframe 
            style={{ borderRadius: "0 0 12px 12px" }} 
            src={`https://open.spotify.com/embed/playlist/${lofiStudyId}?utm_source=generator&theme=0`} 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allowFullScreen="" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
          />
        </div>

      </div>
    </div>
  );
}
