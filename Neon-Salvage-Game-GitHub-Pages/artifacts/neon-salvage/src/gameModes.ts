export type GameModeId = 'easy' | 'hard' | 'super-hard' | 'impossible';

export type GameModeConfig = {
  id: GameModeId;
  label: string;
  timeLimit: number;
  droneCount: number;
  patrolSpeed: number;
  summary: string;
  canWin: boolean;
};

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    timeLimit: 90,
    droneCount: 3,
    patrolSpeed: 0.42,
    summary: '90 SEC · 3 DRONES',
    canWin: true,
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    timeLimit: 60,
    droneCount: 5,
    patrolSpeed: 0.66,
    summary: '60 SEC · 5 DRONES',
    canWin: true,
  },
  'super-hard': {
    id: 'super-hard',
    label: 'SUPER HARD',
    timeLimit: 45,
    droneCount: 7,
    patrolSpeed: 1.02,
    summary: '45 SEC · 7 FAST DRONES',
    canWin: true,
  },
  impossible: {
    id: 'impossible',
    label: 'IMPOSSIBLE',
    timeLimit: 15,
    droneCount: 12,
    patrolSpeed: 1.65,
    summary: '15 SEC · 12 DRONES · NO WIN',
    canWin: false,
  },
};

export const MAX_DRONE_COUNT = Math.max(...Object.values(GAME_MODES).map(({ droneCount }) => droneCount));
