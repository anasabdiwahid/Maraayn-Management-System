import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
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
}

