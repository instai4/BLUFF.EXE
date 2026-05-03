/* ═══════════════════════════════════════════════════════════════════════════
   BLUFF CARD GAME — WebRTC Voice Chat Module
   Mesh topology: each player connects directly to every other voice participant.
   No external TURN server needed for LAN/same-network play.
   Google STUN is used for NAT traversal on wider networks.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

class VoiceChat {
  constructor() {
    this.socket        = null;   // set after socket connects
    this.localStream   = null;   // microphone MediaStream
    this.peers         = new Map(); // peerId → { pc, audioEl, gainNode }
    this.isMuted       = true;
    this.isActive      = false;  // true = joined voice
    this.audioCtx      = null;   // AudioContext for speaking detection
    this.analyser      = null;
    this.speakTimer    = null;
    this.isSpeaking    = false;

    // ICE servers — Google STUN (free, no auth needed)
 this.iceConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    },

    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],

  iceCandidatePoolSize: 10
};
  }

  // ─── Called once socket is ready ─────────────────────────────────────────
init(socket) {
  this.socket = socket;
  this._bindSignaling();

  setTimeout(() => {
    this.join(true);
  }, 1000);
}

  // ─── Activate mic and join voice room ────────────────────────────────────
  async join(silent = false) {
    if (this.isActive) return true;
    try {
     this.localStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  },
  video: false
});

// Start muted if silent join
if (silent) {
  this.localStream.getAudioTracks().forEach(t => {
    t.enabled = false;
  });

  this.isMuted = true;
}
      this.isActive = true;
      this._startSpeakingDetection();
      this.socket.emit('voice_join');
      return true;
    } catch (err) {
      console.warn('Mic access denied:', err);
      return false;
    }
  }

  // ─── Leave voice, clean up all peers ─────────────────────────────────────
  leave() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.peers.forEach((_, id) => this._closePeer(id));
    this.peers.clear();
    this.isActive  = false;
    this.isMuted   = false;
    this.isSpeaking= false;
    if (this.analyser) { this.analyser = null; }
    if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
    clearTimeout(this.speakTimer);
    this.socket.emit('voice_leave');
  }

  // ─── Mute / Unmute ───────────────────────────────────────────────────────
  toggleMute() {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(t => { t.enabled = !this.isMuted; });
    return this.isMuted;
  }

  // ─── Bind all signaling events from server ────────────────────────────────
  _bindSignaling() {
    const s = this.socket;

    // Server tells us who's already in voice when we join
    s.on('voice_existing_users', async ({ userIds }) => {
      if (!this.isActive) return;
      for (const uid of userIds) {
        if (uid !== s.id) await this._createOffer(uid);
      }
    });

    // Someone new joined voice after us
    s.on('voice_user_joined', async ({ userId }) => {
      if (!this.isActive || userId === s.id) return;
      // They will send us an offer — no need to call createOffer here
      // (only the JOINER sends offers to existing users)
    });

    // Someone left voice
    s.on('voice_user_left', ({ userId }) => {
      this._closePeer(userId);
      this._updateSpeakingUI(userId, false);
    });

    // Receive offer from another peer
    s.on('voice_offer', async ({ from, offer }) => {
      if (!this.isActive) return;
      await this._handleOffer(from, offer);
    });

    // Receive answer to our offer
    s.on('voice_answer', async ({ from, answer }) => {
      const peer = this.peers.get(from);
      if (peer) {
        try { await peer.pc.setRemoteDescription(new RTCSessionDescription(answer)); }
        catch (e) { console.warn('setRemoteDescription (answer) error:', e); }
      }
    });

    // Receive ICE candidate
    s.on('voice_ice', async ({ from, candidate }) => {
      const peer = this.peers.get(from);
      if (peer && candidate) {
        try { await peer.pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { /* safe to ignore late candidates */ }
      }
    });

    // Remote speaking indicator
    s.on('voice_speaking', ({ userId, isSpeaking }) => {
      this._updateSpeakingUI(userId, isSpeaking);
    });
  }

  // ─── Create RTCPeerConnection ─────────────────────────────────────────────
  _createPC(peerId) {
    const pc = new RTCPeerConnection(this.iceConfig);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream));
    }

    // Remote audio
   pc.ontrack = async (e) => {
  console.log('Remote track received from', peerId);

  let audioEl = document.getElementById(`audio-${peerId}`);

  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = `audio-${peerId}`;
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    document.body.appendChild(audioEl);
  }

  audioEl.srcObject = e.streams[0];

  try {
    await audioEl.play();
    console.log('Audio playing');
  } catch (err) {
    console.warn('Autoplay blocked:', err);

    document.body.addEventListener(
      'click',
      async () => {
        try {
          await audioEl.play();
        } catch {}
      },
      { once: true }
    );
  }

  const entry = this.peers.get(peerId);
  if (entry) entry.audioEl = audioEl;
};

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit('voice_ice', { to: peerId, candidate: e.candidate });
      }
    };

   pc.onconnectionstatechange = () => {
  console.log(
    'Peer state:',
    peerId,
    pc.connectionState
  );

  if (
    pc.connectionState === 'failed' ||
    pc.connectionState === 'closed'
  ) {
    this._closePeer(peerId);
  }
};

pc.oniceconnectionstatechange = () => {
  console.log(
    'ICE state:',
    peerId,
    pc.iceConnectionState
  );
};

pc.onicecandidateerror = (e) => {
  console.warn(
    'ICE candidate error:',
    e
  );
};

    return pc;
  }

 async _createOffer(peerId) {
  const pc = this._createPC(peerId);
  this.peers.set(peerId, { pc, audioEl: null });

  try {
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    this.socket.emit('voice_offer', {
      to: peerId,
      offer
    });

  } catch (e) {
    console.warn('createOffer error:', e);
  }
}

async _handleOffer(from, offer) {
  const pc = this._createPC(from);
  this.peers.set(from, { pc, audioEl: null });

  try {
    await pc.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit('voice_answer', {
      to: from,
      answer
    });

  } catch (e) {
    console.warn('handleOffer error:', e);
  }
}
  _closePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    if (peer.audioEl) { peer.audioEl.pause(); peer.audioEl.srcObject = null; }
    peer.pc.close();
    this.peers.delete(peerId);
  }

  // ─── Speaking detection via AudioContext analyser ─────────────────────────
  _startSpeakingDetection() {
    if (!this.localStream) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src     = this.audioCtx.createMediaStreamSource(this.localStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      src.connect(this.analyser);

      const buf = new Uint8Array(this.analyser.frequencyBinCount);
      const THRESHOLD = 20; // RMS threshold

      const detect = () => {
        if (!this.isActive) return;
        if (this.analyser) {
          this.analyser.getByteFrequencyData(buf);
          const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
          const speaking = !this.isMuted && rms > THRESHOLD;

          if (speaking !== this.isSpeaking) {
            this.isSpeaking = speaking;
            this.socket.emit('voice_speaking', { isSpeaking: speaking });
            this._updateSpeakingUI(this.socket.id, speaking);
          }
        }
        this.speakTimer = setTimeout(detect, 150);
      };
      detect();
    } catch (e) { console.warn('AudioContext error:', e); }
  }

  // ─── Update speaking indicator in the voice panel UI ─────────────────────
  _updateSpeakingUI(userId, isSpeaking) {
    const el = document.querySelector(`.voice-dot[data-id="${userId}"]`);
    if (el) el.classList.toggle('speaking', isSpeaking);
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
window.voiceChat = new VoiceChat();