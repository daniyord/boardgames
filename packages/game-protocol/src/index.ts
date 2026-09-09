/**
 * Realtime message definitions shared between the FastAPI backend and every
 * TypeScript client. This is a separate protocol from the OpenAPI HTTP contract.
 */

export type ClientMessage = MakeMoveMessage | PlayerResignedMessage;

// 
export interface MakeMoveMessage {
  type: 'make_move';
  from: string;
  to: string;
}

export interface PlayerResignedMessage {
  type: 'player_resigned';
}

export type ServerMessage =
  | GameStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartedMessage
  | GameFinishedMessage;

export interface GameStateMessage {
  type: 'game_state';
  gameId: string;
  turn: string;
  board: unknown[];
}

export interface PlayerJoinedMessage {
  type: 'player_joined';
  gameId: string;
  playerId: string;
}

export interface PlayerLeftMessage {
  type: 'player_left';
  gameId: string;
  playerId: string;
}

export interface GameStartedMessage {
  type: 'game_started';
  gameId: string;
}

export interface GameFinishedMessage {
  type: 'game_finished';
  gameId: string;
  result: string;
}

/** Bump whenever a breaking change is made to the message shapes above. */
export const GAME_PROTOCOL_VERSION = 1;
