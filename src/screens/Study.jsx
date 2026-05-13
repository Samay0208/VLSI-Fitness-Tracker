import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Briefcase, FileText, Loader2, Clock, PenTool, Gamepad2, ScrollText, Hammer, Map } from 'lucide-react';
import { VLSI_PHASES, SEED } from '../data/vlsi';
import { aiJson } from '../services/ai';
import { db } from '../utils/storage';

import AssignmentTab from '../components/study/AssignmentTab';
import GamesTab from '../components/study/GamesTab';
import TestTab from '../components/study/TestTab';
import ProjectTab from '../components/study/ProjectTab';
import RoadmapTab from '../components/study/RoadmapTab';

export default function StudyScreen({ profile, setProfile, vlsiProgress, setVlsiProgress }) {
  const [tab, setTab] = useState('lesson');
  const [lesson, setLesson] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [timer, setTimer] = useState(1500); // 25 mins
  const [timerActive, setTimerActive] = useState(false);
  
  const vp = VLSI_PHASES[profile.vlsiPhase];
  const lkey = `${profile.vlsiPhase}-${profile.vlsiDay}`;

  useEffect(() => {
    (async () => {
      const stored = await db.get(`lesson_${lkey}`);
      if (stored) { setLesson(stored); return; }
      if (SEED[lkey]) { setLesson(SEED[lkey]); return; }
      setLesson(null);
    })();
  }, [lkey]);

  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      alert('Pomodoro complete! Take a 5 minute break.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const generateLesson = async () => {
    setGenerating(true);
    const prompt = `Generate a highly technical VLSI lesson for Phase: ${vp.name}, Day ${profile.vlsiDay}.
    Return a JSON object with:
    - title (string)
    - videoId (string) (leave empty if none, we will provide a search link instead)
    - notes (string, detailed markdown format)
    - exercise (string)
    - assignment (string)
    - resources (array of objects with 'title' and 'url')
    - flashcards (array of objects with 'q' and 'a')
    Include a YouTube search URL in resources formatted like: https://www.youtube.com/results?search_query=VLSI+[topic]
    Include at least one Coursera or NPTEL search link in resources.`;
    
    const sys = "You are a senior VLSI engineering professor creating curriculum. Your output must strictly be the JSON format requested.";
    const result = await aiJson(prompt, sys);
    
    if (result) {
      setLesson(result);
      await db.set(`lesson_${lkey}`, result);
    } else {
      alert("Failed to generate lesson. Please try again.");
    }
    setGenerating(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const TABS = [
    { id: 'lesson', label: 'Lesson', icon: BookOpen },
    { id: 'assignment', label: 'Assignment', icon: PenTool },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'test', label: 'Test', icon: ScrollText },
    { id: 'project', label: 'Project', icon: Hammer },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'interview', label: 'Interview', icon: FileText },
    { id: 'companies', label: 'Companies', icon: Briefcase }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div className="glass-card" style={{ padding: '16px', borderTop: `4px solid ${vp.color}`, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '10px', padding: '4px 8px', background: `${vp.color}20`, color: vp.color, borderRadius: '12px' }}>{vp.name} - Day {profile.vlsiDay}</span>
            <h2 style={{ fontSize: '20px', marginTop: '12px', marginBottom: '8px', lineHeight: 1.2 }}>{lesson?.title || 'Topic Not Generated Yet'}</h2>
          </div>
          
          <div style={{ textAlign: 'center', background: 'var(--color-bg-tertiary)', padding: '8px', borderRadius: '12px', flexShrink: 0, marginLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Clock size={14} color="var(--color-accent-track)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatTime(timer)}</span>
            </div>
            <button 
              onClick={() => setTimerActive(!timerActive)}
              style={{ fontSize: '10px', padding: '4px 8px', width: '100%', background: timerActive ? 'var(--color-accent-danger)' : 'var(--color-accent-fit)', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {timerActive ? 'Pause' : 'Focus'}
            </button>
          </div>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
          <div style={{ width: `${(profile.vlsiDay / vp.days) * 100}%`, height: '100%', background: vp.color }} />
        </div>
      </div>

      {/* Clean, horizontally scrollable tab menu */}
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

      {tab === 'lesson' && !lesson && !generating && (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <BookOpen size={48} color={vp.color} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>AI Lesson Engine</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            This day's curriculum has not been generated yet. Gemini will create deep technical notes, fetch YouTube links, and provide free course references instantly.
          </p>
          <button 
            onClick={generateLesson}
            style={{ padding: '14px 28px', background: vp.color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px' }}
          >
            Generate Lesson
          </button>
        </div>
      )}

      {tab === 'lesson' && generating && (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Loader2 size={40} color={vp.color} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>Gemini is writing your lesson...</h3>
        </div>
      )}

      {tab === 'lesson' && lesson && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color={vp.color} /> Video Lecture
          </h3>
          <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)' }}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                📺 Search for the best lecture on: <strong style={{ color: 'white' }}>{lesson.title}</strong>
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a 
                  href={`https://www.youtube.com/results?search_query=VLSI+${encodeURIComponent(lesson.title)}+lecture+tutorial`} 
                  target="_blank" rel="noreferrer"
                  style={{ padding: '10px 16px', background: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ▶ YouTube
                </a>
                <a 
                  href={`https://nptel.ac.in/course.html?query=${encodeURIComponent(lesson.title)}`} 
                  target="_blank" rel="noreferrer"
                  style={{ padding: '10px 16px', background: '#1D9E7520', color: '#1D9E75', border: '1px solid #1D9E7540', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  📖 NPTEL
                </a>
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Interactive Notes</h3>
          <pre style={{ fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', lineHeight: 1.6, color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--color-border-secondary)' }}>
            {lesson.notes}
          </pre>

          {lesson.resources && lesson.resources.length > 0 && (
            <>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>External Free Resources</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {lesson.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ padding: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '8px', color: 'var(--color-accent-vlsi)', textDecoration: 'none', fontSize: '14px', border: '1px solid var(--color-border-secondary)' }}>
                    🔗 {r.title}
                  </a>
                ))}
              </div>
            </>
          )}

          <button 
            onClick={async () => {
              // Track completed day
              const newCompleted = [...(vlsiProgress.completedDays || []), lkey];
              const updatedVP = { ...vlsiProgress, completedDays: newCompleted };
              setVlsiProgress(updatedVP);
              
              // Track activity for streak
              const today = new Date().toDateString();
              const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
              if (!activityLog.includes(today)) {
                activityLog.push(today);
                localStorage.setItem('activityLog', JSON.stringify(activityLog));
              }
              
              // Advance to next day
              setProfile(p => ({ ...p, vlsiDay: p.vlsiDay + 1 }));
              await db.set('profile', { ...profile, vlsiDay: profile.vlsiDay + 1 });
            }}
            style={{ width: '100%', padding: '14px', background: vp.color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
          >
            Complete Lesson & Next Day
          </button>
        </div>
      )}

      {tab === 'assignment' && <AssignmentTab lesson={lesson} />}
      {tab === 'games' && <GamesTab lesson={lesson} />}
      {tab === 'test' && <TestTab profile={profile} vlsiProgress={vlsiProgress} setVlsiProgress={setVlsiProgress} />}
      {tab === 'project' && <ProjectTab profile={profile} />}
      {tab === 'roadmap' && <RoadmapTab profile={profile} />}

      {tab === 'interview' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FileText size={24} color="#f59e0b" />
            <h3 style={{ fontSize: '16px' }}>Interview Question Bank</h3>
          </div>
          {['RTL Design', 'Verilog', 'STA', 'UVM', 'Physical Design'].map(cat => (
            <div key={cat} style={{ padding: '16px', border: '1px solid var(--color-border-secondary)', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-tertiary)' }}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{cat}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '4px 8px', borderRadius: '12px' }}>50+ Qs</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'companies' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Briefcase size={24} color="#10b981" />
            <h3 style={{ fontSize: '16px' }}>Application Tracker</h3>
          </div>
          <button style={{ width: '100%', padding: '14px', border: '1px dashed var(--color-border-primary)', borderRadius: '8px', background: 'var(--color-bg-tertiary)', color: 'white', marginBottom: '16px', fontSize: '14px' }}>+ Add Application</button>
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            No active applications tracked yet. Keep pushing!
          </div>
        </div>
      )}
    </div>
  );
}
