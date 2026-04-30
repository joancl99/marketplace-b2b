import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AnalyticsQueryDto, Period } from './dto/analytics-query.dto';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Dashboard overview ───────────────────────────────────────────────────

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueThisMonth,
      ordersThisMonth,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.count({
        where: { status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.order.count({
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.getTopProducts({ limit: 5 }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: { not: OrderStatus.CANCELLED } },
        include: {
          buyer: { select: { name: true, company: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0).toFixed(2),
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueThisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0).toFixed(2),
      ordersThisMonth,
      topProducts,
      recentOrders,
    };
  }

  // ─── Top products ─────────────────────────────────────────────────────────

  async getTopProducts(query: Pick<AnalyticsQueryDto, 'limit' | 'from' | 'to' | 'categoryId'>) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      where: {
        order: {
          status: { not: OrderStatus.CANCELLED },
          ...dateFilter,
        },
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: query.limit ?? 10,
    });

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      include: { category: true, images: { where: { isPrimary: true } } },
    });

    const returnCounts = await this.prisma.return.groupBy({
      by: ['productId'],
      _count: { id: true },
      where: { productId: { in: items.map((i) => i.productId) } },
    });

    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const returns = returnCounts.find((r) => r.productId === item.productId)?._count.id ?? 0;
      const totalSold = item._count.id;
      const returnRate = totalSold > 0 ? ((returns / totalSold) * 100).toFixed(2) : '0.00';

      return {
        productId: item.productId,
        name: product?.name ?? 'Unknown',
        category: product?.category?.name ?? 'Unknown',
        image: product?.images?.[0]?.url ?? null,
        unitsSold: item._sum.quantity ?? 0,
        revenue: Number(item._sum.subtotal ?? 0).toFixed(2),
        returnRate: `${returnRate}%`,
      };
    });
  }

  // ─── Sales by period ──────────────────────────────────────────────────────

  async getSales(query: AnalyticsQueryDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const [revenue, units, orders] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: OrderStatus.CANCELLED }, ...dateFilter },
      }),
      this.prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: { order: { status: { not: OrderStatus.CANCELLED }, ...dateFilter } },
      }),
      this.prisma.order.count({
        where: { status: { not: OrderStatus.CANCELLED }, ...dateFilter },
      }),
    ]);

    const byStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      where: dateFilter,
    });

    return {
      totalRevenue: Number(revenue._sum.totalAmount ?? 0).toFixed(2),
      totalUnits: units._sum.quantity ?? 0,
      totalOrders: orders,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    };
  }

  // ─── Demand evolution over time ───────────────────────────────────────────

  async getDemand(query: AnalyticsQueryDto) {
    const period = query.period ?? Period.DAY;
    const truncMap = { day: 'day', week: 'week', month: 'month' };
    const trunc = truncMap[period];

    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 86400000);
    const to = query.to ? new Date(query.to) : new Date();

    const rows = await this.prisma.$queryRaw<
      { date: Date; orders: number; revenue: string; units: number }[]
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${trunc}'`)}, o."createdAt")   AS date,
        COUNT(DISTINCT o.id)::int                                AS orders,
        COALESCE(SUM(o."totalAmount"), 0)::float                 AS revenue,
        COALESCE(SUM(oi.quantity), 0)::int                       AS units
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o.status != 'CANCELLED'
        AND o."createdAt" >= ${from}
        AND o."createdAt" <= ${to}
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${trunc}'`)}, o."createdAt")
      ORDER BY date ASC
    `);

    return rows.map((r) => ({
      date: r.date,
      orders: Number(r.orders),
      revenue: Number(r.revenue).toFixed(2),
      units: Number(r.units),
    }));
  }

  // ─── Profitability per product ────────────────────────────────────────────

  async getProfitability(query: AnalyticsQueryDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      where: {
        order: { status: { not: OrderStatus.CANCELLED }, ...dateFilter },
      },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: query.limit ?? 20,
    });

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      include: { category: true },
    });

    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        const unitsSold = item._sum.quantity ?? 0;
        const totalRevenue = Number(item._sum.subtotal ?? 0);
        const cost = Number(product.cost ?? 0);
        const totalCost = cost * unitsSold;
        const totalProfit = totalRevenue - totalCost;
        const price = Number(product.price);
        const marginPct = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '0.00';

        return {
          productId: product.id,
          name: product.name,
          category: product.category?.name,
          price: price.toFixed(2),
          cost: cost.toFixed(2),
          margin: (price - cost).toFixed(2),
          marginPercentage: `${marginPct}%`,
          unitsSold,
          totalRevenue: totalRevenue.toFixed(2),
          totalCost: totalCost.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
        };
      })
      .filter(Boolean);
  }

  // ─── Return rates ─────────────────────────────────────────────────────────

  async getReturns(query: AnalyticsQueryDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const [returnsByProduct, soldByProduct] = await Promise.all([
      this.prisma.return.groupBy({
        by: ['productId'],
        _count: { id: true },
        where: { createdAt: dateFilter.createdAt },
        orderBy: { _count: { id: 'desc' } },
        take: query.limit ?? 20,
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { order: { status: { not: OrderStatus.CANCELLED }, ...dateFilter } },
      }),
    ]);

    const products = await this.prisma.product.findMany({
      where: { id: { in: returnsByProduct.map((r) => r.productId) } },
      include: { category: true },
    });

    return returnsByProduct.map((r) => {
      const product = products.find((p) => p.id === r.productId);
      const unitsSold = soldByProduct.find((s) => s.productId === r.productId)?._sum.quantity ?? 0;
      const returnRate = unitsSold > 0 ? ((r._count.id / unitsSold) * 100).toFixed(2) : '0.00';

      return {
        productId: r.productId,
        name: product?.name ?? 'Unknown',
        category: product?.category?.name ?? 'Unknown',
        totalReturns: r._count.id,
        unitsSold,
        returnRate: `${returnRate}%`,
      };
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return {};
    const createdAt: any = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);
    return { createdAt };
  }
}
