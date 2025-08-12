'use client';
import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    useState
} from 'react';
import confetti from "canvas-confetti";


type Team = {
    name: string;
    score: number;
    animation: string;
};

type ScoreboardState = {
    team1: Team;
    team2: Team;
    winningTeam: string;
    isEditingTeam1Score: boolean;
    isEditingTeam2Score: boolean;
    team1ScoreInput: string;
    team2ScoreInput: string;
    gif: string;
    headline: string;
    showMessage: boolean;
};

type ScoreboardAction =
    | { type: 'SET_TEAM_NAME'; payload: { team: 'team1' | 'team2'; name: string } }
    | { type: 'SET_TEAM_SCORE'; payload: { team: 'team1' | 'team2'; score: number } }
    | { type: 'SET_TEAM_ANIMATION'; payload: { team: 'team1' | 'team2'; animation: string } }
    | { type: 'SET_WINNING_TEAM'; payload: string }
    | { type: 'SET_EDITING_SCORE'; payload: { team: 'team1' | 'team2'; editing: boolean } }
    | { type: 'SET_SCORE_INPUT'; payload: { team: 'team1' | 'team2'; input: string } }
    | { type: 'SET_HEADER'; payload: { input: string } }
    | { type: 'SET_SHOW_MESSAGE'; payload: { input: boolean } }
    | { type: 'CLEAR_ANIMATIONS' };


const initialScoreboardState: ScoreboardState = {
    team1: { name: 'Team 1', score: 0, animation: '' },
    team2: { name: 'Team 2', score: 0, animation: '' },
    winningTeam: '',
    isEditingTeam1Score: false,
    isEditingTeam2Score: false,
    team1ScoreInput: '',
    team2ScoreInput: '',
    gif: '',
    headline: '',
    showMessage: false
};

// Reducer
function scoreboardReducer(state: ScoreboardState, action: ScoreboardAction): ScoreboardState {
    switch (action.type) {
        case 'SET_TEAM_NAME':
            return {
                ...state,
                [action.payload.team]: {
                    ...state[action.payload.team],
                    name: action.payload.name
                }
            };
        case 'SET_TEAM_SCORE':
            return {
                ...state,
                [action.payload.team]: {
                    ...state[action.payload.team],
                    score: action.payload.score
                }
            };
        case 'SET_TEAM_ANIMATION':
            return {
                ...state,
                [action.payload.team]: {
                    ...state[action.payload.team],
                    animation: action.payload.animation
                }
            };
        case 'SET_WINNING_TEAM':
            return {
                ...state,
                winningTeam: action.payload
            };
        case 'SET_EDITING_SCORE':
            const editingKey = action.payload.team === 'team1' ? 'isEditingTeam1Score' : 'isEditingTeam2Score';
            return {
                ...state,
                [editingKey]: action.payload.editing
            };
        case 'SET_SCORE_INPUT':
            const inputKey = action.payload.team === 'team1' ? 'team1ScoreInput' : 'team2ScoreInput';
            return {
                ...state,
                [inputKey]: action.payload.input
            };
        case 'CLEAR_ANIMATIONS':
            return {
                ...state,
                team1: { ...state.team1, animation: '' },
                team2: { ...state.team2, animation: '' }
            };

        case 'SET_HEADER':
            return {
                ...state,
                headline: action.payload.input
            };
        case 'SET_SHOW_MESSAGE':
            return {
                ...state,
                showMessage: action.payload.input
            };
        default:
            return state;
    }
}


type ScoreboardContextType = {
    state: ScoreboardState;
    dispatch: React.Dispatch<ScoreboardAction>;
    updateTeamName: (team: 'team1' | 'team2', name: string) => void;
    handleScoreFocus: (team: 'team1' | 'team2') => void;
    handleScoreInputChange: (team: 'team1' | 'team2', value: string) => void;
    handleScoreSubmit: (team: 'team1' | 'team2') => void;
    handleScoreKeyPress: (team: 'team1' | 'team2', e: React.KeyboardEvent) => void;
    disableShowMessage: () => void;
};

const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);


export const useScoreboard = () => {
    const context = useContext(ScoreboardContext);
    if (context === undefined) {
        throw new Error('useScoreboard must be used within a ScoreboardProvider');
    }
    return context;
};

// Provider component
type ScoreboardProviderProps = {
    children: React.ReactNode;
    onScoreChange?: (team: string, score: number, change: 'increase' | 'decrease') => void;
};

export const ScoreboardProvider: React.FC<ScoreboardProviderProps> = ({ children, onScoreChange }) => {
    const [state, dispatch] = useReducer(scoreboardReducer, initialScoreboardState);

    const fireConfetti = useCallback(() => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
        });
    }, []);

    const updateTeamName = (team: 'team1' | 'team2', name: string) => {
        dispatch({ type: 'SET_TEAM_NAME', payload: { team, name } });
    };

    const animateScore = (team: 'team1' | 'team2', type: 'increase' | 'decrease') => {
        const animation = type === 'increase' ? 'score-increase' : 'score-decrease';
        dispatch({ type: 'SET_TEAM_ANIMATION', payload: { team, animation } });
        setTimeout(() => {
            dispatch({ type: 'SET_TEAM_ANIMATION', payload: { team, animation: '' } });
        }, 600);
    };

    const handleScoreFocus = (team: 'team1' | 'team2') => {
        const prevEditingTeamScore = team == 'team1' ? state.team1.score : state.team2.score;
        const scoreStringValue = prevEditingTeamScore.toString();
        dispatch({ type: 'SET_EDITING_SCORE', payload: { team, editing: true } });
        dispatch({ type: 'SET_SCORE_INPUT', payload: { team, input: scoreStringValue } });
    };

    const handleScoreInputChange = (team: 'team1' | 'team2', value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        dispatch({ type: 'SET_SCORE_INPUT', payload: { team, input: numericValue } });
    };

    const handleScoreSubmit = (team: 'team1' | 'team2') => {
        const inputValue = team === 'team1' ? state.team1ScoreInput : state.team2ScoreInput;
        const parsedScore = parseInt(inputValue) || 0;
        const validScore = Math.max(0, parsedScore);
        const oldScore = team === 'team1' ? state.team1.score : state.team2.score;
        const change = validScore - oldScore;

        dispatch({ type: 'SET_TEAM_SCORE', payload: { team, score: validScore } });
        dispatch({ type: 'SET_SCORE_INPUT', payload: { team, input: '' } });

        if (change !== 0) {
            animateScore(team, change > 0 ? 'increase' : 'decrease');
        }

        const newTeam1Score = team === 'team1' ? validScore : state.team1.score;
        const newTeam2Score = team === 'team2' ? validScore : state.team2.score;

        if (newTeam1Score > newTeam2Score) {
            dispatch({ type: 'SET_WINNING_TEAM', payload: state.team1.name });
        } else if (newTeam2Score > newTeam1Score) {
            dispatch({ type: 'SET_WINNING_TEAM', payload: state.team2.name });
        } else {
            dispatch({ type: 'SET_WINNING_TEAM', payload: 'Tie' });
        }

        if (change > 0) {
            fireConfetti();
        }

        if (change !== 0) {
            const teamName = team === 'team1' ? state.team1.name : state.team2.name;
            const headline: string = change > 0
                ? `Way To Go ${teamName}!`
                : `Try Harder ${teamName}!`;
            dispatch({ type: 'SET_HEADER', payload: { input: headline } });
            if (onScoreChange) {
                onScoreChange(teamName, validScore, change > 0 ? 'increase' : 'decrease');
            }
        }

        dispatch({ type: 'SET_EDITING_SCORE', payload: { team, editing: false } });
    };

    const handleScoreKeyPress = (team: 'team1' | 'team2', e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleScoreSubmit(team);
        } else if (e.key === 'Escape') {
            const prevEditingTeamScore = team == 'team1' ? state.team1.score : state.team2.score;
            const scoreStringValue = prevEditingTeamScore.toString();
            dispatch({ type: 'SET_EDITING_SCORE', payload: { team, editing: false } });
            dispatch({ type: 'SET_SCORE_INPUT', payload: { team, input: scoreStringValue } });
        }
    };

    const disableShowMessage = () => {
        dispatch({ type: 'SET_SHOW_MESSAGE', payload: {input: false }});
    }

    const value = {
        state,
        dispatch,
        updateTeamName,
        handleScoreFocus,
        handleScoreInputChange,
        handleScoreSubmit,
        handleScoreKeyPress,
        disableShowMessage
    };

    return (
        <ScoreboardContext.Provider value={value}>
            {children}
        </ScoreboardContext.Provider>
    );
};