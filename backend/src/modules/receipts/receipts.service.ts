import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema.js';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async getReceiptByNumber(tenantId: Types.ObjectId, receiptNumber: string) {
    const receipt = await this.receiptModel.findOne({ tenantId, receiptNumber }).exec();
    if (!receipt) throw new NotFoundException('Receipt not found');
    const tenant = await this.tenantModel.findById(tenantId).exec();

    return { receipt, tenant };
  }

  async getWhatsAppShareData(tenantId: Types.ObjectId, receiptNumber: string) {
    const { receipt, tenant } = await this.getReceiptByNumber(tenantId, receiptNumber);

    let phone = (receipt.customerPhone || '').replace(/[^0-9]/g, '');
    // If phone starts with 061 or 068, convert to Somalia international 252...
    if (phone.startsWith('0')) {
      phone = '252' + phone.substring(1);
    } else if (phone.length === 9) {
      phone = '252' + phone;
    }

    const businessName = tenant?.name || 'Maraayn Business';
    const currency = tenant?.currencySymbol || '$';

    let text = `*${businessName.toUpperCase()} — RASIDKA / RECEIPT*\n`;
    text += `Lambarka Rasidka: *${receipt.receiptNumber}*\n`;
    text += `Taariikhda: ${new Date(receipt.createdAt as any).toLocaleDateString()}\n`;
    text += `Macmiilka: *${receipt.customerName || 'Customer'}*\n`;
    text += `--------------------------------\n`;

    if (receipt.items && receipt.items.length > 0) {
      receipt.items.forEach((item: any) => {
        text += `• ${item.productName || item.title} (x${item.quantity || 1}) — ${currency}${item.total || item.unitPrice}\n`;
      });
      text += `--------------------------------\n`;
    }

    text += `Wadarta Guud: *${currency}${receipt.grandTotal}*\n`;
    text += `Lacagta La Bixiyay: *${currency}${receipt.amountPaid}*\n`;

    if (receipt.balanceRemaining > 0) {
      text += `Daynta Hartay: *${currency}${receipt.balanceRemaining}*\n`;
    }

    text += `Nooca Bixinta: ${receipt.paymentMethod || 'CASH'}\n\n`;
    text += `${tenant?.receiptSettings?.footerMessage || 'Waad ku mahadsantahay ganacsigaaga!'}\n`;
    text += `Ganacsigaaga, Hal Meel — Maraayn`;

    const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;

    return {
      phone,
      waLink,
      encodedMessage: encodeURIComponent(text),
      plainMessage: text,
      receipt,
      tenant,
    };
  }

  async generatePdfReceipt(tenantId: Types.ObjectId, receiptNumber: string): Promise<Buffer> {
    const { receipt, tenant } = await this.getReceiptByNumber(tenantId, receiptNumber);

    return new Promise((resolve, reject) => {
      // 80mm thermal receipt width is approx 226 points (standard 72dpi = 3.14 inches)
      const doc = new PDFDocument({
        size: [240, 600],
        margin: 15,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const currency = tenant?.currencySymbol || '$';

      // Header
      doc.fontSize(14).font('Helvetica-Bold').text(tenant?.name || 'Maraayn Business', { align: 'center' });
      if (tenant?.location) {
        doc.fontSize(8).font('Helvetica').text(tenant.location, { align: 'center' });
      }
      if (tenant?.ownerPhone) {
        doc.fontSize(8).font('Helvetica').text(`Tel: ${tenant.ownerPhone}`, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica-Oblique').text(`Nooca: ${receipt.receiptType.replace('_', ' ')}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica-Bold').text(`Rasid No: ${receipt.receiptNumber}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(`Taariikh: ${new Date(receipt.createdAt as any).toLocaleString()}`, { align: 'center' });
      doc.fontSize(8).text(`Macmiilka: ${receipt.customerName || 'Walk-in'}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.text('------------------------------------------------', { align: 'center' });

      // Items table
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('Badeecada / Item', 15, doc.y, { width: 120, continued: true });
      doc.text('Xoog', { width: 30, continued: true });
      doc.text('Wadarta', { align: 'right' });
      doc.font('Helvetica');

      if (receipt.items && receipt.items.length > 0) {
        receipt.items.forEach((item: any) => {
          doc.text((item.productName || item.title || '').slice(0, 18), 15, doc.y, { width: 120, continued: true });
          doc.text(`x${item.quantity || 1}`, { width: 30, continued: true });
          doc.text(`${currency}${item.total || item.unitPrice}`, { align: 'right' });
        });
      }

      doc.text('------------------------------------------------', { align: 'center' });

      // Totals
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`Wadarta Guud: ${currency}${receipt.grandTotal}`, { align: 'right' });
      doc.text(`La Bixiyay: ${currency}${receipt.amountPaid}`, { align: 'right' });

      if (receipt.balanceRemaining > 0) {
        doc.fillColor('#DC2626');
        doc.text(`Daynta Hartay: ${currency}${receipt.balanceRemaining}`, { align: 'right' });
        doc.fillColor('#000000');
      }

      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text(`Habka Bixinta: ${receipt.paymentMethod || 'CASH'}`, { align: 'center' });

      doc.moveDown(0.8);
      doc.fontSize(8).font('Helvetica-Oblique').text(tenant?.receiptSettings?.footerMessage || 'Waad ku mahadsantahay ganacsigaaga!', {
        align: 'center',
      });
      doc.fontSize(7).text('Maraayn — Ganacsigaaga, Hal Meel', { align: 'center' });

      doc.end();
    });
  }
}

