'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import CenterMessage from '@/components/centerMessage';
import confetti from "canvas-confetti";
import { useScoreboard } from './context/scoreboardContext';




export default function Home() {
  // Timer state
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showMessage, setShowMessage ] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef<Set<number>>(new Set());

  // Scoreboard State
  const {
    state,
    updateTeamName,
    handleScoreFocus,
    handleScoreInputChange,
    handleScoreSubmit,
    handleScoreKeyPress,
    disableShowMessage
  } = useScoreboard();

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
    const timeOverAudio = new Audio('/sounds/timer-over.wav');
    timeOverAudio.preload = 'auto';
    timeOverAudioRef.current = timeOverAudio;
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

  const showWinner = () => {
    console.log("Winner show");
    const title = state.winningTeam !== 'Tie' ? `${state.winningTeam} Wins!` : "It's a Tie!";
    const team1Score = `Team 1 Score: ${state.team1.score}`;
    const team2Score = `Team 2 Score: ${state.team2.score}`;
    const description = team1Score + "\n" + team2Score;
    setTitle(title);
    setDescription(description);
    setShowMessage(true);

  }


  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center p-4 space-y-12"
      style={{
        backgroundImage: `url('/data/back.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'bottom 10%',
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-white/30"></div>

      {/* Logo fixed to top-left */}
      <div className="absolute top-4 left-4 z-20">
        <img
          src="/data/Nestlé Logo.png"
          alt="Nestlé Logo"
          className="w-28 h-auto"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-6xl font-extrabold text-[#01519A]">
            Nestlé Timer & Scoreboard
          </h1>
        </div>

        {/* Row: Team1 - Timer - Team2 */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full px-4">
          {/* Team 1 */}
          <div className="bg-white rounded-3xl shadow-xl p-4 w-full md:w-1/4 max-w-sm mb-6 md:mb-0">
            <div className="text-center">
              <input
                type="text"
                value={state.team1.name}
                onChange={(e) => updateTeamName('team1', e.target.value)}
                className="text-3xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
                maxLength={20}
              />
              <input
                type="text"
                value={
                  state.isEditingTeam1Score
                    ? state.team1ScoreInput
                    : state.team1.score.toString()
                }
                onChange={(e) => handleScoreInputChange('team1', e.target.value)}
                onFocus={() => handleScoreFocus('team1')}
                onBlur={() =>
                  state.isEditingTeam1Score && handleScoreSubmit('team1')
                }
                onKeyDown={(e) => handleScoreKeyPress('team1', e)}
                className={`text-[10vh] font-bold text-[#01519A] mb-6 bg-transparent text-center w-full focus:outline-none focus:bg-blue-50 rounded-lg transition-all duration-300 ${state.team1.animation} ${state.isEditingTeam1Score ? 'ring-2 ring-blue-300' : ''
                  }`}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>

          {/* Timer */}
          <div className="bg-white/25 rounded-3xl shadow-xl p-4 w-full md:w-1/4 max-w-md text-center">
            {/* Timer Display */}
            <div className="mb-6">
              {isEditing ? (
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(parseInt(e.target.value) || 0)
                    }
                    className="w-[5vl] text-4xl font-mono text-center border-2 border-[#01519A] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <span className="text-4xl font-mono text-[#01519A]">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds.toString().padStart(2, '0')}
                    onChange={(e) =>
                      setSeconds(parseInt(e.target.value) || 0)
                    }
                    className="w-[5vl] text-4xl font-mono text-center border-2 border-[#01519A] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ) : (
                <div
                  className={`text-6xl font-mono cursor-pointer transition-colors duration-300 ${minutes === 0 && seconds <= 10
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
            <div className="flex justify-center space-x-4 mb-4">
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

            {/* Finish Button */}
            <button
              onClick={() => showWinner()}
              className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition-colors duration-300 font-semibold"
            >
              Finish
            </button>
          </div>

          {/* Team 2 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full md:w-1/4 max-w-sm mb-6 md:mb-0">
            <div className="text-center">
              <input
                type="text"
                value={state.team2.name}
                onChange={(e) => updateTeamName('team2', e.target.value)}
                className="text-3xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
                maxLength={20}
              />
              <input
                type="text"
                value={
                  state.isEditingTeam2Score
                    ? state.team2ScoreInput
                    : state.team2.score.toString()
                }
                onChange={(e) => handleScoreInputChange('team2', e.target.value)}
                onFocus={() => handleScoreFocus('team2')}
                onBlur={() =>
                  state.isEditingTeam2Score && handleScoreSubmit('team2')
                }
                onKeyDown={(e) => handleScoreKeyPress('team2', e)}
                className={`text-[10vh] font-bold text-[#01519A] mb-6 bg-transparent text-center w-full focus:outline-none focus:bg-blue-50 rounded-lg transition-all duration-300 ${state.team2.animation} ${state.isEditingTeam2Score ? 'ring-2 ring-blue-300' : ''
                  }`}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>
        </div>

        {/* Message Popup */}
        {showMessage && (
          <CenterMessage
            title={title}
            description={description}
            duration={20000}
            onClose={() =>setShowMessage(false)}
          />
        )}

        {/* Animations */}
        <style jsx>{`
      @keyframes score-increase {
        0% {
          transform: scale(1);
          color: #01519a;
        }
        50% {
          transform: scale(1.2);
          color: #22c55e;
        }
        100% {
          transform: scale(1);
          color: #01519a;
        }
      }
      @keyframes score-decrease {
        0% {
          transform: scale(1);
          color: #01519a;
        }
        50% {
          transform: scale(1.2);
          color: #ef4444;
        }
        100% {
          transform: scale(1);
          color: #01519a;
        }
      }
      .score-increase {
        animation: score-increase 0.6s ease-in-out;
      }
      .score-decrease {
        animation: score-decrease 0.6s ease-in-out;
      }
    `}</style>
      </div>
    </div>



  );
}