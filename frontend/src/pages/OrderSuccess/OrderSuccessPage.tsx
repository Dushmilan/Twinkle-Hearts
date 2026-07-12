import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { HeartIcon } from '../../components/UI/Icons';

export default function OrderSuccessPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.success-icon', { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' })
      .fromTo('.success-title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
      .fromTo('.success-subtitle', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
      .fromTo('.success-card', { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, '-=0.1')
      .fromTo('.success-cta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 });
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="success-icon w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="success-title font-display text-3xl font-bold text-twinkle-ink mb-2">
            Order Placed!
          </h1>
          <p className="success-subtitle text-twinkle-ink/70 text-lg">
            Your cards are on their way — check WhatsApp to confirm
          </p>
        </div>

        <div className="success-card card p-6 mb-8">
          <div className="text-center mb-6 pb-4 border-b border-twinkle-mist">
            <HeartIcon className="w-8 h-8 text-twinkle-rose mx-auto mb-2" />
            <h2 className="font-display text-xl font-semibold text-twinkle-ink">
              Order Summary
            </h2>
            <p className="text-xs text-twinkle-ink/40 mt-1">
              Confirmation sent to your WhatsApp
            </p>
          </div>

          <div className="bg-twinkle-sage/20 border border-twinkle-mist rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-twinkle-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-twinkle-ink mb-1">Next Step</p>
                <p className="text-sm text-twinkle-ink/50 leading-relaxed">
                  Open WhatsApp and send the pre-filled order message. We'll confirm your order and arrange delivery!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="success-cta text-center">
          <Link to="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}