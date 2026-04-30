import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post()
  addItem(@CurrentUser() user: any, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(user.id, dto);
  }

  @Delete(':productId')
  removeItem(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(user.id, productId);
  }
}
