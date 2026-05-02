/* ═══════════════════════════════════════════════════════════════════════════
   BLUFF CARD GAME — Client Script
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── State ─────────────────────────────────────────────────────────────────────
const State = {
  socket: null,
  roomCode: null,
  myNickname: null,
  myAvatar: null,
  selectedAvatar: null,
  selectedCards: new Set(),   // card IDs
  gameState: null,
  isMyTurn: false,
};

// ─── Suit symbols & colors ─────────────────────────────────────────────────────
const SUIT_SYMBOL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_COLOR = { spades: 'black', hearts: 'red', diamonds: 'red', clubs: 'black' };

// ─── Player zone positions (% of container) for 2-6 players ───────────────────
// Each entry: array of {top,left} in %, length = number-of-players
// Position 0 = bottom center (self rendered separately in hand), so these
// are the OPPONENTS positioned around the table.
// We'll position ALL players including self in the ring, but "me" is also
// shown in the hand area.
const ZONE_POSITIONS = {
  1: [{ top: 8, left: 50 }],
  2: [{ top: 8, left: 30 }, { top: 8, left: 70 }],
  3: [{ top: 6, left: 20 }, { top: 6, left: 50 }, { top: 6, left: 80 }],
  4: [{ top: 6, left: 20 }, { top: 6, left: 50 }, { top: 6, left: 80 }, { top: 75, left: 80 }],
  5: [{ top: 6, left: 15 }, { top: 6, left: 40 }, { top: 6, left: 65 }, { top: 6, left: 88 }, { top: 75, left: 88 }],
};

// ─── DOM Refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Utilities ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'error') {
  const t = document.createElement('div');
  t.className = `toast${type === 'success' ? ' success' : ''}`;
  t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'triangle-exclamation'}"></i> ${msg}`;
  $('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Room code copied!', 'success'));
}

function spawnParticles(x, y) {
  const symbols = ['♠', '♥', '♦', '♣', '★'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = (x + (Math.random() - 0.5) * 120) + 'px';
    p.style.top = (y - 60 + (Math.random() - 0.5) * 60) + 'px';
    p.style.color = ['#d4af37', '#e63946', '#22c55e', '#7c3aed'][Math.floor(Math.random() * 4)];
    p.style.animationDelay = (Math.random() * 0.4) + 's';
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

// ─── LOBBY — Avatar Grid ───────────────────────────────────────────────────────
function buildAvatarGrid() {
  const grid = $('avatarGrid');
  grid.innerHTML = '';
  AVATARS.forEach(av => {
    const div = document.createElement('div');
    div.className = 'avatar-option';
    div.dataset.id = av.id;
    div.innerHTML = `
      <div class="avatar-svg-wrap">${av.svg}</div>
      <span class="avatar-name">${av.name}</span>`;
    div.addEventListener('click', () => selectAvatar(av.id));
    grid.appendChild(div);
  });
  // Auto-select first
  selectAvatar(AVATARS[0].id);
}

function selectAvatar(id) {
  State.selectedAvatar = id;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
}

function getAvatarSvg(id) {
  return (AVATARS.find(a => a.id === id) || AVATARS[0]).svg;
}

function getAvatarColor(id) {
  return (AVATARS.find(a => a.id === id) || AVATARS[0]).color;
}

// ─── LOBBY — Room Lobby Panel ──────────────────────────────────────────────────
function showRoomLobby(code) {
  $('setupPanel').style.display = 'none';
  $('roomLobby').style.display = 'block';
  $('displayRoomCode').textContent = code;
  State.roomCode = code;
}

function hideRoomLobby() {
  $('setupPanel').style.display = '';
  $('roomLobby').style.display = 'none';
}

function renderRoomLobbyPlayers(players) {
  const wrap = $('playersWaiting');
  wrap.innerHTML = '';
  players.forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    slot.innerHTML = `
      <div class="slot-avatar">${getAvatarSvg(p.avatar)}</div>
      <div class="slot-name">${escHtml(p.nickname)}</div>
      ${p.isHost ? '<div class="slot-badge"><i class="fa-solid fa-crown"></i> Host</div>' : ''}
      ${p.id === State.socket.id ? '<div class="slot-badge">You</div>' : ''}`;
    wrap.appendChild(slot);
  });
  // Empty slots (up to 6)
  for (let i = players.length; i < 6; i++) {
    const slot = document.createElement('div');
    slot.className = 'player-slot empty-slot';
    slot.innerHTML = `<i class="fa-regular fa-circle-user"></i><span>Waiting...</span>`;
    wrap.appendChild(slot);
  }

  // Show/hide start button
  const isHost = players.find(p => p.id === State.socket.id)?.isHost;
  $('startGameBtn').style.display = isHost ? '' : 'none';
  $('waitingMsg').textContent = players.length < 2
    ? 'Need at least 2 players to start...'
    : isHost ? `${players.length} player${players.length > 1 ? 's' : ''} ready — start when set!`
      : `${players.length} player${players.length > 1 ? 's' : ''} in room — waiting for host...`;
}

// ─── HTML escape ───────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SOCKET.IO Setup ───────────────────────────────────────────────────────────
function initSocket() {
  State.socket = io(window.location.origin, {
  transports: ['websocket', 'polling']
});

  State.socket.on('connect', () => {
    console.log('Connected:', State.socket.id);
  });

  State.socket.on('room_joined', ({ roomCode }) => {
    State.roomCode = roomCode;
    showRoomLobby(roomCode);
  });

  State.socket.on('error_msg', ({ message }) => {
    showToast(message);
  });

  State.socket.on('game_state', (gs) => {
    State.gameState = gs;
    handleGameState(gs);
  });

  State.socket.on('disconnect', () => {
    showToast('Disconnected from server. Please refresh.');
  }); 
}

// ─── Validate lobby inputs ─────────────────────────────────────────────────────
function validateLobbyInputs() {
  const nick = $('nicknameInput').value.trim();
  if (!nick) { showToast('Please enter your alias first.'); return null; }
  if (nick.length < 2) { showToast('Alias must be at least 2 characters.'); return null; }
  if (!State.selectedAvatar) { showToast('Please select a character.'); return null; }
  return { nickname: nick, avatar: State.selectedAvatar };
}

// ─── LOBBY Bindings ────────────────────────────────────────────────────────────
function bindLobby() {
  // Create Room
  $('createRoomBtn').addEventListener('click', () => {
    const data = validateLobbyInputs();
    if (!data) return;
    State.myNickname = data.nickname;
    State.myAvatar = data.avatar;
    State.socket.emit('create_room', data);
  });

  // Show Join
  $('showJoinBtn').addEventListener('click', () => {
    $('joinSection').classList.toggle('visible');
    $('showJoinBtn').innerHTML = $('joinSection').classList.contains('visible')
      ? '<i class="fa-solid fa-xmark"></i> Cancel'
      : '<i class="fa-solid fa-door-open"></i> Join Room';
  });

  // Join Room
  $('joinRoomBtn').addEventListener('click', joinRoom);
  $('roomCodeInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });

  // Start Game
  $('startGameBtn').addEventListener('click', () => {
    State.socket.emit('start_game');
  });

  // Leave Room
  $('leaveRoomBtn').addEventListener('click', () => {
    location.reload();
  });

  // Copy room code
  $('displayRoomCode').addEventListener('click', () => {
    copyToClipboard($('displayRoomCode').textContent.trim());
  });

  // Rules toggle
  $('rulesToggle').addEventListener('click', () => {
    const body = $('rulesBody');
    body.classList.toggle('open');
    $('rulesChevron').style.transform = body.classList.contains('open') ? 'rotate(180deg)' : '';
  });
}

function joinRoom() {
  const data = validateLobbyInputs();
  if (!data) return;
  const code = $('roomCodeInput').value.trim().toUpperCase();
  if (code.length !== 6) { showToast('Room code must be 6 characters.'); return; }
  State.myNickname = data.nickname;
  State.myAvatar = data.avatar;
  State.socket.emit('join_room', { ...data, roomCode: code });
}

// ─── GAME SCREEN Bindings ──────────────────────────────────────────────────────
function bindGame() {
  $('copyCodeBtn').addEventListener('click', () => copyToClipboard(State.roomCode));
  $('toggleLogBtn').addEventListener('click', () => {
    $('gameLog').style.display = $('gameLog').style.display === 'none' ? '' : 'none';
  });

  $('callBluffBtn').addEventListener('click', () => {
    State.socket.emit('call_bluff');
  });

  $('proceedBtn').addEventListener('click', () => {
    State.socket.emit('proceed');
  });

  $('playCardsBtn').addEventListener('click', () => {

    if (State.selectedCards.size === 0) {

      showToast('Select at least one card.');

      return;
    }

    // ─────────────────────────
    // AUTO LOCKED RANK
    // ─────────────────────────

    let claimedRank = null;

    // If locked rank exists,
    // don't require selector

    if (!State.gameState.lockedRank) {

      const select =
        document.getElementById('rankSelect');

      claimedRank = select?.value;

      if (!claimedRank) {

        showToast('Select a rank first.');

        return;
      }
    }

    State.socket.emit('play_cards', {

      cardIds: [...State.selectedCards],

      claimedRank
    });

    State.selectedCards.clear();
  });

  $('passBtn').addEventListener('click', () => {
    State.socket.emit('pass_turn');
  });

  $('restartBtn').addEventListener('click', () => {
    State.socket.emit('restart_game');
    $('gameOverOverlay').classList.remove('active');
  });

  $('quitBtn').addEventListener('click', () => {
    location.reload();
  });
}

// ─── HANDLE GAME STATE ─────────────────────────────────────────────────────────
function handleGameState(gs) {
  // If game just started, switch to game screen
  if (gs.gameStarted && $('lobby').style.display !== 'none') {
    switchToGame();
  }

  // If still in lobby, update waiting list
  if (!gs.gameStarted) {
    renderRoomLobbyPlayers(gs.players);
    return;
  }

  // ── Update game screen ──
  const me = gs.players.find(p => p.isMe);
  State.isMyTurn = me && gs.players[gs.currentPlayerIndex]?.isMe;

  updateHeader(gs);
  renderStatusBanner(gs);
  renderDrawPileInfo(gs);
  renderCenterPile(gs);
  renderPlayersRing(gs);
  renderMyHand(gs, me);
  renderBluffWindow(gs, me);
  renderGameLog(gs);

  if (gs.gamePhase === 'ended' && gs.winner) {
    showGameOver(gs);
  }
}

// ─── Switch Screens ────────────────────────────────────────────────────────────
function switchToGame() {
  $('lobby').style.display = 'none';
  $('game-app').style.display = 'flex';
  $('headerRoomCode').textContent = State.roomCode;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function updateHeader(gs) {
  $('headerRoomCode').textContent = gs.roomCode;
  $('headerPlayerCount').textContent = gs.players.length;
}

// ─── Status Banner ─────────────────────────────────────────────────────────────
function renderStatusBanner(gs) {
  $('statusBanner').textContent = gs.message || '...';
}

// ─── Draw Pile Info ────────────────────────────────────────────────────────────
function renderDrawPileInfo(gs) {
  $('drawPileCount').textContent = gs.drawPileCount;
  $('centerPileCount').textContent = gs.centerPileCount;
}

// ─── Center Pile ───────────────────────────────────────────────────────────────
function renderCenterPile(gs) {
  const stack = $('pileStack');
  const claimDisp = $('claimDisplay');

  if (gs.centerPileCount === 0) {
    stack.innerHTML = `<div class="pile-empty"><i class="fa-regular fa-rectangle-list"></i></div>`;
    claimDisp.style.display = 'none';
    return;
  }

  // Show stacked card backs
  const count = Math.min(gs.centerPileCount, 3);
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `<div class="pile-card"></div>`;
  }
  if (gs.centerPileCount > 0) {
    html += `<div class="pile-count-badge">${gs.centerPileCount}</div>`;
  }
  stack.innerHTML = html;

  if (gs.lastClaim) {
    claimDisp.style.display = '';
    const rankNames = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
    const r = gs.lastClaim.claimedRank;
    const rDisplay = rankNames[r] || r;
    $('claimValue').textContent = `${gs.lastClaim.claimedCount} × ${rDisplay}`;
    $('claimValue').dataset.player = gs.lastClaim.playerNickname;
  } else {
    claimDisp.style.display = 'none';
  }
}

// ─── Players Ring (around table) ──────────────────────────────────────────────
function renderPlayersRing(gs) {
  const ring = $('playersRing');
  ring.innerHTML = '';

  const players = gs.players;
  const total = players.length;
  const me = players.find(p => p.isMe);
  const myIdx = players.findIndex(p => p.isMe);

  // Reorder so 'me' is last (shown at bottom conceptually)
  // Build order: others first, me last
  const ordered = [];
  for (let i = 1; i < total; i++) {
    ordered.push(players[(myIdx + i) % total]);
  }

  // Opponent count = total - 1
  const oppCount = ordered.length;
  const positions = getPositions(oppCount, total);

  ordered.forEach((p, i) => {
    const pos = positions[i];
    const zone = document.createElement('div');
    zone.className = `player-zone${p.isCurrentPlayer ? ' current-turn' : ''}`;
    zone.style.left = pos.left + '%';
    zone.style.top = pos.top + '%';

    const miniCards = Math.min(p.cardCount, 6);
    let miniHtml = '';
    for (let c = 0; c < miniCards; c++) miniHtml += '<div class="mini-card"></div>';

    zone.innerHTML = `
      <div class="player-avatar-wrap" style="position:relative;">
        ${p.isHost ? '<div class="host-crown"><i class="fa-solid fa-crown"></i></div>' : ''}
        ${getAvatarSvg(p.avatar)}
      </div>
      <div class="player-name-tag" style="border-color:${getAvatarColor(p.avatar)}40;">${escHtml(p.nickname)}</div>
      <div class="player-card-count">
        <i class="fa-solid fa-layer-group"></i> ${p.cardCount} cards
      </div>
      <div class="mini-cards">${miniHtml}</div>`;
    ring.appendChild(zone);
  });

  // Render "me" zone at bottom (inside ring, but won't overlap hand)
  if (me) {
    const meZone = document.createElement('div');
    meZone.className = `player-zone${me.isCurrentPlayer ? ' current-turn' : ''}`;
    meZone.style.left = '50%';
    meZone.style.top = '90%';
    meZone.innerHTML = `
      <div class="player-avatar-wrap" style="position:relative;border-color:${getAvatarColor(me.avatar)}80;">
        ${me.isHost ? '<div class="host-crown"><i class="fa-solid fa-crown"></i></div>' : ''}
        ${getAvatarSvg(me.avatar)}
      </div>
      <div class="you-badge">You</div>`;
    ring.appendChild(meZone);
  }
}

function getPositions(oppCount, total) {
  // Positions for opponents around the top arc of the table
  if (oppCount === 0) return [];
  if (oppCount === 1) return [{ top: 6, left: 50 }];
  if (oppCount === 2) return [{ top: 6, left: 28 }, { top: 6, left: 72 }];
  if (oppCount === 3) return [{ top: 6, left: 18 }, { top: 6, left: 50 }, { top: 6, left: 82 }];
  if (oppCount === 4) return [{ top: 6, left: 15 }, { top: 6, left: 38 }, { top: 6, left: 62 }, { top: 6, left: 85 }];
  return [{ top: 6, left: 12 }, { top: 6, left: 30 }, { top: 6, left: 50 }, { top: 6, left: 70 }, { top: 6, left: 88 }];
}

// ─── My Hand ───────────────────────────────────────────────────────────────────
function renderMyHand(gs, me) {

  if (!me) return;

  // Update small avatar in hand bar
  const sm = $('myAvatarSmall');

  sm.innerHTML =
    getAvatarSvg(me.avatar);

  $('myNameLabel').textContent =
    me.nickname;

  $('myCardCount').textContent =
    me.cardCount;

  const isMyTurn =
    me.isCurrentPlayer;

  const bluffOpen =
    gs.bluffWindowOpen;

  const handLocked =
    !isMyTurn || bluffOpen;

  // Render cards
  renderCardsFan(
    me.hand || [],
    handLocked,
    gs
  );

  // ───────────────────────
  // PASS BUTTON
  // ───────────────────────

  const passBtn =
    $('passBtn');

  // PASS ONLY ALLOWED
  // AFTER ROUND STARTS

  const canPass =

    !handLocked &&

    gs.lockedRank;

  passBtn.disabled =
    !canPass;

  if (
    gs.passImmunity &&
    isMyTurn &&
    !bluffOpen
  ) {

    passBtn.classList.add(
      'immunity'
    );

    passBtn.title =
      'Free pass — immunity from full set!';

  } else {

    passBtn.classList.remove(
      'immunity'
    );

    passBtn.title = '';
  }

  // Waiting indicator
  $('waitingIndicator').style.display =
    handLocked ? 'flex' : 'none';
}

// ─── Cards Fan Renderer ─────────────────────────────────────────────────────────
function renderCardsFan(hand, locked, gs) {
  const fan = $('cardsFan');
  fan.innerHTML = '';

  if (!hand || hand.length === 0) {
    fan.innerHTML = `<div style="color:var(--text-secondary);font-size:0.85rem;letter-spacing:0.1em;">No cards in hand</div>`;
    $('playCardsBtn').disabled = true;
    $('rankSelectorWrap').style.display = 'none';
    $('selectedCount').style.display = 'none';
    return;
  }

  const total = hand.length;
  const maxSpread = Math.min(40, 600 / total);
  const maxRot = Math.min(2.5, 15 / total);
  const offset = (total - 1) / 2;

  hand.forEach((card, i) => {
    const el = document.createElement('div');
    const isRed = SUIT_COLOR[card.suit] === 'red';
    const selected = State.selectedCards.has(card.id);
    const sym = SUIT_SYMBOL[card.suit];

    el.className = `play-card card-${isRed ? 'red' : 'black'}${selected ? ' selected' : ''}${locked ? ' disabled' : ''}`;

    const rot = (i - offset) * maxRot;
    const tx = (i - offset) * maxSpread;
    const ty = Math.abs(i - offset) * 2.5;
    const liftY = selected ? -24 : 0;

    el.style.transform = `translateX(${tx}px) translateY(${ty + liftY}px) rotate(${rot}deg)`;
    el.style.zIndex = selected ? 50 + i : i;
    el.style.transitionDelay = `${i * 15}ms`;

    el.innerHTML = `
      <div class="card-corner">
        <div class="card-rank">${escHtml(card.rank)}</div>
        <div class="card-suit-small">${sym}</div>
      </div>
      <div class="card-suit-center">${sym}</div>
      <div class="card-corner bottom-right">
        <div class="card-rank">${escHtml(card.rank)}</div>
        <div class="card-suit-small">${sym}</div>
      </div>`;

    if (!locked) {
      el.addEventListener('click', () => toggleCardSelection(card.id, gs));
    }

    fan.appendChild(el);
  });

  updatePlayControls(gs, locked);
}

function toggleCardSelection(cardId, gs) {
  if (State.selectedCards.has(cardId)) {
    State.selectedCards.delete(cardId);
  } else {
    State.selectedCards.add(cardId);
  }
  updatePlayControls(gs, false);
  renderCardsFan(gs.players.find(p => p.isMe)?.hand || [], false, gs);
}

function updatePlayControls(gs, locked) {

  const count = State.selectedCards.size;

  const countEl = $('selectedCount');
  const rankWrap = $('rankSelectorWrap');
  const playBtn = $('playCardsBtn');

  // ─────────────────────────
  // NO CARDS SELECTED
  // ─────────────────────────

  if (count === 0 || locked) {

    countEl.style.display = 'none';

    rankWrap.style.display = 'none';

    playBtn.disabled = true;

    return;
  }

  // ─────────────────────────
  // SHOW SELECTED COUNT
  // ─────────────────────────

  countEl.style.display = '';

  $('selectedNum').textContent = count;

  // ─────────────────────────
  // AUTO LOCKED RANK UI
  // ─────────────────────────

  if (gs.lockedRank) {

    rankWrap.style.display = '';

    const rankNames = {
      A: 'Ace',
      J: 'Jack',
      Q: 'Queen',
      K: 'King'
    };

    const rankText =
      rankNames[gs.lockedRank] ||
      gs.lockedRank;

    rankWrap.innerHTML = `
      <div class="locked-rank-display">
        <i class="fa-solid fa-lock"></i>
        Locked Rank:
        <span>${rankText}s</span>
      </div>
    `;

  } else {

    // First move of round
    // show selector

    rankWrap.style.display = '';

    rankWrap.innerHTML = `
      <label for="rankSelect">
        Claim Rank
      </label>

      <select id="rankSelect" class="rank-select">
        <option value="">Select Rank</option>
        <option value="A">Ace</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
        <option value="J">Jack</option>
        <option value="Q">Queen</option>
        <option value="K">King</option>
      </select>
    `;
  }

  // ─────────────────────────
  // ENABLE PLAY BUTTON
  // ─────────────────────────

  playBtn.disabled = false;
}

// ─── Bluff Overlay ─────────────────────────────────────────────────────────────
function renderBluffWindow(gs, me) {

  const overlay = $('bluffOverlay');

  const callBtn = $('callBluffBtn');

  const procBtn = $('proceedBtn');

  // ─────────────────────────
  // NO BLUFF WINDOW
  // ─────────────────────────

  if (!gs.bluffWindowOpen) {

    overlay.classList.remove('active');

    return;
  }

  // ─────────────────────────
  // WHO PLAYED?
  // ─────────────────────────

  const currentPlayer =
    gs.players[gs.currentPlayerIndex];

  const isMyPlay =
    currentPlayer?.isMe;

  // ─────────────────────────
  // IF I AM MOVE MAKER
  // HIDE OVERLAY COMPLETELY
  // ─────────────────────────

  if (isMyPlay) {

    overlay.classList.remove('active');

    return;
  }

  // ─────────────────────────
  // SHOW OVERLAY TO OTHERS
  // ─────────────────────────

  overlay.classList.add('active');

  const rankNames = {
    A: 'Ace',
    J: 'Jack',
    Q: 'Queen',
    K: 'King'
  };

  const lc = gs.lastClaim;

  if (lc) {

    const r =
      rankNames[lc.claimedRank] ||
      lc.claimedRank;

    $('bluffClaimInfo').innerHTML = `
      <span>${escHtml(lc.playerNickname)}</span>
      played
      <span class="rank-highlight">
        ${lc.claimedCount} × ${r}
      </span>
    `;
  }

  // ─────────────────────────
  // ONLY NEXT PLAYER
  // CAN PROCEED
  // ─────────────────────────

  const nextIdx =
    (gs.currentPlayerIndex + 1)
    % gs.players.length;

  const isNextPlayer =
    gs.players[nextIdx]?.isMe;

  // Everyone can call bluff
  callBtn.disabled = false;

  // Only next player can proceed
  procBtn.disabled = !isNextPlayer;

  // ─────────────────────────
  // SUBTEXT
  // ─────────────────────────

  $('bluffSub').textContent =

    isNextPlayer

      ? 'Call bluff or continue the round'

      : 'You may call bluff';
}
// ─── Game Log ──────────────────────────────────────────────────────────────────
function renderGameLog(gs) {
  const entries = $('logEntries');
  entries.innerHTML = '';
  (gs.log || []).forEach(msg => {
    const el = document.createElement('div');
    const isBluff = msg.toLowerCase().includes('bluff') || msg.toLowerCase().includes('caught') || msg.toLowerCase().includes('wrong call');
    const isWin = msg.toLowerCase().includes('winner') || msg.toLowerCase().includes('wins');
    el.className = `log-entry${isBluff ? ' bluff' : ''}${isWin ? ' win' : ''}`;
    el.textContent = msg;
    entries.appendChild(el);
  });
}

// ─── Game Over ─────────────────────────────────────────────────────────────────
function showGameOver(gs) {

  const overlay = $('gameOverOverlay');

  overlay.classList.add('active');

  $('winnerName').textContent = gs.winner;

  const winnerPlayer =
    gs.players.find(
      p => p.nickname === gs.winner
    );

  if (winnerPlayer) {

    $('winnerAvatar').innerHTML =
      getAvatarSvg(winnerPlayer.avatar);
  }

  // Celebration effect
  const rect =
    overlay.getBoundingClientRect();

  spawnParticles(
    rect.width / 2,
    rect.height / 2
  );

  // Show button for everyone
  $('restartBtn').style.display = '';

  // Optional text
  $('restartBtn').innerHTML =
    '<i class="fa-solid fa-rotate"></i> Play Again';
}

  // ─── INIT ──────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    buildAvatarGrid();
    initSocket();
    bindLobby();
    bindGame();
  });
