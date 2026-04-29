import React, { useEffect, useRef, useState } from 'react';

export function useZoomPan() {
  const [transform, setTransform] = useState({ x: 100, y: 300, scale: 0.8 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(transform.scale + delta, 0.1), 3);
    setTransform(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click to drag
    const startX = e.pageX - transform.x;
    const startY = e.pageY - transform.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setTransform(prev => ({
        ...prev,
        x: moveEvent.pageX - startX,
        y: moveEvent.pageY - startY
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return { transform, setTransform, containerRef, handleMouseDown, handleWheel };
}
