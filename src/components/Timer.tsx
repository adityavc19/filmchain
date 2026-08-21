'use client';
import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  startTime: number | null;
  endTime?: number | null;
}

export default function Timer({ startTime, endTime }: TimerProps) {
  const [now, setNow] = useState<number>(Date.now());
  const requestRef = useRef<number>(undefined);

  useEffect(() => {
    if (!startTime || endTime) return;

    const updateTime = () => {
      setNow(Date.now());
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [startTime, endTime]);

  const timeToDisplay = endTime || (startTime ? now : null);
  const elapsed = timeToDisplay && startTime ? timeToDisplay - startTime : 0;

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const ms = Math.floor((elapsed % 1000) / 10);

  return (
    <div className="font-mono text-2xl sm:text-3xl font-bold text-accent tracking-wider tabular-nums select-none drop-shadow-[0_0_8px_rgba(0,224,84,0.3)]">
      {startTime ? (
        <>
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
          <span className="text-lg sm:text-xl text-accent-dim">.{ms.toString().padStart(2, '0')}</span>
        </>
      ) : (
        "00:00.00"
      )}
    </div>
  );
}
