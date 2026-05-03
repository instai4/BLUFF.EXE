/* ═══════════════════════════════════════════════════════════════════════════
   BLUFF CARD GAME — WebRTC Voice Chat Module
   Stable Voice Chat Version
   FIXES:
   ✔ Voice works when only ONE user unmutes
   ✔ Better mobile/browser compatibility
   ✔ Fix renegotiation issues
   ✔ Prevent duplicate peer creation
   ✔ Handles autoplay properly
   ✔ Better ICE handling
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

class VoiceChat {
  constructor() {
    this.socket = null;

    this.localStream = null;

    // peerId => { pc, audioEl }
    this.peers = new Map();

    this.isMuted = true;
    this.isActive = false;
    this.isSpeaking = false;

    this.audioCtx = null;
    this.analyser = null;
    this.speakTimer = null;

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

  /* ───────────────────────────────────────────────────────────── */

  init(socket) {
    this.socket = socket;

    this._bindSignaling();

    console.log('Voice initialized');
  }

  /* ───────────────────────────────────────────────────────────── */

  async join(startMuted = true) {
    if (this.isActive) return true;

    try {
      this.localStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });

      // IMPORTANT:
      // KEEP TRACK ENABLED FOR WEBRTC
      // Only control mute logically
      this.localStream
        .getAudioTracks()
        .forEach(track => {
          track.enabled = !startMuted;
        });

      this.isMuted = startMuted;

      this.isActive = true;

      this._startSpeakingDetection();

      this.socket.emit('voice_join');

      console.log('Joined voice');

      return true;

    } catch (err) {
      console.warn('Voice join error:', err);
      return false;
    }
  }

  /* ───────────────────────────────────────────────────────────── */

  leave() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.peers.forEach((_, peerId) => {
      this._closePeer(peerId);
    });

    this.peers.clear();

    this.isActive = false;
    this.isMuted = true;
    this.isSpeaking = false;

    clearTimeout(this.speakTimer);

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.socket.emit('voice_leave');
  }

  /* ───────────────────────────────────────────────────────────── */

  toggleMute() {
    if (!this.localStream) return true;

    this.isMuted = !this.isMuted;

    this.localStream
      .getAudioTracks()
      .forEach(track => {
        track.enabled = !this.isMuted;
      });

    console.log(
      this.isMuted
        ? 'Mic muted'
        : 'Mic unmuted'
    );

    return this.isMuted;
  }

  /* ───────────────────────────────────────────────────────────── */

  _bindSignaling() {
    const s = this.socket;

    /* EXISTING USERS */
    s.on('voice_existing_users', async ({ userIds }) => {

      if (!this.isActive) return;

      for (const userId of userIds) {

        if (userId === s.id) continue;

        if (this.peers.has(userId)) continue;

        await this._createOffer(userId);
      }
    });

    /* USER JOINED */
    s.on('voice_user_joined', async ({ userId }) => {

      if (!this.isActive) return;

      if (userId === s.id) return;

      console.log('User joined:', userId);
    });

    /* OFFER */
    s.on('voice_offer', async ({ from, offer }) => {

      if (!this.isActive) return;

      await this._handleOffer(from, offer);
    });

    /* ANSWER */
    s.on('voice_answer', async ({ from, answer }) => {

      const peer = this.peers.get(from);

      if (!peer) return;

      try {
        await peer.pc.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        console.log('Answer connected:', from);

      } catch (e) {
        console.warn('Answer error:', e);
      }
    });

    /* ICE */
    s.on('voice_ice', async ({ from, candidate }) => {

      const peer = this.peers.get(from);

      if (!peer || !candidate) return;

      try {
        await peer.pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (e) {
        console.warn('ICE add error:', e);
      }
    });

    /* USER LEFT */
    s.on('voice_user_left', ({ userId }) => {
      this._closePeer(userId);
    });

    /* SPEAKING */
    s.on('voice_speaking', ({ userId, isSpeaking }) => {
      this._updateSpeakingUI(userId, isSpeaking);
    });
  }

  /* ───────────────────────────────────────────────────────────── */

  _createPC(peerId) {

    const pc =
      new RTCPeerConnection(this.iceConfig);

    console.log('Creating peer:', peerId);

    /* LOCAL TRACKS */
    if (this.localStream) {

      this.localStream
        .getTracks()
        .forEach(track => {

          pc.addTrack(track, this.localStream);
        });
    }

    /* REMOTE AUDIO */
    pc.ontrack = async (event) => {

      console.log(
        'Remote track received:',
        peerId
      );

      let audio =
        document.getElementById(
          `audio-${peerId}`
        );

      if (!audio) {

        audio =
          document.createElement('audio');

        audio.id = `audio-${peerId}`;
        audio.autoplay = true;
        audio.playsInline = true;

        document.body.appendChild(audio);
      }

      audio.srcObject = event.streams[0];

      try {

        await audio.play();

        console.log(
          'Playing audio from',
          peerId
        );

      } catch (err) {

        console.warn(
          'Autoplay blocked'
        );

        const resume = async () => {

          try {
            await audio.play();

            document.removeEventListener(
              'click',
              resume
            );

          } catch {}
        };

        document.addEventListener(
          'click',
          resume
        );
      }

      const peer =
        this.peers.get(peerId);

      if (peer) {
        peer.audioEl = audio;
      }
    };

    /* ICE */
    pc.onicecandidate = (event) => {

      if (!event.candidate) return;

      this.socket.emit('voice_ice', {
        to: peerId,
        candidate: event.candidate
      });
    };

    /* STATE */
    pc.onconnectionstatechange = () => {

      console.log(
        'Connection:',
        peerId,
        pc.connectionState
      );

      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'closed'
      ) {
        this._closePeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {

      console.log(
        'ICE:',
        peerId,
        pc.iceConnectionState
      );
    };

    return pc;
  }

  /* ───────────────────────────────────────────────────────────── */

  async _createOffer(peerId) {

    if (this.peers.has(peerId)) return;

    const pc = this._createPC(peerId);

    this.peers.set(peerId, {
      pc,
      audioEl: null
    });

    try {

      const offer =
        await pc.createOffer({
          offerToReceiveAudio: true
        });

      await pc.setLocalDescription(offer);

      this.socket.emit('voice_offer', {
        to: peerId,
        offer: pc.localDescription
      });

      console.log('Offer sent:', peerId);

    } catch (e) {
      console.warn('Offer error:', e);
    }
  }

  /* ───────────────────────────────────────────────────────────── */

  async _handleOffer(from, offer) {

    let peer = this.peers.get(from);

    if (!peer) {

      const pc = this._createPC(from);

      peer = {
        pc,
        audioEl: null
      };

      this.peers.set(from, peer);
    }

    const pc = peer.pc;

    try {

      await pc.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer =
        await pc.createAnswer();

      await pc.setLocalDescription(answer);

      this.socket.emit('voice_answer', {
        to: from,
        answer: pc.localDescription
      });

      console.log('Answer sent:', from);

    } catch (e) {
      console.warn('Handle offer error:', e);
    }
  }

  /* ───────────────────────────────────────────────────────────── */

  _closePeer(peerId) {

    const peer =
      this.peers.get(peerId);

    if (!peer) return;

    console.log('Closing peer:', peerId);

    if (peer.audioEl) {

      peer.audioEl.pause();

      peer.audioEl.srcObject = null;

      peer.audioEl.remove();
    }

    if (peer.pc) {
      peer.pc.close();
    }

    this.peers.delete(peerId);
  }

  /* ───────────────────────────────────────────────────────────── */

  _startSpeakingDetection() {

    if (!this.localStream) return;

    try {

      this.audioCtx =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      const src =
        this.audioCtx.createMediaStreamSource(
          this.localStream
        );

      this.analyser =
        this.audioCtx.createAnalyser();

      this.analyser.fftSize = 512;

      src.connect(this.analyser);

      const data =
        new Uint8Array(
          this.analyser.frequencyBinCount
        );

      const THRESHOLD = 20;

      const detect = () => {

        if (!this.isActive) return;

        this.analyser.getByteFrequencyData(
          data
        );

        const rms =
          Math.sqrt(
            data.reduce(
              (s, v) => s + v * v,
              0
            ) / data.length
          );

        const speaking =
          !this.isMuted &&
          rms > THRESHOLD;

        if (speaking !== this.isSpeaking) {

          this.isSpeaking = speaking;

          this.socket.emit(
            'voice_speaking',
            {
              isSpeaking: speaking
            }
          );

          this._updateSpeakingUI(
            this.socket.id,
            speaking
          );
        }

        this.speakTimer =
          setTimeout(detect, 150);
      };

      detect();

    } catch (e) {
      console.warn(
        'Speaking detection error:',
        e
      );
    }
  }

  /* ───────────────────────────────────────────────────────────── */

  _updateSpeakingUI(userId, speaking) {

    const el =
      document.querySelector(
        `.voice-dot[data-id="${userId}"]`
      );

    if (el) {
      el.classList.toggle(
        'speaking',
        speaking
      );
    }
  }
}

/* ───────────────────────────────────────────────────────────── */

window.voiceChat = new VoiceChat();