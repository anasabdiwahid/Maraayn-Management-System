import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('hasDebt') hasDebt?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.findAll(req.tenantId, { search, hasDebt, page, limit });
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.customersService.findOne(req.tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.customersService.create(req.tenantId, body);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.customersService.update(req.tenantId, id, body);
  }
}

