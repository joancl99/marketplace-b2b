import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      host: this.config.get<string>('DB_HOST'),
      port: Number(this.config.get<string>('DB_PORT')),
      user: this.config.get<string>('DB_USER'),
      password: this.config.get<string>('DB_PASSWORD'),
      database: this.config.get<string>('DB_NAME'),
    });
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows as T[];
  }

  async ping(): Promise<boolean> {
    const rows = await this.query<{ ok: number }>('SELECT 1 as ok;');
    return rows?.[0]?.ok === 1;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}