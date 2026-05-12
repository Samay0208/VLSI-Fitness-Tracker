import React from 'react';
import { Music } from 'lucide-react';

export default function MusicTab() {
  // 7 different YouTube workout playlists for each day of the week
  const dailyPlaylists = [
    { title: "Sunday: Beast Mode", id: "PLyORnZIxHq1N3dD8i5tFqA_k6B-i7eJ_w" },
    { title: "Monday: Gym Motivation", id: "PLyORnZIxHq1NVvI_b8W97XG6L4D7x5Q_E" },
    { title: "Tuesday: Phonk / Adrenaline", id: "PLDIoUOhQQPlXr63I_vwF9VYptk4m3yKWL" },
    { title: "Wednesday: Hip Hop Workout", id: "RDCLAK5QFxhE_GfFow29H4T5oM2wVv2u" },
    { title: "Thursday: Heavy Rock Workout", id: "PLw-VjHDlEOgs658kAHR_LAaILBXb-sILT" },
    { title: "Friday: Dance Workout", id: "RDCLAK5QFxiL_VwX_I411n987Fq2349S" },
    { title: "Saturday: Top 50 Workout", id: "PLhIcv3N1o12t8wFh88xT8u_pZ2P1aApeH" },
  ];

  const todayIdx = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todaysPick = dailyPlaylists[todayIdx];

  const lofiStudyId = "PLofht4BTcE5k1g9vV_E8H0ZkH1v9q3F_j"; // Lo-Fi Beats

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Music size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '18px' }}>Daily Shuffle</h3>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        A fresh, hard-hitting YouTube playlist every day so you never get bored.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Daily Pick */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: `1px solid #ff0000` }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#ff0000' }}>✨ Today's Gym Pick</h4>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{todaysPick.title.split(': ')[1]}</span>
          </div>
          <iframe 
            src={`https://www.youtube.com/embed/videoseries?list=${todaysPick.id}`} 
            style={{ width: '100%', height: '180px', border: 'none', display: 'block' }} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
          />
        </div>

        {/* Study Focus (Always available) */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-secondary)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#8b5cf6' }}>📚 VLSI Deep Focus</h4>
          </div>
          <iframe 
            src={`https://www.youtube.com/embed/videoseries?list=${lofiStudyId}`} 
            style={{ width: '100%', height: '180px', border: 'none', display: 'block' }} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
          />
        </div>

      </div>
    </div>
  );
}
