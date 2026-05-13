import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertTriangle } from 'lucide-react';
import { ai } from '../services/ai';
import { PE } from '../utils/pe';

export default function AICoachScreen({ profile, measurements, vlsiProgress }) {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', content: `Hi ${profile.name.split(' ')[0]}! I'm your AI Coach powered by Groq. I track your VLSI progress and fitness metrics. Ask me anything!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotaHit, setQuotaHit] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const m = measurements.length ? measurements : [profile.firstMeasurement].filter(Boolean);

  const send = async () => {
    if (!input.trim() || loading || quotaHit) return;
    const msg = input.trim();
    setInput('');
    setMsgs(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);
    
    const sysPrompt = `You are a combined VLSI + Fitness AI coach for ${profile.name}. 
    ${PE.fitCtx(m, profile)}
    ${PE.vlsiCtx(vlsiProgress, profile)}
    Be specific, encouraging, concise. Use the user's actual data to personalize every answer.
    If asked about calories/macros, use the data above to calculate precisely.
    If asked about VLSI, reference their current phase and level.`;
    
    const r = await ai(msg, sysPrompt, msgs.slice(-10));
    
    if (r === '__QUOTA_EXCEEDED__') {
      setQuotaHit(true);
      setMsgs(p => [...p, { role: 'assistant', content: '⚠️ Daily AI limit reached. Groq resets at midnight UTC (5:30 AM IST). Gemini resets at 1:30 PM IST. You can still browse your notes, logs, and workout plans!' }]);
    } else {
      setMsgs(p => [...p, { role: 'assistant', content: r }]);
    }
    setLoading(false);
  };

  const suggestions = [
    "What's my calorie target?",
    "Explain K-map grouping rules",
    "Why am I plateauing?",
    "Best pre-workout snack?",
    "What should I study today?",
    "Am I losing weight too fast?"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-accent-ai)20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={24} color="var(--color-accent-ai)" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px' }}>AI Coach</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Groq-powered • Full-context Assistant</p>
        </div>
      </div>

      {quotaHit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f59e0b20', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#f59e0b' }}>
          <AlertTriangle size={16} />
          Daily limit reached. Resets at 5:30 AM IST (Groq) / 1:30 PM IST (Gemini).
        </div>
      )}

      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {msgs.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => setInput(s)}
                style={{ fontSize: '12px', padding: '8px 12px', border: '1px solid var(--color-border-primary)', borderRadius: '16px', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ 
              maxWidth: '85%', padding: '12px 16px', 
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
              background: m.role === 'user' ? 'var(--color-accent-ai)' : 'var(--color-bg-tertiary)',
              color: 'white', fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={quotaHit ? "AI limit reached for today..." : "Ask your coach..."} 
          disabled={quotaHit}
          style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-secondary)', color: 'white', opacity: quotaHit ? 0.5 : 1 }}
        />
        <button 
          onClick={send} 
          disabled={!input.trim() || loading || quotaHit}
          style={{ width: '48px', height: '48px', borderRadius: '12px', background: input.trim() && !loading && !quotaHit ? 'var(--color-accent-ai)' : 'var(--color-bg-tertiary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Send size={20} color="white" />
        </button>
      </div>
    </div>
  );
}
