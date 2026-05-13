import { SEED, VLSI_PHASES } from '../data/vlsi';
import { FIT_PHASES } from '../data/fitness';

export const PE = {
  weightTrend(m) {
    if (m.length < 2) return 'insufficient';
    const s = [...m].sort((a, b) => new Date(a.date) - new Date(b.date));
    const r = s.slice(-Math.min(s.length, 4));
    const wk = (r[r.length - 1].weight - r[0].weight) / Math.max(0.5, (new Date(r[r.length - 1].date) - new Date(r[0].date)) / (7 * 864e5));
    if (wk > 0.25) return 'gaining';
    if (wk < -0.8) return 'losing_fast';
    if (wk < -0.1) return 'losing';
    return 'plateau';
  },
  
  weeklyRate(m) {
    if (m.length < 2) return 0;
    const s = [...m].sort((a, b) => new Date(a.date) - new Date(b.date));
    return +((s[0].weight - s[s.length - 1].weight) / Math.max(0.5, (new Date(s[s.length - 1].date) - new Date(s[0].date)) / (7 * 864e5))).toFixed(2);
  },
  
  stubbornAreas(m) {
    if (m.length < 2) return [];
    const s = [...m].sort((a, b) => new Date(a.date) - new Date(b.date));
    const [f, l] = [s[0], s[s.length - 1]];
    const wk = Math.max(0.5, (new Date(l.date) - new Date(f.date)) / (7 * 864e5));
    if ((f.weight - l.weight) / wk < 0.08) return [];
    const a = [];
    if (l.waist && f.waist && (f.waist - l.waist) / wk < 0.3) a.push('waist');
    if (l.thighs && f.thighs && (f.thighs - l.thighs) / wk < 0.2) a.push('thighs');
    if (l.hips && f.hips && (f.hips - l.hips) / wk < 0.2) a.push('hips');
    return a;
  },
  
  diet(wt, ph, trend, profile = {}) {
    const age = profile.age || 23;
    const ht = profile.height || 175;
    const BMR = Math.round(10 * wt + 6.25 * ht - 5 * age + 5);
    const TDEE = Math.round(BMR * [1.375, 1.55, 1.65][ph || 0] || BMR * 1.55);
    const goal = profile.goal || 'fat_loss';
    let def = { gaining: 550, plateau: 450, losing: 300, losing_fast: -150, insufficient: 350 }[trend] ?? 350;
    if (goal === 'muscle_gain') def = Math.max(def - 300, -200); // surplus for bulking
    if (goal === 'recomposition') def = Math.max(def - 100, 100);
    const kcal = Math.max(1500, TDEE - def);
    const protein = Math.round(wt * (goal === 'muscle_gain' ? 2.2 : 1.9));
    const fat = Math.round(kcal * 0.25 / 9);
    const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
    return { kcal, protein, fat, carbs, TDEE, def, BMR };
  },
  
  vlsiLevel(scores) {
    if (!scores?.length) return { level: 'beginner', style: 'detailed with analogies', avgPct: 0 };
    const r = scores.slice(-5);
    const avg = r.reduce((a, s) => a + s.score / s.total, 0) / r.length;
    const pct = Math.round(avg * 100);
    return {
      level: pct >= 80 ? 'advanced' : pct >= 60 ? 'intermediate' : 'beginner',
      style: pct < 50 ? 'simple + real-world analogies' : pct < 65 ? 'detailed + worked examples' : pct < 80 ? 'standard' : 'concise + edge cases',
      avgPct: pct
    };
  },
  
  adaptations(m, ph) {
    const trend = this.weightTrend(m);
    const sub = this.stubbornAreas(m);
    const r = [];
    if (trend === 'plateau') r.push({ icon: '🔄', col: '#BA7517', text: 'Plateau: +5kg to all lifts, HIIT → 40s ON/20s OFF' });
    if (trend === 'gaining') r.push({ icon: '⚠️', col: '#E24B4A', text: 'Gaining: add 15min LISS, reduce rest to 60s' });
    if (trend === 'losing_fast') r.push({ icon: '🛡️', col: '#BA7517', text: 'Losing too fast: eat +150kcal, HIIT → 8 rounds' });
    if (trend === 'losing') r.push({ icon: '✅', col: '#1D9E75', text: 'Perfect pace — keep everything the same' });
    if (sub.includes('waist')) r.push({ icon: '🎯', col: '#7F77DD', text: 'Waist: +3×20 weighted Russian twists + 5min ab circuit' });
    if (sub.includes('thighs')) r.push({ icon: '🎯', col: '#D4537E', text: 'Thighs: +sumo squat 3×15 + bike HIIT 10min' });
    return r;
  },
  
  fitCtx(m, p) {
    const s = [...m].sort((a, b) => new Date(a.date) - new Date(b.date));
    const f = s[0] || p.firstMeasurement || {};
    const l = s[s.length - 1] || f;
    const d = this.diet(l.weight || 90, p.fitPhase || 0, this.weightTrend(m), p);
    return `FITNESS PROFILE:
Name: ${p.name} | Age: ${p.age || '?'} | Height: ${p.height || '?'}cm | Goal: ${p.goal || 'fat_loss'} | Experience: ${p.experience || 'beginner'}
Weight: ${f.weight || 90}→${l.weight || 90}kg | Trend: ${this.weightTrend(m)} | Rate: ${this.weeklyRate(m)}kg/wk
Waist: ${f.waist || '?'}→${l.waist || '?'}cm | Thighs: ${f.thighs || '?'}→${l.thighs || '?'}cm | Hips: ${f.hips || '?'}→${l.hips || '?'}cm
Stubborn: ${this.stubbornAreas(m).join(', ') || 'none'} | TDEE: ${d.TDEE} | Target: ${d.kcal}kcal | Protein: ${d.protein}g
Phase: ${FIT_PHASES[p.fitPhase || 0]?.name} | Vegetarian`;
  },
  
  vlsiCtx(vp, p) {
    const scores = vp?.testScores || [];
    const lv = this.vlsiLevel(scores);
    return `VLSI PROFILE:\nLevel: ${lv.level} (${lv.avgPct}%) | Style: ${lv.style} | Lessons done: ${vp?.completedDays?.length || 0}\nPhase: ${VLSI_PHASES[p.vlsiPhase]?.name}, Day ${p.vlsiDay}\n${lv.avgPct < 50 ? '⚠️ Struggling — use analogies, extra examples' : ''}${lv.avgPct >= 80 ? '⭐ Excelling — industry depth, edge cases' : ''}`;
  }
};
