import React from 'react';
import { Calendar, Dumbbell } from 'lucide-react';
import { FIT_PHASES } from '../../data/fitness';

export default function ScheduleTab({ profile }) {
  const currentPhase = profile.fitPhase || 0;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Calendar size={24} color="#10b981" />
        <h3 style={{ fontSize: '18px' }}>Training Schedule</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {FIT_PHASES.map((phase, i) => {
          const isDone = i < currentPhase;
          const isCurrent = i === currentPhase;
          
          return (
            <div key={i} style={{ opacity: isDone ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', color: isCurrent ? phase.color : 'white', margin: 0 }}>{phase.name}</h4>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{phase.gymDays.length}x/wk</span>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                {days.map(d => {
                  const isGym = phase.gymDays.includes(d);
                  return (
                    <div 
                      key={d} 
                      style={{ 
                        flex: 1, 
                        padding: '12px 4px', 
                        textAlign: 'center', 
                        borderRadius: '6px', 
                        background: isGym ? `${phase.color}20` : 'var(--color-bg-tertiary)',
                        border: isGym ? `1px solid ${phase.color}` : '1px solid var(--color-border-secondary)'
                      }}
                    >
                      <span style={{ fontSize: '10px', display: 'block', marginBottom: '4px', color: isGym ? 'white' : 'var(--color-text-tertiary)' }}>{d}</span>
                      {isGym ? <Dumbbell size={14} color={phase.color} style={{ margin: '0 auto' }} /> : <span style={{ fontSize: '12px' }}>🚶</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
