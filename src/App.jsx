import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, BookOpen, BarChart2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import HomeScreen from './screens/Home';
import TrainScreen from './screens/Train';
import StudyScreen from './screens/Study';
import TrackScreen from './screens/Track';
import AICoachScreen from './screens/AICoach';

import { db } from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [profile, setProfile] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [vlsiProgress, setVlsiProgress] = useState({ completedDays: [], testScores: [] });
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await db.get('profile');
      const m = await db.get('measurements') || [];
      const vp = await db.get('vlsiProgress') || { completedDays: [], testScores: [] };
      const wl = await db.get('workoutLogs') || [];
      setProfile(p);
      setMeasurements(m);
      setVlsiProgress(vp);
      setWorkoutLogs(wl);
      setLoading(false);
    })();
  }, []);

  const saveProfile = async p => { await db.set('profile', p); setProfile(p); };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!profile) return <Setup onDone={saveProfile} />;

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', color: 'var(--color-accent-danger)' },
    { id: 'study', icon: BookOpen, label: 'Study', color: 'var(--color-accent-vlsi)' },
    { id: 'train', icon: Dumbbell, label: 'Train', color: 'var(--color-accent-fit)' },
    { id: 'track', icon: BarChart2, label: 'Track', color: 'var(--color-accent-track)' },
    { id: 'ai', icon: MessageSquare, label: 'AI', color: 'var(--color-accent-ai)' }
  ];

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      <div style={{ paddingBottom: '80px', height: '100vh', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {screen === 'home' && <HomeScreen profile={profile} measurements={measurements} vlsiProgress={vlsiProgress} workoutLogs={workoutLogs} setScreen={setScreen} />}
            {screen === 'study' && <StudyScreen profile={profile} setProfile={saveProfile} vlsiProgress={vlsiProgress} setVlsiProgress={async vp => { setVlsiProgress(vp); await db.set('vlsiProgress', vp); }} />}
            {screen === 'train' && <TrainScreen profile={profile} measurements={measurements} workoutLogs={workoutLogs} setWorkoutLogs={async wl => { setWorkoutLogs(wl); await db.set('workoutLogs', wl); }} />}
            {screen === 'track' && <TrackScreen measurements={measurements} setMeasurements={async m => { setMeasurements(m); await db.set('measurements', m); }} profile={profile} />}
            {screen === 'ai' && <AICoachScreen profile={profile} measurements={measurements} vlsiProgress={vlsiProgress} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="glass-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', display: 'flex', zIndex: 100, padding: '10px 0 calc(10px + env(safe-area-inset-bottom))' }}>
        {tabs.map(t => {
          const on = screen === t.id;
          const Icon = t.icon;
          return (
            <button 
              key={t.id} 
              onClick={() => setScreen(t.id)} 
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Icon size={24} color={on ? t.color : 'var(--color-text-tertiary)'} style={{ transition: 'color 0.2s' }} />
              <span style={{ fontSize: '10px', color: on ? t.color : 'var(--color-text-tertiary)', fontWeight: on ? 600 : 400 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Setup({ onDone }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('fat_loss');
  const [experience, setExperience] = useState('beginner');
  const [vlsiBackground, setVlsiBackground] = useState('none');

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', marginBottom: '12px', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px', textAlign: 'left' };

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '4px', textAlign: 'center' }}>Welcome! 🚀</h1>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
        Set up your profile so the AI can personalize everything for you.
      </p>

      <label style={labelStyle}>Your Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samay" style={inputStyle} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Age</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="23" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
        <div>
          <label style={labelStyle}>Height (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
        <div>
          <label style={labelStyle}>Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="90" style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
      </div>

      <label style={labelStyle}>Fitness Goal</label>
      <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
        <option value="fat_loss">Fat Loss / Cut</option>
        <option value="muscle_gain">Muscle Gain / Bulk</option>
        <option value="recomposition">Body Recomposition</option>
        <option value="strength">Strength Focus</option>
        <option value="endurance">Endurance / Cardio</option>
      </select>

      <label style={labelStyle}>Gym Experience</label>
      <select value={experience} onChange={e => setExperience(e.target.value)} style={inputStyle}>
        <option value="beginner">Beginner (0-6 months)</option>
        <option value="intermediate">Intermediate (6 months - 2 years)</option>
        <option value="advanced">Advanced (2+ years)</option>
      </select>

      <label style={labelStyle}>VLSI Background</label>
      <select value={vlsiBackground} onChange={e => setVlsiBackground(e.target.value)} style={inputStyle}>
        <option value="none">Complete Beginner</option>
        <option value="some">Some Digital Logic knowledge</option>
        <option value="experienced">Experienced (Verilog/RTL)</option>
      </select>

      <button 
        onClick={() => {
          if (!name.trim()) return;
          onDone({
            name: name.trim(),
            age: parseInt(age) || 23,
            height: parseInt(height) || 175,
            goal,
            experience,
            vlsiBackground,
            startDate: new Date().toISOString(),
            vlsiPhase: vlsiBackground === 'experienced' ? 2 : vlsiBackground === 'some' ? 1 : 0,
            vlsiDay: 1,
            fitPhase: experience === 'advanced' ? 1 : 0,
            firstMeasurement: { date: new Date().toISOString(), weight: parseFloat(weight) || 90 }
          });
        }}
        style={{ padding: '14px 24px', background: 'var(--color-accent-vlsi)', color: 'white', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 600, fontSize: '16px', marginTop: '8px' }}
      >
        Start My Journey
      </button>
    </div>
  );
}
