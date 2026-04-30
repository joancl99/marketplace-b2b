import {
  Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    // validate stock for all items before creating the order
    for (const item of cartItems) {
      if (!item.product.isActive) {
        throw new BadRequestException(`Product "${item.product.name}" is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}": requested ${item.quantity}, available ${item.product.stock}`,
        );
      }
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          totalAmount,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              subtotal: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // decrement stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });
  }

  async findAll(userId: string, role: Role) {
    const where = role === Role.ADMIN ? {} : { buyerId: userId };

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { include: { images: true } } } },
        buyer: { select: { id: true, name: true, email: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: true } } } },
        buyer: { select: { id: true, name: true, email: true, company: true } },
        transaction: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (role !== Role.ADMIN && order.buyerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    // restore stock if order is cancelled
    if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
      await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: { items: { include: { product: true } } },
    });
  }
}
