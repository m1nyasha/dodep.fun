import type { FeedEventDto } from '@dodep/shared';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WebSocket, type WebSocketServer as WsServer } from 'ws';

@WebSocketGateway({ path: '/api/ws' })
export class FeedGateway {
  @WebSocketServer()
  private readonly server?: WsServer;

  publish(event: FeedEventDto): void {
    const message = JSON.stringify({ event: event.type, data: event });
    for (const client of this.server?.clients ?? []) {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    }
  }
}
