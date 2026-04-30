import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { images: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const total = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return { items, total: total.toFixed(2) };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    if (product.stock < dto.quantity) {
      throw new BadRequestException(`Only ${product.stock} units available`);
    }

    return this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { quantity: dto.quantity },
      create: { userId, productId: dto.productId, quantity: dto.quantity },
      include: { product: true },
    });
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Item not in cart');
    if (item.product.stock < dto.quantity) {
      throw new BadRequestException(`Only ${item.product.stock} units available`);
    }

    return this.prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new NotFoundException('Item not in cart');

    await this.prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Cart cleared' };
  }
}
