const express = require('express');
const WebSocket = require('ws');
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Copa2022$',
  database: 'chat'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados MySQL.');
});

const app = express();
app.use(express.json());

const server = app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

wss.on('connection', (ws, request) => {
  const username = request.url.substr(1);

  clients.set(username, ws);

  ws.send(JSON.stringify({ type: 'message', content: `Bem-vindo(a), ${username}!` }));

  broadcast({ type: 'notification', content: `${username} entrou na sala.` });

  ws.on('message', (message) => {
    handleMessage(username, message);
  });

  ws.on('close', () => {
    clients.delete(username);
    broadcast({ type: 'notification', content: `${username} saiu da sala.` });
  });
});

function handleMessage(sender, message) {
  try {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'message':
        saveMessage(sender, data.content); 
        broadcast({ type: 'message', content: `${sender}: ${data.content}` });
        break;
      case 'privateMessage':
        sendPrivateMessage(sender, data);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Erro ao analisar a mensagem:', error);
  }
}

function saveMessage(sender, content) {
  const sql = 'INSERT INTO mensagens (remetente, conteudo) VALUES (?, ?)';
  db.query(sql, [sender, content], (err) => {
    if (err) {
      console.error('Erro ao salvar a mensagem no banco de dados:', err);
    }
  });
}

function sendPrivateMessage(sender, data) {
  const recipient = clients.get(data.recipient);

  if (recipient) {
    recipient.send(JSON.stringify({
      type: 'privateMessage',
      content: `[Mensagem Privada de ${sender}]: ${data.content}`,
    }));
  }
}

function broadcast(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});



