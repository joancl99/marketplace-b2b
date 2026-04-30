import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(userId: string, dto: AddToWishlistDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    const exists = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (exists) throw new ConflictException('Product already in wishlist');

    return this.prisma.wishlistItem.create({
      data: { userId, productId: dto.productId },
      include: { product: true },
    });
  }

  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new NotFoundException('Item not in wishlist');

    await this.prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
    return { message: 'Item removed from wishlist' };
  }
}
