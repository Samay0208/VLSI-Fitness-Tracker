export const FIT_PHASES = [
  { id: 0, name: "PPLUL Foundation", weeks: 8, gymDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], split: ["Push", "Pull", "Legs", "Upper", "Lower"], color: "#1D9E75" },
  { id: 1, name: "Advanced Recomposition", weeks: 12, gymDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], split: ["Upper", "Lower", "Push", "Pull", "Legs"], color: "#378ADD" },
  { id: 2, name: "Lean Bulk / Cut", weeks: 16, gymDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], split: ["Push", "Pull", "Legs", "Upper", "Lower"], color: "#7F77DD" }
];

export const WORKOUTS = {
  Push: {
    name: "Push Day", tag: "Chest, Shoulders, Triceps", duration: "60-75 min", color: "#E24B4A",
    warmup: "5 min incline walk + arm circles, band pull-aparts",
    exercises: [
      { name: "Incline DB Bench Press", defaultSets: 3, defaultReps: 8, rest: "90s", tip: "30-degree incline, control the negative" },
      { name: "Overhead Dumbbell Press", defaultSets: 3, defaultReps: 10, rest: "90s", tip: "Keep core tight, don't overarch back" },
      { name: "Cable Crossovers", defaultSets: 3, defaultReps: 15, rest: "60s", tip: "Squeeze chest at the bottom" },
      { name: "Lateral Raises", defaultSets: 4, defaultReps: 15, rest: "60s", tip: "Lead with elbows, slight forward lean" },
      { name: "Triceps Pushdown", defaultSets: 3, defaultReps: 12, rest: "60s", tip: "Keep elbows pinned to your sides" },
      { name: "Core Finisher: Russian Twists", defaultSets: 3, defaultReps: 20, rest: "45s", tip: "Use medicine ball or weight" },
      { name: "Cardio Finisher", defaultSets: 0, defaultReps: 0, rest: "—", tip: "10 min HIIT (30s sprint / 30s walk)", isHiit: true }
    ],
    cooldown: "5 min chest & shoulder stretching"
  },
  Pull: {
    name: "Pull Day", tag: "Back, Biceps, Rear Delts", duration: "60-75 min", color: "#378ADD",
    warmup: "5 min rower + dynamic stretches",
    exercises: [
      { name: "Lat Pulldown", defaultSets: 3, defaultReps: 10, rest: "90s", tip: "Pull with elbows, not hands" },
      { name: "Barbell/Dumbbell Row", defaultSets: 3, defaultReps: 8, rest: "90s", tip: "Flat back, pull to hip" },
      { name: "Face Pulls", defaultSets: 3, defaultReps: 15, rest: "60s", tip: "Pull to eye level, squeeze rear delts" },
      { name: "Hammer Curls", defaultSets: 3, defaultReps: 12, rest: "60s", tip: "Control the eccentric phase" },
      { name: "Preacher Curls", defaultSets: 3, defaultReps: 10, rest: "60s", tip: "Full stretch at bottom" },
      { name: "Core Finisher: Hanging Leg Raises", defaultSets: 3, defaultReps: 15, rest: "45s", tip: "Avoid swinging, use lower abs" },
      { name: "Cardio Finisher", defaultSets: 0, defaultReps: 0, rest: "—", tip: "10 min moderate stairmaster", isHiit: false }
    ],
    cooldown: "5 min lat & hamstring stretching"
  },
  Legs: {
    name: "Leg Day", tag: "Quads, Hamstrings, Calves", duration: "75-90 min", color: "#1D9E75",
    warmup: "5 min bike + leg swings, deep squats",
    exercises: [
      { name: "Barbell Squat", defaultSets: 4, defaultReps: 8, rest: "120s", tip: "Break parallel, keep chest up" },
      { name: "Romanian Deadlift", defaultSets: 3, defaultReps: 10, rest: "90s", tip: "Hinge at hips, slight knee bend" },
      { name: "Leg Press", defaultSets: 3, defaultReps: 12, rest: "90s", tip: "Don't lock knees at the top" },
      { name: "Leg Curls", defaultSets: 3, defaultReps: 15, rest: "60s", tip: "Squeeze hamstrings" },
      { name: "Calf Raises", defaultSets: 4, defaultReps: 20, rest: "60s", tip: "Full stretch at bottom, hold at top" },
      { name: "Core Finisher: Plank", defaultSets: 3, defaultReps: 1, rest: "45s", tip: "60s hold" },
      { name: "Cardio Finisher", defaultSets: 0, defaultReps: 0, rest: "—", tip: "15 min LISS cycling", isHiit: false }
    ],
    cooldown: "5 min quad & hip flexor stretching"
  },
  Upper: {
    name: "Upper Body", tag: "Overall Upper", duration: "60 min", color: "#7F77DD",
    warmup: "5 min dynamic upper body stretches",
    exercises: [
      { name: "Bench Press", defaultSets: 3, defaultReps: 8, rest: "90s", tip: "Tuck elbows slightly" },
      { name: "Pull-ups / Assisted", defaultSets: 3, defaultReps: 8, rest: "90s", tip: "Full range of motion" },
      { name: "Seated Overhead Press", defaultSets: 3, defaultReps: 10, rest: "90s", tip: "Press straight up" },
      { name: "Cable Row", defaultSets: 3, defaultReps: 12, rest: "90s", tip: "Squeeze shoulder blades together" },
      { name: "Bicep Curl to Overhead Press", defaultSets: 3, defaultReps: 12, rest: "60s", tip: "Smooth continuous motion" },
      { name: "Core Finisher: Bicycle Crunches", defaultSets: 3, defaultReps: 30, rest: "45s", tip: "Elbow to opposite knee" }
    ],
    cooldown: "5 min general upper body stretching"
  },
  Lower: {
    name: "Lower Body", tag: "Overall Lower", duration: "60 min", color: "#BA7517",
    warmup: "5 min dynamic lower body stretches",
    exercises: [
      { name: "Deadlift", defaultSets: 3, defaultReps: 5, rest: "120s", tip: "Maintain neutral spine" },
      { name: "Bulgarian Split Squat", defaultSets: 3, defaultReps: 10, rest: "90s", tip: "Focus on front leg" },
      { name: "Leg Extensions", defaultSets: 3, defaultReps: 15, rest: "60s", tip: "Squeeze quads at top" },
      { name: "Glute Bridges", defaultSets: 3, defaultReps: 15, rest: "60s", tip: "Drive through heels" },
      { name: "Seated Calf Raises", defaultSets: 4, defaultReps: 15, rest: "60s", tip: "Slow and controlled" },
      { name: "Core Finisher: Reverse Crunches", defaultSets: 3, defaultReps: 15, rest: "45s", tip: "Lift hips off floor" }
    ],
    cooldown: "5 min general lower body stretching"
  },
  Rest: {
    name: "Active Recovery", tag: "Rest Day", duration: "30-45 min", color: "#64748b",
    warmup: "—",
    exercises: [
      { name: "Brisk Walk or Light Yoga", defaultSets: 0, defaultReps: 0, rest: "—", tip: "Zone 1-2 cardio, active recovery" },
      { name: "Foam Rolling", defaultSets: 0, defaultReps: 0, rest: "—", tip: "Focus on tight areas like quads and lats" }
    ],
    cooldown: "—"
  }
};
