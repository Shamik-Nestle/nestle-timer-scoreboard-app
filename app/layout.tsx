import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ScoreboardProvider } from './context/scoreboardContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Timer & Scoreboard',
  description: 'Countdown timer and scoreboard application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ScoreboardProvider>
          <body className={inter.className}>{children}</body>
        </ScoreboardProvider>
    </html>
  );
}
