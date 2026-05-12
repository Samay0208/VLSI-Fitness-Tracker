import React, { useState } from 'react';
import { Hammer, Loader2, Award } from 'lucide-react';
import { aiJson } from '../../services/ai';

export default function ProjectTab({ profile }) {
  const [project, setProject] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submission, setSubmission] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const generate = async () => {
    setGenerating(true);
    const prompt = `Generate a Weekend Project (2-4 hours) for a student at VLSI Phase: ${profile.vlsiPhase}.
    It must incorporate the latest topics they learned, as well as cumulative knowledge.
    
    Return JSON:
    {
      "title": "Project Title",
      "goal": "One sentence goal",
      "connection": "How this connects to previous learning",
      "steps": ["Step 1...", "Step 2..."],
      "hints": ["Hint 1..."]
    }`;
    
    const sys = "You are a senior VLSI engineering manager assigning a practical weekend project. JSON output only.";
    const result = await aiJson(prompt, sys);
    
    if (result) setProject(result);
    setGenerating(false);
  };

  const submitProject = async () => {
    if (!submission.trim()) return;
    setEvaluating(true);
    
    const prompt = `Evaluate this student's Weekend Project submission.
    Project context: ${project.title} - ${project.goal}
    Student Submission:
    ${submission}
    
    Return JSON:
    {
      "score": "Score out of 100",
      "strengths": ["...", "..."],
      "improvements": ["...", "..."],
      "nextTopicPreview": "..."
    }`;
    
    const result = await aiJson(prompt, "You are evaluating a student's project submission. Output JSON only.");
    if (result) setFeedback(result);
    setEvaluating(false);
  };

  if (!project && !generating) {
    return (
      <div className="glass-card" style={{ padding: '30px 20px', textAlign: 'center' }}>
        <Hammer size={48} color="#3b82f6" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Weekend Project</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          A 2-4 hour cumulative project generated dynamically based on your exact position in the curriculum.
        </p>
        <button onClick={generate} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Generate Project</button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Loader2 size={40} color="#3b82f6" className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Designing your project...</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Hammer size={24} color="#3b82f6" />
        <h3 style={{ fontSize: '18px' }}>{project.title}</h3>
      </div>
      
      <div style={{ padding: '12px', background: '#3b82f620', border: '1px solid #3b82f6', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'white' }}><strong>Goal:</strong> {project.goal}</p>
      </div>
      
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '20px', fontStyle: 'italic' }}>
        {project.connection}
      </p>

      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-text-primary)' }}>Tasks</h4>
      <ul style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        {project.steps.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
      </ul>

      {project.hints && project.hints.length > 0 && (
        <details style={{ marginBottom: '24px' }}>
          <summary style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>Show Hints (Use only if stuck!)</summary>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
            {project.hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </details>
      )}

      <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Deliverable Submission</h4>
      <textarea 
        value={submission}
        onChange={e => setSubmission(e.target.value)}
        placeholder="Paste your code, analysis, or GitHub link here..."
        style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)', color: 'white', marginBottom: '16px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
      />
      
      <button 
        onClick={submitProject}
        disabled={evaluating || !submission.trim() || feedback}
        style={{ width: '100%', padding: '12px', background: feedback ? 'var(--color-bg-tertiary)' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
      >
        {evaluating ? <><Loader2 size={16} className="animate-spin" /> Evaluating...</> : (feedback ? 'Evaluated' : 'Submit for Review')}
      </button>

      {feedback && (
        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #10b981', borderRadius: '8px', background: '#10b98110' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={20} color="#10b981" />
            <h3 style={{ fontSize: '16px', color: '#10b981' }}>Project Score: {feedback.score}</h3>
          </div>
          
          <h4 style={{ fontSize: '12px', color: 'white', marginBottom: '4px' }}>Strengths</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            {feedback.strengths.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
          
          <h4 style={{ fontSize: '12px', color: 'white', marginBottom: '4px' }}>Areas to Improve</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            {feedback.improvements.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
          
          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-secondary)' }}>
            <strong>Next up:</strong> {feedback.nextTopicPreview}
          </p>
        </div>
      )}
    </div>
  );
}
