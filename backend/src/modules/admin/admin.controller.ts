import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { CreateMarketDto, UpdateMarketDto, SuspendMarketDto, CreateAdminDto } from './dto/admin.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PlatformRole } from '../../common/constants/roles.enum.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('markets')
  async getAllMarkets(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllMarkets({ search, status, category, page, limit });
  }

  @Post('markets')
  async createMarket(@Body() createDto: CreateMarketDto, @CurrentUser() adminUser: any) {
    return this.adminService.createMarket(createDto, adminUser);
  }

  @Get('markets/:id')
  async getMarketById(@Param('id') id: string) {
    return this.adminService.getMarketById(id);
  }

  @Patch('markets/:id')
  async updateMarket(
    @Param('id') id: string,
    @Body() updateDto: UpdateMarketDto,
    @CurrentUser() adminUser: any,
  ) {
    return this.adminService.updateMarket(id, updateDto, adminUser);
  }

  @Post('markets/:id/suspend')
  async suspendMarket(
    @Param('id') id: string,
    @Body() suspendDto: SuspendMarketDto,
    @CurrentUser() adminUser: any,
  ) {
    return this.adminService.suspendMarket(id, suspendDto, adminUser);
  }

  @Post('markets/:id/reactivate')
  async reactivateMarket(@Param('id') id: string, @CurrentUser() adminUser: any) {
    return this.adminService.reactivateMarket(id, adminUser);
  }

  @Patch('markets/:id/storage-quota')
  async updateStorageQuota(
    @Param('id') id: string,
    @Body('quotaGb') quotaGb: number,
    @CurrentUser() adminUser: any,
  ) {
    return this.adminService.updateStorageQuota(id, Number(quotaGb), adminUser);
  }

  @Get('users')
  async getAdministrators() {
    return this.adminService.getAdministrators();
  }

  @Post('users')
  @Roles(PlatformRole.SUPER_ADMIN)
  async createAdministrator(@Body() createDto: CreateAdminDto, @CurrentUser() adminUser: any) {
    return this.adminService.createAdministrator(createDto, adminUser);
  }

  @Patch('users/:id/toggle-status')
  @Roles(PlatformRole.SUPER_ADMIN)
  async toggleAdminStatus(@Param('id') id: string, @CurrentUser() adminUser: any) {
    return this.adminService.toggleAdminStatus(id, adminUser);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(Number(page) || 1, Number(limit) || 20);
  }
}

