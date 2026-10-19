import React, { useState, useEffect } from 'react';
import { LexiLogo } from './LexiLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 850,
}) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    // Check user's reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const duration = prefersReducedMotion ? 80 : minDurationMs;

    // Start fade-out slightly before completion
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, Math.max(0, duration - 220));

    // Hard completion timer to safely unmount and notify caller
    const finishTimer = setTimeout(() => {
      setIsRendered(false);
      if (onFinish) {
        onFinish();
      }
    }, duration);

    // Absolute fallback safety: never stay stuck longer than 1500ms under any circumstances
    const maxSafetyTimer = setTimeout(() => {
      setIsRendered(false);
      if (onFinish) {
        onFinish();
      }
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      clearTimeout(maxSafetyTimer);
    };
  }, [minDurationMs, onFinish]);

  if (!isRendered) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Lexi English Companion loading"
      className={`fixed inset-0 z-999 flex flex-col items-center justify-center bg-gradient-to-b from-[#E7EAFD] via-[#F0F2FE] to-[#FFFFFF] transition-opacity duration-300 ease-out select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Brand Identity */}
        <div className="animate-in fade-in zoom-in-95 duration-500 ease-out">
          <LexiLogo variant="splash" size="xl" showSubtitle={true} />
        </div>

        {/* Subtle Brand Tagline & Progress Accent */}
        <div className="mt-8 flex items-center gap-1.5 opacity-80 animate-in fade-in duration-700 delay-150">
          <span className="w-2 h-2 rounded-full bg-[#646AA4] animate-ping" />
          <span className="text-[12px] font-semibold tracking-wider text-[#646AA4] uppercase">
            Learn English Your Way
          </span>
        </div>
      </div>
    </div>
  );
};
