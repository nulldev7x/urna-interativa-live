// Gerador e Reprodutor dos Sons Oficiais da Urna Eletrônica via Web Audio API
class UrnaAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Som curto ao teclar cada número ("Bip")
  playKeyBeep() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // 880Hz (A5)

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Som inconfundível do CONFIRMA do TSE ("Pi-li-li-liim")
  playConfirmaSound() {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    
    // As 4 notas características do arpeggio de encerramento da urna do TSE
    const notes = [
      { freq: 784, time: 0.00, dur: 0.08 },  // Sol 5
      { freq: 987, time: 0.08, dur: 0.08 },  // Si 5
      { freq: 1175, time: 0.16, dur: 0.08 }, // Ré 6
      { freq: 1568, time: 0.24, dur: 0.85 }  // Sol 6 (sustentado e triunfante)
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle'; // Onda triangular dá o timbre idêntico ao sintetizador da urna
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.25, now + n.time);
      if (n.dur > 0.2) {
        gain.gain.setValueAtTime(0.25, now + n.time + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);
      } else {
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // Som de erro / Corrige
  playErrorSound() {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Som especial para presentes (Gifts)
  playGiftSound() {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // Acorde Dó Maior animado
    
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + (idx * 0.05));

      gain.gain.setValueAtTime(0.18, now + (idx * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.05) + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + (idx * 0.05));
      osc.stop(now + (idx * 0.05) + 0.3);
    });
  }

  // Reproduz Bordões e Memes Icônicos do Lula e Bolsonaro
  playCandidateMemeSound(candidateNumber) {
    if (!this.enabled) return;
    this.init();

    const isLula = String(candidateNumber) === '13';
    const soundFile = isLula ? '/assets/sounds/lula.mp3' : '/assets/sounds/bolsonaro.mp3';
    
    // Toca acorde sonoro
    this.playGiftSound();

    // 1. Tenta reproduzir arquivo de áudio local se existir
    const audio = new Audio(soundFile);
    audio.play().then(() => {
      // Tocou com sucesso o MP3
    }).catch(() => {
      // 2. Se o MP3 não estiver na pasta, usa o sintetizador com os bordões icônicos!
      this.playSynthesizedMeme(isLula);
    });
  }

  playSynthesizedMeme(isLula) {
    if (!('speechSynthesis' in window)) return;
    
    const lulaPhrases = [
      "Companheiro!",
      "Valeu pela rosa, companheiro!",
      "Obrigado pelo presente, companheiro!",
      "É 13, companheiro!"
    ];

    const bolsonaroPhrases = [
      "Valeu aí, tá ok?!",
      "É o capitão, tá ok?!",
      "Valeu pela rosa branca, tá ok?!",
      "Brasil acima de tudo, tá ok?!"
    ];

    const phrases = isLula ? lulaPhrases : bolsonaroPhrases;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = 'pt-BR';
    utter.rate = 1.05;
    utter.pitch = isLula ? 0.75 : 1.15; // Tom mais grave para Lula, mais agudo/rápido para Bolsonaro

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.includes('BR'));
    if (ptVoice) utter.voice = ptVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}

window.urnaAudio = new UrnaAudio();
