'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import CenterMessage from '@/components/centerMessage';

type GifJson = {
  increase: string;
  decrease: string;
}

export default function Home() {
  // Timer state
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [gifs, setGifs] = useState<GifJson>({ increase: '', decrease: '' });
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

  // Score editing state
  const [team1ScoreInput, setTeam1ScoreInput] = useState('');
  const [team2ScoreInput, setTeam2ScoreInput] = useState('');
  const [isEditingTeam1Score, setIsEditingTeam1Score] = useState(false);
  const [isEditingTeam2Score, setIsEditingTeam2Score] = useState(false);

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

    if (gifs) {
      const gif = getGif(teamToScore, updatedScore, scoreChange);
      const headline = change > 0
        ? `Way To Go ${teamToScore}!`
        : `Try Harder ${teamToScore}!`;

      setGif(gif);
      setHeadline(headline);
      setShowMessage(true);
    }
  };


  const handleScoreFocus = (team: 'team1' | 'team2') => {
    if (team === 'team1') {
      setIsEditingTeam1Score(true);
      setTeam1ScoreInput('');
    } else {
      setIsEditingTeam2Score(true);
      setTeam2ScoreInput('');
    }
  };


  const handleScoreInputChange = (team: 'team1' | 'team2', value: string) => {

    const numericValue = value.replace(/[^0-9]/g, '');

    if (team === 'team1') {
      setTeam1ScoreInput(numericValue);
    } else {
      setTeam2ScoreInput(numericValue);
    }
  };


  const handleScoreSubmit = (team: 'team1' | 'team2') => {
    const inputValue = team === 'team1' ? team1ScoreInput : team2ScoreInput;
    const parsedScore = parseInt(inputValue) || 0;
    const validScore = Math.max(0, parsedScore);
    const oldScore = team === 'team1' ? team1Score : team2Score;
    const change = validScore - oldScore;

    // Update the actual score
    if (team === 'team1') {
      setTeam1Score(validScore);
      setIsEditingTeam1Score(false);
      setTeam1ScoreInput('');
      if (change !== 0) {
        animateScore('team1', change > 0 ? 'increase' : 'decrease');
      }
    } else {
      setTeam2Score(validScore);
      setIsEditingTeam2Score(false);
      setTeam2ScoreInput('');
      if (change !== 0) {
        animateScore('team2', change > 0 ? 'increase' : 'decrease');
      }
    }

    const newTeam1Score = team === 'team1' ? validScore : team1Score;
    const newTeam2Score = team === 'team2' ? validScore : team2Score;

    if (newTeam1Score > newTeam2Score) {
      setWinningTeam(team1Name);
    } else if (newTeam2Score > newTeam1Score) {
      setWinningTeam(team2Name);
    } else {
      setWinningTeam('Tie');
    }


    if (change !== 0 && gifs) {
      const teamToScore = team === 'team1' ? team1Name : team2Name;
      const scoreChange = change > 0 ? 'increase' : 'decrease';
      const gif = getGif(teamToScore, validScore, scoreChange);
      const headline = change > 0
        ? `Way To Go ${teamToScore}!`
        : `Try Harder ${teamToScore}!`;

      setGif(gif);
      setHeadline(headline);
      setShowMessage(true);
    }
  };

  const handleScoreKeyPress = (team: 'team1' | 'team2', e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScoreSubmit(team);
    } else if (e.key === 'Escape') {
      // Cancel editing
      if (team === 'team1') {
        setIsEditingTeam1Score(false);
        setTeam1ScoreInput('');
      } else {
        setIsEditingTeam2Score(false);
        setTeam2ScoreInput('');
      }
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center p-4 space-y-12"
      style={{
        backgroundImage: `url('/data/back.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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

        {/* Scoreboard */}
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="text-center">
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="text-3xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
                maxLength={20}
              />
              <input
                type="text"
                value={isEditingTeam1Score ? team1ScoreInput : team1Score.toString()}
                onChange={(e) => handleScoreInputChange('team1', e.target.value)}
                onFocus={() => handleScoreFocus('team1')}
                onBlur={() => isEditingTeam1Score && handleScoreSubmit('team1')}
                onKeyDown={(e) => handleScoreKeyPress('team1', e)}
                className={`text-[10vh] font-bold text-[#01519A] mb-6 bg-transparent text-center w-full focus:outline-none focus:bg-blue-50 rounded-lg transition-all duration-300 ${team1Animation} ${isEditingTeam1Score ? 'ring-2 ring-blue-300' : ''}`}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>

            {/* Team 2 */}
            <div className="text-center">
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="text-3xl font-bold text-[#01519A] bg-transparent border-b-2 border-blue-200 focus:border-[#01519A] focus:outline-none text-center w-full mb-4 pb-2"
                maxLength={20}
              />
              <input
                type="text"
                value={isEditingTeam2Score ? team2ScoreInput : team2Score.toString()}
                onChange={(e) => handleScoreInputChange('team2', e.target.value)}
                onFocus={() => handleScoreFocus('team2')}
                onBlur={() => isEditingTeam2Score && handleScoreSubmit('team2')}
                onKeyDown={(e) => handleScoreKeyPress('team2', e)}
                className={`text-[10vh] font-bold text-[#01519A] mb-6 bg-transparent text-center w-full focus:outline-none focus:bg-blue-50 rounded-lg transition-all duration-300 ${team2Animation} ${isEditingTeam2Score ? 'ring-2 ring-blue-300' : ''}`}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>
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

        {/* Message Popup */}
        {showMessage && (
          <CenterMessage
            gif={gif}
            headline={headline}
            duration={3000}
            onClose={() => setShowMessage(false)}
          />
        )}

        {/* Animations */}
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
    </div>

  );
}