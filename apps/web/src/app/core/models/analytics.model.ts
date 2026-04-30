export interface DashboardData {
  totalRevenue: string;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueThisMonth: string;
  ordersThisMonth: number;
  topProducts: TopProduct[];
  recentOrders: any[];
}

export interface TopProduct {
  productId: string;
  name: string;
  category: string;
  image?: string;
  unitsSold: number;
  revenue: string;
  returnRate: string;
}

export interface DemandPoint {
  date: string;
  orders: number;
  revenue: string;
  units: number;
}

export interface ProfitabilityItem {
  productId: string;
  name: string;
  category: string;
  price: string;
  cost: string;
  margin: string;
  marginPercentage: string;
  unitsSold: number;
  totalRevenue: string;
  totalProfit: string;
}

export interface SalesData {
  totalRevenue: string;
  totalUnits: number;
  totalOrders: number;
  byStatus: { status: string; count: number }[];
}
