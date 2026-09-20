import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AntiCircumventionService } from '../anti-circumvention/anti-circumvention.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('ChatGateway');

  constructor(private antiCircumvention: AntiCircumventionService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Chat: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Chat: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conv_${data.conversationId}`);
    return { event: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      jobId: string;
      conversationId: string;
      senderId: string;
      recipientId: string;
      text: string;
    },
  ) {
    // Scan message for circumvention before broadcasting
    const scanResult = await this.antiCircumvention.scanChatMessage(
      data.jobId,
      data.senderId,
      data.recipientId,
      data.text,
    );

    const payload = {
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: scanResult.sanitizedMessage,
      isFlagged: scanResult.isSuspicious,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`conv_${data.conversationId}`).emit('new_message', payload);
    return payload;
  }
}
