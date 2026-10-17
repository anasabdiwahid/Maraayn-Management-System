import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { DebtsService } from './debts.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('debts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DebtsController {
  constructor(private debtsService: DebtsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.debtsService.findAll(req.tenantId, { status, search, page, limit });
  }

  @Get('summary')
  async getSummary(@Req() req: any) {
    return this.debtsService.getDebtSummary(req.tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.debtsService.findOne(req.tenantId, id);
  }

  @Post(':id/repay')
  async recordPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('_id') userId: any,
  ) {
    return this.debtsService.recordPayment(req.tenantId, id, body, userId);
  }
}

