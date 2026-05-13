import React, { useEffect, useState } from 'react';
import { BookOpen, Dumbbell, Flame, Trophy, CalendarClock, Loader2, PlusCircle, X, Clock } from 'lucide-react';
import { PE } from '../utils/pe';
import { VLSI_PHASES, SEED } from '../data/vlsi';
import { FIT_PHASES } from '../data/fitness';
import { ai, aiJson } from '../services/ai';
import { db } from '../utils/storage';

export default function HomeScreen({ profile, measurements, vlsiProgress, workoutLogs, setScreen }) {
  const [insight, setInsight] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  
  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [gymTime, setGymTime] = useState('07:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [extraCommitments, setExtraCommitments] = useState('');
  
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraType, setExtraType] = useState('workout');
  const [extraDesc, setExtraDesc] = useState('');
  
  const m = measurements.length ? measurements : [profile.firstMeasurement].filter(Boolean);
  const wt = m[m.length - 1]?.weight || 90;
  const vLv = PE.vlsiLevel(vlsiProgress?.testScores);
  const vp = VLSI_PHASES[profile.vlsiPhase];
  const fp = FIT_PHASES[profile.fitPhase || 0];
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const gymIdx = fp.gymDays.indexOf(dow);
  const isGym = gymIdx !== -1;
  const workoutName = isGym && fp.split ? fp.split[gymIdx] : 'Rest';
  const done = vlsiProgress?.completedDays?.length || 0;

  // Calculate real streak from activity log
  const calcStreak = () => {
    try {
      const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
      if (!log.length) return 0;
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (log.includes(d.toDateString())) {
          streak++;
        } else if (i > 0) {
          break; // streak broken
        }
      }
      return streak;
    } catch { return 0; }
  };
  const streak = calcStreak();

  // Load cached daily insight
  useEffect(() => {
    (async () => {
      const todayStr = new Date().toDateString();
      const cached = await db.get('dailyInsight');
      
      if (cached && cached.date === todayStr) {
        setInsight(cached.text);
        return;
      }

      const prompt = `Give a 2-sentence highly motivating daily insight for ${profile.name}. Weight: ${wt}kg. VLSI Level: ${vLv.level}. Today is ${dow}, ${isGym ? workoutName + ' Day' : 'Rest Day'}. Be energetic and personal.`;
      const res = await ai(prompt, "You are a world-class AI fitness and study coach.");
      
      if (res && !res.includes('Sorry') && res !== '__QUOTA_EXCEEDED__') {
        await db.set('dailyInsight', { date: todayStr, text: res });
      }
      setInsight(res === '__QUOTA_EXCEEDED__' ? '🔥 Keep pushing! Every rep and every lesson builds the future you.' : res);
    })();
  }, []);

  // Load cached schedule for today
  useEffect(() => {
    (async () => {
      const todayStr = new Date().toDateString();
      const cached = await db.get('dailySchedule');
      if (cached && cached.date === todayStr) {
        setSchedule(cached.items);
      }
    })();
  }, []);

  const openScheduleModal = () => {
    setShowScheduleModal(true);
  };

  const generateSchedule = async () => {
    setShowScheduleModal(false);
    setGeneratingSchedule(true);
    
    const prompt = `Create a detailed daily time-blocked schedule for ${profile.name}.
    
    USER INPUT:
    - Wake up time: ${wakeTime}
    - Sleep time: ${sleepTime}
    - Gym time preference: ${gymTime}
    - Today is ${isGym ? workoutName + ' Day (gym day)' : 'Rest Day (no gym)'}
    - VLSI study phase: ${vp.name}
    - Other commitments: ${extraCommitments || 'None specified'}
    
    RULES:
    - Start from wake time to sleep time
    - Include meals (breakfast, lunch, dinner, snacks)
    - ${isGym ? `Schedule gym at ${gymTime} for 60-90 minutes (${workoutName} workout)` : 'No gym today, include active recovery/walk'}
    - Include 2-3 VLSI study blocks (total ~2-3 hours)
    - Include breaks and personal time
    - Work around the user's other commitments
    
    Return a JSON object with a single key 'schedule' that maps to an array of objects, where each object has:
    - time (string, e.g., "06:00 AM")
    - activity (string)
    - type (string, strictly one of: 'gym', 'study', 'meal', 'life')`;
    
    const sys = "You are a productivity expert. Output strictly valid JSON.";
    const result = await aiJson(prompt, sys);
    
    if (result && result.schedule) {
      setSchedule(result.schedule);
      // Persist for the entire day
      await db.set('dailySchedule', { date: new Date().toDateString(), items: result.schedule });
    }
    setGeneratingSchedule(false);
  };

  const saveExtraSession = async () => {
    if (!extraDesc.trim()) return;
    const newLogs = [...workoutLogs, { date: new Date().toISOString(), type: `extra_${extraType}`, desc: extraDesc }];
    await db.set('workoutLogs', newLogs);
    setShowExtraModal(false);
    setExtraDesc('');
    alert("Extra dedication logged!");
  };

  return (
    <div style={{ padding: '20px' }}>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Welcome back, {profile.name.split(' ')[0]} 🚀</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={BookOpen} title="Lessons" value={done} color="var(--color-accent-vlsi)" />
        <StatCard icon={Dumbbell} title="Weight" value={`${wt}kg`} color="var(--color-accent-fit)" />
        <StatCard icon={Trophy} title="VLSI Score" value={`${vLv.avgPct}%`} color="var(--color-accent-track)" />
        <StatCard icon={Flame} title="Streak" value={`${streak} Day${streak !== 1 ? 's' : ''}`} color="var(--color-accent-danger)" />
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', borderLeft: '4px solid var(--color-accent-ai)' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>🤖 AI DAILY INSIGHT</h3>
        <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{insight || 'Loading your personalized insight...'}</p>
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Today's Focus</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <ActionCard 
          icon={BookOpen} 
          title="Study" 
          subtitle={SEED[`${profile.vlsiPhase}-${profile.vlsiDay}`]?.title || `Day ${profile.vlsiDay}`}
          color="var(--color-accent-vlsi)" 
          onClick={() => setScreen('study')}
        />
        <ActionCard 
          icon={Dumbbell} 
          title={isGym ? 'Gym Day' : 'Rest Day'} 
          subtitle={isGym ? `${workoutName} Day` : 'Active Recovery'}
          color="var(--color-accent-fit)" 
          onClick={() => setScreen('train')}
        />
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Log Custom Session</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Add your own study/workout data for the AI</p>
        </div>
        <button onClick={() => setShowExtraModal(true)} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', padding: '8px', borderRadius: '50%', color: 'white' }}>
          <PlusCircle size={20} />
        </button>
      </div>

      {showExtraModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '360px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Log Extra Session</h3>
              <button onClick={() => setShowExtraModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setExtraType('workout')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: extraType === 'workout' ? 'var(--color-accent-fit)' : 'var(--color-bg-tertiary)', border: 'none', color: 'white', fontSize: '13px' }}>Workout</button>
              <button onClick={() => setExtraType('study')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: extraType === 'study' ? 'var(--color-accent-vlsi)' : 'var(--color-bg-tertiary)', border: 'none', color: 'white', fontSize: '13px' }}>Study</button>
            </div>
            
            <textarea 
              placeholder={`Describe what you did... (e.g. "Ran 5km in 25 mins" or "Read extra UVM verification notes")`}
              value={extraDesc}
              onChange={e => setExtraDesc(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-primary)', color: 'white', fontSize: '13px', marginBottom: '16px', resize: 'none', boxSizing: 'border-box' }}
            />
            
            <button onClick={saveExtraSession} style={{ width: '100%', padding: '12px', background: 'var(--color-accent-danger)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Save to Logs</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px' }}>AI Daily Schedule</h2>
        <button 
          onClick={schedule ? () => { setSchedule(null); db.set('dailySchedule', null); } : openScheduleModal}
          disabled={generatingSchedule}
          style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {generatingSchedule ? <Loader2 size={12} className="animate-spin" /> : <CalendarClock size={12} />}
          {schedule ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '360px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Plan Your Day</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Wake Up Time</label>
                <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  {isGym ? `Gym Time (${workoutName} Day)` : 'Walk/Recovery Time'}
                </label>
                <input type="time" value={gymTime} onChange={e => setGymTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Sleep Time</label>
                <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Any other commitments today? (optional)</label>
                <textarea 
                  placeholder='e.g. "College class 10 AM - 1 PM" or "Dentist at 4 PM"'
                  value={extraCommitments}
                  onChange={e => setExtraCommitments(e.target.value)}
                  style={{ width: '100%', height: '70px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button onClick={generateSchedule} style={{ width: '100%', padding: '12px', background: 'var(--color-accent-ai)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
              Generate My Schedule
            </button>
          </div>
        </div>
      )}

      {generatingSchedule && (
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <Loader2 size={24} color="var(--color-accent-ai)" className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>AI is building your personalized schedule...</p>
        </div>
      )}

      {schedule && (
        <div className="glass-card" style={{ padding: '16px' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
            📌 This schedule is saved for today. Tap "Regenerate" to create a new one.
          </p>
          {schedule.map((item, i) => {
            let color = 'var(--color-text-secondary)';
            if (item.type === 'gym') color = 'var(--color-accent-fit)';
            if (item.type === 'study') color = 'var(--color-accent-vlsi)';
            if (item.type === 'meal') color = '#f59e0b';
            
            return (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: i < schedule.length - 1 ? '16px' : '0' }}>
                <div style={{ width: '60px', fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600, paddingTop: '2px' }}>{item.time}</div>
                <div style={{ flex: 1, paddingLeft: '16px', borderLeft: `2px solid ${color}` }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{item.activity}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ fontSize: '16px', fontWeight: 600 }}>{value}</p>
        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{title}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, subtitle, color, onClick }) {
  return (
    <div className="glass-card" style={{ padding: '16px', cursor: 'pointer', borderTop: `3px solid ${color}` }} onClick={onClick}>
      <Icon size={24} color={color} style={{ marginBottom: '8px' }} />
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
    </div>
  );
}
