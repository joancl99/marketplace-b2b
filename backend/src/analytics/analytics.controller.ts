import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('top-products')
  getTopProducts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTopProducts(query);
  }

  @Get('sales')
  getSales(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSales(query);
  }

  @Get('demand')
  getDemand(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDemand(query);
  }

  @Get('profitability')
  getProfitability(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProfitability(query);
  }

  @Get('returns')
  getReturns(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getReturns(query);
  }
}
