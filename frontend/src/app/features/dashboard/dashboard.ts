import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';

type Period = '7d' | '30d' | '90d' | '1y';

const CHART_FONT = 'IBM Plex Sans, sans-serif';
const CHART_MONO = 'IBM Plex Mono, monospace';
const AXIS_COLOR = '#8FA3BE';
const GRID_COLOR = '#2C3D56';
const NO_DATA_CFG = {
  text: 'No data available for this period',
  align: 'center' as const,
  verticalAlign: 'middle' as const,
  style: { color: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_FONT },
};

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  loading = signal(true);
  period = signal<Period>('30d');

  kpis = signal<any>(null);
  recentOrders = signal<any[]>([]);
  demandChart = signal<any>(null);
  topProductsChart = signal<any>(null);
  topProductsList = signal<any[]>([]);

  showProductsAsTable = computed(() => this.topProductsList().length <= 3);

  readonly periods: { key: Period; label: string }[] = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '1y', label: '1Y' },
  ];

  readonly orderCols = ['id', 'status', 'total', 'date'];

  theme = inject(ThemeService);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    const { from, to, granularity } = this.periodParams();

    forkJoin({
      dashboard: this.api.getDashboard(),
      demand: this.api.getDemand({ from, to, granularity }),
      topProducts: this.api.getTopProducts({ limit: 6 }),
      orders: this.api.getOrders(),
    }).subscribe({
      next: ({ dashboard, demand, topProducts, orders }) => {
        this.kpis.set(dashboard);
        this.recentOrders.set(
          (orders as any[])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
        );
        this.buildDemandChart(demand as any[]);
        this.buildTopProductsChart(topProducts as any[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setPeriod(p: Period) {
    this.period.set(p);
    const { from, to, granularity } = this.periodParams();
    this.api
      .getDemand({ from, to, granularity })
      .subscribe(data => this.buildDemandChart(data as any[]));
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-amber',
      PROCESSING: 'badge-blue',
      SHIPPED: 'badge-cyan',
      DELIVERED: 'badge-green',
      CANCELLED: 'badge-red',
      RETURNED: 'badge-red',
    };
    return map[status] ?? 'badge-blue';
  }

  private periodParams() {
    const now = new Date();
    const to = now.toISOString();
    let from: Date;
    let granularity: string;

    switch (this.period()) {
      case '7d':
        from = new Date(now.getTime() - 7 * 864e5);
        granularity = 'day';
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 864e5);
        granularity = 'week';
        break;
      case '1y':
        from = new Date(now.getTime() - 365 * 864e5);
        granularity = 'month';
        break;
      default:
        from = new Date(now.getTime() - 30 * 864e5);
        granularity = 'day';
    }

    return { from: from.toISOString(), to, granularity };
  }

  private buildDemandChart(data: any[]) {
    const cats = data.map(d =>
      new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    );
    const revenue = data.map(d => +(+d.revenue).toFixed(2));
    const orders = data.map(d => +d.orders);

    this.demandChart.set({
      series: [
        { name: 'Revenue', type: 'area', data: revenue },
        { name: 'Orders', type: 'line', data: orders },
      ],
      chart: {
        type: 'line',
        height: 320,
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: CHART_FONT,
        sparkline: { enabled: false },
      },
      colors: ['#5293F7', '#22D3EE'],
      stroke: { curve: 'smooth', width: [2, 2] },
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shade: 'dark',
          type: 'vertical',
          opacityFrom: 0.3,
          opacityTo: 0.02,
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: GRID_COLOR,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        categories: cats,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_MONO },
          rotate: -30,
          rotateAlways: false,
          hideOverlappingLabels: true,
        },
      },
      yaxis: [
        {
          seriesName: 'Revenue',
          labels: {
            style: { colors: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_MONO },
            formatter: (v: number) =>
              `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)}`,
          },
        },
        {
          seriesName: 'Orders',
          opposite: true,
          labels: {
            style: { colors: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_MONO },
            formatter: (v: number) => `${Math.round(v)}`,
          },
        },
      ],
      tooltip: {
        theme: 'dark',
        style: { fontFamily: CHART_MONO },
        y: {
          formatter: (v: number, ctx: any) =>
            ctx.seriesIndex === 0 ? `$${v.toFixed(2)}` : `${v} orders`,
        },
      },
      legend: {
        labels: { colors: AXIS_COLOR },
        fontFamily: CHART_FONT,
        fontSize: '13px',
      },
      noData: NO_DATA_CFG,
    });
  }

  private buildTopProductsChart(data: any[]) {
    this.topProductsList.set(data);

    if (data.length === 0) {
      this.topProductsChart.set(null);
      return;
    }

    const names = data.map(d => d.name ?? `#${(d.productId as string)?.slice(0, 6)}`);
    const values = data.map(d => +(+d.totalRevenue).toFixed(2));

    this.topProductsChart.set({
      series: [{ name: 'Revenue', data: values }],
      chart: {
        type: 'bar',
        height: 320,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: CHART_FONT,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '55%',
          distributed: true,
        },
      },
      colors: ['#5293F7', '#22D3EE', '#34D399', '#FBBF24', '#A78BFA', '#F87171'],
      dataLabels: { enabled: false },
      grid: {
        borderColor: GRID_COLOR,
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { left: 4, right: 12 },
      },
      xaxis: {
        categories: names,
        labels: {
          style: { colors: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_MONO },
          formatter: (v: string) => {
            const n = parseFloat(v);
            return isNaN(n) ? v : `$${n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0)}`;
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: AXIS_COLOR, fontSize: '13px', fontFamily: CHART_MONO },
          maxWidth: 150,
        },
      },
      tooltip: {
        theme: 'dark',
        style: { fontFamily: CHART_MONO },
        y: { formatter: (v: number) => `$${v.toFixed(2)}` },
      },
      legend: { show: false },
      noData: NO_DATA_CFG,
    });
  }
}
