import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const SparklesCore = ({
  className,
  particleColor = '#d48a7a',
  particleDensity = 50,
  minSize = 1,
  maxSize = 2,
}: {
  className?: string;
  particleColor?: string;
  particleDensity?: number;
  minSize?: number;
  maxSize?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sparkles = useMemo<Sparkle[]>(() => {
    const items: Sparkle[] = [];
    for (let i = 0; i < particleDensity; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (maxSize - minSize) + minSize,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      });
    }
    return items;
  }, [particleDensity, minSize, maxSize]);

  useEffect(() => {
    sparkleRefs.current.forEach((el, i) => {
      if (!el) return;
      const s = sparkles[i];
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: s.duration * 0.3,
          delay: s.delay,
          ease: 'power2.out',
        },
      );
      gsap.to(el, {
        opacity: 0.3,
        scale: 0.5,
        duration: s.duration * 0.3,
        delay: s.delay + s.duration * 0.3,
        ease: 'power2.in',
      });
      gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: s.duration * 0.2,
        delay: s.delay + s.duration * 0.6,
        ease: 'power2.out',
      });
      gsap.to(el, {
        opacity: 0,
        scale: 0,
        duration: s.duration * 0.2,
        delay: s.delay + s.duration * 0.8,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(el, { opacity: 0, scale: 0 });
          gsap.fromTo(
            el,
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              duration: s.duration * 0.25,
              delay: 0,
              ease: 'power2.out',
              onComplete: () => {
                const cycle = gsap.timeline({ repeat: -1 });
                cycle
                  .to(el, { opacity: 0.3, scale: 0.5, duration: s.duration * 0.3, ease: 'sine.inOut' })
                  .to(el, { opacity: 1, scale: 1, duration: s.duration * 0.2, ease: 'sine.inOut' })
                  .to(el, { opacity: 0, scale: 0, duration: s.duration * 0.2, ease: 'sine.inOut' })
                  .to(el, { opacity: 0, scale: 0, duration: s.duration * 0.3 });
              },
            },
          );
        },
      });
    });

    return () => {
      sparkleRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
    };
  }, [sparkles]);

  return (
    <div ref={containerRef} className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {sparkles.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => { sparkleRefs.current[i] = el; }}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: particleColor,
            opacity: 0,
            transform: 'scale(0)',
          }}
        />
      ))}
    </div>
  );
};