const WebSocket = require('ws');

let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket 客户端已连接');

    ws.on('close', () => {
      console.log('WebSocket 客户端已断开');
    });

    ws.on('message', (message) => {
      console.log('收到消息:', message);
      // 这里可以处理客户端发来的消息，例如心跳检测
    });
  });

  console.log('WebSocket 服务器已启动');
}

function broadcast(message) {
  if (!wss) {
    console.error('WebSocket 服务器尚未初始化。');
    return;
  }

  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = { initWebSocket, broadcast };
