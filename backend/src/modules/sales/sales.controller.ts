import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('sales')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('saleType') saleType?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.findAll(req.tenantId, { search, saleType, paymentStatus, page, limit });
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.salesService.findOne(req.tenantId, id);
  }

  @Post()
  async createSale(@Req() req: any, @Body() body: any, @CurrentUser('_id') userId: any) {
    return this.salesService.createSale(req.tenantId, body, userId);
  }

  @Patch(':id')
  async updateSale(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.salesService.updateSale(req.tenantId, id, body);
  }

  @Post(':id/cancel')
  async cancelSale(
    @Req() req: any,
    @Param('id') id: string,
    @CurrentUser('_id') userId: any,
    @Body('reason') reason?: string,
  ) {
    return this.salesService.cancelSale(req.tenantId, id, userId, reason);
  }

  @Delete(':id')
  async deleteSale(
    @Req() req: any,
    @Param('id') id: string,
    @CurrentUser('_id') userId: any,
  ) {
    return this.salesService.cancelSale(req.tenantId, id, userId, 'Tirtiray / Kansalay');
  }
}
