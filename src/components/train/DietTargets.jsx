import React from 'react';
import { Utensils, Flame, Info } from 'lucide-react';

export default function DietTargets({ profile, measurements }) {
  const latestWeight = measurements.length ? measurements[measurements.length - 1].weight : (profile.firstMeasurement?.weight || 90);
  
  // Mifflin-St Jeor (Male, 23y, 183cm - roughly 6ft)
  // BMR = 10*weight + 6.25*height - 5*age + 5
  const bmr = (10 * latestWeight) + (6.25 * 183) - (5 * 23) + 5;
  
  const fp = profile.fitPhase || 0;
  let multiplier = 1.375; // Phase 1 (3x)
  if (fp === 1) multiplier = 1.55; // Phase 2 (4x)
  if (fp === 2) multiplier = 1.65; // Phase 3 (5x)
  
  const tdee = Math.round(bmr * multiplier);
  
  // Calculate trend (last 2 weeks approx)
  let trend = 'plateau';
  let deficit = -300;
  if (measurements.length > 1) {
    const recent = measurements.slice(-3);
    const w1 = recent[0].weight;
    const w2 = recent[recent.length - 1].weight;
    const diff = w2 - w1;
    if (diff > 0.25) { trend = 'gaining'; deficit = -550; }
    else if (diff < -0.8) { trend = 'losing_fast'; deficit = 150; } // Add cals if losing too fast
    else if (diff < -0.1) { trend = 'losing'; deficit = -300; }
  }
  
  const targetCals = tdee + deficit;
  const protein = Math.round(1.9 * latestWeight);
  const fat = Math.round((targetCals * 0.25) / 9);
  const carbs = Math.round((targetCals - (protein * 4) - (fat * 9)) / 4);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Utensils size={24} color="#f59e0b" />
        <h3 style={{ fontSize: '18px' }}>Dynamic Diet Targets</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Daily Target</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>{targetCals}</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>kcal</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>TDEE: {tdee} kcal</p>
          <p style={{ fontSize: '12px', color: trend === 'gaining' ? '#f43f5e' : '#10b981' }}>{deficit > 0 ? '+' : ''}{deficit} kcal adjust</p>
        </div>
      </div>
      
      <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Macros Breakdown</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', borderBottom: '3px solid #3b82f6' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Protein</p>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>{protein}g</p>
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', borderBottom: '3px solid #10b981' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Carbs</p>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>{carbs}g</p>
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', borderBottom: '3px solid #f59e0b' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Fat</p>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>{fat}g</p>
        </div>
      </div>
      
      {/* Visual Macro Bar */}
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ width: `${(protein * 4 / targetCals) * 100}%`, background: '#3b82f6' }} />
        <div style={{ width: `${(carbs * 4 / targetCals) * 100}%`, background: '#10b981' }} />
        <div style={{ width: `${(fat * 9 / targetCals) * 100}%`, background: '#f59e0b' }} />
      </div>

      <div style={{ background: '#f59e0b20', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px' }}>
        <h4 style={{ fontSize: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Info size={16}/> Vegetarian Protein Cheatsheet</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
          <li><strong>Soya chunks (dry):</strong> 52g per 100g</li>
          <li><strong>Whey protein:</strong> 24g per scoop</li>
          <li><strong>Paneer:</strong> 18g per 100g</li>
          <li><strong>Tofu (firm):</strong> 17g per 100g</li>
          <li><strong>Curd (full-fat):</strong> 11g per 100g</li>
          <li><strong>Rajma (cooked):</strong> 9g per 100g</li>
        </ul>
      </div>
    </div>
  );
}
