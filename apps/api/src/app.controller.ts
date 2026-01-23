import { Controller, Get } from '@nestjs/common';

// Servicio con lógica básica
import { AppService } from './app.service';

// Servicio de base de datos
import { DbService } from './db.service';

// Controlador principal (ruta base "/")
@Controller()
export class AppController {

  // NestJS inyecta automáticamente estos servicios
  constructor(
    private readonly appService: AppService,
    private readonly db: DbService,
  ) {}

  // Endpoint GET /
  @Get()
  getHello(): string {
    // Delegamos la lógica al servicio
    return this.appService.getHello();
  }

  // Endpoint GET /db-health
  @Get('db-health')
  async dbHealth() {
    // Comprobamos conexión con la base de datos
    const ok = await this.db.ping();

    // Devolvemos un objeto JSON
    return { ok };
  }
}