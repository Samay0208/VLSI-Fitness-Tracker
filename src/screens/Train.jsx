import React, { useState, useEffect } from 'react';
import { Dumbbell, Droplets, Moon, Activity, Calendar, Loader2, TrendingUp, Utensils, Music, Sparkles, ClipboardList, ChevronRight } from 'lucide-react';
import { WORKOUTS, FIT_PHASES } from '../data/fitness';
import { db } from '../utils/storage';
import { ai, aiJson } from '../services/ai';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import WorkoutLogger from '../components/train/WorkoutLogger';
import DietTargets from '../components/train/DietTargets';
import MusicTab from '../components/train/MusicTab';
import ScheduleTab from '../components/train/ScheduleTab';

export default function TrainScreen({ profile, measurements, workoutLogs, setWorkoutLogs }) {
  const [tab, setTab] = useState('workout');
  const [monthlyBlock, setMonthlyBlock] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [tips, setTips] = useState('');
  
  const fp = FIT_PHASES[profile.fitPhase || 0];
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const gymIdx = fp.gymDays.indexOf(dow);
  const isGym = gymIdx !== -1;
  const wKey = !isGym ? 'Rest' : (fp.split ? fp.split[gymIdx] : 'Push');

  useEffect(() => {
    (async () => {
      const block = await db.get('monthlyWorkoutBlock');
      if (block) setMonthlyBlock(block);
    })();
  }, []);

  const generateMonth = async () => {
    setGenerating(true);
    const currentWeight = measurements.length ? measurements[measurements.length - 1].weight : (profile.firstMeasurement?.weight || 90);
    
    const prompt = `Generate a 4-week workout block for a user on the ${fp.name} phase. Current weight: ${currentWeight}kg. 
    They train on: ${fp.gymDays.join(', ')}.
    Return a JSON object with keys for each training day (e.g., 'Mon', 'Tue', etc.).
    Each day must have:
    - name (string, e.g., "Heavy Push")
    - tag (string, e.g., "Chest & Triceps")
    - duration (string, e.g., "60-75 min")
    - color (string, hex color)
    - exercises (array of objects with 'name', 'defaultSets', 'defaultReps', 'rest', 'tip')
    Ensure the routine focuses on progressive overload based on this being a new monthly block.`;
    
    const sys = "You are a professional strength and conditioning coach. Your output must strictly be the JSON format requested.";
    const result = await aiJson(prompt, sys);
    
    if (result) {
      setMonthlyBlock(result);
      await db.set('monthlyWorkoutBlock', result);
    } else {
      alert("Failed to generate workout block. Please try again.");
    }
    setGenerating(false);
  };

  const getAITips = async () => {
    const todayStr = new Date().toDateString();
    const cached = await db.get('dailyTrainTips');
    if (cached && cached.date === todayStr) {
      setTips(cached.text);
      return;
    }

    setTips('Loading...');
    const currentWeight = measurements.length ? measurements[measurements.length - 1].weight : (profile.firstMeasurement?.weight || 90);
    const prompt = `Give me 3 short personalized fitness tips for today. I weigh ${currentWeight}kg, I am doing Phase: ${fp.name}, and today is a ${isGym ? 'Gym Day' : 'Rest Day'}. Be concise.`;
    const res = await ai(prompt, "You are an elite personal trainer.");
    
    if (res && !res.includes('Sorry')) {
      await db.set('dailyTrainTips', { date: todayStr, text: res });
    }
    setTips(res);
  };

  useEffect(() => {
    (async () => {
      const todayStr = new Date().toDateString();
      const cached = await db.get('dailyTrainTips');
      if (cached && cached.date === todayStr) {
        setTips(cached.text);
      }
    })();
  }, []);

  const workout = monthlyBlock && monthlyBlock[dow] ? monthlyBlock[dow] : (isGym ? WORKOUTS[wKey] : WORKOUTS['Rest']);

  // Calculate tomorrow's workout
  const tomorrowIdx = (new Date().getDay() + 1) % 7;
  const tomorrowDow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][tomorrowIdx];
  const tomorrowGymIdx = fp.gymDays.indexOf(tomorrowDow);
  const isTomorrowGym = tomorrowGymIdx !== -1;
  const tomorrowKey = !isTomorrowGym ? 'Rest' : (fp.split ? fp.split[tomorrowGymIdx] : 'Push');
  const tomorrowWorkout = monthlyBlock && monthlyBlock[tomorrowDow] ? monthlyBlock[tomorrowDow] : (isTomorrowGym ? WORKOUTS[tomorrowKey] : WORKOUTS['Rest']);

  const TABS = [
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'plan', label: 'Plan', icon: ClipboardList },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'overload', label: 'Overload', icon: TrendingUp },
    { id: 'water', label: 'Water', icon: Droplets },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'supplements', label: 'Supplements', icon: Activity }
  ];

  // Calculate AI banner
  let banner = null;
  if (measurements.length > 1) {
    const recent = measurements.slice(-3);
    const w1 = recent[0].weight;
    const w2 = recent[recent.length - 1].weight;
    const diff = w2 - w1;
    if (diff > 0.25) banner = "⚠️ Gaining: +15min LISS, shorter rest periods";
    else if (diff < -0.8) banner = "⚠️ Losing too fast: Reduce HIIT, eat more protein";
    else if (diff > -0.1 && diff < 0.25) banner = "🔄 Plateau detected: +5kg to all lifts, HIIT intensity up";
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px' }}>Training Hub</h2>
        <button 
          onClick={generateMonth}
          disabled={generating}
          style={{ fontSize: '12px', padding: '8px 16px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          New Month AI Block
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button 
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: active ? 600 : 400,
                background: active ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
                color: active ? 'var(--color-bg-base)' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-primary)', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'workout' && !monthlyBlock && !generating && (
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>You haven't generated your AI personalized monthly block yet. Below is the default template.</p>
        </div>
      )}

      {tab === 'workout' && generating && (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', marginBottom: '20px' }}>
          <Loader2 size={40} color={fp.color} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>AI is programming your month...</h3>
        </div>
      )}

      {tab === 'workout' && !generating && (
        <>
          {banner && (
            <div style={{ padding: '12px', background: 'var(--color-accent-danger)20', border: '1px solid var(--color-accent-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-accent-danger)" /> {banner}
            </div>
          )}

          <div className="glass-card" style={{ padding: '16px', borderTop: `4px solid ${workout.color || fp.color}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', padding: '4px 8px', background: `${fp.color}20`, color: fp.color, borderRadius: '12px', marginRight: '8px' }}>{fp.name}</span>
                <span style={{ fontSize: '10px', padding: '4px 8px', background: `${workout.color || fp.color}20`, color: workout.color || fp.color, borderRadius: '12px' }}>{workout.tag || 'Daily Workout'}</span>
                <h2 style={{ fontSize: '20px', marginTop: '12px' }}>{workout.name}</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{workout.duration}</p>
              </div>
              <Dumbbell size={32} color={workout.color || fp.color} style={{ opacity: 0.5 }} />
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <button onClick={getAITips} style={{ width: '100%', padding: '10px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#f59e0b" /> Get AI tips for today
              </button>
              {tips && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-bg-base)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {tips}
                </div>
              )}
            </div>
          </div>

          <WorkoutLogger workout={workout} isGym={isGym} color={workout.color || fp.color} workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} tomorrowWorkout={tomorrowWorkout} tomorrowDow={tomorrowDow} isTomorrowGym={isTomorrowGym} />
        </>
      )}

      {tab === 'plan' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ClipboardList size={24} color={fp.color} />
            <h3 style={{ fontSize: '16px' }}>Monthly Workout Plan</h3>
          </div>
          {!monthlyBlock ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>No AI plan generated yet. Tap "New Month AI Block" above to create your personalized 4-week program.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fp.gymDays.map((day, i) => {
                const dayWorkout = monthlyBlock[day] || {};
                return (
                  <div key={day} style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: `1px solid ${dayWorkout.color || fp.color}40` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: dayWorkout.color || fp.color, background: `${dayWorkout.color || fp.color}20`, padding: '2px 8px', borderRadius: '6px' }}>{day}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{dayWorkout.name || fp.split?.[i] || 'Workout'}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{dayWorkout.duration || ''}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{dayWorkout.tag || ''}</p>
                    {dayWorkout.exercises && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayWorkout.exercises.map((ex, j) => (
                          <div key={j} style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ChevronRight size={10} /> {ex.name} — {ex.defaultSets}×{ex.defaultReps}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: '1px solid #64748b40' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', background: '#64748b20', padding: '2px 8px', borderRadius: '6px' }}>Sat/Sun</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Active Recovery</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Walk, stretching, foam rolling</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'diet' && <DietTargets profile={profile} measurements={measurements} />}
      {tab === 'music' && <MusicTab />}
      {tab === 'schedule' && <ScheduleTab profile={profile} />}
      {tab === 'overload' && <ProgressiveOverloadChart logs={workoutLogs} />}
      {tab === 'water' && <WaterTracker />}
      {tab === 'sleep' && <SleepTracker />}
      {tab === 'supplements' && <SupplementTracker />}
    </div>
  );
}

function ProgressiveOverloadChart({ logs }) {
  const data = [
    { name: 'Week 1', volume: 12000 },
    { name: 'Week 2', volume: 12500 },
    { name: 'Week 3', volume: 13200 },
    { name: 'Week 4', volume: 14100 },
  ];

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <TrendingUp size={24} color="#10b981" />
        <h3 style={{ fontSize: '16px' }}>Progressive Overload</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Total weekly volume lifted (kg) to ensure continuous strength gains.</p>
      
      <div style={{ height: '200px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={10} />
            <YAxis domain={['auto', 'auto']} stroke="var(--color-text-tertiary)" fontSize={10} />
            <Tooltip contentStyle={{ background: 'var(--color-bg-primary)', border: 'none', borderRadius: '8px', color: 'white' }} />
            <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WaterTracker() {
  const [water, setWater] = useState(0);
  const target = 4000;
  return (
    <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
      <Droplets size={48} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Water Intake</h3>
      <p style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6' }}>{water} / {target} mL</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={() => setWater(w => w + 250)} style={{ padding: '8px 16px', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px' }}>+ 250mL</button>
        <button onClick={() => setWater(w => w + 500)} style={{ padding: '8px 16px', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px' }}>+ 500mL</button>
      </div>
    </div>
  );
}

function SleepTracker() {
  const [hours, setHours] = useState('8');
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Moon size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '16px' }}>Sleep Tracker</h3>
      </div>
      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Hours Slept Last Night</label>
      <input type="number" value={hours} onChange={e => setHours(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', marginBottom: '16px' }} />
      <button style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Log Sleep</button>
    </div>
  );
}

function SupplementTracker() {
  const [logs, setLogs] = useState({ creatine: false, d3: false, b12: false, whey: false });
  const toggle = k => setLogs(l => ({ ...l, [k]: !l[k] }));
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Activity size={24} color="#10b981" />
        <h3 style={{ fontSize: '16px' }}>Daily Supplements</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries({ creatine: 'Creatine Monohydrate (5g)', d3: 'Vitamin D3', b12: 'Vitamin B12', whey: 'Whey Protein (1 Scoop)' }).map(([k, label]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={logs[k]} onChange={() => toggle(k)} style={{ width: '20px', height: '20px', accentColor: '#10b981' }} />
            <span style={{ fontSize: '14px', textDecoration: logs[k] ? 'line-through' : 'none', color: logs[k] ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MealPlanGenerator() {
  return (
    <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
      <Calendar size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>AI Meal Planner</h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Generate a full week of vegetarian meals tailored to your caloric deficit and protein needs.</p>
      <button style={{ padding: '12px 24px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Generate Plan</button>
    </div>
  );
}
