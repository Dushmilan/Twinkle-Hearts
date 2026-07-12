import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const fadeUpStagger = (
  targets: gsap.TweenTarget,
  opts?: { stagger?: number; duration?: number; y?: number; ease?: string; scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars }
) =>
  gsap.fromTo(
    targets,
    { opacity: 0, y: opts?.y ?? 30 },
    {
      opacity: 1,
      y: 0,
      duration: opts?.duration ?? 0.6,
      ease: opts?.ease ?? 'power3.out',
      stagger: opts?.stagger ?? 0.06,
      scrollTrigger: opts?.scrollTrigger,
    },
  );

export const scaleIn = (
  targets: gsap.TweenTarget,
  opts?: { from?: number; duration?: number; ease?: string; delay?: number; scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars }
) =>
  gsap.fromTo(
    targets,
    { scale: opts?.from ?? 0.92, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: opts?.duration ?? 0.5,
      ease: opts?.ease ?? 'back.out(1.4)',
      delay: opts?.delay ?? 0,
      scrollTrigger: opts?.scrollTrigger,
    },
  );

export const slideInLeft = (
  targets: gsap.TweenTarget,
  opts?: { x?: number; duration?: number; ease?: string; delay?: number; scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars }
) =>
  gsap.fromTo(
    targets,
    { x: opts?.x ?? -40, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: opts?.duration ?? 0.6,
      ease: opts?.ease ?? 'power3.out',
      delay: opts?.delay ?? 0,
      scrollTrigger: opts?.scrollTrigger,
    },
  );

export const slideInRight = (
  targets: gsap.TweenTarget,
  opts?: { x?: number; duration?: number; ease?: string; delay?: number; scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars }
) =>
  gsap.fromTo(
    targets,
    { x: opts?.x ?? 40, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: opts?.duration ?? 0.6,
      ease: opts?.ease ?? 'power3.out',
      delay: opts?.delay ?? 0,
      scrollTrigger: opts?.scrollTrigger,
    },
  );

export const floatLoop = (
  targets: gsap.TweenTarget,
  opts?: { y?: number; duration?: number; ease?: string; repeatRefresh?: boolean }
) =>
  gsap.to(targets, {
    y: opts?.y ?? -12,
    duration: opts?.duration ?? 3,
    ease: opts?.ease ?? 'sine.inOut',
    yoyo: true,
    repeat: -1,
    repeatRefresh: opts?.repeatRefresh ?? true,
  });

export const stickyReveal = (trigger: string | Element, opts?: { start?: string; end?: string; pin?: boolean }) =>
  ScrollTrigger.create({
    trigger,
    start: opts?.start ?? 'top 85%',
    end: opts?.end ?? 'bottom 20%',
    toggleActions: 'play none none reverse',
    ...(opts?.pin ? { pin: true, end: opts?.end ?? '+=200%' } : {}),
  });

export const magneticEffect = (el: HTMLElement, strength?: number) => {
  const s = strength ?? 0.35;
  const onMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * s;
    const dy = (e.clientY - cy) * s;
    gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
  };
  const onLeave = () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  };
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  return () => {
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
  };
};

export const cleanUpScrollTriggers = (selector?: string) => {
  const triggers = ScrollTrigger.getAll();
  if (selector) {
    triggers.forEach((st) => {
      if (st.trigger && (st.trigger as Element).matches?.(selector)) st.kill();
    });
  } else {
    triggers.forEach((st) => st.kill());
  }
};

export { gsap, ScrollTrigger };