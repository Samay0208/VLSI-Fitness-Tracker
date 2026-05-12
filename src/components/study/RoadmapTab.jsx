import React from 'react';
import { Map, CheckCircle } from 'lucide-react';
import { VLSI_PHASES } from '../../data/vlsi';

export default function RoadmapTab({ profile }) {
  const currentPhase = profile.vlsiPhase;

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Map size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '18px' }}>VLSI Mastery Roadmap</h3>
      </div>
      
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Vertical line connecting nodes */}
        <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '26px', width: '2px', background: 'var(--color-border-secondary)' }} />
        
        {VLSI_PHASES.map((p, i) => {
          const isDone = i < currentPhase;
          const isCurrent = i === currentPhase;
          const isFuture = i > currentPhase;
          
          let circleBg = isDone ? '#10b981' : (isCurrent ? p.color : 'var(--color-bg-secondary)');
          let circleBorder = isFuture ? `2px solid var(--color-border-primary)` : `2px solid ${circleBg}`;
          
          return (
            <div key={i} style={{ position: 'relative', paddingLeft: '32px', marginBottom: '32px', opacity: isFuture ? 0.6 : 1 }}>
              <div style={{ position: 'absolute', left: 0, top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: circleBg, border: circleBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {isDone && <CheckCircle size={10} color="white" />}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'white' : 'var(--color-text-primary)', margin: 0 }}>{p.name}</h4>
                {isCurrent && <span style={{ fontSize: '10px', padding: '2px 8px', background: `${p.color}30`, color: p.color, borderRadius: '12px', fontWeight: 600 }}>NOW</span>}
              </div>
              
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{p.days} Days • Phase {i}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
