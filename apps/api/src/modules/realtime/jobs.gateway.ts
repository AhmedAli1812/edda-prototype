import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'jobs',
  cors: { origin: '*' },
})
export class JobTrackingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('JobTrackingGateway');

  @SubscribeMessage('subscribe_job')
  handleSubscribeJob(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    client.join(`job_${data.jobId}`);
    return { event: 'subscribed', jobId: data.jobId };
  }

  @SubscribeMessage('technician_location_update')
  handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string; lat: number; lng: number; heading?: number },
  ) {
    this.server.to(`job_${data.jobId}`).emit('technician_moved', {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastJobStatusChange(jobId: string, status: string, details?: any) {
    this.server.to(`job_${jobId}`).emit('job_status_changed', {
      jobId,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

@WebSocketGateway({
  namespace: 'offers',
  cors: { origin: '*' },
})
export class OffersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe_request')
  handleSubscribeRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requestId: string },
  ) {
    client.join(`req_${data.requestId}`);
    return { event: 'subscribed', requestId: data.requestId };
  }

  broadcastNewOffer(requestId: string, offer: any) {
    this.server.to(`req_${requestId}`).emit('new_offer_received', offer);
  }
}

@WebSocketGateway({
  namespace: 'orders',
  cors: { origin: '*' },
})
export class StoreOrdersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe_store')
  handleSubscribeStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storeId: string },
  ) {
    client.join(`store_${data.storeId}`);
    return { event: 'subscribed', storeId: data.storeId };
  }

  broadcastNewStoreOrder(storeId: string, order: any) {
    this.server.to(`store_${storeId}`).emit('new_store_order', order);
  }
}
