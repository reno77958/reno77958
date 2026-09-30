import { useState, useEffect, useRef, useCallback } from 'react';

export function useAutoScroll() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(3); // 1 (very slow) to 8 (fast)
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const accumulatedScrollRef = useRef<number>(0);

  const stopScrolling = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const scrollToTop = useCallback(() => {
    stopScrolling();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsAtBottom(false);
  }, [stopScrolling]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    lastScrollTimeRef.current = performance.now();
    accumulatedScrollRef.current = window.scrollY;

    const scrollStep = (currentTime: number) => {
      const delta = currentTime - lastScrollTimeRef.current;
      lastScrollTimeRef.current = currentTime;

      // Base speed calculation: speed 1 = ~12 px/sec, speed 5 = ~36 px/sec, speed 8 = ~65 px/sec
      const pixelsPerSecond = 8 + speed * 7;
      const pixelsToMove = (pixelsPerSecond * delta) / 1000;

      const currentScroll = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (currentScroll >= maxScroll - 4) {
        // Reached bottom
        setIsAtBottom(true);
        setIsPlaying(false);
        return;
      } else {
        setIsAtBottom(false);
      }

      accumulatedScrollRef.current += pixelsToMove;
      window.scrollTo(0, Math.floor(accumulatedScrollRef.current));

      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Keep accumulated ref synced if user manually scrolls while playing
  useEffect(() => {
    const handleScroll = () => {
      if (!isPlaying) {
        accumulatedScrollRef.current = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPlaying]);

  return {
    isPlaying,
    speed,
    isAtBottom,
    setSpeed,
    togglePlay,
    stopScrolling,
    scrollToTop,
  };
}
