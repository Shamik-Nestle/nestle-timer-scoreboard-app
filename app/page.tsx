'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import CenterMessage from '@/components/centerMessage';

export default function Home() {
  // Timer state
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [gifs, setGifs] = useState(null);
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);

  // Scoreboard state
  const [team1Name, setTeam1Name] = useState('Team 1');
  const [team2Name, setTeam2Name] = useState('Team 2');
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Animation, setTeam1Animation] = useState('');
  const [team2Animation, setTeam2Animation] = useState('');
  const [winningTeam, setWinningTeam] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef<Set<number>>(new Set());
  const [showMessage, setShowMessage] = useState(false);
  const [gif, setGif] = useState('');

  const timeOverAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice countdown function
  const speakNumber = (number: number) => {
    if ('speechSynthesis' in window && !hasSpokenRef.current.has(number)) {
      window.speechSynthesis.cancel();
      let utterance;
      if (number === 15) {
        utterance = new SpeechSynthesisUtterance('15 seconds remaining');
      } else {
        utterance = new SpeechSynthesisUtterance(number.toString());
      }
      utterance.rate = 0.5;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
      hasSpokenRef.current.add(number);
    }
  };

  const playOverFxSound = () => {
    timeOverAudioRef.current?.play();
  };

  const getGif = (teamToScore: string, score: number, change: string) => {
    console.log(change, winningTeam, teamToScore);
    const gif = change === 'increase' ? gifs.increase : gifs.decrease;

    // const randomIndex = Math.floor(Math.random() * 10);
    // const selectedMessage = messageArray[randomIndex];

    return gif;
  };

  // Timer logic
  useEffect(() => {
    if (!isRunning || (minutes === 0 && seconds === 0)) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const totalSeconds = minutes * 60 + seconds;
    const interval = totalSeconds <= 10 ? 1500 : 1000;

    intervalRef.current = setTimeout(() => {
      const currentTotal = minutes * 60 + seconds;

      if (currentTotal <= 1) {
        // Timer finished
        setMinutes(0);
        setSeconds(0);
        setIsRunning(false);
        playOverFxSound();
        return;
      }

      const newTotal = currentTotal - 1;
      const newMinutes = Math.floor(newTotal / 60);
      const newSeconds = newTotal % 60;

      setMinutes(newMinutes);
      setSeconds(newSeconds);

      if (newTotal === 0) {
        setIsRunning(false);
        playOverFxSound();
      } else if (newTotal === 15) {
        speakNumber(newTotal);
      } else if (newTotal <= 10 && newTotal > 0) {
        speakNumber(newTotal);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, minutes, seconds]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch('/data/gifs.json');
        const data = await response.json();
        setGifs(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  useEffect(() => {
    const timeOverAudio = new Audio('/sounds/timer-over.wav');
    timeOverAudio.preload = 'auto';
    timeOverAudioRef.current = timeOverAudio;
    // Optional: load the file so it's decoded
    timeOverAudio.load();
  }, []);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      hasSpokenRef.current.clear();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(initialMinutes);
    setSeconds(initialSeconds);
    hasSpokenRef.current.clear();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const updateInitialTime = () => {
    setInitialMinutes(minutes);
    setInitialSeconds(seconds);
    setIsEditing(false);
  };

  // Score animation functions
  const animateScore = (
    team: 'team1' | 'team2',
    type: 'increase' | 'decrease'
  ) => {
    const animation = type === 'increase' ? 'score-increase' : 'score-decrease';
    if (team === 'team1') {
      setTeam1Animation(animation);
      setTimeout(() => setTeam1Animation(''), 600);
    } else {
      setTeam2Animation(animation);
      setTimeout(() => setTeam2Animation(''), 600);
    }
  };

  const updateScore = (team: 'team1' | 'team2', change: number) => {
    let newTeam1Score = team1Score;
    let newTeam2Score = team2Score;
    let newWinningTeam = winningTeam;

    if (team === 'team1') {
      newTeam1Score = Math.max(0, team1Score + change);
      setTeam1Score(newTeam1Score);
      animateScore('team1', change > 0 ? 'increase' : 'decrease');
    } else {
      newTeam2Score = Math.max(0, team2Score + change);
      setTeam2Score(newTeam2Score);
      animateScore('team2', change > 0 ? 'increase' : 'decrease');
    }

    if (newTeam1Score > newTeam2Score) {
      newWinningTeam = team1Name;
      setWinningTeam(newWinningTeam);
    } else if (newTeam2Score > newTeam1Score) {
      newWinningTeam = team2Name;
      setWinningTeam(newWinningTeam);
    } else {
      setWinningTeam('Tie');
    }

    const updatedScore = team === 'team1' ? newTeam1Score : newTeam2Score;
    const teamToScore = team === 'team1' ? team1Name : team2Name;
    const scoreChange = change > 0 ? 'increase' : 'decrease';

    const gif = getGif(teamToScore, updatedScore, scoreChange);
    const headline =
      (scoreChange === 'increase' ? 'Way To Go' : 'Try Harder') +
      ' ' +
      (team === 'team1' ? team1Name : team2Name) +
      '!';
    setGif(gif);
    setHeadline(headline);
    setShowMessage(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 space-y-12">
      {/* Header */}
      <div className="flex flex-col items-center space-y-2">
        <img
          src="/data/Nestlé Logo.png" // replace with actual logo path or placeholder
          alt="Nestlé Logo"
          className="w-28 h-auto"
        />
        <h1 className="text-6xl font-extrabold text-[#01519A]">
          Nestlé Timer & Scoreboard
        </h1>
      </div>
      {/* Countdown Timer */}
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          {/* Timer Display */}
          <div className="mb-6">
            {isEditing ? (
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="w-[5vl] text-4xl font-mono text-center border-2 border-[#01519A] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-4xl font-mono text-[#01519A]">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds.toString().padStart(2, '0')}
                  onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                  className="w-[5vl] text-4xl font-mono text-center border-2 border-[#01519A] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ) : (
              <div
                className={`text-6xl font-mono cursor-pointer transition-colors duration-300 ${
                  minutes === 0 && seconds <= 10
                    ? 'text-red-500 animate-pulse'
                    : 'text-[#01519A]'
                }`}
                onClick={() => !isRunning && setIsEditing(true)}
              >
                {minutes.toString()}:{seconds.toString().padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-4">
            {isEditing ? (
              <button
                onClick={updateInitialTime}
                className="bg-[#01519A] text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 font-semibold"
              >
                Set Time
              </button>
            ) : (
              <>
                <button
                  onClick={toggleTimer}
                  className="bg-[#01519A] text-white p-4 rounded-full hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                >
                  {isRunning ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={resetTimer}
                  className="bg-blue-100 text-[#01519A] p-4 rounded-full hover:bg-blue-200 transition-all duration-300 hover:scale-105"
                >
                  <RotateCcw size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Team 1 */}
          <div className="text-center">
            <input
              type="text"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="text-2xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
              maxLength={20}
            />
            <div
              className={`text-8xl font-bold text-[#01519A] mb-6 transition-all duration-300 ${team1Animation}`}
            >
              {team1Score}
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => updateScore('team1', -1)}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all duration-300 hover:scale-110"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => updateScore('team1', 1)}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <input
              type="text"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              className="text-2xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
              maxLength={20}
            />
            <div
              className={`text-8xl font-bold text-[#01519A] mb-6 transition-all duration-300 ${team2Animation}`}
            >
              {team2Score}
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => updateScore('team2', -1)}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all duration-300 hover:scale-110"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => updateScore('team2', 1)}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-all duration-300 hover:scale-110"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showMessage && (
        <CenterMessage
          gif={gif}
          headline={headline}
          duration={3000}
          onClose={() => setShowMessage(false)}
        />
      )}

      <style jsx>{`
        @keyframes score-increase {
          0% { transform: scale(1); color: #01519A; }
          50% { transform: scale(1.2); color: #22c55e; }
          100% { transform: scale(1); color: #01519A; }
        }
        
        @keyframes score-decrease {
          0% { transform: scale(1); color: #01519A; }
          50% { transform: scale(1.2); color: #ef4444; }
          100% { transform: scale(1); color: #01519A; }
        }
        
        .score-increase {
          animation: score-increase 0.6s ease-in-out;
        }
        
        .score-decrease {
          animation: score-decrease 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
