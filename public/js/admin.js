const socket = io();

// Elementos de Conexão TikTok
const tiktokUserInput = document.getElementById('tiktok-user-input');
const btnConnectTikTok = document.getElementById('btn-connect-tiktok');
const btnDisconnectTikTok = document.getElementById('btn-disconnect-tiktok');
const statusDot = document.querySelector('.status-dot');
const connectionText = document.getElementById('connection-text');
const tiktokFeedback = document.getElementById('tiktok-feedback');

// Elementos de Controle
const roundDurationInput = document.getElementById('round-duration-input');
const btnSaveTimer = document.getElementById('btn-save-timer');
const btnToggleTimer = document.getElementById('btn-toggle-timer');
const btnRestartRound = document.getElementById('btn-restart-round');

// Elementos dos Candidatos
const c1NameInput = document.getElementById('c1-name-input');
const c1NumberInput = document.getElementById('c1-number-input');
const c1PartyInput = document.getElementById('c1-party-input');
const c1ColorInput = document.getElementById('c1-color-input');
const c1PhotoInput = document.getElementById('c1-photo-input');

const c2NameInput = document.getElementById('c2-name-input');
const c2NumberInput = document.getElementById('c2-number-input');
const c2PartyInput = document.getElementById('c2-party-input');
const c2ColorInput = document.getElementById('c2-color-input');
const c2PhotoInput = document.getElementById('c2-photo-input');
const btnSaveCandidates = document.getElementById('btn-save-candidates');

// Botões Simuladores
const simVoteC1 = document.getElementById('sim-vote-c1');
const simVoteC2 = document.getElementById('sim-vote-c2');
const simGiftC1 = document.getElementById('sim-gift-c1');
const simGiftC2 = document.getElementById('sim-gift-c2');

// Receber Estado Inicial
socket.on('game_state', state => {
  if (state.tiktokUsername) {
    tiktokUserInput.value = state.tiktokUsername;
  }
  updateConnectionStatus(state.connected, state.tiktokUsername);

  roundDurationInput.value = state.roundDuration;

  // Candidato 1
  c1NameInput.value = state.candidate1.name;
  c1NumberInput.value = state.candidate1.number;
  c1PartyInput.value = state.candidate1.party;
  c1ColorInput.value = state.candidate1.color || '#ef4444';
  c1PhotoInput.value = state.candidate1.photo || '';

  // Candidato 2
  c2NameInput.value = state.candidate2.name;
  c2NumberInput.value = state.candidate2.number;
  c2PartyInput.value = state.candidate2.party;
  c2ColorInput.value = state.candidate2.color || '#22c55e';
  c2PhotoInput.value = state.candidate2.photo || '';

  // Configurações de Conversão & Anti-Restrição
  if (commentsPerVoteInput && state.commentsPerVote) commentsPerVoteInput.value = state.commentsPerVote;
  if (brandTitleInput && state.brandTitle) brandTitleInput.value = state.brandTitle;
  if (giftVotesC1Input && state.giftVotesC1) giftVotesC1Input.value = state.giftVotesC1;
  if (giftVotesC2Input && state.giftVotesC2) giftVotesC2Input.value = state.giftVotesC2;
});

// Status TikTok
socket.on('tiktok_status', data => {
  updateConnectionStatus(data.connected, data.username);
  tiktokFeedback.textContent = data.message;
  tiktokFeedback.style.color = data.connected ? '#4ade80' : '#f87171';
});

function updateConnectionStatus(isConnected, username) {
  if (isConnected) {
    statusDot.className = 'status-dot connected';
    connectionText.textContent = `Conectado em @${username}`;
    btnConnectTikTok.style.display = 'none';
    btnDisconnectTikTok.style.display = 'block';
  } else {
    statusDot.className = 'status-dot disconnected';
    connectionText.textContent = 'TikTok Desconectado';
    btnConnectTikTok.style.display = 'block';
    btnDisconnectTikTok.style.display = 'none';
  }
}

// Chave Euler Opcional
const eulerApiKeyInput = document.getElementById('euler-api-key-input');
if (eulerApiKeyInput) {
  const savedKey = localStorage.getItem('euler_api_key');
  if (savedKey) eulerApiKeyInput.value = savedKey;
}

// Ações do Usuário
btnConnectTikTok.addEventListener('click', () => {
  const user = tiktokUserInput.value.trim();
  if (!user) {
    alert('Digite o seu nome de usuário do TikTok (@)!');
    return;
  }
  const apiKey = eulerApiKeyInput ? eulerApiKeyInput.value.trim() : '';
  if (apiKey) {
    localStorage.setItem('euler_api_key', apiKey);
  } else {
    localStorage.removeItem('euler_api_key');
  }

  tiktokFeedback.textContent = 'Conectando à live...';
  tiktokFeedback.style.color = '#fbbf24';
  socket.emit('connect_tiktok', { username: user, apiKey });
});

btnDisconnectTikTok.addEventListener('click', () => {
  socket.emit('disconnect_tiktok');
});

btnSaveTimer.addEventListener('click', () => {
  const dur = parseInt(roundDurationInput.value, 10);
  if (dur > 0) {
    socket.emit('update_timer_settings', { duration: dur });
    alert('Tempo de rodada atualizado!');
  }
});

btnToggleTimer.addEventListener('click', () => {
  socket.emit('toggle_timer');
});

btnRestartRound.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja zerar os votos e reiniciar a rodada agora?')) {
    socket.emit('restart_round');
  }
});

btnSaveCandidates.addEventListener('click', () => {
  socket.emit('update_candidates', {
    candidate1: {
      name: c1NameInput.value.trim(),
      number: c1NumberInput.value.trim(),
      party: c1PartyInput.value.trim(),
      color: c1ColorInput.value,
      photo: c1PhotoInput.value.trim()
    },
    candidate2: {
      name: c2NameInput.value.trim(),
      number: c2NumberInput.value.trim(),
      party: c2PartyInput.value.trim(),
      color: c2ColorInput.value,
      photo: c2PhotoInput.value.trim()
    }
  });
  alert('Candidatos atualizados com sucesso no jogo!');
});

// Elementos de Conversão e Anti-Restrição
const commentsPerVoteInput = document.getElementById('comments-per-vote-input');
const brandTitleInput = document.getElementById('brand-title-input');
const giftVotesC1Input = document.getElementById('gift-votes-c1-input');
const giftVotesC2Input = document.getElementById('gift-votes-c2-input');
const btnSaveConversion = document.getElementById('btn-save-conversion');
const btnTestSoundC1 = document.getElementById('btn-test-sound-c1');
const btnTestSoundC2 = document.getElementById('btn-test-sound-c2');

if (btnSaveConversion) {
  btnSaveConversion.addEventListener('click', () => {
    socket.emit('update_live_settings', {
      commentsPerVote: parseInt(commentsPerVoteInput.value, 10) || 5,
      brandTitle: brandTitleInput.value.trim() || 'ENQUETE DA LIVE',
      giftVotesC1: parseInt(giftVotesC1Input.value, 10) || 50,
      giftVotesC2: parseInt(giftVotesC2Input.value, 10) || 50
    });
    alert('Regras de conversão e Anti-Restrição salvas com sucesso!');
  });
}

// Teste de Sons Memes
if (btnTestSoundC1) {
  btnTestSoundC1.addEventListener('click', () => {
    if (window.urnaAudio) {
      window.urnaAudio.playCandidateMemeSound('13');
    } else {
      const u = new SpeechSynthesisUtterance("Companheiro!");
      u.lang = 'pt-BR';
      window.speechSynthesis.speak(u);
    }
  });
}

if (btnTestSoundC2) {
  btnTestSoundC2.addEventListener('click', () => {
    if (window.urnaAudio) {
      window.urnaAudio.playCandidateMemeSound('22');
    } else {
      const u = new SpeechSynthesisUtterance("Valeu aí, tá ok?!");
      u.lang = 'pt-BR';
      window.speechSynthesis.speak(u);
    }
  });
}

// Ações do Simulador
simVoteC1.addEventListener('click', () => {
  socket.emit('simulate_vote', {
    candidateNumber: c1NumberInput.value.trim(),
    votes: 1,
    senderName: 'Eleitor_' + Math.floor(Math.random() * 900 + 100)
  });
});

simVoteC2.addEventListener('click', () => {
  socket.emit('simulate_vote', {
    candidateNumber: c2NumberInput.value.trim(),
    votes: 1,
    senderName: 'Eleitor_' + Math.floor(Math.random() * 900 + 100)
  });
});

simGiftC1.addEventListener('click', () => {
  const pts = parseInt(giftVotesC1Input ? giftVotesC1Input.value : 50, 10) || 50;
  socket.emit('simulate_vote', {
    candidateNumber: c1NumberInput.value.trim(),
    votes: pts,
    senderName: 'FãDoLula_' + Math.floor(Math.random() * 90 + 10),
    isGift: true,
    giftName: 'Rosa Vermelha'
  });
});

simGiftC2.addEventListener('click', () => {
  const pts = parseInt(giftVotesC2Input ? giftVotesC2Input.value : 50, 10) || 50;
  socket.emit('simulate_vote', {
    candidateNumber: c2NumberInput.value.trim(),
    votes: pts,
    senderName: 'FãDoCapitão_' + Math.floor(Math.random() * 90 + 10),
    isGift: true,
    giftName: 'Rosa Branca'
  });
});
