const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// IMPORTANT FOR VERCEL
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);

const io = new Server(server, {

  cors: {
    origin: '*'
  },

  transports: ['polling'],

  pingTimeout: 60000,

  pingInterval: 25000
});

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

const RANKS = [
  'A', '2', '3', '4', '5', '6',
  '7', '8', '9', '10', 'J', 'Q', 'K'
];

const RANK_NAMES = {
  A: 'Ace',
  J: 'Jack',
  Q: 'Queen',
  K: 'King'
};

const rooms = new Map();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function rankLabel(rank) {
  return RANK_NAMES[rank] || rank;
}

function createDeck() {

  const deck = [];

  for (const suit of SUITS) {

    for (const rank of RANKS) {

      deck.push({
        suit,
        rank,
        id: `${rank}_${suit}_${Math.random()
          .toString(36)
          .slice(2, 8)}`
      });

    }

  }

  return deck;
}

function shuffle(arr) {

  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function generateRoomCode() {

  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  do {

    code = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

  } while (rooms.has(code));

  return code;
}

function createRoom(code) {

  return {

    code,

    players: [],

    gameStarted: false,

    drawPile: [],
    centerPile: [],

    currentPlayerIndex: 0,

    lastPlay: null,
    lastClaim: null,

    lockedRank: null,

    passImmunity: false,

     consecutivePasses: 0,


    bluffWindowOpen: false,

    gamePhase: 'waiting',

    winner: null,

    roundNumber: 0,

    log: [],

    message:
      'Waiting for host to start...'
  };
}

function addLog(room, msg) {

  room.log.unshift(msg);

  if (room.log.length > 20) {
    room.log.pop();
  }
}

function checkWinner(room) {

  return room.players.find(
    p => p.hand.length === 0
  ) || null;
}

function personalState(room, playerId) {

  const nextIndex =
    room.gameStarted
      ? (room.currentPlayerIndex + 1) %
      room.players.length
      : -1;

  return {

    roomCode: room.code,

    gameStarted: room.gameStarted,

    gamePhase: room.gamePhase,

    winner: room.winner,

    message: room.message,

    bluffWindowOpen: room.bluffWindowOpen,

    passImmunity: room.passImmunity,

    lockedRank: room.lockedRank,

    drawPileCount: room.drawPile.length,

    centerPileCount: room.centerPile.length,

    lastClaim: room.lastClaim,

    currentPlayerIndex:
      room.currentPlayerIndex,

    roundNumber: room.roundNumber,

    log: room.log,

    players: room.players.map((p, idx) => ({

      id: p.id,

      nickname: p.nickname,

      avatar: p.avatar,

      isHost: p.isHost,

      cardCount: p.hand.length,

      isCurrentPlayer:
        idx === room.currentPlayerIndex,

      isNextPlayer:
        idx === nextIndex,

      isMe:
        p.id === playerId,

      hand:
        p.id === playerId
          ? p.hand
          : null

    }))
  };
}

function broadcast(roomCode) {

  const room = rooms.get(roomCode);

  if (!room) return;

  for (const player of room.players) {

    const sock =
      io.sockets.sockets.get(player.id);

    if (sock) {

      sock.emit(
        'game_state',
        personalState(room, player.id)
      );

    }

  }

}

// ─────────────────────────────────────────────────────────────
// SOCKET EVENTS
// ─────────────────────────────────────────────────────────────

io.on('connection', socket => {

  console.log('CONNECTED:', socket.id);

  // ─────────────────────────
  // CREATE ROOM
  // ─────────────────────────

  socket.on(
    'create_room',
    ({ nickname, avatar }) => {

      const code = generateRoomCode();

      const room = createRoom(code);

      room.players.push({
        id: socket.id,
        nickname,
        avatar,
        isHost: true,
        hand: []
      });

      rooms.set(code, room);

      socket.join(code);

      socket.roomCode = code;

      socket.emit('room_joined', {
        roomCode: code
      });

      addLog(room, `${nickname} created room`);

      broadcast(code);
    }
  );

  // ─────────────────────────
  // JOIN ROOM
  // ─────────────────────────

  socket.on(
    'join_room',
    ({ nickname, avatar, roomCode }) => {

      const code =
        roomCode.toUpperCase().trim();

      const room = rooms.get(code);

      if (!room) {

        socket.emit('error_msg', {
          message: 'Room not found.'
        });

        return;
      }

      if (room.gameStarted) {

        socket.emit('error_msg', {
          message:
            'Game already started.'
        });

        return;
      }

      if (room.players.length >= 6) {

        socket.emit('error_msg', {
          message:
            'Room full.'
        });

        return;
      }

      if (
        room.players.find(
          p => p.nickname === nickname
        )
      ) {

        socket.emit('error_msg', {
          message:
            'Nickname already used.'
        });

        return;
      }

      room.players.push({
        id: socket.id,
        nickname,
        avatar,
        isHost: false,
        hand: []
      });

      socket.join(code);

      socket.roomCode = code;

      socket.emit('room_joined', {
        roomCode: code
      });

      addLog(room, `${nickname} joined room`);

      broadcast(code);
    }
  );

  // ─────────────────────────
  // START GAME
  // ─────────────────────────

  socket.on('start_game', () => {

    const room = rooms.get(socket.roomCode);

    if (!room) return;

    const me =
      room.players.find(
        p => p.id === socket.id
      );

    if (!me?.isHost) return;

    if (room.players.length < 2) {

      socket.emit('error_msg', {
        message:
          'Need at least 2 players.'
      });

      return;
    }

    const deck = shuffle(createDeck());

    const cardsPerPlayer =
      room.players.length <= 3
        ? 8
        : 6;

    for (const player of room.players) {

      player.hand =
        deck.splice(0, cardsPerPlayer);

    }

    Object.assign(room, {

      drawPile: deck,

      centerPile: [],

      currentPlayerIndex: 0,

      lastPlay: null,

      lastClaim: null,

      lockedRank: null,

      passImmunity: false,

      bluffWindowOpen: false,

      gameStarted: true,

      gamePhase: 'playing',

      winner: null,

      roundNumber: 0,

      log: [],

      message:
        `${room.players[0].nickname}'s turn`
    });

    addLog(
      room,
      `Game started`
    );

    broadcast(room.code);
  });

  // ─────────────────────────
  // PLAY CARDS
  // ─────────────────────────

  socket.on(
    'play_cards',
    ({ cardIds, claimedRank = null }) => {

      const room = rooms.get(socket.roomCode);

      if (
        !room ||
        !room.gameStarted ||
        room.gamePhase !== 'playing'
      ) return;

      if (room.bluffWindowOpen) {

        socket.emit('error_msg', {
          message: 'Resolve bluff first.'
        });

        return;
      }

      const currentPlayer =
        room.players[room.currentPlayerIndex];

      if (currentPlayer.id !== socket.id) {

        socket.emit('error_msg', {
          message: 'Not your turn.'
        });

        return;
      }

      if (room.lockedRank) {
        claimedRank = room.lockedRank;
      }

      if (!claimedRank) {

        socket.emit('error_msg', {
          message: 'Select rank.'
        });

        return;
      }

      const uniqueIds =
        [...new Set(cardIds)];

      const cards =
        currentPlayer.hand.filter(
          c => uniqueIds.includes(c.id)
        );

      if (
        cards.length !== uniqueIds.length
      ) {

        socket.emit('error_msg', {
          message: 'Invalid cards.'
        });

        return;
      }

      currentPlayer.hand =
        currentPlayer.hand.filter(
          c => !uniqueIds.includes(c.id)
        );

      room.centerPile.push(...cards);

      const isFullSet =

        uniqueIds.length === 4 &&

        cards.every(
          c => c.rank === claimedRank
        );

      room.lastPlay = {

        playerId: socket.id,

        playerNickname:
          currentPlayer.nickname,

        claimedRank,

        claimedCount:
          uniqueIds.length,

        actualCards: cards,

        isFullSet
      };

      room.lastClaim = {

        playerNickname:
          currentPlayer.nickname,

        claimedRank,

        claimedCount:
          uniqueIds.length
      };

      room.lockedRank =
  claimedRank;

// RESET PASS COUNTER
room.consecutivePasses = 0;

room.bluffWindowOpen = true;

      room.passImmunity =
        isFullSet;

      room.message =
        `${currentPlayer.nickname} played ${uniqueIds.length} card(s)`;

      addLog(room, room.message);

      broadcast(room.code);
    }
  );

  // ─────────────────────────
  // CALL BLUFF
  // ─────────────────────────

  socket.on('call_bluff', () => {

    const room = rooms.get(socket.roomCode);

    if (!room || !room.bluffWindowOpen) return;

    const caller =
      room.players.find(
        p => p.id === socket.id
      );

    if (!caller) return;

    if (
      caller.id === room.lastPlay.playerId
    ) {

      socket.emit('error_msg', {
        message:
          'Cannot bluff your own play.'
      });

      return;
    }

    room.bluffWindowOpen = false;

    const {
      actualCards,
      claimedRank,
      playerNickname,
      playerId,
      isFullSet
    } = room.lastPlay;

    const wasBluff =
      actualCards.some(
        c => c.rank !== claimedRank
      );

    const playedPlayer =
      room.players.find(
        p => p.id === playerId
      );

    room.lockedRank = null;
    room.lastPlay = null;

    // PLAYER LIED

    if (wasBluff) {

      playedPlayer.hand.push(
        ...room.centerPile
      );

      room.centerPile = [];

      room.currentPlayerIndex =
        room.players.findIndex(
          p => p.id === caller.id
        );

      room.message =
        `${playerNickname} was bluffing!`;

      addLog(room, room.message);
    }

    // PLAYER WAS HONEST

    else {

      caller.hand.push(
        ...room.centerPile
      );

      room.centerPile = [];

      room.currentPlayerIndex =
        room.players.findIndex(
          p => p.id === playerId
        );

      room.passImmunity =
        isFullSet;

      room.message =
        `${caller.nickname} called wrong bluff!`;

      addLog(room, room.message);
    }

    const winner = checkWinner(room);

    if (winner) {

      room.gamePhase = 'ended';

      room.winner =
        winner.nickname;

      room.message =
        `${winner.nickname} wins!`;

      addLog(
        room,
        `${winner.nickname} won the game`
      );
    }

    broadcast(room.code);
  });

  // ─────────────────────────
  // PROCEED
  // ─────────────────────────

  socket.on('proceed', () => {

    const room =
      rooms.get(socket.roomCode);

    if (
      !room ||
      !room.bluffWindowOpen
    ) return;

    const nextIndex =
      (
        room.currentPlayerIndex + 1
      ) % room.players.length;

    const nextPlayer =
      room.players[nextIndex];

    if (
      nextPlayer.id !== socket.id
    ) {

      socket.emit('error_msg', {
        message:
          'Only next player can proceed.'
      });

      return;
    }

    room.bluffWindowOpen = false;

    const prevPlayer =
      room.players[room.currentPlayerIndex];

    if (
      prevPlayer.hand.length === 0
    ) {

      room.gamePhase = 'ended';

      room.winner =
        prevPlayer.nickname;

      room.message =
        `${prevPlayer.nickname} wins!`;

      addLog(room, room.message);

      broadcast(room.code);

      return;
    }

    room.currentPlayerIndex =
      nextIndex;

    room.message =
      `${nextPlayer.nickname}'s turn`;

    addLog(
      room,
      `${nextPlayer.nickname}'s turn`
    );

    broadcast(room.code);
  });

  // ─────────────────────────
  // PASS TURN
  // ─────────────────────────

socket.on('pass_turn', () => {

  const room = rooms.get(socket.roomCode);

  if (!room || !room.gameStarted) return;

  // CANNOT PASS
  // DURING BLUFF WINDOW

  if (room.bluffWindowOpen) return;

  // CANNOT PASS
  // BEFORE FIRST PLAY

  if (!room.lockedRank) {

    socket.emit('error_msg', {
      message:
        'Cannot pass before first play.'
    });

    return;
  }

    const cur =
      room.players[room.currentPlayerIndex];

    if (cur.id !== socket.id) return;

    let drawnCard = null;

    if (room.passImmunity) {

      room.passImmunity = false;
    }

    else if (room.drawPile.length > 0) {

      drawnCard = room.drawPile.pop();

      cur.hand.push(drawnCard);
    }

    else if (room.centerPile.length > 0) {

      room.drawPile =
        shuffle([...room.centerPile]);

      room.centerPile = [];

      drawnCard = room.drawPile.pop();

      cur.hand.push(drawnCard);
    }

    // SAME RANK BONUS TURN

    const sameRankBonus =
      drawnCard &&
      room.lockedRank &&
      drawnCard.rank === room.lockedRank;

    if (sameRankBonus) {

      room.message =
        `${cur.nickname} drew matching rank and plays again!`;

      addLog(room, room.message);

      broadcast(room.code);

      return;
    }

   room.consecutivePasses++;

const previousIndex =
  room.currentPlayerIndex;

room.currentPlayerIndex =
  (room.currentPlayerIndex + 1)
  % room.players.length;

const next =
  room.players[room.currentPlayerIndex];

// ─────────────────────────────
// CHECK IF ROUND RETURNED
// TO ORIGINAL PLAYER
// ─────────────────────────────

const roundReturnedToStarter =
  room.currentPlayerIndex ===
  room.players.findIndex(
    p =>
      p.id === room.lastPlay?.playerId
  );

if (
  roundReturnedToStarter &&
  room.consecutivePasses >=
    room.players.length - 1
) {

  const starter =
    room.players[room.currentPlayerIndex];

  const hasLockedRank =
    starter.hand.some(
      c => c.rank === room.lockedRank
    );

  // PLAYER HAS NO MATCHING CARD
  // RESET ROUND

  if (!hasLockedRank) {

    room.drawPile.push(
      ...room.centerPile
    );

    room.drawPile =
      shuffle(room.drawPile);

    room.centerPile = [];

    room.lockedRank = null;

    room.lastPlay = null;

    room.lastClaim = null;

    room.consecutivePasses = 0;

    room.message =
      `${starter.nickname} starts a new round`;

    addLog(room, room.message);

    broadcast(room.code);

    return;
  }
}

room.message =
  `${cur.nickname} passed — ${next.nickname}'s turn`;

addLog(room, room.message);

broadcast(room.code);
  });

  // ─────────────────────────
  // RESTART GAME
  // ─────────────────────────

  socket.on('restart_game', () => {

    const room =
      rooms.get(socket.roomCode);

    if (!room) return;

    const me =
      room.players.find(
        p => p.id === socket.id
      );

    if (!me?.isHost) return;

    const deck =
      shuffle(createDeck());

    const cardsPerPlayer =
      room.players.length <= 3
        ? 8
        : 6;

    for (const player of room.players) {

      player.hand =
        deck.splice(0, cardsPerPlayer);

    }

    Object.assign(room, {

      drawPile: deck,

      centerPile: [],

      currentPlayerIndex: 0,

      lastPlay: null,

      lastClaim: null,

      lockedRank: null,

      passImmunity: false,

      bluffWindowOpen: false,

      gameStarted: true,

      gamePhase: 'playing',

      winner: null,

      roundNumber: 0,

      log: [],

      message:
        `${room.players[0].nickname}'s turn`
    });

    addLog(room, 'Game restarted');

    broadcast(room.code);
  });

  // ─────────────────────────
  // DISCONNECT
  // ─────────────────────────

  socket.on('disconnect', () => {

    const code =
      socket.roomCode;

    if (!code) return;

    const room =
      rooms.get(code);

    if (!room) return;

    const idx =
      room.players.findIndex(
        p => p.id === socket.id
      );

    if (idx === -1) return;

    const leaving =
      room.players[idx];

    addLog(
      room,
      `${leaving.nickname} disconnected`
    );

    room.players.splice(idx, 1);

    if (room.players.length === 0) {

      rooms.delete(code);

      return;
    }

    if (
      !room.players.find(
        p => p.isHost
      )
    ) {

      room.players[0].isHost = true;
    }

    if (
      room.currentPlayerIndex >=
      room.players.length
    ) {

      room.currentPlayerIndex = 0;
    }

    broadcast(code);
  });

});

// ─────────────────────────────────────────────────────────────
// EXPORT FOR VERCEL
// ─────────────────────────────────────────────────────────────

module.exports = server;

// ─────────────────────────────────────────────────────────────
// LOCALHOST RUN
// ─────────────────────────────────────────────────────────────

if (require.main === module) {

  const PORT =
    process.env.PORT || 3000;

  server.listen(PORT, () => {

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Bluff Card Game Server
 Running on:
 http://localhost:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  });

}