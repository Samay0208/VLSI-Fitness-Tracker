export const VLSI_PHASES = [
  { id: 0, name: "Digital Logic", weeks: 2, days: 14, color: "#1D9E75" },
  { id: 1, name: "Verilog HDL", weeks: 4, days: 28, color: "#378ADD" },
  { id: 2, name: "RTL Design", weeks: 6, days: 42, color: "#7F77DD" },
  { id: 3, name: "SV + UVM", weeks: 6, days: 42, color: "#D4537E" },
  { id: 4, name: "Physical Design", weeks: 8, days: 56, color: "#BA7517" },
  { id: 5, name: "Advanced Topics", weeks: 4, days: 28, color: "#639922" },
  { id: 6, name: "Portfolio & Jobs", weeks: 4, days: 28, color: "#E24B4A" }
];

export const SEED = {
  "0-1": {
    day: 1, phase: 0, title: "Boolean Algebra Foundations", videoId: "gI-qXk7XojA",
    notes: `# Boolean Algebra\n\nVariables are ONLY 0 or 1. The foundation of every chip.\n\n## Operations\n\n**AND (·)** — Output 1 ONLY when ALL inputs are 1\n**OR (+)** — Output 1 when at least ONE input is 1\n**NOT (')** — Inverts: 0→1, 1→0\n\n## Key Identities\n\n| Name | AND | OR |\n|------|-----|----|\n| Identity | A·1=A | A+0=A |\n| Null | A·0=0 | A+1=1 |\n| Complement | A·A'=0 | A+A'=1 |\n| Involution | (A')'=A | — |\n| Distributive | A(B+C)=AB+AC | A+(BC)=(A+B)(A+C) |\n| Absorption | A+AB=A | — |`,
    exercise: `Evaluate F = AB + A'C when A=1, B=0, C=1\nStep 1: A'=0, AB=0, A'C=0, F=0+0=0\nTry: A=0, B=1, C=1 → ?`,
    assignment: `Complete truth tables (8 rows each):\n1. F = AB + BC\n2. F = A·(B + C')\n3. F = (A+B)·(A'+C)`,
    resources: [{ title: "Neso Academy — Boolean Algebra", url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm" }],
    flashcards: [
      { q: "What does AND gate output?", a: "1 only when ALL inputs are 1" },
      { q: "What does OR gate output?", a: "1 when at least ONE input is 1" },
      { q: "What is De Morgan's Theorem 1?", a: "(AB)' = A' + B'" },
      { q: "What is absorption law?", a: "A + AB = A" },
      { q: "What is (A')' equal to?", a: "A (double negation)" }
    ]
  },
  "0-2": {
    day: 2, phase: 0, title: "De Morgan's & Simplification", videoId: "7nNVMzJBqsE",
    notes: `# De Morgan's Theorems\n\n**Theorem 1:** (A·B)' = A' + B'\n**Theorem 2:** (A + B)' = A'·B'\n\n## Golden Rule: "Break the bar, change the sign"\n\n## Key Simplifications\n\n- Absorption: A + AB = A\n- XOR pattern: A'B + AB' = A⊕B\n- XNOR: A'B' + AB = A⊙B`,
    exercise: `Simplify (A'B + AB')' → A'B' + AB (XNOR)`,
    assignment: `1. Simplify ((A+B)(C+D))'\n2. Prove A + A'B = A + B\n3. Minimize A'B'C + A'BC + AB'C + ABC`,
    resources: [{ title: "De Morgan's — Neso Academy", url: "https://www.youtube.com/watch?v=7nNVMzJBqsE" }],
    flashcards: [
      { q: "State De Morgan's Theorem 1", a: "(AB)' = A' + B'" },
      { q: "State De Morgan's Theorem 2", a: "(A+B)' = A'·B'" },
      { q: "Simplify (ABC)'", a: "A' + B' + C'" },
      { q: "What is the golden rule for De Morgan's?", a: "Break the bar, change the sign (AND↔OR)" },
      { q: "A'B + AB' equals what?", a: "A ⊕ B (XOR)" }
    ]
  },
  "0-3": {
    day: 3, phase: 0, title: "Logic Gates & Truth Tables", videoId: "O9cWk68Lbnw",
    notes: `# Basic Logic Gates\n\nLogic gates are the physical realization of Boolean algebra. They take one or more binary inputs and produce a single binary output.\n\n## The Universal Gates\n\n**NAND** and **NOR** are called *universal gates* because ANY boolean function can be implemented using only NAND or only NOR gates.\n\n- **NAND:** Output is 0 only if all inputs are 1. (Inverse of AND)\n- **NOR:** Output is 0 if any input is 1. (Inverse of OR)\n\n## Exclusive Gates\n\n- **XOR (Exclusive OR):** Output is 1 if inputs are DIFFERENT.\n- **XNOR (Exclusive NOR):** Output is 1 if inputs are the SAME.`,
    exercise: `Draw the truth table for a 2-input XOR gate.`,
    assignment: `1. Implement an AND gate using only NAND gates.\n2. Implement an OR gate using only NAND gates.\n3. Implement a NOT gate using a single NOR gate.`,
    resources: [{ title: "Neso Academy - Logic Gates", url: "https://www.youtube.com/watch?v=O9cWk68Lbnw" }, { title: "NPTEL - Digital Circuits", url: "https://nptel.ac.in/courses/108105113" }],
    flashcards: [
      { q: "Why are NAND and NOR called universal gates?", a: "Because any boolean function can be created using just them." },
      { q: "What is the output of an XOR gate when inputs are 1 and 1?", a: "0 (Inputs are the same)" },
      { q: "How do you make a NOT gate from a NAND gate?", a: "Tie both inputs of the NAND gate together." }
    ]
  },
  "1-1": {
    day: 1, phase: 1, title: "Intro to Verilog HDL", videoId: "PJGvEibMkt8",
    notes: `# Introduction to Verilog\n\nVerilog is a Hardware Description Language (HDL). We don't write "programs" that run sequentially; we describe *hardware* that operates concurrently.\n\n## Modules\n\nThe fundamental building block in Verilog is the \`module\`.\n\n\`\`\`verilog\nmodule my_and_gate ( \n  input wire a, \n  input wire b, \n  output wire y\n);\n  assign y = a & b; // Bitwise AND operator\nendmodule\n\`\`\`\n\n## Data Types\n\n- **wire:** Used to connect elements. Represents a physical wire. Cannot hold a value (stateless).\n- **reg:** Used to store a value. Typically used inside \`always\` blocks. (Does NOT necessarily synthesize to a physical register/flip-flop).`,
    exercise: `Write a Verilog module for a 2-input OR gate.`,
    assignment: `1. Write a Verilog module that implements the boolean function: F = (A AND B) OR C.\n2. Create a testbench for your module to test all 8 possible input combinations.`,
    resources: [{ title: "Verilog HDL Basics", url: "https://www.asic-world.com/verilog/veritut.html" }, { title: "Coursera: Hardware Description Languages", url: "https://www.coursera.org/learn/intro-fpga-design" }],
    flashcards: [
      { q: "What is the difference between wire and reg?", a: "wire connects elements and is stateless. reg stores a value and is used in procedural blocks." },
      { q: "What keyword defines the inputs and outputs of a hardware block?", a: "module" },
      { q: "Is Verilog executed sequentially?", a: "No, it describes concurrent hardware." }
    ]
  }
};
