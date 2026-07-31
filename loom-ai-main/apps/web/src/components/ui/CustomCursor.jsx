import React, { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  // The SVG arrow's visible tip is at (6, 4), not at its top-left corner.
  // Keep that tip on the real browser mouse hotspot so hover/click targets
  // never appear to push the custom cursor away.
  const CURSOR_HOTSPOT = { x: 6, y: 4 };
  const mainCursorRef = useRef(null);
  const trailingCursorRef = useRef(null);
  const rippleLayerRef = useRef(null);
  
  // Track actual mouse position
  const mousePos = useRef({ x: 0, y: 0 });
  // Track trailing position
  const trailingPos = useRef({ x: 0, y: 0 });
  const lastRippleAt = useRef(0);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  useEffect(() => {
    // Check if it's a touch device, if so, don't show the custom cursor
    if (window.matchMedia("(pointer: coarse)").matches) return;

    setIsVisible(true);
    document.body.classList.add('hide-default-cursor');

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Keep the effect inexpensive: a short-lived ripple at most every 80ms.
      const now = performance.now();
      if (now - lastRippleAt.current < 80 || !rippleLayerRef.current) return;
      lastRippleAt.current = now;

      const ripple = document.createElement('span');
      ripple.className = 'custom-cursor-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      rippleLayerRef.current.appendChild(ripple);
    };

    const handleMouseOver = (e) => {
      // Check if hovering over clickable elements
      const target = e.target;
      const isTextControl = target.closest('input, textarea, [contenteditable="true"]');
      setIsEditingText(Boolean(isTextControl));
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    // Animation loop for the trailing effect
    let animationFrameId;
    
    const animate = () => {
      // Main cursor moves instantly
      if (mainCursorRef.current) {
        mainCursorRef.current.style.transform = `translate3d(${mousePos.current.x - CURSOR_HOTSPOT.x}px, ${mousePos.current.y - CURSOR_HOTSPOT.y}px, 0)`;
      }

      // Trailing cursor lerps (linear interpolation) to the target position
      trailingPos.current.x += (mousePos.current.x - trailingPos.current.x) * 0.15;
      trailingPos.current.y += (mousePos.current.y - trailingPos.current.y) * 0.15;

      if (trailingCursorRef.current) {
        trailingCursorRef.current.style.transform = `translate3d(${trailingPos.current.x}px, ${trailingPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
      document.body.classList.remove('hide-default-cursor');
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`pointer-events-none fixed inset-0 z-[99999] overflow-hidden ${isEditingText ? 'opacity-0' : ''}`}>
      <div ref={rippleLayerRef} className="absolute inset-0" aria-hidden="true" />
      {/* Background glow trail */}
      <div
        ref={trailingCursorRef}
        className={`absolute left-0 top-0 -ml-6 -mt-6 h-12 w-12 rounded-full bg-indigo-500/30 mix-blend-screen blur-md transition-transform duration-75 ease-out will-change-transform ${
          isHovering ? 'bg-indigo-400/40' : ''
        }`}
      />
      
      {/* Main sharp pointer (hollow arrow) */}
      <div
        ref={mainCursorRef}
        className={`absolute left-0 top-0 will-change-transform ${
          isHovering ? 'text-indigo-300' : 'text-white'
        }`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <path
            d="M6 4L18 12L12 14L10 20L6 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default CustomCursor;
