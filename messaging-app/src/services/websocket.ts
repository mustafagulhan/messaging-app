// src/services/websocket.ts
import { Message, WebSocketMessage } from '../types';

type MessageCallback = (message: Message) => void;

export class WebSocketService {
    private ws: WebSocket | null = null;
    private messageCallback: MessageCallback | null = null;

    connect(userId: string) {
        this.ws = new WebSocket(`ws://localhost:8080/api/messages/ws/${userId}`);

        this.ws.onopen = () => {
            console.log('WebSocket bağlantısı kuruldu');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.messageCallback) {
                this.messageCallback(message);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket hatası:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket bağlantısı kapandı');
            // Bağlantıyı yeniden kurmayı deneyebiliriz
            setTimeout(() => this.connect(userId), 3000);
        };
    }

    sendMessage(message: WebSocketMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket bağlantısı kapalı');
        }
    }

    onMessage(callback: MessageCallback) {
        this.messageCallback = callback;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}