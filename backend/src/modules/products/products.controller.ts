import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll(req.tenantId, { search, category, stockStatus, page, limit });
  }

  @Get('low-stock')
  async getLowStock(@Req() req: any) {
    return this.productsService.getLowStock(req.tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.productsService.findOne(req.tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any, @CurrentUser('_id') userId: any) {
    return this.productsService.create(req.tenantId, body, userId);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any, @CurrentUser('_id') userId: any) {
    return this.productsService.update(req.tenantId, id, body, userId);
  }

  @Patch(':id/adjust-stock')
  async adjustStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantityDelta: number; reason: string },
    @CurrentUser('_id') userId: any,
  ) {
    return this.productsService.adjustStock(req.tenantId, id, body, userId);
  }
}

