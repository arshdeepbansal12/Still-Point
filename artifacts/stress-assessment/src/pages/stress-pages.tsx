import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronUp, Download, FileText, LockKeyhole, Leaf, Moon, MoreHorizontal, ShieldCheck, Sparkles, Trash2, TrendingDown, TrendingUp, TriangleAlert, Wind, Footprints, Headphones, Heart, Coffee, Eye, MessageCircle } from 'lucide-react';
import {
  getGetAssessmentSessionQueryKey,
  getListAssessmentSessionsQueryKey,
  useCreateAssessmentSession,
  useDeleteAssessmentSession,
  useGetAssessmentSession,
  useListAssessmentSessions,
} from '@workspace/api-client-react';
import { CreateMLCEngine, type InitProgressReport, type MLCEngine } from "@mlc-ai/web-llm";
import { AppShell, EmptyState, ErrorNotice, LoadingBlock, PageHeader } from '@/components/app-shell';
import { answerLabels, questions, scoreAssessment, shuffleQuestions, type AssessmentAnswer, type Category } from '@/lib/assessment';
import * as faceapi from '@vladmandic/face-api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const categoryNames: Record<Category, string> = { emotional: 'Emotional load', physical: 'Body signals', behavioral: 'Daily patterns' };
const bandCopy: Record<string, { label: string; description: string; color: string }> = {
  low: { label: 'A lighter day', description: 'Your answers suggest stress is present, but not taking up a lot of room right now.', color: 'text-primary' },
  moderate: { label: 'A fuller day', description: 'Some stress signals are asking for your attention. A little support and space may help.', color: 'text-amber-700' },
  high: { label: 'A lot to hold', description: 'Your answers suggest stress is showing up across several parts of your day. You deserve support with this.', color: 'text-destructive' },
};

function formatDate(date: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)); }
function formatShortDate(date: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date)); }

import { FlowWaveBackground } from '../components/flow-wave';

export function HomePage() {
  const [, setLocation] = useLocation();
  const [consent, setConsent] = useState(false);
  const [safety, setSafety] = useState(false);

  return (
    <div className="dark relative min-h-[100dvh] bg-background text-foreground w-full overflow-hidden">
      <FlowWaveBackground />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-5 pb-28 pt-12 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:gap-16 md:pt-24">
        <section className="animate-rise-in">
          <div className="mb-7 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"><span className="h-px w-7 bg-primary" /> Your space to notice</div>
          <h1 className="max-w-2xl font-display text-[3.35rem] leading-[.96] tracking-[-0.055em] sm:text-7xl">How is stress<br /><span className="text-primary">showing up</span> today?</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">A gentle, private check-in for the parts of stress you can feel, notice, and name. It takes about five minutes.</p>
          <div className="mt-10 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground/80">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" data-testid="input-consent" />
              <span>I understand this is a wellbeing reflection, not a diagnosis or medical advice.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground/80">
              <input type="checkbox" checked={safety} onChange={e => setSafety(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" data-testid="input-safety-consent" />
              <span>I’m in a private enough place to answer honestly, and I can pause whenever I need.</span>
            </label>
          </div>
          <button disabled={!consent || !safety} onClick={() => setLocation('/assessment')} className="mt-9 flex items-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-start-assessment">
            Begin the check-in <ArrowRight size={17} />
          </button>
        </section>

        <section className="animate-rise-in max-w-sm rounded-3xl border border-border/20 bg-black/40 backdrop-blur-md p-7 shadow-2xl md:ml-auto" style={{ animationDelay: '150ms' }}>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Leaf size={22} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl">What to expect</h2>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground/90">Ten questions</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground/75">Covering emotional load, body signals, and behavior patterns.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/90">Private by default</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground/75">Your data never leaves your device. No cloud storage.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/90">Adaptive AI Assistance</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground/75">Gentle, offline guidance and facial-tension awareness without the creepy factor.</p>
            </div>
          </div>
        </section>
      </div>
      
      <div className="relative z-10 text-center pb-8 pt-32 text-muted-foreground/40 uppercase tracking-[0.3em] text-[10px]">
        Scroll Down
      </div>
    </div>
  );
}



function CameraFeed({ onTensionChange }: { onTensionChange?: (index: number | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState<{ emotion: string, score: number } | null>(null);
  const trackingRef = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]).then(() => setIsLoaded(true)).catch(err => {
      console.error('Failed to load models:', err);
      setError('Could not load emotion detection models.');
    });
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isLoaded) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          setError('Camera access denied or unavailable.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (trackingRef.current) {
        clearInterval(trackingRef.current);
      }
    };
  }, [isLoaded]);

  const handlePlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    
    // We poll roughly 3 times a second
    trackingRef.current = window.setInterval(async () => {
      if (video.paused || video.ended) return;
      
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      
      if (detections) {
        const expr = detections.expressions;
        
        // Find dominant emotion for UI
        let maxEmotion = 'neutral';
        let maxScore = expr.neutral;
        for (const [e, score] of Object.entries(expr)) {
          if (score > maxScore) {
            maxScore = score;
            maxEmotion = e;
          }
        }
        setDominantEmotion({ emotion: maxEmotion, score: Math.round(maxScore * 100) });

        if (onTensionChange) {
          // Simple heuristic for physical facial tension/stress:
          // High combination of sad, angry, or fearful expressions
          const tensionScore = (expr.sad + expr.angry + expr.fearful) * 100;
          
          // Let's cap and normalize it as a simple index (0-100)
          onTensionChange(Math.min(100, Math.round(tensionScore)));
        }
      }
    }, 300);
  };

  const emotionEmojis: Record<string, string> = {
    neutral: '😐 Neutral',
    happy: '😊 Happy',
    sad: '😢 Sad',
    angry: '😠 Angry',
    fearful: '😨 Fearful',
    disgusted: '🤢 Disgusted',
    surprised: '😲 Surprised'
  };

  return (
    <div className="fixed top-[80px] right-4 z-40 md:relative md:top-auto md:right-auto md:z-auto flex flex-col gap-3 md:mt-12 pointer-events-none md:pointer-events-auto">
      <div className="hidden md:flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Feed</span>
      </div>
      
      <div className="overflow-hidden shadow-2xl md:shadow-none border-2 border-emerald-500/30 md:border md:border-border/70 bg-black h-28 w-28 rounded-full md:rounded-2xl md:aspect-auto md:h-64 md:w-full relative flex items-center justify-center pointer-events-auto transition-all">
        {!isLoaded ? (
           <p className="text-[10px] md:text-xs text-muted-foreground px-2 md:px-4 text-center leading-tight">Loading...</p>
        ) : error ? (
          <p className="text-[10px] md:text-xs text-muted-foreground px-2 md:px-4 text-center leading-tight">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              onPlay={handlePlay}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover transform -scale-x-100"
            />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none hidden md:block" />
            
            {dominantEmotion && (
              <>
                <div className="hidden md:flex absolute bottom-4 right-4 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 px-3 py-2 shadow-sm items-center gap-2">
                  <span className="text-sm font-semibold">{emotionEmojis[dominantEmotion.emotion] || dominantEmotion.emotion}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{dominantEmotion.score}%</span>
                </div>
                <div className="md:hidden absolute bottom-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 px-2 py-0.5 shadow-sm flex items-center gap-1">
                  <span className="text-sm">{emotionEmojis[dominantEmotion.emotion]?.split(' ')[0] || '👀'}</span>
                  <span className="text-[9px] font-medium text-foreground">{dominantEmotion.score}%</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      <p className="hidden md:block text-[11px] leading-relaxed text-muted-foreground">
        <strong>Privacy Note:</strong> This camera feed and expression detection runs entirely on your device. No video or facial data is recorded or sent to our servers.
      </p>
    </div>
  );
}

export function AssessmentPage() {
  const [, setLocation] = useLocation();
  const createSession = useCreateAssessmentSession();
  const sessionQuestions = useMemo(() => shuffleQuestions(questions), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitError, setSubmitError] = useState(false);
  const [facialTension, setFacialTension] = useState<number[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  
  const question = sessionQuestions[step];
  const selected = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const choose = (value: number) => setAnswers(current => ({ ...current, [question.id]: value }));
  
  const finish = () => {
    const answerList: AssessmentAnswer[] = questions.map(q => ({ questionId: q.id, answerValue: answers[q.id] ?? 0 }));
    let scored = scoreAssessment(answerList);
    
    // Average facial tension recorded during the test (0-100)
    let avgTension: number | null = null;
    let facialDataUsed = false;
    if (facialTension.length > 0) {
      avgTension = Math.round(facialTension.reduce((a, b) => a + b, 0) / facialTension.length);
      facialDataUsed = true;
      // We gently blend the facial tension score into the final self-reported score 
      // (e.g. giving it a 25% weight so self-reporting remains the primary driver)
      const combinedScore = Math.round((scored.overallScore * 0.75) + (avgTension * 0.25));
      scored = {
        ...scored,
        overallScore: combinedScore,
        band: combinedScore < 34 ? 'low' : combinedScore < 67 ? 'moderate' : 'high',
      };
    }

    setSubmitError(false);
    createSession.mutate({ 
      data: { 
        mcqScore: scoreAssessment(answerList).overallScore, 
        finalScore: scored.overallScore, 
        band: scored.band, 
        categoryScores: scored.categoryScores, 
        facialDataUsed, 
        facialTensionIndex: avgTension, 
        crisisFlag: scored.crisisFlag, 
        answers: answerList,
        journalEntry: journalEntry.trim() || null
      } as any 
    }, {
      onSuccess: (session) => { localStorage.setItem('stillpoint-current-session', String(session.id)); setLocation(`/report?session=${session.id}`); },
      onError: () => setSubmitError(true),
    });
  };

  const handleTension = (index: number | null) => {
    if (index !== null) {
      setFacialTension(prev => [...prev, index].slice(-100)); // Keep a rolling buffer of 100 samples
    }
  };

  if (step === sessionQuestions.length) {
    return <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-24 pt-8 md:px-8 md:pt-14">
        <div className="flex-1">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-4 font-display text-4xl">One last thought</h2>
            <p className="text-sm text-muted-foreground mb-8">Take a moment to write down anything else on your mind. This is completely private.</p>
            <textarea
              value={journalEntry}
              onChange={e => setJournalEntry(e.target.value)}
              className="w-full h-40 rounded-2xl bg-card border border-border p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="What's taking up space today?..."
            />
            {submitError && <div className="mt-4"><p className="text-xs font-medium text-destructive">Couldn’t save this check-in. Try again.</p></div>}
            <button
              onClick={finish}
              disabled={createSession.isPending}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createSession.isPending ? 'Saving...' : 'Finish check-in'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>;
  }

  return <AppShell>
    <div className="mx-auto grid min-h-[calc(100dvh-65px)] w-full grid-cols-1 gap-8 px-5 pb-28 pt-4 sm:px-8 md:grid-cols-[1.5fr_1fr] md:gap-10 md:pt-4">
      <div className="flex flex-col pt-7 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => step === 0 ? setLocation('/') : setStep(step - 1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="button-assessment-back"><ArrowLeft size={16} /> Back</button>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground" data-testid="text-assessment-progress">{String(step + 1).padStart(2, '0')} <span className="text-border">/</span> {sessionQuestions.length}</span>
        </div>
        <div className="mb-14 h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / sessionQuestions.length) * 100}%` }} /></div>
        <div key={question.id} className="animate-rise-in flex flex-1 flex-col">
          <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-primary"><span className="h-px w-6 bg-primary" /> {categoryNames[question.category]}</div>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] tracking-[-.035em] sm:text-5xl">{question.text}</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">{question.note}</p>
          <div className="mt-12 grid gap-2.5 sm:grid-cols-5">
            {answerLabels.map((label, index) => <button key={label} onClick={() => choose(index)} className={`group flex w-full min-w-0 min-h-[64px] items-center justify-between rounded-2xl border p-3 text-left transition-all sm:min-h-[120px] sm:flex-col sm:items-start sm:justify-between ${selected === index ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'}`} data-testid={`button-answer-${index}`}><span className={`flex shrink-0 h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${selected === index ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground group-hover:border-primary/50'}`}>{index + 1}</span><span className="w-full min-w-0 break-words text-[13px] leading-tight font-medium sm:mt-auto">{label}</span></button>)}
          </div>
          <div className="mt-auto flex flex-col items-start justify-between gap-4 pt-12 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">{answeredCount} of {sessionQuestions.length} answered · You can change an answer</p>
            {submitError && <p className="text-xs font-medium text-destructive" data-testid="status-submit-error">Couldn’t save this check-in. Try again.</p>}
            <button disabled={selected === undefined || createSession.isPending} onClick={() => step === sessionQuestions.length - 1 ? finish() : setStep(step + 1)} className="flex items-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40" data-testid="button-next-question">
              {createSession.isPending ? 'Saving your reflection…' : step === sessionQuestions.length - 1 ? 'See my reflection' : 'Next'} {!createSession.isPending && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="md:border-l md:border-border/70 md:pl-6">
        <CameraFeed onTensionChange={handleTension} />
      </div>
    </div>
  </AppShell>;
}

function SessionLoadingOrEmpty({ session }: { session: any }) {
  if (!session) return <EmptyState title="No reflection yet" message="Complete a check-in and your reflection will meet you here." action={<Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-start-from-report">Start a check-in <ArrowRight size={15} /></Link>} />;
  return null;
}

export function ReportPage() {
  const [queryId] = useState(() => new URLSearchParams(window.location.search).get('session'));
  const sessionsQuery = useListAssessmentSessions();
  const requestedId = Number(queryId || localStorage.getItem('stillpoint-current-session') || 0);
  const detailQuery = useGetAssessmentSession(requestedId, { query: { enabled: requestedId > 0, queryKey: getGetAssessmentSessionQueryKey(requestedId) } });
  const session = detailQuery.data ?? (sessionsQuery.data?.[0]);
  const isLoading = requestedId > 0 ? detailQuery.isLoading : sessionsQuery.isLoading;
  if (isLoading) return <AppShell><div className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><LoadingBlock lines={5} /></div></AppShell>;
  if (!session) return <AppShell><div className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><SessionLoadingOrEmpty session={session} /></div></AppShell>;
  const band = bandCopy[session.band] ?? bandCopy.moderate;
  return <AppShell>
    <div className="print-report mx-auto max-w-5xl px-5 pb-28 sm:px-8">
      <div className="no-print pt-8"><Link href="/history" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-report-back"><ArrowLeft size={16} /> Back to history</Link></div>
      <header className="border-b border-border/70 pb-9 pt-9 md:pt-14">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div><p className="mb-3 text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Your reflection · {formatDate(session.createdAt)}</p><h1 className="font-display text-5xl tracking-[-.045em] sm:text-6xl">A little room<br /><span className={band.color}>to notice.</span></h1></div>
          <button onClick={() => window.print()} className="no-print inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted sm:self-auto" data-testid="button-export-report"><FileText size={16} /> Save as PDF</button>
        </div>
        <p className="mt-7 max-w-2xl text-sm leading-6 text-muted-foreground">{band.description} This is a snapshot of how things feel today, not a label or a prediction.</p>
      </header>
      <div className="grid gap-5 py-9 md:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-3xl bg-sidebar p-7 text-sidebar-foreground shadow-lg" data-testid="card-overall-score">
          <div className="flex items-start justify-between"><div><p className="text-[11px] uppercase tracking-[.18em] text-sidebar-foreground/55">Overall signal</p><p className="mt-3 font-display text-7xl leading-none text-sidebar-primary">{session.finalScore}</p><p className="mt-2 text-sm text-sidebar-foreground/60">out of 100</p></div><div className="rounded-full border border-sidebar-primary/30 p-3"><Sparkles size={18} className="text-sidebar-primary" /></div></div>
          <div className="mt-14 border-t border-sidebar-border pt-5"><p className="font-display text-2xl">{band.label}</p><p className="mt-2 text-xs leading-5 text-sidebar-foreground/60">Lower scores suggest fewer stress signals in this snapshot.</p></div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-7 flex flex-col" data-testid="card-category-breakdown">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Where it’s showing</p>
              <h2 className="mt-2 font-display text-2xl">Three angles, one picture</h2>
            </div>
            <BarIcon />
          </div>
          
          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_1fr] flex-1">
            <div className="flex flex-col justify-center space-y-6">
              {(Object.keys(categoryNames) as Category[]).map(category => <ScoreBar key={category} label={categoryNames[category]} score={session.categoryScores[category]} tone={category} />)}
            </div>
            <div className="flex items-center justify-center -ml-4 -mr-4 sm:ml-0 sm:mr-0 h-48 sm:h-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: 'Emotional', A: session.categoryScores.emotional, fullMark: 100 },
                  { subject: 'Physical', A: session.categoryScores.physical, fullMark: 100 },
                  { subject: 'Behavioral', A: session.categoryScores.behavioral, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Radar name="Stress" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <StressInsight scores={session.categoryScores} />
        </section>
      </div>
      {session.facialDataUsed && (
        <section className="mb-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
          <div className="flex gap-4 items-center">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Facial Expression Context Included</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/75">
                Your final score includes a subtle blend (25%) of your facial tension index (<strong>{session.facialTensionIndex}/100</strong>) captured during the check-in. Your self-reported answers remain the primary measure.
              </p>
            </div>
          </div>
        </section>
      )}
      {session.crisisFlag && <section className="mb-5 rounded-3xl border border-destructive/30 bg-card p-6 sm:p-7" data-testid="panel-crisis-support"><div className="flex gap-4"><div className="rounded-full bg-destructive/10 p-3 text-destructive"><TriangleAlert size={20} /></div><div><h2 className="font-display text-2xl text-destructive">You don’t have to carry this alone.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/75">Your answer suggests you may need support right now. Please reach out to someone you trust or a qualified professional. If you might act on thoughts of harming yourself, call <strong>9152987821</strong> (AASRA) in India, or contact your local emergency service. You deserve immediate, human support.</p><div className="mt-5 flex flex-wrap gap-3"><a href="tel:9152987821" className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground" data-testid="link-crisis-call">Call 9152987821</a><a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-destructive/25 px-4 py-3 text-sm font-semibold text-destructive" data-testid="link-crisis-worldwide">Find support worldwide</a></div></div></div></section>}
      {(session as any).journalEntry && (
          <section className="mb-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="font-display text-xl text-foreground mb-4">Your Reflection</h2>
            <div className="rounded-2xl bg-secondary/50 p-5">
              <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">{(session as any).journalEntry}</p>
            </div>
          </section>
        )}
      <section className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl border border-border bg-card p-7"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">A gentle next step</p><h2 className="mt-3 font-display text-3xl">Make one thing<br />a little easier.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Try choosing one small action that lowers the volume: step outside for five minutes, send a simple message, or make your next task smaller than it looks.</p><div className="mt-7 flex items-center gap-3 rounded-2xl bg-secondary p-4 text-sm"><CheckCircle2 size={18} className="shrink-0 text-primary" /><span>Notice one thing you can put down before the day ends.</span></div></div>
        <div className="rounded-3xl border border-border bg-card p-7"><Moon size={20} className="text-primary" strokeWidth={1.6} /><h2 className="mt-5 font-display text-2xl">Keep the context</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A score is most useful next to your own notes. What was happening around you today?</p><button onClick={() => window.print()} className="no-print mt-7 text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4" data-testid="button-print-reflection">Print this reflection</button></div>
      </section>
      <StressDrivers session={session} />
      <RecommendationsPanel session={session} />
      <p className="mt-10 text-center text-[11px] leading-5 text-muted-foreground">Stillpoint is a personal reflection tool, not a substitute for professional medical advice.</p>
    </div>
  </AppShell>;
}

function BarIcon() { return <div className="flex items-end gap-1 text-primary/50"><span className="h-4 w-1.5 rounded-full bg-primary/30" /><span className="h-6 w-1.5 rounded-full bg-primary/50" /><span className="h-9 w-1.5 rounded-full bg-primary" /></div>; }
function ScoreBar({ label, score, tone }: { label: string; score: number; tone: Category }) {
  const colors = { emotional: 'bg-primary', physical: 'bg-accent', behavioral: 'bg-sky-700/60' };
  return <div><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-semibold tabular-nums">{score}<span className="ml-1 text-xs font-normal text-muted-foreground">/ 100</span></span></div><div className="h-2 rounded-full bg-muted"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.max(3, score)}%` }} /></div></div>;
}

function StressInsight({ scores }: { scores: Record<Category, number> }) {
  const highest = (Object.keys(scores) as Category[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const insights = {
    emotional: "Your emotional bandwidth is stretched the most. When emotional load outpaces the others, it often points to unresolved worries, feelings of overwhelm, or a need for a mental breather.",
    physical: "Your body is currently carrying the brunt of your stress. This often manifests as muscle tension, fatigue, or a sense of being 'wired but tired'. Physical rest and grounding are key right now.",
    behavioral: "Your daily patterns are showing the most disruption. When stress affects our behavior first, it often means we are withdrawing, procrastinating, or shifting our eating and sleeping habits to cope."
  };
  
  return (
    <div className="mt-6 rounded-2xl bg-secondary/40 p-5 border border-border/50">
      <h3 className="font-semibold text-[11px] uppercase tracking-[.18em] text-primary mb-2 flex items-center gap-2">
        <Sparkles size={14} className="text-primary"/> 
        What this shape tells us
      </h3>
      <p className="text-sm leading-6 text-foreground/80">{insights[highest]}</p>
    </div>
  );
}

function StressDrivers({ session }: { session: any }) {
  if (!session.answers || session.answers.length === 0) return null;

  // Match answers to questions
  const scoredAnswers = session.answers.map((ans: any) => {
    const q = questions.find((q) => q.id === ans.questionId);
    if (!q || q.crisis) return null;
    const raw = ans.answerValue; // 0 to 4
    const score = q.reverse_scored ? 4 - raw : raw; // 0 to 4 stress contribution
    return { question: q.text, score, raw, category: q.category };
  }).filter(Boolean) as { question: string, score: number, raw: number, category: string }[];

  // Top 3 highest contributing answers
  const drivers = scoredAnswers.filter(a => a.score >= 3).sort((a, b) => b.score - a.score).slice(0, 3);

  if (drivers.length === 0) return null;

  return (
    <section className="mb-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <MessageCircle size={18} />
        </div>
        <div>
          <h2 className="font-display text-2xl">Key Stress Drivers</h2>
          <p className="text-sm text-muted-foreground mt-1">Based on your check-in, these areas are primarily driving your stress score.</p>
        </div>
      </div>
      <ul className="space-y-4">
        {drivers.map((driver, i) => (
          <li key={i} className="flex gap-4 p-4 bg-secondary/30 rounded-2xl border border-border/50">
            <div className="text-xl">
              {driver.category === 'emotional' ? '🧠' : driver.category === 'physical' ? '🔋' : '🔄'}
            </div>
            <div>
              <p className="text-sm font-semibold">{driver.question}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                 You answered: <strong className="text-primary">{answerLabels[driver.raw]}</strong>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))} className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-xl text-sm font-semibold transition-colors">
        <MessageCircle size={16} />
        Discuss this evaluation with AI Companion
      </button>
    </section>
  );
}

function RecommendationsPanel({ session }: { session: any }) {
  if (!session || !session.categoryScores) return null;
  const scores = session.categoryScores;
  const highestCategory = (Object.keys(scores) as Category[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  const allRecs = {
    physical: [
      { title: "Box Breathing", desc: "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat 3 times to quickly reset your nervous system.", icon: Wind },
      { title: "Body Scan", desc: "Notice where you're holding tension right now. Try dropping your shoulders and unclasping your jaw.", icon: Sparkles },
      { title: "Change Your Scenery", desc: "Step away from your current environment for just 5 minutes to break the physical stress loop.", icon: Footprints }
    ],
    emotional: [
      { title: "5-4-3-2-1 Grounding", desc: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you can taste.", icon: Eye },
      { title: "Listen to Ambient Sound", desc: "Turn on the continuous brown noise generator in the sidebar to help quiet your racing mind.", icon: Headphones },
      { title: "Self-Compassion Break", desc: "Remind yourself: 'This is a moment of suffering. It is a part of life. May I be kind to myself.'", icon: Heart }
    ],
    behavioral: [
      { title: "Micro-Break", desc: "Close unnecessary tabs and put your device away for 10 minutes.", icon: Coffee },
      { title: "The 2-Minute Rule", desc: "If a task takes less than 2 minutes, do it now. Otherwise, write it down and let it go for today.", icon: CheckCircle2 },
      { title: "Set a Micro-Boundary", desc: "Say no to one small demand today, or intentionally push a non-urgent deadline to tomorrow.", icon: ShieldCheck }
    ]
  };

  const recs = allRecs[highestCategory];
  const catName = categoryNames[highestCategory];

  return (
    <section className="mt-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="font-display text-2xl">Suggested Practices</h2>
          <p className="text-sm text-muted-foreground mt-1">Personalized based on your highest stress area today ({catName.toLowerCase()})</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {recs.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <div key={i} className="rounded-2xl border border-border bg-secondary/30 p-5 flex flex-col">
              <Icon size={20} className="text-primary mb-3" />
              <h3 className="font-semibold text-sm mb-2">{rec.title}</h3>
              <p className="text-xs text-muted-foreground leading-5">{rec.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryPage() {
  const queryClient = useQueryClient();
  const sessionsQuery = useListAssessmentSessions();
  const deleteSession = useDeleteAssessmentSession();
  const sessions = useMemo(() => [...(sessionsQuery.data ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [sessionsQuery.data]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const average = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + s.finalScore, 0) / sessions.length) : 0;
  const trendDown = sessions.length > 1 && sessions[0].finalScore < sessions[1].finalScore;
  const remove = (id: number) => { if (window.confirm('Delete this reflection permanently?')) deleteSession.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAssessmentSessionsQueryKey() }) }); };
  return <AppShell>
    <PageHeader eyebrow="Your patterns" title="My history" description="A private, plain-language view of how your stress signals have shifted over time." action={<Link href="/assessment" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-new-assessment">New check-in <ArrowRight size={15} /></Link>} />
    <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-8">
      {sessionsQuery.isLoading && <LoadingBlock lines={5} />}
      {sessionsQuery.isError && <ErrorNotice onRetry={() => sessionsQuery.refetch()} />}
      {!sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length === 0 && <EmptyState title="Your history starts here" message="One check-in can become a useful point of reference. Come back whenever you want to notice what has changed." action={<Link href="/assessment" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-empty-start">Begin a check-in <ArrowRight size={15} /></Link>} />}
      {sessions.length > 0 && <><div className="mb-7 grid gap-4 sm:grid-cols-3"><SummaryStat label="Check-ins" value={String(sessions.length)} /><SummaryStat label="Average signal" value={`${average}/100`} /><SummaryStat label="Since last time" value={sessions.length > 1 ? `${Math.abs(sessions[0].finalScore - sessions[1].finalScore)} pts` : 'First one'} trend={sessions.length > 1 ? trendDown : undefined} /></div>
        <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Signal over time</p>
                <h2 className="mt-2 font-display text-2xl">A shape, not a scorecard</h2>
              </div>
              <TrendingDown size={19} className={trendDown ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div className="mt-10 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessions.slice(0, 15).reverse().map(s => ({ date: formatShortDate(s.createdAt), score: s.finalScore }))}>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">The useful question is not “is this good?” but “what might this be telling me?”</p>
          </div>
          <div className="soft-grid rounded-3xl border border-border p-7"><ShieldCheck size={21} className="text-primary" /><h2 className="mt-5 font-display text-2xl">Your data, your pace</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sessions stay available so you can spot patterns, not to grade you. Delete any entry whenever you like.</p><Link href="/settings" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary" data-testid="link-history-settings">Review privacy settings <ArrowRight size={15} /></Link></div></div><div className="mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">{sessions.map(session => <div key={session.id} data-testid={`row-session-${session.id}`}><div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7"><div className="flex min-w-0 items-center gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${session.band === 'high' ? 'bg-destructive/10 text-destructive' : session.band === 'moderate' ? 'bg-accent/40 text-amber-800' : 'bg-primary/10 text-primary'}`}><span className="font-semibold tabular-nums">{session.finalScore}</span></div><div className="min-w-0"><p className="text-sm font-semibold">{formatDate(session.createdAt)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{bandCopy[session.band]?.label ?? session.band} · {session.crisisFlag ? 'Support flagged' : 'No support flag'}</p></div></div><div className="flex items-center gap-1"><Link href={`/report?session=${session.id}`} className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 sm:block" data-testid={`link-view-session-${session.id}`}>View reflection</Link><button onClick={() => setExpanded(expanded === session.id ? null : session.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-expand-session-${session.id}`}>{expanded === session.id ? <ChevronUp size={17} /> : <MoreHorizontal size={17} />}</button></div></div>{expanded === session.id && <div className="flex items-center justify-between border-t border-border bg-muted/35 px-5 py-3 sm:px-7"><Link href={`/report?session=${session.id}`} className="text-xs font-semibold text-primary sm:hidden" data-testid={`link-mobile-view-session-${session.id}`}>View reflection</Link><button onClick={() => remove(session.id)} className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-destructive" data-testid={`button-delete-session-${session.id}`}><Trash2 size={14} /> Delete reflection</button></div>}</div>)}</div></>}
    </div>
  </AppShell>;
}

function SummaryStat({ label, value, trend }: { label: string; value: string; trend?: boolean }) { return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><div className="mt-2 flex items-center gap-2"><p className="font-display text-3xl">{value}</p>{trend !== undefined && (trend ? <TrendingDown size={17} className="text-primary" /> : <TrendingUp size={17} className="text-destructive/70" />)}</div></div>; }

export function SettingsPage() {
  const queryClient = useQueryClient();
  const sessionsQuery = useListAssessmentSessions();
  const deleteSession = useDeleteAssessmentSession();
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sessions = sessionsQuery.data ?? [];
  const exportData = () => { const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `stillpoint-reflections-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const deleteAll = () => { if (!sessions.length || !window.confirm('Delete every saved reflection? This cannot be undone.')) return; setDeleting(true); let remaining = sessions.length; sessions.forEach(session => deleteSession.mutate({ id: session.id }, { onSettled: () => { remaining -= 1; if (remaining === 0) { setDeleting(false); queryClient.invalidateQueries({ queryKey: getListAssessmentSessionsQueryKey() }); } } })); };
  return <AppShell><PageHeader eyebrow="The quiet details" title="Privacy & data" description="Stillpoint is designed to help you reflect without asking for more of you than it needs." /><div className="mx-auto max-w-4xl px-5 pb-28 sm:px-8"><div className="grid gap-4 sm:grid-cols-3"><PrivacyTile icon={<LockKeyhole size={18} />} title="No account" detail="Your check-ins are not tied to a profile." /><PrivacyTile icon={<ShieldCheck size={18} />} title="Local camera" detail="Facial data is never saved or collected here." /><PrivacyTile icon={<Moon size={18} />} title="No diagnosis" detail="Language stays reflective, not clinical." /></div><div className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card"><section className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><div className="flex items-center gap-3"><Download size={19} className="text-primary" /><h2 className="font-display text-2xl">Take your data with you</h2></div><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Download a readable JSON copy of your saved reflections. It includes your answers and scores, and nothing else.</p></div><button onClick={exportData} disabled={!sessions.length} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-export-data"><Download size={15} /> {saved ? 'Downloaded' : 'Export data'}</button></section><section className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><div className="flex items-center gap-3"><Trash2 size={19} className="text-destructive" /><h2 className="font-display text-2xl">Delete all reflections</h2></div><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Permanently remove every check-in saved to this space. This action cannot be undone.</p></div><button onClick={deleteAll} disabled={!sessions.length || deleting} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-destructive/25 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-delete-all">{deleting ? 'Deleting…' : 'Delete everything'}</button></section></div><section className="mt-8 rounded-3xl bg-secondary p-6 sm:p-7"><div className="flex gap-4"><FileText size={20} className="shrink-0 text-primary" /><div><h2 className="font-display text-2xl">A note on safety</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Stillpoint can help you notice patterns, but it cannot respond in an emergency. If you may hurt yourself or someone else, contact local emergency services or a crisis line right away. In India, call 9152987821.</p></div></div></section><p className="mt-8 text-center text-xs leading-5 text-muted-foreground">You can return to this page at any time. There is no dark pattern here: your data controls are always close by.</p></div></AppShell>;
}

function PrivacyTile({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>; }