import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { HeartSparkle } from '../../components/UI/Icons';

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.nf-icon', { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
      .fromTo('.nf-code', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
      .fromTo('.nf-text', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
      .fromTo('.nf-btn', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 });
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="nf-icon w-20 h-20 rounded-full bg-twinkle-rose/20 flex items-center justify-center mx-auto mb-6">
          <HeartSparkle className="w-10 h-10 text-twinkle-rose" />
        </div>
        <h1 className="nf-code text-6xl font-display font-bold text-twinkle-ink mb-2">404</h1>
        <p className="nf-text text-lg font-display text-twinkle-ink/60 mb-2">Page not found</p>
        <p className="nf-text text-sm text-twinkle-ink/40 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="nf-btn btn-primary inline-flex">
          Back to Home
        </Link>
      </div>
    </div>
  );
}