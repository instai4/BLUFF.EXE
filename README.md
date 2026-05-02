# BLUFF — The Strategic Card Game

A real-time multiplayer card game with custom strategic rules, 3D casino aesthetic, and unique avatar characters.

---

## Architecture

```
bluff-game/
├── server.js                  # Node.js + Socket.io game server (all game logic)
├── package.json               # Dependencies
├── README.md                  # This file
└── public/                    # Static files served to clients
    ├── index.html             # Single-page app (lobby + game screens)
    ├── css/
    │   ├── style.css          # Lobby, setup, avatar, toast, responsive styles
    │   └── game.css           # 3D table, cards, player zones, animations
    └── js/
        ├── avatars.js         # 8 unique SVG character avatars (inline)
        └── game.js            # Client logic: socket, UI, state, card rendering
```

### Data Flow

```
Browser (game.js)
    │  Socket.io events (create_room, join_room, play_cards, call_bluff, pass_turn, proceed)
    ▼
server.js  ──  In-memory rooms Map
    │  Emits: game_state (personalized per player), error_msg, room_joined
    ▼
Browser (renders personalized state — each player sees only their own cards)
```

---


---

## Game Rules (Custom Strategic Version)

| Rule | Detail |
|---|---|
| Players | 2–6 |
| Cards per player | 8 (2–3 players) / 6 (4–6 players) |
| Turn order | Fixed clockwise |
| Playing cards | Place 1+ cards face-down, announce claimed rank |
| Bluff calling | **ANY** player may call bluff (not just next player) |
| Bluff caught | Liar picks up entire center pile; caller gets next turn |
| Wrong accusation | Accuser picks up center pile; normal turn order resumes |
| Passing | Costs 1 draw pile card (penalty) |
| Full set (4-of-a-kind) | Next player gets a FREE pass, no draw penalty |
| Empty draw pile | Center pile reshuffles into new draw pile |
| No cards anywhere | Free passing for everyone |
| Win condition | First player to empty their hand wins |

---

## Features

- **Real-time multiplayer** via Socket.io rooms
- **Room codes** — 6-character shareable codes
- **8 unique characters** — hand-crafted SVG avatars (Phantom, Blaze, Glacier, Shadow, Viper, Thunder, Cosmos, Titan)
- **3D felt table** — CSS perspective/rotateX table with stacked card pile
- **Fan hand layout** — cards spread in natural arc, lift on select
- **Bluff window** — any player can challenge; next player can proceed
- **Game log** — last 8 game events shown on table
- **Pass immunity** display when full set was played
- **Celebration particles** on game over
- **Host controls** — only host can start/restart game
- **Responsive** — works on mobile and desktop
- **No emojis** — Font Awesome icons throughout

---

## Technology Stack

| Layer | Tech |
|---|---|
| Server | Node.js, Express |
| Real-time | Socket.io v4 |
| Frontend | Vanilla JS (ES6+), HTML5, CSS3 |
| Icons | Font Awesome 6 |
| Fonts | Cinzel Decorative (headers), Rajdhani (body) |
| Avatars | Inline SVG (no images needed) |

---