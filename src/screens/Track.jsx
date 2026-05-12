import React, { useState, useRef } from 'react';
import { Camera, Ruler, Calculator, TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ai, aiVision } from '../services/ai';

export default function TrackScreen({ measurements, setMeasurements, profile }) {
  const [tab, setTab] = useState('charts');
  const [stats, setStats] = useState({ weight: '', waist: '', hips: '', thigh: '', chest: '' });
  
  // Photo AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const fileInputRef = useRef(null);

  const chartData = measurements.map(m => ({
    name: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight
  }));

  const save = () => {
    if(!stats.weight) return alert("Weight is required.");
    setMeasurements([...measurements, { 
      date: new Date().toISOString(), 
      weight: parseFloat(stats.weight),
      waist: stats.waist ? parseFloat(stats.waist) : null,
      hips: stats.hips ? parseFloat(stats.hips) : null,
      thigh: stats.thigh ? parseFloat(stats.thigh) : null,
      chest: stats.chest ? parseFloat(stats.chest) : null
    }]);
    setStats({ weight: '', waist: '', hips: '', thigh: '', chest: '' });
    setTab('charts');
  };

  const getFullAnalysis = async () => {
    setAnalyzing(true);
    const prompt = `Analyze my full fitness measurement history and tell me what is improving, what is lagging, why stubborn fat persists, and 2 specific changes for next week.\n\nHistory:\n${JSON.stringify(measurements, null, 2)}`;
    const result = await ai(prompt, "You are an elite fitness coach and nutritionist.");
    setAnalysis(result);
    setAnalyzing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];
      const mimeType = file.type;
      
      const prompt = `Analyze this physique progress photo. Look for visible fat in love handles, stomach, and thighs. Estimate body fat % range. Give specific exercise recommendations and note positive progress.`;
      const result = await aiVision(base64String, mimeType, prompt, "You are a professional bodybuilding judge and fitness coach. Be extremely honest and constructive.");
      setAnalysis(result);
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  // Trend analysis
  let trendStr = "Log more data";
  let trendColor = "var(--color-text-secondary)";
  let rate = 0;
  
  if (measurements.length > 1) {
    const first = profile.firstMeasurement || measurements[0];
    const latest = measurements[measurements.length - 1];
    const diff = latest.weight - first.weight;
    
    const recent = measurements.slice(-2);
    const weeklyDiff = recent[1].weight - recent[0].weight;
    rate = weeklyDiff;

    if (weeklyDiff > 0.25) { trendStr = "Gaining ⚠️"; trendColor = "#ef4444"; }
    else if (weeklyDiff < -0.8) { trendStr = "Too fast ⚠️"; trendColor = "#f59e0b"; }
    else if (weeklyDiff < -0.1) { trendStr = "On track ✅"; trendColor = "#10b981"; }
    else { trendStr = "Plateau 🔄"; trendColor = "#3b82f6"; }
  }

  // Calculate Deltas from start
  const m1 = profile.firstMeasurement || (measurements.length ? measurements[0] : null);
  const mN = measurements.length ? measurements[measurements.length - 1] : null;
  const getDelta = (key) => {
    if(!m1 || !mN || m1[key] == null || mN[key] == null) return null;
    return (mN[key] - m1[key]).toFixed(1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Progress Tracker</h2>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {['charts', 'log', 'history', 'photos', '1rm'].map(t => (
          <button 
            key={t}
            onClick={() => { setTab(t); setAnalysis(''); }}
            style={{ 
              padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: tab === t ? 600 : 400,
              background: tab === t ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
              color: tab === t ? 'var(--color-bg-base)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-primary)', whiteSpace: 'nowrap'
            }}
          >
            {t === '1rm' ? '1RM Calc' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'charts' && (
        <>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', borderLeft: `4px solid ${trendColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Trend</p>
                <h3 style={{ fontSize: '18px', color: trendColor }}>{trendStr}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Weekly Rate</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{rate > 0 ? '+' : ''}{rate.toFixed(2)} kg/wk</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <DeltaCard title="Weight" val={getDelta('weight')} unit="kg" />
            <DeltaCard title="Waist" val={getDelta('waist')} unit="cm" />
            <DeltaCard title="Hips" val={getDelta('hips')} unit="cm" />
            <DeltaCard title="Thighs" val={getDelta('thigh')} unit="cm" />
          </div>

          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>WEIGHT TREND</h3>
            <div style={{ height: '200px', width: '100%' }}>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={10} />
                    <YAxis domain={['auto', 'auto']} stroke="var(--color-text-tertiary)" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-primary)', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Line type="monotone" dataKey="weight" stroke="var(--color-accent-track)" strokeWidth={3} dot={{ fill: 'var(--color-accent-track)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Log more measurements to see your trend.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={getFullAnalysis}
            disabled={analyzing || measurements.length < 2}
            style={{ width: '100%', padding: '14px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {analyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><TrendingUp size={16} color="var(--color-accent-track)" /> Get AI Progress Analysis</>}
          </button>
          
          {analysis && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-accent-track)' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.6 }}>{analysis}</pre>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Measurement Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...measurements].reverse().map((m, i) => (
              <div key={i} style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.entries(m).filter(([k,v]) => k !== 'date' && v != null).map(([k,v]) => (
                    <div key={k}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{k}</span>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>{v} <span style={{ fontSize: '10px', fontWeight: 400 }}>{k === 'weight' ? 'kg' : 'cm'}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Ruler size={24} color="var(--color-accent-track)" />
            <h3 style={{ fontSize: '16px' }}>Log Sunday Stats</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Log every Sunday morning, same time, after bathroom, before food.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <input type="number" placeholder="Weight (kg) *" value={stats.weight} onChange={e => setStats({...stats, weight: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Waist (cm)" value={stats.waist} onChange={e => setStats({...stats, waist: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Hips (cm)" value={stats.hips} onChange={e => setStats({...stats, hips: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Left Thigh (cm)" value={stats.thigh} onChange={e => setStats({...stats, thigh: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Chest (cm)" value={stats.chest} onChange={e => setStats({...stats, chest: e.target.value})} style={inputStyle} />
          </div>
          <button onClick={save} style={{ width: '100%', padding: '14px', background: 'var(--color-accent-track)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Save Log</button>
        </div>
      )}

      {tab === '1rm' && <OneRepMaxCalc />}

      {tab === 'photos' && (
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <Camera size={48} color="var(--color-accent-track)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>AI Photo Analyzer</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Upload a progress photo. Gemini Vision will analyze muscle definition, fat distribution in stubborn areas, and estimate body fat %. 
            <br/><br/><em>Privacy: Photos are analyzed and immediately discarded. Never saved.</em>
          </p>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            style={{ display: 'none' }} 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={analyzing}
            style={{ padding: '14px 28px', background: 'var(--color-accent-track)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '0 auto' }}
          >
            {analyzing ? <><Loader2 size={16} className="animate-spin" /> Processing Image...</> : 'Upload Photo'}
          </button>
          
          {analysis && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-accent-track)', textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-accent-track)' }}>Vision Analysis</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.6 }}>{analysis}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white' };

function DeltaCard({ title, val, unit }) {
  if (val === null) return (
    <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px dashed var(--color-border-primary)' }}>
      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>No data</p>
    </div>
  );
  
  const v = parseFloat(val);
  const isGood = v <= 0;
  
  return (
    <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', borderLeft: `3px solid ${isGood ? '#10b981' : '#ef4444'}` }}>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{title} Lost</p>
      <p style={{ fontSize: '16px', fontWeight: 600, color: isGood ? '#10b981' : '#ef4444' }}>{v > 0 ? '+' : ''}{v} {unit}</p>
    </div>
  );
}

function OneRepMaxCalc() {
  const [w, setW] = useState('');
  const [r, setR] = useState('');
  const [rm, setRm] = useState(null);

  const calc = () => {
    if(w && r) setRm(Math.round(parseFloat(w) * (1 + parseInt(r) / 30)));
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Calculator size={24} color="#3b82f6" />
        <h3 style={{ fontSize: '16px' }}>1RM Calculator</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <input type="number" placeholder="Weight (kg)" value={w} onChange={e => setW(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Reps" value={r} onChange={e => setR(e.target.value)} style={inputStyle} />
      </div>
      <button onClick={calc} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, marginBottom: rm ? '16px' : '0' }}>Calculate 1RM</button>
      
      {rm && (
        <div style={{ padding: '16px', background: '#3b82f620', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>Estimated 1RM</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{rm} kg</p>
        </div>
      )}
    </div>
  );
}
