import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to MySQL database');
    } catch (error) {
      this.logger.warn(`Could not connect to database at startup: ${error instanceof Error ? error.message : error}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
