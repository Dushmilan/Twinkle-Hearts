import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsArray = words.split(' ');

  useEffect(() => {
    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll('span');

    gsap.fromTo(
      spans,
      { opacity: 0, filter: filter ? 'blur(10px)' : 'none' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: duration ?? 1,
        stagger: 0.2,
        ease: 'power2.out',
      },
    );
  }, [duration, filter]);

  return (
    <div className={cn('font-bold', className)}>
      <div className="mt-4">
        <div className="text-2xl leading-snug tracking-wide">
          <div ref={containerRef}>
            {wordsArray.map((word, idx) => (
              <span key={word + idx} className="opacity-0" style={{ filter: filter ? 'blur(10px)' : 'none' }}>
                {word}{' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};