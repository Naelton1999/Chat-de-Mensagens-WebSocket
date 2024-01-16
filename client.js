const WebSocket = require('ws');

const username = process.argv[2]; 
if (!username) {
  console.error('Por favor, forneça um nome de usuário.');
  process.exit(1);
}

const ws = new WebSocket('ws://localhost:3000/' + username);

ws.on('open', () => {
  console.log(`Conectado como ${username}.`);
});

ws.on('message', (message) => {
  const data = JSON.parse(message);
  console.log(data.content);
});

ws.on('close', () => {
  console.log('Conexão encerrada.');
});

process.stdin.on('data', (data) => {
  const message = data.toString().trim();
  if (message.length > 0) {
    ws.send(JSON.stringify({ type: 'message', content: message }));
  }
});
