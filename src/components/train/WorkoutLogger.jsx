import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { db } from '../../utils/storage';

export default function WorkoutLogger({ workout, isGym, color, workoutLogs, setWorkoutLogs }) {
  const [activeLogs, setActiveLogs] = useState({});

  if (!isGym) {
    return (
      <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Active Recovery Day</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Take a 30-40 min walk and stretch. Let your muscles recover.</p>
        <button 
          onClick={async () => {
            const newLogs = [...workoutLogs, { date: new Date().toISOString(), type: 'recovery' }];
            setWorkoutLogs(newLogs);
            await db.set('workoutLogs', newLogs);
            alert("Recovery logged!");
          }}
          style={{ padding: '12px 24px', background: color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          Mark Recovery Complete
        </button>
      </div>
    );
  }

  const logSet = (exIdx, setIdx, weight, reps) => {
    setActiveLogs(prev => {
      const exLogs = prev[exIdx] || {};
      return { ...prev, [exIdx]: { ...exLogs, [setIdx]: { weight, reps, done: true } } };
    });
  };

  const finishWorkout = async () => {
    const session = {
      date: new Date().toISOString(),
      name: workout.name,
      exercises: Object.keys(activeLogs).map(exIdx => ({
        name: workout.exercises[exIdx].name,
        sets: activeLogs[exIdx]
      }))
    };
    const newLogs = [...workoutLogs, session];
    setWorkoutLogs(newLogs);
    await db.set('workoutLogs', newLogs);
    setActiveLogs({});
    alert("Workout Saved!");
  };

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>INTERACTIVE LOGGER</h3>
      
      {workout.exercises && workout.exercises.map((ex, i) => (
        <ExerciseRow key={i} ex={ex} exIdx={i} color={color} activeLogs={activeLogs[i] || {}} logSet={logSet} />
      ))}
      
      <button 
        onClick={finishWorkout}
        style={{ width: '100%', padding: '14px', background: color, color: 'white', border: 'none', borderRadius: '8px', marginTop: '20px', fontWeight: 600, fontSize: '14px' }}
      >
        Mark Workout Complete
      </button>
    </div>
  );
}

function ExerciseRow({ ex, exIdx, color, activeLogs, logSet }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600 }}>{ex.name}</p>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Target: {ex.defaultSets}×{ex.defaultReps}</span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '12px', fontStyle: 'italic' }}>💡 {ex.tip}</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: ex.defaultSets }).map((_, setIdx) => {
          const isDone = activeLogs[setIdx]?.done;
          return <SetRow key={setIdx} setIdx={setIdx} color={color} isDone={isDone} defaultReps={ex.defaultReps} onLog={(w, r) => logSet(exIdx, setIdx, w, r)} />;
        })}
      </div>
    </div>
  );
}

function SetRow({ setIdx, color, isDone, defaultReps, onLog }) {
  const [w, setW] = useState('');
  const [r, setR] = useState(defaultReps || '');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '24px', fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{setIdx + 1}</div>
      <input 
        type="number" 
        placeholder="kg" 
        value={w} 
        onChange={e => setW(e.target.value)} 
        disabled={isDone}
        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-primary)', background: isDone ? 'transparent' : 'var(--color-bg-primary)', color: 'white', textAlign: 'center' }} 
      />
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>×</span>
      <input 
        type="number" 
        placeholder="reps" 
        value={r} 
        onChange={e => setR(e.target.value)} 
        disabled={isDone}
        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-primary)', background: isDone ? 'transparent' : 'var(--color-bg-primary)', color: 'white', textAlign: 'center' }} 
      />
      <button 
        onClick={() => !isDone && onLog(w, r)}
        style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', background: isDone ? `${color}40` : 'var(--color-bg-tertiary)', color: isDone ? color : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDone ? 'default' : 'pointer' }}
      >
        {isDone ? <Check size={16} /> : <Check size={16} />}
      </button>
    </div>
  );
}
