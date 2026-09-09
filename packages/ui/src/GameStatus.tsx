export interface GameStatusProps {
  turn: string;
  status: 'waiting' | 'in_progress' | 'finished';
}

/** Placeholder shared component; real board-game UI components land here. */
export function GameStatus({ turn, status }: GameStatusProps) {
  return <span data-status={status}>Turn: {turn}</span>;
}
