import React from 'react';
import { Music } from 'lucide-react';

export default function MusicTab() {
  const playlists = [
    { title: "Workout Pump", id: "PLyORnZIxHq1N3dD8i5tFqA_k6B-i7eJ_w" },
    { title: "Hip Hop Training", id: "PLyORnZIxHq1NVvI_b8W97XG6L4D7x5Q_E" },
    { title: "Lo-Fi Study", id: "PLofht4BTcE5k1g9vV_E8H0ZkH1v9q3F_j" },
    { title: "Deep Focus", id: "PLyORnZIxHq1P2_p4Fh6tL4pW6q01k8o1E" }
  ];

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Music size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '18px' }}>Training & Focus Music</h3>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Curated playlists for your sessions. Tap to play inline.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {playlists.map((pl, i) => (
          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
            <h4 style={{ padding: '12px 16px', margin: 0, fontSize: '14px', borderBottom: '1px solid var(--color-border-secondary)' }}>{pl.title}</h4>
            <iframe 
              src={`https://www.youtube.com/embed/videoseries?list=${pl.id}`} 
              style={{ width: '100%', height: '180px', border: 'none', display: 'block' }} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
