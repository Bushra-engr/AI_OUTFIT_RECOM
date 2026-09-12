import React, { useEffect, useRef, useState } from 'react';

export function ElasticCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ballX = mouseX;
    let ballY = mouseY;
    let isVisible = false;
    let rafId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        if (cursorRef.current) cursorRef.current.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    const lerp = (a, b, n) => (1 - n) * a + n * b;

    const render = () => {
      const prevX = ballX;
      const prevY = ballY;

      // Ultra-snappy 0.45 tracking (instantly follows mouse without sluggish lag)
      ballX = lerp(ballX, mouseX, 0.45);
      ballY = lerp(ballY, mouseY, 0.45);

      const dx = ballX - prevX;
      const dy = ballY - prevY;
      const speed = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Subtle dynamic stretch along velocity
      const stretch = Math.min(speed * 0.025, 0.35);
      const scaleX = 1 + stretch;
      const scaleY = 1 / Math.sqrt(scaleX);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${ballX}px, ${ballY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[99999] opacity-0 transition-opacity duration-150"
      style={{ willChange: 'transform' }}
    >
      {/* Single Orange Ball - constant size, zero lag */}
      <div className="w-5 h-5 rounded-full bg-[#FF6B00]/90 shadow-sm shadow-orange-500/25" />
    </div>
  );
}
