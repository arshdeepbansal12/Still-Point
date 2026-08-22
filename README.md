# Still-Point

🌿 Stillpoint
A privacy-first mental wellness companion that helps you notice stress before it becomes a crisis.
Stillpoint combines a validated stress assessment with real-time facial expression analysis to generate a personalized report — breaking your stress down into Emotional, Physical, and Behavioral dimensions, and recommending specific micro-habits to help you recover. A private, on-device AI companion is available throughout the app for ongoing support, with built-in safety routing to crisis resources when needed.
> ⚠️ **Disclaimer**: Stillpoint is a self-awareness and wellness tool — **not** a medical device and **not** a diagnostic instrument. It does not replace professional mental health care. If you're in crisis, please reach out to a licensed professional or a crisis helpline immediately.
---
✨ Features
💬 Global AI Companion
A private AI chatbot, powered by an on-device LLM (WebLLM), accessible from anywhere in the app via a sliding drawer. Conversations never leave your device — nothing is sent to an external server. State persists across page navigation, so your conversation continues no matter where you are in the app.
🕸️ Interactive Radar Chart & Insights
Your stress assessment results are visualized on a glowing radar chart (Recharts) across three dimensions — Emotional, Physical, and Behavioral. A "What this shape tells us" panel translates your highest-scoring category into a plain-language explanation of what you might be experiencing.
🌱 Suggested Practices
Personalized, actionable micro-habit recommendations based on your dominant stress category:
Category	Suggested Practices
Physical	Box Breathing, Body Scan, Change of Scenery
Emotional	5-4-3-2-1 Grounding, Ambient Audio, Self-Compassion Break
Behavioral	Tech Micro-Break, The 2-Minute Rule, Setting Micro-Boundaries
📱 Responsive Mobile Camera UI
Optional live facial expression tracking during the assessment, fully opt-in. On mobile, the camera feed becomes a lightweight, floating circular badge in the top-right corner, showing just an emoji — keeping the interface clean without sacrificing functionality.
🛡️ Safety First
Crisis-relevant answers are flagged immediately, and emergency helpline information (localized to AASRA — 9152987821 for India) is surfaced consistently across the Chatbot, Report Page, and Privacy Page.
---
🧠 How It Works
Consent — Users are shown a clear disclaimer and can optionally enable camera-based expression tracking (the app works fully without it).
Assessment — A stress questionnaire, structured around validated scales like the Perceived Stress Scale (PSS-10), captures Emotional, Physical, and Behavioral indicators.
Optional Facial Analysis — If enabled, expressions are analyzed on-device during the test; raw video is never stored or transmitted — only aggregated results are used.
Scoring — MCQ responses are the primary signal; facial data (when available) supplements the score, and any disagreement between the two signals is explicitly flagged rather than hidden.
Report — Results are visualized on a radar chart with plain-language insights and personalized micro-habit recommendations.
Safety Routing — Responses indicating serious distress immediately surface crisis resources.
---
🛠️ Tech Stack
Frontend
React (Vite)
Tailwind CSS
Recharts — radar chart visualization
Responsive/mobile-first design patterns
AI / ML
WebLLM — in-browser, on-device AI companion (no external API calls)
Client-side facial expression detection (face-api.js / MediaPipe-style model) — runs entirely on-device
State Management
Global state provider for cross-page AI Companion persistence
Backend / Data (update to match actual implementation)
Node.js / Express (or Next.js API routes)
PostgreSQL / Firebase / Supabase — stores assessment scores and aggregated facial metrics only, never raw video or images
---
📂 Project Structure
```
stillpoint/
├── src/
│   ├── components/
│   │   ├── AIChatDrawer/         # Global AI companion drawer
│   │   ├── RadarChart/           # Report page visualization
│   │   ├── SuggestedPractices/   # Recommendation panel
│   │   ├── CameraFeed/           # Facial expression tracking UI
│   │   └── AssessmentCards/      # MCQ test UI
│   ├── pages/
│   │   ├── Assessment.jsx
│   │   ├── Report.jsx
│   │   └── Privacy.jsx
│   ├── lib/
│   │   ├── scoring.js            # MCQ + facial score blending logic
│   │   └── webllm.js             # Local LLM integration
│   └── data/
│       └── questions.js          # Question bank (PSS-10 based)
├── public/
└── README.md
```
(Update this to reflect your actual folder structure)
---
🚀 Getting Started
```bash
# Clone the repository
git clone <your-repo-url>
cd stillpoint

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```
Environment Setup
Requires a browser with WebGPU support for the local LLM (Chrome/Edge recommended)
Camera access requires HTTPS (or localhost) due to browser security requirements
---
🔒 Privacy & Data
Facial data: Processed entirely client-side. Raw frames are discarded immediately after analysis — only aggregated emotion metrics are retained.
Chat conversations: Never leave the user's device (on-device LLM).
Assessment data: Stored securely, tied to user sessions, with options to view/export/delete.
Consent: Camera access is explicitly opt-in; the app is fully functional without it.
If you plan to deploy this beyond a prototype/demo, a formal privacy review (GDPR/BIPA-aligned) and legal review are recommended before handling real user data at scale.
