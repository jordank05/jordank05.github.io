import { type ReactNode, useEffect, useReducer } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import SalvageGame, { type GameOutcome } from '@/components/SalvageGame';
import NotFound from '@/pages/not-found';
import { GAME_MODES, type GameModeId } from './gameModes';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [game, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    if (game.outcome !== 'playing') return;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(timer);
  }, [game.outcome]);

  return (
    <SalvageGame
      active={game.outcome === 'playing'}
      outcome={game.outcome}
      score={game.score}
      cores={game.cores}
      lives={game.lives}
      timeRemaining={game.timeRemaining}
      resetKey={game.resetKey}
      mode={game.mode}
      onStart={() => dispatch({ type: 'start' })}
      onRestart={() => dispatch({ type: 'start' })}
      onModeChange={(mode) => dispatch({ type: 'selectMode', mode })}
      onCoreCollected={() => dispatch({ type: 'collect' })}
      onHazardHit={() => dispatch({ type: 'hit' })}
    />
  );
}

type GameState = {
  outcome: GameOutcome;
  score: number;
  cores: number;
  lives: number;
  timeRemaining: number;
  resetKey: number;
  mode: GameModeId;
};

type GameAction =
  | { type: 'start' }
  | { type: 'tick' }
  | { type: 'collect' }
  | { type: 'hit' }
  | { type: 'selectMode'; mode: GameModeId };

const initialGameState: GameState = {
  outcome: 'ready',
  score: 0,
  cores: 0,
  lives: 3,
  timeRemaining: 90,
  resetKey: 0,
  mode: 'easy',
};

function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'selectMode') {
    if (state.outcome === 'playing') return state;
    return { ...state, mode: action.mode, timeRemaining: GAME_MODES[action.mode].timeLimit };
  }

  if (action.type === 'start') {
    return {
      outcome: 'playing',
      score: 0,
      cores: 0,
      lives: 3,
      timeRemaining: GAME_MODES[state.mode].timeLimit,
      resetKey: state.resetKey + 1,
      mode: state.mode,
    };
  }

  if (state.outcome !== 'playing') return state;

  if (action.type === 'tick') {
    const timeRemaining = Math.max(0, state.timeRemaining - 1);
    return { ...state, timeRemaining, outcome: timeRemaining === 0 ? 'lost' : 'playing' };
  }

  if (action.type === 'collect') {
    const cores = Math.min(8, state.cores + 1);
    return {
      ...state,
      cores,
      score: state.score + 100,
      outcome: cores === 8 && GAME_MODES[state.mode].canWin ? 'won' : 'playing',
    };
  }

  const lives = Math.max(0, state.lives - 1);
  return { ...state, lives, outcome: lives === 0 ? 'lost' : 'playing' };
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
