import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { PoolConfig } from 'mariadb';

export function parseDatabaseUrl(databaseUrl: string): PoolConfig {
  const url = new URL(databaseUrl);
  const host = url.hostname || 'localhost';
  const port = url.port ? parseInt(url.port, 10) : 3306;
  const user = url.username ? decodeURIComponent(url.username) : undefined;
  const password = url.password ? decodeURIComponent(url.password) : undefined;
  const rawPath = url.pathname.replace(/^\//, '');
  const database = rawPath ? decodeURIComponent(rawPath) : undefined;

  const config: PoolConfig = {
    host,
    port,
    user,
    password,
    database,
  };

  const connectionLimit = url.searchParams.get('connection_limit') || url.searchParams.get('connectionLimit');
  if (connectionLimit) {
    config.connectionLimit = parseInt(connectionLimit, 10);
  }

  const connectTimeout = url.searchParams.get('connect_timeout') || url.searchParams.get('connectTimeout');
  if (connectTimeout) {
    config.connectTimeout = parseInt(connectTimeout, 10);
  }

  const ssl = url.searchParams.get('ssl');
  if (ssl === 'true' || ssl === '1') {
    config.ssl = true;
  }

  return config;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor(@Optional() private readonly configService?: ConfigService) {
    const databaseUrl = configService?.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    const dbConfig = databaseUrl ? parseDatabaseUrl(databaseUrl) : { host: 'localhost', port: 3306 };
    const adapter = new PrismaMariaDb(dbConfig as any);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to MySQL/MariaDB database via JavaScript driver adapter');
    } catch (error) {
      this.logger.warn(`Could not connect to database at startup: ${error instanceof Error ? error.message : error}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
