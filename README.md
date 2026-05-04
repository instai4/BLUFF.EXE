# BLUFF.EXE

## Overview

BLUFF.EXE is a modern real-time multiplayer bluff card game built for the browser using WebSockets, WebRTC voice communication, and Progressive Web App technologies.

The project recreates the classic bluff gameplay experience in an immersive online multiplayer environment featuring live rooms, animated gameplay, interactive UI systems, integrated voice chat, responsive design, and real-time game synchronization.

The application focuses on delivering a competitive and social multiplayer experience while maintaining low-latency communication and smooth gameplay across desktop and mobile devices.

BLUFF.EXE combines multiplayer networking, real-time game state management, browser-based voice communication, and modern frontend systems into a complete interactive gaming platform.

---

# Objectives

The primary objectives of the project are:

- Build a fully synchronized multiplayer bluff card game
- Provide real-time gameplay using WebSockets
- Support integrated browser-based voice communication
- Create a responsive and immersive game interface
- Implement scalable multiplayer room systems
- Deliver smooth gameplay animations and interactions
- Support Progressive Web App functionality
- Simulate a modern online social card game environment

---

# Core Features

## Real-Time Multiplayer Gameplay

The game supports live multiplayer sessions where players can:

- Create private rooms
- Join existing rooms using room codes
- Play simultaneously in real time
- Interact with synchronized game states
- Experience instant gameplay updates

The multiplayer system ensures all player actions are synchronized across connected clients with minimal latency.

---

## Bluff Card Mechanics

The gameplay system includes:

- Card selection
- Rank claiming
- Bluff detection
- Turn-based gameplay
- Passing mechanics
- Bluff challenge system
- Penalty handling
- Round progression
- Victory detection

Players strategically attempt to deceive opponents while avoiding being exposed during bluff calls.

---

## Live Voice Chat Integration

BLUFF.EXE includes integrated WebRTC-based voice communication allowing players to:

- Join voice sessions
- Mute and unmute microphones
- Communicate during gameplay
- Experience low-latency voice streaming
- Participate in social multiplayer sessions

The voice system operates directly in the browser without external applications.

---

## Room Management System

The platform includes a room-based multiplayer architecture supporting:

- Private game rooms
- Unique room codes
- Host controls
- Lobby management
- Player synchronization
- Real-time room updates

Hosts can control game flow and manage multiplayer sessions dynamically.

---

## Interactive Game Interface

The frontend includes a fully animated modern user interface featuring:

- Dynamic card rendering
- Interactive card fan layout
- Animated transitions
- Player status indicators
- Turn highlighting
- Live notifications
- Round banners
- Game overlays
- Responsive layouts

The UI is designed to provide clarity and immersion during gameplay.

---

## Avatar System

Players can choose custom avatars before entering multiplayer sessions.

Features include:

- Avatar selection interface
- Visual player identity system
- Avatar rendering during gameplay
- Player recognition support

The avatar system improves multiplayer interaction and room visualization.

---

## Bluff Window System

The game includes a dedicated bluff decision phase where players can:

- Challenge suspicious plays
- Continue the round
- Analyze previous claims
- React strategically to opponents

The bluff window creates tension and strategic decision-making during gameplay.

---

## Real-Time Game Logs

The platform maintains a synchronized live game log displaying:

- Player actions
- Bluff calls
- Round events
- Penalty actions
- Victory announcements
- Gameplay progression

The log provides transparency and improves multiplayer awareness.

---

## Progressive Web App Support

BLUFF.EXE supports Progressive Web App functionality allowing:

- Installation on desktop devices
- Installation on mobile devices
- Standalone application behavior
- Offline asset caching
- Native-style experience

The PWA system improves accessibility and usability across platforms.

---

# Technical Architecture

The project follows a real-time client-server multiplayer architecture.

---

# Frontend System

The frontend handles:

- User interface rendering
- Card animations
- Real-time updates
- Voice controls
- Lobby systems
- Game interactions
- Responsive layouts

Core technologies:

- HTML5
- CSS3
- JavaScript
- WebRTC
- Socket.IO Client

---

# Backend System

The backend manages:

- Room creation
- Multiplayer synchronization
- Game logic
- Turn validation
- Bluff resolution
- Player state management
- WebSocket communication

Core technologies:

- Node.js
- Express.js
- Socket.IO

---

# Networking System

The multiplayer communication system uses WebSockets for:

- Instant gameplay updates
- Real-time room synchronization
- Low-latency event broadcasting
- Player action handling
- Live multiplayer communication

The networking architecture supports scalable multiplayer interactions.

---

# Voice Communication System

The integrated voice system is powered by WebRTC.

Capabilities include:

- Browser-to-browser audio streaming
- Microphone controls
- Real-time voice communication
- Peer connection management
- Voice session synchronization

The system allows natural social interaction during gameplay.

---

# Gameplay Flow

## Lobby Phase

Players:
- Choose avatars
- Enter nicknames
- Create or join rooms
- Wait for participants
- Prepare for match start

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