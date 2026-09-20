import { Module, Global } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JobTrackingGateway, OffersGateway, StoreOrdersGateway } from './jobs.gateway';

@Global()
@Module({
  providers: [ChatGateway, JobTrackingGateway, OffersGateway, StoreOrdersGateway],
  exports: [ChatGateway, JobTrackingGateway, OffersGateway, StoreOrdersGateway],
})
export class RealtimeModule {}
