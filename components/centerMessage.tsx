'use client';
import { useEffect, useState } from 'react';

type CenterMessageProps = {
  duration: number;
  onClose: () => void;
  title: string;
  description: string;
};

export default function CenterMessage({
  duration = 3000,
  onClose,
  title,
  description,
}: CenterMessageProps) {
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
        <h2 className="text-6xl font-extrabold text-gray-800">{title}</h2>
        <p style={{ whiteSpace: "pre-line" }} className="text-4xl font-light">{description}</p>
      </div>
    </div>
  );
}
