import React, { useState, useEffect } from 'react';
import { Gamepad2, Timer, RefreshCw } from 'lucide-react';

export default function GamesTab({ lesson }) {
  const [game, setGame] = useState('select'); // select, flashcards, quiz

  if (!lesson) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>Please generate or select a lesson first.</div>;
  }

  return (
    <div className="glass-card" style={{ padding: '20px', minHeight: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Gamepad2 size={24} color="#8b5cf6" />
        <h3 style={{ fontSize: '16px' }}>Learning Games</h3>
      </div>

      {game === 'select' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <button onClick={() => setGame('flashcards')} style={{ padding: '20px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '12px', textAlign: 'left', cursor: 'pointer' }}>
            <h4 style={{ fontSize: '16px', color: 'white', marginBottom: '4px' }}>Flashcards</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Flip cards to memorize key concepts from this lesson.</p>
          </button>
          <button onClick={() => setGame('quiz')} style={{ padding: '20px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: '12px', textAlign: 'left', cursor: 'pointer' }}>
            <h4 style={{ fontSize: '16px', color: 'white', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Timer size={16} color="#ef4444"/> Quick Quiz</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>15-seconds per question. Test your instant recall.</p>
          </button>
        </div>
      )}

      {game === 'flashcards' && <Flashcards gameData={lesson.flashcards || []} onBack={() => setGame('select')} />}
      {game === 'quiz' && <QuickQuiz lesson={lesson} onBack={() => setGame('select')} />}
    </div>
  );
}

function Flashcards({ gameData, onBack }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  if (gameData.length === 0) return <div>No flashcards available for this lesson.</div>;
  
  if (idx >= gameData.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Set Complete!</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>You knew {known} out of {gameData.length}.</p>
        <button onClick={onBack} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px' }}>Back to Games</button>
      </div>
    );
  }

  const card = gameData[idx];

  const handleNext = (knewIt) => {
    if (knewIt) setKnown(k => k + 1);
    setFlipped(false);
    setTimeout(() => setIdx(i => i + 1), 150);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{idx + 1} / {gameData.length}</span>
      </div>

      <div 
        onClick={() => setFlipped(!flipped)}
        style={{ 
          height: '200px', background: 'var(--color-bg-tertiary)', borderRadius: '12px', padding: '20px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer',
          border: '1px solid var(--color-border-primary)', marginBottom: '20px', transition: 'transform 0.3s',
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0)'
        }}
      >
        <div style={{ transform: flipped ? 'rotateX(180deg)' : 'none', fontSize: '16px', lineHeight: 1.5 }}>
          {flipped ? card.a : card.q}
        </div>
      </div>

      {flipped ? (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleNext(false)} style={{ flex: 1, padding: '12px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }}>✕ Still Learning</button>
          <button onClick={() => handleNext(true)} style={{ flex: 1, padding: '12px', background: '#10b98120', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px' }}>✓ I Know This</button>
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Tap card to flip</p>
      )}
    </div>
  );
}

// Minimal placeholder for Quiz to keep it concise, since full AI quiz generation is large
function QuickQuiz({ lesson, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'block', marginBottom: '20px' }}>← Back</button>
      <Timer size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Quick Quiz Coming Soon</h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>The 15-second visual countdown is being connected to the AI question engine.</p>
    </div>
  );
}
