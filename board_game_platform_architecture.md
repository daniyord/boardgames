# Board Game Platform — System Architecture

**Status:** Selected architecture
**Scope:** Multiplayer board games with web and terminal clients

## 1. Architecture Decision

The platform will use a polyglot architecture:

- **Backend:** Python + FastAPI
- **Game engine:** Python, server-authoritative
- **Database:** PostgreSQL
- **Web clients:** React + Vite + TypeScript
- **Terminal client:** Python or TypeScript
- **HTTP contract:** OpenAPI
- **TypeScript API generation:** Orval
- **Realtime communication:** WebSocket
- **Monorepo:** RushJS

FastAPI/Pydantic models are the source of truth for the HTTP API. FastAPI generates OpenAPI, and Orval generates the TypeScript API client used by the web applications.

## 2. High-Level Architecture

```text
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │    FastAPI      │
                         │                 │
                         │ REST API        │
                         │ WebSockets      │
                         │ Game Engine     │
                         └───────┬─────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
                  ▼              ▼              ▼
             React Web      Terminal       Other Client
             Clients        Client
                  │
                  │ HTTP
                  ▼
           Generated API Client
             from OpenAPI

                  WebSocket
                  ──────────
                  Client ◄────────► FastAPI
                         game events/state
```

## 3. Monorepo Structure

```text
boardgames/
├── apps/
│   ├── api/                    # Python + FastAPI
│   ├── lobby-web/              # React + Vite
│   ├── chess-web/              # React + Vite
│   ├── checkers-web/           # React + Vite
│   └── chess-cli/              # Terminal client
│
├── packages/
│   ├── api-client/             # Generated TypeScript client
│   ├── game-protocol/          # Realtime message definitions
│   └── ui/                     # Shared React components
│
├── common/
│   └── scripts/
│
├── rush.json
└── common/config/rush/
```

## 4. Backend Responsibilities

The backend will:

- expose REST endpoints for lobby and game management;
- maintain authoritative game state;
- validate every move on the server;
- expose WebSocket connections for active games;
- broadcast accepted state changes and game events;
- persist game metadata and appropriate game state/history;
- keep game rules independent from HTTP/WebSocket transport.

## 5. OpenAPI Contract

FastAPI automatically generates an OpenAPI document from Pydantic models and route definitions.

```text
Pydantic models
      │
      ▼
   FastAPI
      │
      ▼
 openapi.json
      │
      ▼
    Orval
      │
      ▼
packages/api-client
      │
      ▼
 React/Vite applications
```

Example HTTP operations:

```text
GET    /api/games
POST   /api/games
GET    /api/games/{game_id}
POST   /api/games/{game_id}/join
POST   /api/games/{game_id}/start
GET    /api/users/me
```

The generated client prevents manual duplication of API types between Python and TypeScript.

## 6. Realtime Game Protocol

OpenAPI describes the HTTP API. WebSocket messages use a separate game protocol.

Example client message:

```json
{
  "type": "make_move",
  "from": "e2",
  "to": "e4"
}
```

Example server message:

```json
{
  "type": "game_state",
  "gameId": "abc123",
  "turn": "black",
  "board": []
}
```

Typical events:

- `make_move`
- `game_state`
- `player_joined`
- `player_left`
- `game_started`
- `game_finished`
- `player_resigned`

The protocol should be explicitly versioned and validated at the server boundary.

## 7. Server-Authoritative Game Model

```text
Client
  │
  │ move request
  ▼
FastAPI/WebSocket
  │
  ▼
Game Engine
  ├── validate move
  ├── apply move
  ├── determine resulting state
  ├── detect win/draw/end conditions
  └── persist/broadcast state
  │
  ▼
All connected clients
```

The client is responsible for presentation and input, not for deciding whether a move is legal.

The server is always authoritative.

## 8. Terminal Client

A terminal application fits naturally into this architecture.

```text
FastAPI
   ▲
   │ HTTP / WebSocket
   │
chess-cli
   │
   ├── terminal rendering
   ├── keyboard/input handling
   └── API/WebSocket client
```

The terminal client uses the same backend and game engine as the web client. This avoids maintaining a second implementation of game rules.

## 9. Why Python + FastAPI

- Strong fit for game-engine and simulation logic.
- Pydantic provides explicit runtime-validated models.
- FastAPI provides automatic OpenAPI generation.
- FastAPI supports WebSockets.
- Python provides a good foundation for future AI, bots, simulations and analysis.

## 10. Why React + Vite

- Focused frontend architecture without coupling the application to a full-stack framework.
- Good fit for interactive board-game UIs.
- TypeScript provides compile-time checking.
- Multiple game frontends can share UI and API packages.

## 11. Why Not Put the Game Engine in TypeScript?

Using TypeScript everywhere would make sharing code between browser and server easier.

However, the selected architecture prioritizes a clean authoritative Python game engine. OpenAPI removes most of the friction at the HTTP boundary.

The React applications do not need to duplicate the complete game engine. They render server state and send player actions.

## 12. Build and Development Flow

1. Developer changes a FastAPI/Pydantic model.
2. FastAPI produces the updated OpenAPI schema.
3. Orval regenerates `packages/api-client`.
4. Rush builds affected TypeScript projects.
5. TypeScript compilation exposes incompatible API usage.
6. Backend tests validate game rules independently.
7. Integration tests validate HTTP/WebSocket behavior.

## 13. Testing Strategy

### Game Engine

- legal moves;
- illegal moves;
- turns;
- win/draw conditions;
- edge cases;
- deterministic state transitions.

### API

- REST endpoint tests;
- authentication;
- authorization;
- invalid requests.

### WebSocket

- joining;
- moves;
- broadcasts;
- disconnects;
- reconnection;
- game completion.

### Clients

- browser end-to-end tests;
- CLI integration tests;
- generated-client compatibility.

## 14. Security and Trust Boundaries

- Treat every client as untrusted.
- Validate all move requests on the server.
- Never accept client-supplied game state as authoritative.
- Authenticate users before joining protected games.
- Authorize players against the specific game.
- Protect game-action and WebSocket endpoints against abuse.

## 15. Persistence Model

PostgreSQL stores durable platform data.

Game records should contain information such as:

- game type;
- status;
- players;
- creation/start/end timestamps;
- lifecycle metadata.

For replay and audit requirements, store accepted moves or immutable game events in addition to the current state.

## 16. Key Architectural Decisions

| Area                  | Selected       | Reason                                    |
| --------------------- | -------------- | ----------------------------------------- |
| Backend               | FastAPI/Python | API tooling and strong game/AI foundation |
| Frontend              | React/Vite     | Focused interactive game frontend         |
| HTTP contract         | OpenAPI        | Strong typed boundary                     |
| TypeScript generation | Orval          | Generated models/client                   |
| Realtime              | WebSocket      | Natural multiplayer communication         |
| Authority             | Server         | Prevents clients deciding game outcomes   |
| Database              | PostgreSQL     | Durable platform/game data                |
| Monorepo              | RushJS         | Dependency and build orchestration        |
| Terminal              | Same backend   | No duplicated authoritative rules         |

## 17. Initial Implementation Order

1. Create the Rush monorepo and TypeScript package structure.
2. Create the FastAPI application and PostgreSQL integration.
3. Implement one complete game engine with deterministic unit tests.
4. Add REST game/lobby endpoints and OpenAPI models.
5. Add OpenAPI → TypeScript client generation.
6. Implement WebSocket game sessions and protocol.
7. Build the first React/Vite game client.
8. Build the terminal client against the same API/WebSocket endpoints.
9. Add authentication, authorization and persistence hardening.
10. Extract reusable platform services before adding additional games.

## 18. Future Extensions

- Additional games as independent game-engine modules.
- Bots and AI players.
- Game replay.
- Spectator mode.
- Matchmaking.
- Rating systems.
- Game rooms.
- Tournaments.
- Mobile or desktop clients.
- Horizontal scaling of WebSocket/game sessions when required.

## 19. Summary

The architecture separates platform concerns, transport, presentation and game rules.

**FastAPI/Python** owns authoritative game behavior and the HTTP contract. **OpenAPI + Orval** provides a typed boundary to **React/Vite**. **WebSockets** handle realtime gameplay. The same backend can serve browser, terminal and future clients.

**RushJS** organizes the TypeScript monorepo and shared frontend packages.

The key architectural principle is:

> **One authoritative game engine on the server, multiple clients around it.**
