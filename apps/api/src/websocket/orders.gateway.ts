import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class OrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    client.emit('joined_room', room);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
  }

  emitOrderCreated(order: any) {
    this.server.to('room:orders').emit('order:created', order);
    this.server.to('room:kitchen').emit('order:created', order);
  }

  emitOrderUpdated(order: any) {
    this.server.to('room:orders').emit('order:updated', order);
    this.server.to('room:kitchen').emit('order:updated', order);
    this.server.to('room:delivery').emit('order:updated', order);
  }
}
