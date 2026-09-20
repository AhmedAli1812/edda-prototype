import { Module, Global } from '@nestjs/common';
import { AntiCircumventionService } from './anti-circumvention.service';

@Global()
@Module({
  providers: [AntiCircumventionService],
  exports: [AntiCircumventionService],
})
export class AntiCircumventionModule {}
