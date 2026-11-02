const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado do Jogo
const gameState = {
  tiktokUsername: '',
  connected: false,
  roundDuration: 180, // 3 minutos por padrão
  timer: 180,
  isTimerRunning: true,
  candidate1: {
    name: 'LULINHA',
    number: '13',
    party: 'PT',
    color: '#ef4444', // Vermelho
    photo: '/assets/candidate1.png',
    votes: 0
  },
  candidate2: {
    name: 'BOLSONARO',
    number: '22',
    party: 'PL',
    color: '#22c55e', // Verde
    photo: '/assets/candidate2.png',
    votes: 0
  },
  // Configuração de Conversão de Live
  commentsPerVote: 5, // A cada 5 comentários no chat = 1 voto na urna (aumenta o valor dos presentes)
  chatVoteWeight: 1,
  // Presentes por Candidato
  giftVotesC1: 50, // Rosa Vermelha = +50 votos
  giftVotesC2: 50, // Rosa Branca / Coração = +50 votos
  c1GiftName: 'Rosa Vermelha',
  c2GiftName: 'Rosa Branca',
  // Anti-Restrição TikTok
  brandTitle: 'ENQUETE DA LIVE',
  enableMemeAudio: true,
  giftsConfig: {
    rose: { name: 'Rosa Vermelha', votes: 50 },
    whiteRose: { name: 'Rosa Branca', votes: 50 },
    fingerHeart: { name: 'Coração', votes: 50 },
    tiktok: { name: 'TikTok', votes: 50 },
    doughnut: { name: 'Rosquinha', votes: 150 },
    perfume: { name: 'Perfume', votes: 300 },
    cap: { name: 'Boné', votes: 500 },
    weights: { name: 'Haltere', votes: 50 },
    default: { name: 'Outros', votes: 50 }
  }
};

let tiktokLiveConnection = null;
let timerInterval = null;

// Loop do Temporizador
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState.isTimerRunning && gameState.timer > 0) {
      gameState.timer--;
      io.emit('timer_update', { timer: gameState.timer });
      if (gameState.timer === 0) {
        // Fim de rodada
        determineWinner();
      }
    }
  }, 1000);
}

function determineWinner() {
  let winner = null;
  if (gameState.candidate1.votes > gameState.candidate2.votes) {
    winner = gameState.candidate1;
  } else if (gameState.candidate2.votes > gameState.candidate1.votes) {
    winner = gameState.candidate2;
  } else {
    winner = { name: 'EMPATE', number: '--' };
  }
  io.emit('round_winner', {
    winner,
    candidate1: gameState.candidate1,
    candidate2: gameState.candidate2
  });
}

function restartRound() {
  gameState.timer = gameState.roundDuration;
  gameState.candidate1.votes = 0;
  gameState.candidate2.votes = 0;
  gameState.isTimerRunning = true;
  io.emit('game_state', gameState);
}

// Processador de Voto
function processVote(targetCandidateNum, votesCount, senderName = 'Eleitor', avatar = '', isGift = false, giftName = '') {
  const numStr = String(targetCandidateNum).trim();
  let candidate = null;

  if (numStr === String(gameState.candidate1.number)) {
    candidate = gameState.candidate1;
  } else if (numStr === String(gameState.candidate2.number)) {
    candidate = gameState.candidate2;
  }

  if (candidate) {
    candidate.votes += votesCount;
    // Emite o evento de voto para a urna animar e atualizar o placar
    io.emit('new_vote', {
      candidateNumber: candidate.number,
      candidateName: candidate.name,
      party: candidate.party,
      photo: candidate.photo,
      votesAdded: votesCount,
      totalVotesC1: gameState.candidate1.votes,
      totalVotesC2: gameState.candidate2.votes,
      senderName,
      avatar,
      isGift,
      giftName
    });
  }
}

// Conectar ao TikTok
function connectToTikTok(username, apiKey = '') {
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {
      console.log('Desconectando anterior...', e.message);
    }
  }

  const cleanUsername = username.replace('@', '').trim();
  gameState.tiktokUsername = cleanUsername;

  const connOptions = {
    processInitialData: false,
    fetchRoomInfoOnConnect: false,
    enableExtendedGiftInfo: false
  };

  const finalApiKey = apiKey || process.env.EULER_API_KEY || '';
  if (finalApiKey) {
    connOptions.signApiKey = finalApiKey;
  }

  tiktokLiveConnection = new TikTokLiveConnection(cleanUsername, connOptions);

  tiktokLiveConnection.connect()
    .then(state => {
      gameState.connected = true;
      console.log(`[TikTok] Conectado à live de: @${cleanUsername} (Room ID: ${state.roomId})`);
      io.emit('tiktok_status', { connected: true, username: cleanUsername, message: 'Conectado com sucesso!' });
    })
    .catch(err => {
      gameState.connected = false;
      console.error(`[TikTok] Falha ao conectar em @${cleanUsername}:`, err.message);
      io.emit('tiktok_status', { connected: false, username: cleanUsername, message: `Erro ao conectar: ${err.message}` });
    });

  // Contadores para "Tantos comentários = 1 voto"
  let c1Comments = 0;
  let c2Comments = 0;

  // Escutar Comentários do Chat
  tiktokLiveConnection.on(WebcastEvent.CHAT, data => {
    const rawComment = (data.comment || '').trim();
    const comment = rawComment.toLowerCase();
    const c1Num = String(gameState.candidate1.number);
    const c2Num = String(gameState.candidate2.number);
    const senderName = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Eleitor';
    const avatar = data.user?.profilePicture?.urls?.[0] || data.profilePictureUrl || '';

    const reqComments = Math.max(1, parseInt(gameState.commentsPerVote, 10) || 1);

    const matchesC1 = comment === c1Num || comment.startsWith(c1Num + ' ') || comment.endsWith(' ' + c1Num) || comment === 'lula' || comment === 'lulinha';
    const matchesC2 = comment === c2Num || comment.startsWith(c2Num + ' ') || comment.endsWith(' ' + c2Num) || comment === 'bolsonaro' || comment === 'mito';

    if (matchesC1) {
      c1Comments++;
      io.emit('chat_progress', { candidateNumber: c1Num, current: c1Comments, required: reqComments, senderName });
      if (c1Comments >= reqComments) {
        c1Comments = 0;
        processVote(c1Num, gameState.chatVoteWeight || 1, senderName, avatar);
      }
    } else if (matchesC2) {
      c2Comments++;
      io.emit('chat_progress', { candidateNumber: c2Num, current: c2Comments, required: reqComments, senderName });
      if (c2Comments >= reqComments) {
        c2Comments = 0;
        processVote(c2Num, gameState.chatVoteWeight || 1, senderName, avatar);
      }
    }
  });

  // Escutar Presentes (Gifts)
  tiktokLiveConnection.on(WebcastEvent.GIFT, data => {
    const giftType = data.giftDetails?.giftType ?? data.giftType;
    if (giftType === 1 && !data.repeatEnd) {
      // Combo em andamento - espera finalizar para computar total
      return;
    }

    const rawGiftName = data.giftDetails?.giftName || data.giftName || 'Presente';
    const giftName = rawGiftName.toLowerCase();
    const count = data.repeatCount || 1;
    const senderName = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Apoiador';
    const avatar = data.user?.profilePicture?.urls?.[0] || data.profilePictureUrl || '';

    let voteFor = null;
    let votesAwarded = 50 * count;

    // Detecção Inteligente e Segura:
    // 1. Rosa Branca ou presentes do Bolsonaro (Candidato 2)
    const isWhiteRose = giftName.includes('branc') || giftName.includes('white');
    const isBolsonaroGift = isWhiteRose || giftName.includes('cora') || giftName.includes('heart') || giftName.includes('tiktok') || giftName.includes('dedo');
    // 2. Rosa Vermelha ou presentes do Lula (Candidato 1)
    const isRedRose = (giftName.includes('rose') || giftName.includes('rosa')) && !isWhiteRose;

    if (isBolsonaroGift) {
      voteFor = gameState.candidate2.number;
      votesAwarded = (gameState.giftVotesC2 || 50) * count;
    } else if (isRedRose) {
      voteFor = gameState.candidate1.number;
      votesAwarded = (gameState.giftVotesC1 || 50) * count;
    } else {
      // Outros presentes
      voteFor = gameState.candidate2.number;
      votesAwarded = (gameState.giftsConfig[giftName]?.votes || 50) * count;
    }

    if (voteFor) {
      processVote(voteFor, votesAwarded, senderName, avatar, true, rawGiftName);
    }
  });

  // Escutar Curtidas (Likes)
  let accumulatedLikes = 0;
  tiktokLiveConnection.on(WebcastEvent.LIKE, data => {
    accumulatedLikes += data.likeCount || 1;
    if (accumulatedLikes >= 15) {
      accumulatedLikes = 0;
      io.emit('likes_trigger', { count: data.likeCount, total: data.totalLikeCount });
    }
  });

  tiktokLiveConnection.on(ControlEvent.DISCONNECTED, () => {
    gameState.connected = false;
    io.emit('tiktok_status', { connected: false, username: cleanUsername, message: 'Live desconectada.' });
  });

  tiktokLiveConnection.on(ControlEvent.ERROR, err => {
    console.error('[TikTok Event Error]', err);
  });
}

// Sockets e Endpoints
io.on('connection', socket => {
  // Envia estado completo ao conectar novo cliente
  socket.emit('game_state', gameState);

  // Painel de Admin solicita conexão TikTok
  socket.on('connect_tiktok', ({ username, apiKey }) => {
    if (username) connectToTikTok(username, apiKey);
  });

  socket.on('disconnect_tiktok', () => {
    if (tiktokLiveConnection) {
      tiktokLiveConnection.disconnect();
      gameState.connected = false;
      io.emit('tiktok_status', { connected: false, message: 'Desconectado manualmente' });
    }
  });

  // Atualizar configurações dos candidatos
  socket.on('update_candidates', data => {
    if (data.candidate1) Object.assign(gameState.candidate1, data.candidate1);
    if (data.candidate2) Object.assign(gameState.candidate2, data.candidate2);
    io.emit('game_state', gameState);
  });

  // Atualizar regras de tempo
  socket.on('update_timer_settings', ({ duration }) => {
    gameState.roundDuration = parseInt(duration, 10) || 180;
    gameState.timer = gameState.roundDuration;
    io.emit('game_state', gameState);
  });

  // Reiniciar rodada
  socket.on('restart_round', () => {
    restartRound();
  });

  // Pausar/Retomar timer
  socket.on('toggle_timer', () => {
    gameState.isTimerRunning = !gameState.isTimerRunning;
    io.emit('timer_toggle', { isTimerRunning: gameState.isTimerRunning });
  });

  // Atualizar configurações da live (comentários por voto, presentes, etc)
  socket.on('update_live_settings', data => {
    if (data.commentsPerVote !== undefined) gameState.commentsPerVote = Math.max(1, parseInt(data.commentsPerVote, 10) || 1);
    if (data.giftVotesC1 !== undefined) gameState.giftVotesC1 = parseInt(data.giftVotesC1, 10) || 50;
    if (data.giftVotesC2 !== undefined) gameState.giftVotesC2 = parseInt(data.giftVotesC2, 10) || 50;
    if (data.c1GiftName !== undefined) gameState.c1GiftName = data.c1GiftName;
    if (data.c2GiftName !== undefined) gameState.c2GiftName = data.c2GiftName;
    if (data.brandTitle !== undefined) gameState.brandTitle = data.brandTitle;
    if (data.enableMemeAudio !== undefined) gameState.enableMemeAudio = !!data.enableMemeAudio;
    io.emit('game_state', gameState);
  });

  // Voto simulado (para testes locais sem precisar de live aberta)
  socket.on('simulate_vote', ({ candidateNumber, votes, senderName, isGift, giftName }) => {
    processVote(candidateNumber, votes || 1, senderName || 'Testador', '', isGift, giftName);
  });
});

// Inicia o timer
startTimer();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`   LIVE INTERATIVA - URNA ELETRÔNICA DO TIKTOK     `);
  console.log(`====================================================`);
  console.log(`-> Overlay da Live (OBS / Studio): http://localhost:${PORT}`);
  console.log(`-> Painel de Controle (Admin):     http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});
