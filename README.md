# 🗳️ Urna Eletrônica Interativa para TikTok Live

Sistema interativo de votação e disputa em tempo real para transmissões no **TikTok Live**, totalmente customizável, com animação da urna eletrônica, sons realistas, mecânica de engajamento para presentes e painel de controle completo para o streamer.

---

## 📸 Visão Geral

- **Overlay da Live (`/`):** Exibe a urna eletrônica animada com dedo indicador teclando, placar dinâmico, barra de disputa (cabo de guerra), feed flutuante de votos e tela de vitória da rodada.
- **Painel do Streamer (`/admin.html`):** Controle total da live em tempo real — conexão com TikTok, personalização dos candidatos, metas de comentários, pontuação de presentes e simulador de votos para testes.

---

## ✨ Funcionalidades Principais

### 🗳️ Urna Eletrônica & Animação Realista
- **Layout Fiel à Urna:** Gabinete clássico, teclado numérico com botões *Branco*, *Corrige* e *Confirma*, e tela LCD verde com scanlines.
- **Mãozinha Animada Dinâmica:** Dedo indicador com física de clique que se desloca exatamente até as teclas digitadas e pressiona o botão *Confirma*.
- **Fila Inteligente de Votação:** Sistema com aceleração dinâmica automática para suportar enxurradas de votos no chat sem atrasar ou travar a live.
- **Tela de Fim:** Transição idêntica à oficial com exibição de "FIM / VOTO GRAVADO".

### 🔊 Efeitos Sonoros & Memes
- **Sons Oficiais via Web Audio API:** Bipe de tecla e arpeggio triunfal *"pi-li-li-liim"* da confirmação gerados por osciladores matemáticos com latência zero e sem dependência de áudio externo.
- **Vozes e Bordões dos Candidatos:** Reprodução automática de memes ao enviar presentes (Lula: *"Companheiro!"*, Bolsonaro: *"Valeu aí, tá ok?!"*) via síntese de voz nativa (`SpeechSynthesis`) ou arquivos MP3 locais.

### 💰 Conversão da Live & Mecânicas de Engajamento
- **Meta de Comentários no Chat:** Configure quantos comentários são necessários para gerar 1 voto na urna (ex: a cada 5 comentários = 1 voto), aquecendo o algoritmo do TikTok e incentivando presentes.
- **Presentes com Super Votos (Gifts):** Rosas e presentes especiais concedem blocos de votos (ex: +50 votos), virando o jogo instantaneamente.
- **Detecção Inteligente de Presentes:** Reconhece Rosa Vermelha, Rosa Branca, Coração, TikTok, Rosquinha, Boné, Perfume e outros.
- **Reconhecimento Flexível de Voto:** Aceita número direto (`13`, `22`), número com texto ou apelidos populares (`lula`, `lulinha`, `bolsonaro`, `mito`).

### 🛡️ Proteção & Diretrizes TikTok (Anti-Restrição)
- **Letreiro Personalizável:** Evita o uso de nomes institucionais (como "Justiça Eleitoral") substituindo por **"ENQUETE DA LIVE"**, prevenindo punições ou derrubada da transmissão por falsidade ideológica/autoridade pública.
- **Aviso de Conformidade:** Rodapé com declaração explícita de entretenimento e humor sem vínculo partidário.

### 🎛️ Painel de Controle do Streamer (`/admin.html`)
- **Conexão com 1 Clique:** Basta digitar o `@usuario` da sua conta TikTok (a live já deve estar aberta).
- **Suporte a API Opcional:** Campo dedicado para chave EulerStream caso queira redundância ou use a conexão direta gratuita.
- **Edição em Tempo Real dos Candidatos:** Altere nomes, números de 2 dígitos, partidos, cores temáticas e URLs de foto a qualquer momento durante a live.
- **Gestão da Partida:** Ajuste do tempo de rodada em segundos, pausar/retomar cronômetro e reiniciar rodada com zeramento de votos.
- **Simulador de Testes Integrado:** Botões para disparar comentários e presentes de ambos os candidatos sem precisar estar ao vivo.

---

## 📁 Estrutura do Projeto

```text
live-interativa-voto/
├── package.json               # Configurações e dependências do Node.js
├── server.js                 # Servidor Express, Socket.IO e conector TikTok Live
├── public/
│   ├── index.html            # Overlay do jogo para OBS / TikTok Studio
│   ├── admin.html            # Painel de controle do streamer
│   ├── css/
│   │   ├── style.css         # Estilização do overlay e urna eletrônica
│   │   └── admin.css         # Estilização do painel administrativo
│   ├── js/
│   │   ├── main.js           # Gerenciador do overlay e sockets
│   │   ├── admin.js          # Lógica do painel de controle
│   │   ├── urna.js           # Controlador de animação e fila da urna
│   │   └── audio.js          # Síntese sonora (TSE) e memes via Web Audio API
│   └── assets/               # Imagens, SVGs e ícones dos candidatos e presentes
```

---

## 🚀 Como Instalar e Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada).

### 1. Clonar ou Baixar o Repositório
```bash
git clone https://github.com/joaopaulogomesgv/live-voto.git
cd live-voto
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Iniciar o Servidor
```bash
npm start
```
*(ou `npm run dev`)*

O terminal exibirá os links de acesso:
- **Overlay da Live:** [http://localhost:3000](http://localhost:3000)
- **Painel de Controle:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🎬 Como Transmitir no TikTok LIVE Studio / OBS Studio

1. Abra o **TikTok LIVE Studio** (ou OBS Studio) e inicie sua transmissão ao vivo no TikTok.
2. No seu software de transmissão, clique em **Adicionar Fonte (+)** > selecione **Navegador (Browser Source)**.
3. Configure os seguintes parâmetros:
   - **URL:** `http://localhost:3000`
   - **Largura (Width):** `1080`
   - **Altura (Height):** `1920` (ou ajuste para a proporção vertical da sua tela 9:16).
4. Abra o painel [http://localhost:3000/admin.html](http://localhost:3000/admin.html) em uma aba do navegador ou no celular.
5. Digite o seu `@usuario` do TikTok e clique em **Conectar**.
6. Os comentários e presentes do público serão computados automaticamente em tempo real!

---

## ⌨️ Atalhos Rápidos para Teste Local

Na tela do Overlay ([http://localhost:3000](http://localhost:3000)), você pode testar via teclado:

| Tecla | Ação |
| :---: | :--- |
| `1` | Dispara +1 voto para o Candidato 1 |
| `2` | Dispara +1 voto para o Candidato 2 |
| `R` | Simula o envio de 1 Rosa (+10 votos comemorativos) |

Além disso, o painel `/admin.html` possui botões dedicados de simulação rápida.

---

## 🛠️ Tecnologias Utilizadas

- **[Node.js](https://nodejs.org/)** com **[Express](https://expressjs.com/)**
- **[Socket.IO](https://socket.io/)** para comunicação bidirecional em tempo real e ultra baixa latência
- **[tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector)** para conexão com o Webcast do TikTok
- **Web Audio API & Web Speech API** para síntese dos efeitos da urna e vozes dos candidatos
- **HTML5, CSS3 Moderno (Flexbox / Grid) e Vanilla JavaScript**

---

## 📄 Licença

Este projeto é desenvolvido para fins de entretenimento, gamificação e transmissões ao vivo.
