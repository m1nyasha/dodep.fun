import type { FeedEventDto } from '@dodep/shared';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WebSocket, type WebSocketServer as WsServer } from 'ws';

// ponytail: рассылка из памяти процесса — один экземпляр API; при нескольких репликах нужен Redis pub/sub.
@WebSocketGateway({ path: '/api/ws', maxPayload: 4096 })
export class FeedGateway {
  @WebSocketServer()
  private readonly server?: WsServer;

  @SubscribeMessage('ping')
  ping() {
    return { event: 'pong' };
  }

  publish(event: FeedEventDto): void {
    const message = JSON.stringify({ event: event.type, data: event });
    for (const client of this.server?.clients ?? []) {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    }
  }
}
