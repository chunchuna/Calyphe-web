const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 存储在线用户
const onlineUsers = new Map(); // Map<websocket, {ip, position, sprite}>

wss.on('connection', (ws, req) => {
    // 获取真实IP地址，去除IPv6前缀
    const ip = req.socket.remoteAddress.replace(/^::ffff:/, '');
    console.log(`新用户连接: ${ip}`);
    
    // 存储用户信息
    onlineUsers.set(ws, {
        ip: ip,
        position: { x: 0, y: 0 },
        sprite: '🧙‍♂️'
    });
    
    // 发送当前在线用户数量给新用户
    ws.send(JSON.stringify({
        type: 'onlineCount',
        count: onlineUsers.size
    }));
    
    // 广播新用户加入消息给其他用户
    broadcastMessage({
        type: 'userJoined',
        ip: ip,
        count: onlineUsers.size
    }, ws);
    
    // 立即广播位置信息
    broadcastPositions();
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'position':
                    if (onlineUsers.has(ws)) {
                        const user = onlineUsers.get(ws);
                        user.position = data.position;
                        // 广播位置更新给其他用户
                        broadcastPositions();
                    }
                    break;
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
        }
    });
    
    ws.on('close', () => {
        const user = onlineUsers.get(ws);
        if (user) {
            console.log(`用户断开连接: ${user.ip}`);
            onlineUsers.delete(ws);
            // 广播用户离开的消息
            broadcastMessage({
                type: 'userLeft',
                ip: user.ip,
                count: onlineUsers.size
            });
        }
    });
});

function broadcastMessage(message, exclude = null) {
    wss.clients.forEach(client => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function broadcastPositions() {
    const positions = Array.from(onlineUsers.values()).map(user => ({
        ip: user.ip,
        position: user.position,
        sprite: user.sprite
    }));
    
    broadcastMessage({
        type: 'positions',
        positions: positions
    });
}

server.listen(8080, () => {
    console.log('WebSocket 服务器运行在端口 8080');
}); 