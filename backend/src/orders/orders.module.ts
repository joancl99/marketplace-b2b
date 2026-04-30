import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [OrdersService, CartService, PrismaService],
  controllers: [OrdersController, CartController],
  exports: [OrdersService],
})
export class OrdersModule {}
