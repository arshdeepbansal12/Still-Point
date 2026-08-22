import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('button, a, input, label'));
    };
    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

  useEffect(() => {
    let frame: number;
    const updateTrail = () => {
      setTrail(prev => ({
        x: prev.x + (pos.x - prev.x) * 0.15,
        y: prev.y + (pos.y - prev.y) * 0.15
      }));
      frame = requestAnimationFrame(updateTrail);
    };
    frame = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(frame);
  }, [pos]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <div 
        className="absolute h-4 w-4 text-primary transition-transform duration-300 mix-blend-screen"
        style={{ left: pos.x, top: pos.y, transform: `translate(-50%, -50%) ${isHovering ? 'scale(0)' : 'scale(1)'}` }}
      >
        <Sparkles size={16} />
      </div>
      <div 
        className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 mix-blend-screen"
        style={{ left: trail.x, top: trail.y, width: isHovering ? '60px' : '30px', height: isHovering ? '60px' : '30px', transform: `translate(-50%, -50%) rotate(${trail.x * 0.5}deg)` }}
      >
        <div className="absolute inset-0 rounded-[40%_60%_70%_30%] bg-primary/30 blur-md animate-spin-slow" />
        <div className="absolute inset-0 rounded-[60%_40%_30%_70%] bg-emerald-400/20 blur-sm animate-spin-reverse-slow" />
      </div>
    </div>
  );
}
