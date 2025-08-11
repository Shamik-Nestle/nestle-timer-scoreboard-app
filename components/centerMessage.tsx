'use client';
import { useEffect, useState } from 'react';

export default function CenterMessage({
  gif,
  duration = 3000,
  onClose,
  headline,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white/90 p-6 rounded-xl shadow-lg text-center space-y-4 max-w-[80%]">
        <h2 className="text-4xl font-extrabold text-gray-800">{headline}</h2>
        <img
          src={gif}
          alt="Score animation"
          className="w-80 h-80 mx-auto object-contain"
        />
      </div>
    </div>
  );
}
