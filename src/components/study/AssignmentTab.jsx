import React, { useState } from 'react';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { aiJson } from '../../services/ai';

export default function AssignmentTab({ lesson }) {
  const [solution, setSolution] = useState('');
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!lesson) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>Please generate or select a lesson first.</div>;
  }

  const submit = async () => {
    if (!solution.trim()) return;
    setGrading(true);
    
    const prompt = `Grade the following student solution for this assignment:
    Assignment: ${lesson.assignment}
    Exercise context: ${lesson.exercise}
    
    Student Solution:
    ${solution}
    
    Return a JSON object with:
    - score_out_of_10 (number)
    - correct_parts (array of strings)
    - errors_and_corrections (array of strings)
    - advice (string)
    `;
    
    const sys = "You are a strict but encouraging VLSI engineering professor. Return valid JSON only.";
    const result = await aiJson(prompt, sys);
    
    if (result) setFeedback(result);
    setGrading(false);
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <FileText size={24} color="#f59e0b" />
        <h3 style={{ fontSize: '16px' }}>Assignment & Practice</h3>
      </div>
      
      <div style={{ background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>WORKED EXAMPLE</h4>
        <pre style={{ fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>{lesson.exercise}</pre>
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
        <h4 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>YOUR TASK</h4>
        <pre style={{ fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>{lesson.assignment}</pre>
      </div>

      <textarea 
        value={solution}
        onChange={e => setSolution(e.target.value)}
        placeholder="Type your solution here (Verilog code, truth tables, or explanations)..."
        style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', marginBottom: '16px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
      />
      
      <button 
        onClick={submit}
        disabled={grading || !solution.trim() || feedback}
        style={{ width: '100%', padding: '12px', background: feedback ? 'var(--color-bg-tertiary)' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
      >
        {grading ? <><Loader2 size={16} className="animate-spin" /> Grading...</> : (feedback ? 'Graded' : 'Submit for AI Grading')}
      </button>

      {feedback && (
        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>AI Evaluation</h3>
            <span style={{ fontSize: '20px', fontWeight: 700, color: feedback.score_out_of_10 >= 7 ? '#10b981' : '#f43f5e' }}>{feedback.score_out_of_10}/10</span>
          </div>
          
          <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>{feedback.advice}</p>
          
          {feedback.correct_parts?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Correct</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {feedback.correct_parts.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          
          {feedback.errors_and_corrections?.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', color: '#f43f5e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12}/> Errors & Fixes</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {feedback.errors_and_corrections.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          
          <button onClick={() => { setFeedback(null); setSolution(''); }} style={{ marginTop: '16px', fontSize: '12px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border-primary)', borderRadius: '8px', color: 'white' }}>Try Again</button>
        </div>
      )}
    </div>
  );
}
