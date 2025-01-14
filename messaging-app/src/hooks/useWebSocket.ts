// src/hooks/useWebSocket.ts
import { useState, useEffect } from 'react';
import { Message, WebSocketMessage } from '../types';

const WS_BASE_URL = 'ws://localhost:8080';

export const useWebSocket = (userId: string, onMessageReceived: (message: Message) => void) => {
    const [connected, setConnected] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!userId) return;

        const websocket = new WebSocket(`${WS_BASE_URL}/api/messages/ws/${userId}`);

        websocket.onopen = () => {
            console.log('WebSocket Bağlantı kuruldu');
            setConnected(true);
        };

        websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'message') {
                    onMessageReceived(message);
                }
            } catch (error) {
                console.error('WebSocket mesaj işleme hatası:', error);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket bağlantı hatası:', error);
            setConnected(false);
        };

        websocket.onclose = () => {
            console.log('WebSocket Bağlantı kapandı');
            setConnected(false);
        };

        setWs(websocket);

        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, [userId, onMessageReceived]);

    const sendMessage = (message: WebSocketMessage) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket bağlantısı kapalı');
            return;
        }
        ws.send(JSON.stringify(message));
    };

    return { connected, sendMessage };
};