import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, Body, UseGuards, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from './storage.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body('category') category: string,
    @CurrentUser('_id') userId: any,
  ) {
    return this.storageService.handleFileUpload(req.tenantId, file, category, userId);
  }

  @Get('files/:fileKey')
  async getFile(@Param('fileKey') fileKey: string, @Res() res: any) {
    const { stream, mimeType } = await this.storageService.getStoredFile(fileKey);
    res.setHeader('Content-Type', mimeType);
    stream.pipe(res);
  }
}

