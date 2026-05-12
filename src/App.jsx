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
  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Setup Profile</h1>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Your Name" 
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', marginBottom: '16px' }} 
      />
      <button 
        onClick={() => {
          if(!name.trim()) return;
          onDone({
            name: name.trim(), startDate: new Date().toISOString(),
            vlsiPhase: 0, vlsiDay: 1, fitPhase: 0,
            firstMeasurement: { date: new Date().toISOString(), weight: 90 }
          });
        }}
        style={{ padding: '12px 24px', background: 'var(--color-accent-vlsi)', color: 'white', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 600 }}
      >
        Start Journey
      </button>
    </div>
  );
}
