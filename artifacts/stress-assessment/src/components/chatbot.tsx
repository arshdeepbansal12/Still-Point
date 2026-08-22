import { useState, useEffect, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { CreateMLCEngine, type InitProgressReport, type MLCEngine } from '@mlc-ai/web-llm';

export function Chatbot({ facialTension = [], onClose }: { facialTension?: number[], onClose?: () => void }) {
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user' | 'system'; content: string }[]>([
    { role: 'system', content: 'You are a gentle, empathetic companion for a stress-assessment app. Be incredibly concise (1-2 sentences), warm, and validating. Do not give medical advice. If they mention suicide or self-harm, tell them to call 9152987821 (AASRA in India) or visit findahelpline.com.' },
    { role: 'assistant', content: 'Hello! I am your daily stress assistant. How can I support you right now?' }
  ]);
  const [input, setInput] = useState('');
  const [hasIntervened, setHasIntervened] = useState(false);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Loading AI model...');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const initProgressCallback = (initProgress: InitProgressReport) => {
          setLoadingMsg(`Loading AI: ${Math.round(initProgress.progress * 100)}%`);
        }
        const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
        const newEngine = await CreateMLCEngine(selectedModel, { initProgressCallback });
        setEngine(newEngine);
      } catch (err) {
        console.error("WebLLM error:", err);
        setLoadingMsg("Error loading AI. Is WebGPU supported on your browser?");
      }
    }
    load();
  }, []);

  const triggerBreathe = () => {
    window.dispatchEvent(new CustomEvent('breathe-sync', { detail: { active: true } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('breathe-sync', { detail: { active: false } }));
    }, 60000); 
  };

  useEffect(() => {
    if (facialTension.length >= 3 && !hasIntervened && engine && !isGenerating) {
      const last3 = facialTension.slice(-3);
      const avg = last3.reduce((a, b) => a + b, 0) / 3;
      if (avg > 50) {
        setHasIntervened(true);
        const intervention = "I notice you're holding a lot of tension right now. Let's take a 1-minute breathing break. Watch the waves in the background rise and fall, and breathe with them.";
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: intervention }
        ]);
        triggerBreathe();
      }
    }
  }, [facialTension, hasIntervened, engine, isGenerating]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !engine || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setIsGenerating(true);
    
    try {
      const chunks = await engine.chat.completions.create({
        messages: newMessages,
        stream: true,
      });

      let currentReply = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        currentReply += delta;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: currentReply };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: "I'm sorry, I encountered an error." };
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col bg-card/95 backdrop-blur-md">
      <div className="border-b border-border/70 p-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg">Support Guide</h2>
          <p className="text-xs text-muted-foreground">{!engine ? loadingMsg : 'A true AI companion'}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
            <X size={20} />
          </button>
        )}
      </div>
      {!engine && <div className="h-1 w-full bg-border overflow-hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: loadingMsg.includes('%') ? loadingMsg.split(':')[1].replace('%','').trim() + '%' : '0%' }} /></div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-border/70 p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!engine || isGenerating}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || !engine || isGenerating} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
