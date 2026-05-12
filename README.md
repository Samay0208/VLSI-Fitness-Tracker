# AI-Powered VLSI + Fitness Tracker

A production-grade React application for tracking fitness progress, VLSI study goals, and interacting with an AI coach. 

## Features
- **Fitness System**: Push/Pull/Legs/Upper/Lower workout routines, water tracking, sleep tracking, and supplement logs.
- **VLSI Study Hub**: Interview question bank, daily revision planner, company application tracker.
- **AI Coach**: Powered by Gemini (default) or Claude, giving personalized insights based on your progress.
- **Progress Tracking**: Charts built with Recharts, and photo analysis.
- **Productivity**: Streaks and achievement badges.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.local.example` to `.env.local` and add your API keys.
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

## Deployment
This project is configured for Vercel. 
Simply push to GitHub and deploy via Vercel dashboard. The `/api/chat` route will automatically run as a serverless function.
