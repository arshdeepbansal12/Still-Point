import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BarChart3, BookOpen, CircleHelp, History, Leaf, Settings, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { FlowWaveBackground } from './flow-wave';
import { ambientAudio } from '../lib/audio';
import { Chatbot } from './chatbot';

const navigation = [
  { href: '/', label: 'Today', icon: BookOpen },
  { href: '/history', label: 'My history', icon: History },
  { href: '/settings', label: 'Privacy & data', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [audioOn, setAudioOn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);
  return (
    <div className="app-shell dark relative min-h-[100dvh] md:flex text-foreground bg-background overflow-hidden">
      <FlowWaveBackground />
      <aside className="relative z-10 no-print hidden w-[244px] shrink-0 flex-col justify-between bg-sidebar/70 backdrop-blur-md px-5 py-7 text-sidebar-foreground md:flex border-r border-sidebar-border">
        <div>
          <Link href="/" className="mb-14 flex items-center gap-3 text-sidebar-foreground" data-testid="link-brand">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-primary/50 bg-sidebar-accent">
              <Leaf size={17} className="text-sidebar-primary" strokeWidth={1.7} />
            </span>
            <span>
              <span className="block font-display text-lg leading-none">stillpoint</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.19em] text-sidebar-foreground/55">a quiet check-in</span>
            </span>
          </Link>
          <nav className="space-y-1.5" aria-label="Main navigation">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link
                  href={href}
                  key={href}
                  data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/63 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${isChatOpen ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/63 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
            >
              <MessageCircle size={17} strokeWidth={1.7} />
              AI Companion
            </button>
          </nav>
        </div>
        <div>
          <button 
            onClick={() => setAudioOn(ambientAudio.toggle())} 
            className="mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/63 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          >
            {audioOn ? <Volume2 size={17} strokeWidth={1.7} /> : <VolumeX size={17} strokeWidth={1.7} />}
            Ambient Sound
          </button>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4">
            <CircleHelp size={17} className="mb-3 text-sidebar-primary" strokeWidth={1.6} />
            <p className="text-xs font-medium leading-5">A check-in, not a verdict.</p>
            <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">Your answers are yours. We keep the language human and the data private.</p>
          </div>
        </div>
      </aside>
      <div className="flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden md:min-w-0">
        <header className="relative z-10 flex h-[65px] items-center justify-between border-b border-border/70 bg-background/50 px-5 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 text-foreground" data-testid="link-mobile-brand">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/50 bg-primary/10">
              <Leaf size={14} className="text-primary" strokeWidth={1.7} />
            </span>
            <span className="font-display text-lg leading-none">stillpoint</span>
          </Link>
          <Link href="/settings" data-testid="link-mobile-settings" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Settings size={18} /></Link>
        </header>
        <main className="relative z-10 min-h-[calc(100dvh-65px)]">{children}</main>
        <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t border-border/80 bg-background/95 px-5 py-2 backdrop-blur md:hidden" aria-label="Mobile navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link href={href} key={href} data-testid={`link-mobile-nav-${label.toLowerCase().replace(/\s+/g, '-')}`} className={`flex flex-1 flex-col items-center gap-1 py-1 text-[10px] ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon size={17} strokeWidth={active ? 2 : 1.7} />
                {label === 'Privacy & data' ? 'Privacy' : label}
              </Link>
            );
          })}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex flex-1 flex-col items-center gap-1 py-1 text-[10px] ${isChatOpen ? 'text-primary' : 'text-muted-foreground'}`}>
            <MessageCircle size={17} strokeWidth={isChatOpen ? 2 : 1.7} />
            Chat
          </button>
        </nav>
        {isChatOpen && (
          <aside className="absolute right-0 top-0 bottom-0 z-50 h-[100dvh] w-full sm:w-[400px] border-l border-border bg-card shadow-2xl animate-in slide-in-from-right">
             <Chatbot onClose={() => setIsChatOpen(false)} />
          </aside>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-col gap-5 px-5 pb-9 pt-9 sm:px-8 md:flex-row md:items-end md:justify-between md:pt-14">
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        <h1 className="font-display text-4xl leading-[1.04] tracking-[-0.035em] text-foreground sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-3" data-testid="status-loading">
    {Array.from({ length: lines }).map((_, i) => <div key={i} className={`animate-pulse rounded-xl bg-muted ${i === 0 ? 'h-7 w-2/5' : 'h-14 w-full'}`} />)}
  </div>;
}

export function ErrorNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5" data-testid="status-error">
      <p className="text-sm font-semibold text-destructive">We couldn’t bring that in just now.</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">Nothing was lost. Take a breath and try again.</p>
      {onRetry && <button onClick={onRetry} className="mt-4 rounded-lg border border-destructive/25 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10" data-testid="button-retry">Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="soft-grid rounded-3xl border border-dashed border-border p-10 text-center" data-testid="status-empty">
      <BarChart3 size={25} className="mx-auto mb-4 text-primary/70" strokeWidth={1.5} />
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}