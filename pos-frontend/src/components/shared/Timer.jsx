import React, { useState, useEffect } from 'react';

const Timer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      setElapsed(now - start);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');
    
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Color coding based on duration (optional)
  const getColor = (ms) => {
      const minutes = Math.floor(ms / 60000);
      if (minutes >= 30) return "text-red-500";
      if (minutes >= 15) return "text-yellow-500";
      return "text-green-500";
  };

  return (
    <span className={`font-mono font-bold ${getColor(elapsed)}`}>
      {formatTime(elapsed)}
    </span>
  );
};

export default Timer;
