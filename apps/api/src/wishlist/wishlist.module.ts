import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [WishlistService, PrismaService],
  controllers: [WishlistController],
})
export class WishlistModule {}
