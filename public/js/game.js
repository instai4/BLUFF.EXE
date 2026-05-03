/* ═══════════════════════════════════════════════════════════════════════════
   BLUFF CARD GAME — Client Game Script
   Uses provided server logic + WebRTC voice chat + PWA install
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const State = {
  socket: null,
  roomCode: null,
  myNickname: null,
  myAvatar: null,
  selectedAvatar: null,
  selectedCards: new Set(),
  gameState: null,
  isMyTurn: false,
  prevRoundNumber: -1,     // for round-change flash
  pwaPrompt: null,         // deferred install prompt
};

const SUIT_SYMBOL = { spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣' };
const SUIT_COLOR  = { spades:'black', hearts:'red', diamonds:'red', clubs:'black' };
const RANK_NAMES  = { A:'Ace', J:'Jack', Q:'Queen', K:'King' };

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type='error') {
  const t = document.createElement('div');
  t.className = `toast${type==='success'?' success':''}`;
  t.innerHTML = `<i class="fa-solid fa-${type==='success'?'circle-check':'triangle-exclamation'}"></i> ${msg}`;
  $('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Room code copied!','success'));
}

function spawnParticles(x, y, count=14) {
  const syms=['♠','♥','♦','♣','★','✦'];
  const colors=['#FFD93D','#FF6B6B','#6BCB77','#4D96FF','#C77DFF'];
  for (let i=0; i<count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${x+(Math.random()-.5)*160}px;top:${y-60+(Math.random()-.5)*80}px;color:${colors[i%colors.length]};animation-delay:${Math.random()*.5}s;font-size:${1+Math.random()}rem;`;
    p.textContent = syms[Math.floor(Math.random()*syms.length)];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2800);
  }
}

function flashScreen(color='red') {
  const f = document.createElement('div');
  f.className = `screen-flash${color==='green'?' green':color==='yellow'?' yellow':''}`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 500);
}

function showRoundBanner(text) {
  const b = document.createElement('div');
  b.className = 'round-banner';
  b.textContent = text;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 900);
}

// ═══════════════════════════════════════════════════════════════════════════
// PWA INSTALL
// ═══════════════════════════════════════════════════════════════════════════

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  State.pwaPrompt = e;
  $('pwaBanner').style.display = 'flex';
  $('installHintBtn').style.display = 'flex';
});

function bindPWA() {
  $('pwaInstallBtn').addEventListener('click', async () => {
    if (!State.pwaPrompt) return;
    State.pwaPrompt.prompt();
    const { outcome } = await State.pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      $('pwaBanner').style.display = 'none';
      showToast('App installed! Launch from your home screen.', 'success');
    }
    State.pwaPrompt = null;
  });

  $('pwaDismissBtn').addEventListener('click', () => {
    $('pwaBanner').style.display = 'none';
  });

  $('installHintBtn').addEventListener('click', () => {
    if (State.pwaPrompt) $('pwaInstallBtn').click();
    else showToast('To install: use your browser\'s "Add to Home Screen" option.');
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      console.log('SW registered:', reg.scope);
    }).catch(e => console.log('SW error:', e));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════════════

function buildAvatarGrid() {
  const grid = $('avatarGrid');
  grid.innerHTML = '';
  AVATARS.forEach(av => {
    const div = document.createElement('div');
    div.className  = 'avatar-option';
    div.dataset.id = av.id;
    div.innerHTML  = `<div class="avatar-svg-wrap">${av.svg}</div><span class="avatar-name">${av.name}</span>`;
    div.addEventListener('click', () => selectAvatar(av.id));
    grid.appendChild(div);
  });
  selectAvatar(AVATARS[0].id);
}

function selectAvatar(id) {
  State.selectedAvatar = id;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.toggle('selected', el.dataset.id===id));
}

function getAvatarSvg(id)   { return (AVATARS.find(a=>a.id===id)||AVATARS[0]).svg; }
function getAvatarColor(id) { return (AVATARS.find(a=>a.id===id)||AVATARS[0]).color; }

// ═══════════════════════════════════════════════════════════════════════════
// ROOM LOBBY
// ═══════════════════════════════════════════════════════════════════════════

function showRoomLobby(code) {
  $('setupPanel').style.display = 'none';
  $('roomLobby').style.display  = 'block';
  $('displayRoomCode').textContent = code;
  State.roomCode = code;
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
      ${p.id===State.socket.id ? '<div class="slot-badge">You</div>' : ''}`;
    wrap.appendChild(slot);
  });
  for (let i=players.length; i<6; i++) {
    const slot = document.createElement('div');
    slot.className = 'player-slot empty-slot';
    slot.innerHTML = `<i class="fa-regular fa-circle-user"></i><span>Waiting...</span>`;
    wrap.appendChild(slot);
  }
  const isHost = players.find(p => p.id===State.socket.id)?.isHost;
  $('startGameBtn').style.display = isHost ? '' : 'none';
  $('waitingMsg').textContent = players.length < 2
    ? 'Need at least 2 players to start...'
    : isHost
      ? `${players.length} player${players.length>1?'s':''} ready — start when set!`
      : `${players.length} player${players.length>1?'s':''} ready — waiting for host...`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCKET
// ═══════════════════════════════════════════════════════════════════════════

function initSocket() {
  State.socket = io({ transports: ['websocket','polling'] });

  State.socket.on('connect', () => {
    console.log('Connected:', State.socket.id);
    window.voiceChat.init(State.socket); // hook voice chat to this socket
  });

  State.socket.on('room_joined', ({ roomCode }) => {
    State.roomCode = roomCode;
    showRoomLobby(roomCode);
  });

  State.socket.on('error_msg', ({ message }) => showToast(message));

  State.socket.on('game_state', gs => {
    State.gameState = gs;
    handleGameState(gs);
  });

  // ── Voice participants list ──
  State.socket.on('voice_participants', ({ participants }) => {
    renderVoiceParticipants(participants);
  });

  State.socket.on('disconnect', () => {
    showToast('Disconnected — please refresh.');
    window.voiceChat.leave();
  });
}

function validateLobbyInputs() {
  const nick = $('nicknameInput').value.trim();
  if (!nick)          { showToast('Enter your alias first.'); return null; }
  if (nick.length<2)  { showToast('Alias must be at least 2 characters.'); return null; }
  if (!State.selectedAvatar) { showToast('Pick a character!'); return null; }
  return { nickname: nick, avatar: State.selectedAvatar };
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE CHAT UI
// ═══════════════════════════════════════════════════════════════════════════

function renderVoiceParticipants(participants) {
  const panel = $('voicePanel');
  const vp    = $('voiceParticipants');
  if (!participants || !participants.length) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'flex';
  vp.innerHTML = participants.map(p => `
    <div class="voice-user">
      <div class="voice-dot" data-id="${p.id}" title="${escHtml(p.nickname)}">
        <i class="fa-solid fa-microphone"></i>
      </div>
      <span class="voice-name">${escHtml(p.nickname)}</span>
    </div>`).join('');
}

async function toggleVoiceChat() {

  // ─────────────────────────────────────
  // SAFETY CHECKS
  // ─────────────────────────────────────

  if (!window.voiceChat) {
    showToast('Voice system not loaded');
    return;
  }

  const vc = window.voiceChat;

  // Browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Microphone not supported in this browser');
    return;
  }

  // HTTPS check
  const isSecure =
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

  if (!isSecure) {
    showToast('Voice chat requires HTTPS');
    return;
  }

  // ─────────────────────────────────────
  // FIRST TIME CONNECT
  // ─────────────────────────────────────

  if (!vc.isActive) {

    try {

      updateMicBtn(null, null);

      // Ask mic permission FIRST
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      // Stop temporary tracks
      stream.getTracks().forEach(track => track.stop());

      // Connect voice system
      const ok = await vc.join(true);

      if (!ok) {
        updateMicBtn(false, false);
        showToast('Unable to connect voice chat');
        return;
      }

      updateMicBtn(true, true);

      $('voicePanel').style.display = 'flex';

      showToast('Voice connected (muted)', 'success');

    } catch (err) {

      console.error('VOICE ERROR:', err);

      updateMicBtn(false, false);

      // Better error messages
      if (err.name === 'NotAllowedError') {
        showToast('Microphone permission denied');
      }
      else if (err.name === 'NotFoundError') {
        showToast('No microphone detected');
      }
      else if (err.name === 'NotReadableError') {
        showToast('Microphone already in use');
      }
      else {
        showToast('Voice chat failed');
      }

      $('micDenied').style.display = 'block';

      setTimeout(() => {
        $('micDenied').style.display = 'none';
      }, 3000);
    }

    return;
  }

  // ─────────────────────────────────────
  // TOGGLE MUTE
  // ─────────────────────────────────────

  try {

    const muted = vc.toggleMute();

    updateMicBtn(true, muted);

    showToast(
      muted ? 'Microphone muted' : 'Microphone unmuted',
      'success'
    );

  } catch (err) {

    console.error(err);

    showToast('Voice toggle failed');
  }
}

function updateMicBtn(isActive, isMuted) {
  const btn   = $('micBtn');
  const icon  = $('micIcon');
  const label = $('micLabel');

  if (isActive === null) { // loading
    btn.className   = 'mic-btn mic-loading';
    icon.className  = 'fa-solid fa-spinner fa-spin';
    label.textContent = '...';
    return;
  }

  if (!isActive) {
    btn.className   = 'mic-btn mic-off';
    icon.className  = 'fa-solid fa-microphone-slash';
    label.textContent = 'Voice Off';
    return;
  }

  if (isMuted) {
    btn.className   = 'mic-btn mic-muted';
    icon.className  = 'fa-solid fa-microphone-slash';
    label.textContent = 'Muted';
  } else {
    btn.className   = 'mic-btn mic-on';
    icon.className  = 'fa-solid fa-microphone';
    label.textContent = 'Voice On';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOBBY BINDINGS
// ═══════════════════════════════════════════════════════════════════════════

function bindLobby() {
  $('createRoomBtn').addEventListener('click', () => {
    const data = validateLobbyInputs();
    if (!data) return;
    State.myNickname = data.nickname;
    State.myAvatar   = data.avatar;
    State.socket.emit('create_room', data);
  });

  $('showJoinBtn').addEventListener('click', () => {
    $('joinSection').classList.toggle('visible');
    $('showJoinBtn').innerHTML = $('joinSection').classList.contains('visible')
      ? '<i class="fa-solid fa-xmark"></i> Cancel'
      : '<i class="fa-solid fa-door-open"></i> Join Room';
  });

  $('joinRoomBtn').addEventListener('click', joinRoom);
  $('roomCodeInput').addEventListener('keydown', e => { if (e.key==='Enter') joinRoom(); });

  $('startGameBtn').addEventListener('click', () => State.socket.emit('start_game'));
  $('leaveRoomBtn').addEventListener('click', () => location.reload());

  $('displayRoomCode').addEventListener('click', () => copyToClipboard($('displayRoomCode').textContent.trim()));

  $('rulesToggle').addEventListener('click', () => {
    $('rulesBody').classList.toggle('open');
    $('rulesChevron').style.transform = $('rulesBody').classList.contains('open') ? 'rotate(180deg)' : '';
  });
}

function joinRoom() {
  const data = validateLobbyInputs();
  if (!data) return;
  const code = $('roomCodeInput').value.trim().toUpperCase();
  if (code.length!==6) { showToast('Room code must be 6 characters.'); return; }
  State.myNickname = data.nickname;
  State.myAvatar   = data.avatar;
  State.socket.emit('join_room', { ...data, roomCode: code });
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME BINDINGS
// ═══════════════════════════════════════════════════════════════════════════

function bindGame() {
  $('copyCodeBtn').addEventListener('click', () => copyToClipboard(State.roomCode));

  $('toggleLogBtn').addEventListener('click', () => {
    const log = $('gameLog');
    log.style.display = log.style.display === 'none' ? '' : 'none';
  });

  // ── MIC BUTTON ──
  $('micBtn').addEventListener('click', toggleVoiceChat);

  // ── VOICE MUTE BUTTON ──
  $('voiceMuteBtn').addEventListener('click', () => {
    const vc = window.voiceChat;
    if (!vc.isActive) return;
    const muted = vc.toggleMute();
    updateMicBtn(true, muted);
    $('muteIcon').className = muted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone';
    showToast(muted ? 'Muted' : 'Unmuted', 'success');
  });

  // ── BLUFF ACTIONS ──
  $('callBluffBtn').addEventListener('click', () => State.socket.emit('call_bluff'));
  $('proceedBtn').addEventListener('click', () => State.socket.emit('proceed'));

  // ── PLAY CARDS ──
  $('playCardsBtn').addEventListener('click', () => {
    if (State.selectedCards.size === 0) { showToast('Select at least one card.'); return; }

    let claimedRank = null;

    // If no locked rank, require dropdown selection
    if (!State.gameState?.lockedRank) {
      const sel = document.getElementById('rankSelect');
      claimedRank = sel?.value;
      if (!claimedRank) { showToast('Select a rank to claim first.'); return; }
    }

    State.socket.emit('play_cards', {
      cardIds: [...State.selectedCards],
      claimedRank
    });
    State.selectedCards.clear();
  });

  // ── PASS ──
  $('passBtn').addEventListener('click', () => State.socket.emit('pass_turn'));

  // ── GAME OVER ACTIONS ──
  $('restartBtn').addEventListener('click', () => {
    State.socket.emit('restart_game');
    $('gameOverOverlay').classList.remove('active');
  });
  $('quitBtn').addEventListener('click', () => location.reload());
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE HANDLER
// ═══════════════════════════════════════════════════════════════════════════

function handleGameState(gs) {
  if (gs.gameStarted && $('lobby').style.display !== 'none') switchToGame();

  if (!gs.gameStarted) {
    renderRoomLobbyPlayers(gs.players);
    return;
  }

  const me = gs.players.find(p => p.isMe);

  updateHeader(gs);
  renderLockedRank(gs);
  renderStatusBanner(gs);
  renderDrawPileInfo(gs);
  renderCenterPile(gs);
  renderPlayersRing(gs);
  renderMyHand(gs, me);
  renderBluffWindow(gs, me);
  renderGameLog(gs);

  // Round change flash
  if (gs.roundNumber > State.prevRoundNumber && State.prevRoundNumber >= 0) {
    flashScreen('yellow');
    showRoundBanner('New Round!');
  }
  State.prevRoundNumber = gs.roundNumber;

  if (gs.gamePhase === 'ended' && gs.winner) showGameOver(gs);
}

function switchToGame() {
  $('lobby').style.display    = 'none';
  $('game-app').style.display = 'flex';
  $('headerRoomCode').textContent = State.roomCode;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function updateHeader(gs) {
  $('headerRoomCode').textContent    = gs.roomCode;
  $('headerPlayerCount').textContent = gs.players.length;
}

// ─── Locked Rank Banner ───────────────────────────────────────────────────────
function renderLockedRank(gs) {
  const banner = $('lockedRankBanner');
  if (gs.lockedRank) {
    const rn = RANK_NAMES[gs.lockedRank] || gs.lockedRank;
    $('lockedRankText').textContent = `Round: ${rn}s`;
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function renderStatusBanner(gs) { $('statusBanner').textContent = gs.message||'...'; }

// ─── Draw Pile Info ───────────────────────────────────────────────────────────
function renderDrawPileInfo(gs) {
  $('drawPileCount').textContent  = gs.drawPileCount;
  $('centerPileCount').textContent= gs.centerPileCount;
}

// ─── Center Pile ──────────────────────────────────────────────────────────────
function renderCenterPile(gs) {
  const stack = $('pileStack');
  if (gs.centerPileCount === 0) {
    stack.innerHTML = `<div class="pile-empty"><i class="fa-regular fa-rectangle-list"></i></div>`;
    $('claimDisplay').style.display = 'none';
    return;
  }
  const count = Math.min(gs.centerPileCount, 3);
  let html = '';
  for (let i=0; i<count; i++) html += `<div class="pile-card"></div>`;
  html += `<div class="pile-count-badge">${gs.centerPileCount}</div>`;
  stack.innerHTML = html;

  if (gs.lastClaim) {
    $('claimDisplay').style.display = '';
    const r = gs.lastClaim.claimedRank;
    $('claimValue').textContent = `${gs.lastClaim.claimedCount} × ${RANK_NAMES[r]||r}`;
  } else {
    $('claimDisplay').style.display = 'none';
  }
}

// ─── Players Ring ─────────────────────────────────────────────────────────────
function renderPlayersRing(gs) {
  const ring = $('playersRing');
  ring.innerHTML = '';
  const players = gs.players;
  const myIdx   = players.findIndex(p => p.isMe);
  const me      = players[myIdx];

  const ordered = [];
  for (let i=1; i<players.length; i++) ordered.push(players[(myIdx+i)%players.length]);

  const positions = getPositions(ordered.length);
  ordered.forEach((p, i) => {
    const pos  = positions[i];
    const zone = document.createElement('div');
    zone.className = `player-zone${p.isCurrentPlayer ? ' current-turn' : ''}`;
    zone.style.left = pos.left+'%';
    zone.style.top  = pos.top+'%';
    const miniCards = Math.min(p.cardCount, 6);
    let minis = '';
    for (let c=0; c<miniCards; c++) minis += '<div class="mini-card"></div>';
    zone.innerHTML = `
      <div class="player-avatar-wrap" style="position:relative;">
        ${p.isHost ? '<div class="host-crown"><i class="fa-solid fa-crown"></i></div>' : ''}
        ${getAvatarSvg(p.avatar)}
      </div>
      <div class="player-name-tag">${escHtml(p.nickname)}</div>
      <div class="player-card-count"><i class="fa-solid fa-layer-group"></i> ${p.cardCount}</div>
      <div class="mini-cards">${minis}</div>`;
    ring.appendChild(zone);
  });

  if (me) {
    const mz = document.createElement('div');
    mz.className = `player-zone${me.isCurrentPlayer?' current-turn':''}`;
    mz.style.left = '50%'; mz.style.top = '90%';
    mz.innerHTML = `
      <div class="player-avatar-wrap" style="position:relative;">
        ${me.isHost ? '<div class="host-crown"><i class="fa-solid fa-crown"></i></div>' : ''}
        ${getAvatarSvg(me.avatar)}
      </div>
      <div class="you-badge">You</div>`;
    ring.appendChild(mz);
  }
}

function getPositions(oppCount) {
  if (oppCount===0) return [];
  if (oppCount===1) return [{top:6,left:50}];
  if (oppCount===2) return [{top:6,left:28},{top:6,left:72}];
  if (oppCount===3) return [{top:6,left:18},{top:6,left:50},{top:6,left:82}];
  if (oppCount===4) return [{top:6,left:15},{top:6,left:38},{top:6,left:62},{top:6,left:85}];
  return [{top:6,left:12},{top:6,left:30},{top:6,left:50},{top:6,left:70},{top:6,left:88}];
}

// ─── My Hand ──────────────────────────────────────────────────────────────────
function renderMyHand(gs, me) {
  if (!me) return;
  $('myAvatarSmall').innerHTML = getAvatarSvg(me.avatar);
  $('myNameLabel').textContent  = me.nickname;
  $('myCardCount').textContent  = me.cardCount;

  const isMyTurn   = me.isCurrentPlayer;
  const bluffOpen  = gs.bluffWindowOpen;
  const handLocked = !isMyTurn || bluffOpen;

  renderCardsFan(me.hand||[], handLocked, gs);

  // Pass button: only allowed after first play (lockedRank exists)
  const canPass = !handLocked && !!gs.lockedRank;
  const passBtn = $('passBtn');
  passBtn.disabled = !canPass;
  if (gs.passImmunity && isMyTurn && !bluffOpen) {
    passBtn.classList.add('immunity');
    passBtn.title = 'Free pass — immunity!';
  } else {
    passBtn.classList.remove('immunity');
    passBtn.title = '';
  }

  $('waitingIndicator').style.display = handLocked ? 'flex' : 'none';
}

// ─── Cards Fan ────────────────────────────────────────────────────────────────
function renderCardsFan(hand, locked, gs) {
  const fan = $('cardsFan');
  fan.innerHTML = '';

  if (!hand||!hand.length) {
    fan.innerHTML = `<div style="color:var(--txt3);font-size:.85rem;">No cards in hand</div>`;
    $('playCardsBtn').disabled = true;
    $('rankSelectorWrap').style.display = 'none';
    $('selectedCount').style.display    = 'none';
    return;
  }

  const total     = hand.length;
  const maxSpread = Math.min(40, 600/total);
  const maxRot    = Math.min(2.5, 15/total);
  const offset    = (total-1)/2;

  hand.forEach((card, i) => {
    const isRed    = SUIT_COLOR[card.suit]==='red';
    const selected = State.selectedCards.has(card.id);
    const sym      = SUIT_SYMBOL[card.suit];
    const el       = document.createElement('div');

    el.className = `play-card card-${isRed?'red':'black'}${selected?' selected':''}${locked?' disabled':''}`;

    const rot   = (i-offset)*maxRot;
    const tx    = (i-offset)*maxSpread;
    const ty    = Math.abs(i-offset)*2.5;
    const liftY = selected ? -24 : 0;

    el.style.transform   = `translateX(${tx}px) translateY(${ty+liftY}px) rotate(${rot}deg)`;
    el.style.zIndex      = selected ? 50+i : i;
    el.style.transitionDelay = `${i*12}ms`;

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

    if (!locked) el.addEventListener('click', () => toggleCardSelection(card.id, gs));
    fan.appendChild(el);
  });

  updatePlayControls(gs, locked);
}

function toggleCardSelection(cardId, gs) {
  if (State.selectedCards.has(cardId)) State.selectedCards.delete(cardId);
  else State.selectedCards.add(cardId);
  updatePlayControls(gs, false);
  renderCardsFan(gs.players.find(p=>p.isMe)?.hand||[], false, gs);
}

function updatePlayControls(gs, locked) {
  const count    = State.selectedCards.size;
  const countEl  = $('selectedCount');
  const rankWrap = $('rankSelectorWrap');
  const playBtn  = $('playCardsBtn');

  if (count===0 || locked) {
    countEl.style.display  = 'none';
    rankWrap.style.display = 'none';
    playBtn.disabled       = true;
    return;
  }

  // Show selected count
  countEl.style.display = '';
  $('selectedNum').textContent = count;

  // Rank selector / locked rank display
  if (gs.lockedRank) {
    // Round is locked — auto claim shown
    rankWrap.style.display = '';
    rankWrap.innerHTML = `
      <div class="locked-rank-display">
        <i class="fa-solid fa-lock"></i>
        <span>${RANK_NAMES[gs.lockedRank]||gs.lockedRank}s</span>
      </div>`;
  } else {
    // First play of round — show selector
    rankWrap.style.display = '';
    const prev = document.getElementById('rankSelect')?.value || '';
    rankWrap.innerHTML = `
      <div class="rank-selector-wrap">
        <select id="rankSelect" class="rank-select">
          <option value="">Claim Rank</option>
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
        <i class="fa-solid fa-chevron-down rank-select-arrow"></i>
      </div>`;
    if (prev) {
      const sel = document.getElementById('rankSelect');
      if (sel) sel.value = prev;
    }
  }

  playBtn.disabled = false;
}

// ─── Bluff Window ─────────────────────────────────────────────────────────────
function renderBluffWindow(gs, me) {
  const overlay = $('bluffOverlay');
  const callBtn = $('callBluffBtn');
  const procBtn = $('proceedBtn');

  if (!gs.bluffWindowOpen) { overlay.classList.remove('active'); return; }

  const currentPlayer = gs.players[gs.currentPlayerIndex];
  const isMyPlay      = currentPlayer?.isMe;

  // ── KEY FIX: Player who played sees NO overlay ──
  if (isMyPlay) {
    overlay.classList.remove('active');
    return;
  }

  overlay.classList.add('active');

  if (gs.lastClaim) {
    const r = gs.lastClaim.claimedRank;
    $('bluffClaimInfo').innerHTML = `
      <span>${escHtml(gs.lastClaim.playerNickname)}</span>
      played
      <span class="rank-highlight">${gs.lastClaim.claimedCount} × ${RANK_NAMES[r]||r}</span>`;
  }

  const nextIdx      = (gs.currentPlayerIndex+1) % gs.players.length;
  const isNextPlayer = gs.players[nextIdx]?.isMe;

  // Anyone can call bluff
  callBtn.disabled = false;
  // Only next player can proceed
  procBtn.disabled = !isNextPlayer;

  $('bluffSub').textContent = isNextPlayer
    ? 'Call bluff or continue the round'
    : 'You may call bluff anytime';
}

// ─── Game Log ─────────────────────────────────────────────────────────────────
function renderGameLog(gs) {
  const entries = $('logEntries');
  entries.innerHTML = '';
  (gs.log||[]).forEach(msg => {
    const el = document.createElement('div');
    const isBluff = /bluff|wrong call|busted/i.test(msg);
    const isWin   = /win|champion/i.test(msg);
    el.className  = `log-entry${isBluff?' bluff':''}${isWin?' win':''}`;
    el.textContent= msg;
    entries.appendChild(el);
  });
}

// ─── Game Over ────────────────────────────────────────────────────────────────
function showGameOver(gs) {
  const overlay = $('gameOverOverlay');
  overlay.classList.add('active');
  $('winnerName').textContent = gs.winner;

  const wp = gs.players.find(p => p.nickname===gs.winner);
  if (wp) $('winnerAvatar').innerHTML = getAvatarSvg(wp.avatar);

  const rect = overlay.getBoundingClientRect();
  spawnParticles(rect.width/2, rect.height/2, 20);

  const isHost = gs.players.find(p=>p.isMe)?.isHost;
  $('restartBtn').style.display = isHost ? '' : 'none';
  flashScreen('yellow');
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  buildAvatarGrid();
  initSocket();
  bindLobby();
  bindGame();
  bindPWA();
});