import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: particleColor,
          }}
          animate={{
            opacity: [0, 1, 0.3, 1, 0],
            scale: [0, 1, 0.5, 1, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
