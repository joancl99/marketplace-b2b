import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controlador principal (maneja peticiones HTTP)
import { AppController } from './app.controller';

// Servicio base (lógica simple)
import { AppService } from './app.service';

// Servicio de base de datos (PostgreSQL)
import { DbService } from './db.service';

@Module({
  // Módulos externos que este módulo necesita
  imports: [
    // Carga variables de entorno desde .env
    // isGlobal: true => disponible en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],

  // Controladores que manejan rutas HTTP
  controllers: [AppController],

  // Servicios que Nest puede inyectar en otras clases
  providers: [
    AppService, // lógica básica
    DbService,  // conexión a PostgreSQL
  ],
})
export class AppModule {}