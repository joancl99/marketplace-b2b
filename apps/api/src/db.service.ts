import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

// Servicio inyectable para acceder a PostgreSQL
@Injectable()
export class DbService implements OnModuleDestroy {

  // Pool de conexiones a la base de datos
  private pool: Pool;

  // Nest inyecta ConfigService automáticamente
  constructor(private readonly config: ConfigService) {

    // Se crea el pool usando variables de entorno
    this.pool = new Pool({
      host: this.config.get<string>('DB_HOST'),
      port: Number(this.config.get<string>('DB_PORT')),
      user: this.config.get<string>('DB_USER'),
      password: this.config.get<string>('DB_PASSWORD'),
      database: this.config.get<string>('DB_NAME'),
    });
  }

  // Ejecuta una consulta SQL genérica
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows as T[];
  }

  // Comprueba si la base de datos responde correctamente
  async ping(): Promise<boolean> {
    const rows = await this.query<{ ok: number }>('SELECT 1 as ok;');
    return rows?.[0]?.ok === 1;
  }

  // Se ejecuta cuando la app se cierra
  async onModuleDestroy() {
    await this.pool.end();
  }
}