import { Controller, Get, Patch, Post, Delete, Param, Body, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

@Controller('receipts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReceiptsController {
  constructor(private receiptsService: ReceiptsService) {}

  @Get(':receiptNumber')
  async getReceipt(@Req() req: any, @Param('receiptNumber') receiptNumber: string) {
    return this.receiptsService.getReceiptByNumber(req.tenantId, receiptNumber);
  }

  @Get(':receiptNumber/whatsapp')
  async getWhatsAppShare(@Req() req: any, @Param('receiptNumber') receiptNumber: string) {
    return this.receiptsService.getWhatsAppShareData(req.tenantId, receiptNumber);
  }

  @Get(':receiptNumber/pdf')
  async downloadPdf(@Req() req: any, @Param('receiptNumber') receiptNumber: string, @Res() res: any) {
    const pdfBuffer = await this.receiptsService.generatePdfReceipt(req.tenantId, receiptNumber);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${receiptNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':receiptNumber')
  async updateReceipt(
    @Req() req: any,
    @Param('receiptNumber') receiptNumber: string,
    @Body() body: any,
  ) {
    return this.receiptsService.updateReceipt(req.tenantId, receiptNumber, body);
  }

  @Post(':receiptNumber/cancel')
  async cancelReceipt(
    @Req() req: any,
    @Param('receiptNumber') receiptNumber: string,
    @Body('reason') reason?: string,
  ) {
    return this.receiptsService.cancelReceipt(req.tenantId, receiptNumber, reason);
  }

  @Delete(':receiptNumber')
  async deleteReceipt(
    @Req() req: any,
    @Param('receiptNumber') receiptNumber: string,
  ) {
    return this.receiptsService.cancelReceipt(req.tenantId, receiptNumber, 'Tirtiray / Kansalay');
  }
}
