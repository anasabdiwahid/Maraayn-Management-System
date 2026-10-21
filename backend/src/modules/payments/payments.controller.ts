import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';
import { Sale, SaleDocument } from '../../schemas/sale.schema.js';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema.js';
import { Debt, DebtDocument } from '../../schemas/debt.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { DebtStatus } from '../../common/constants/roles.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentsController {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('method') method?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { tenantId: req.tenantId };
    if (method && method !== 'ALL') {
      filter.paymentMethod = method;
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { paymentNumber: searchRegex },
        { receiptNumber: searchRegex },
        { reference: searchRegex },
        { notes: searchRegex },
      ];
    }

    const total = await this.paymentModel.countDocuments(filter);
    const payments = await this.paymentModel
      .find(filter)
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      data: payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid payment ID');
    const payment = await this.paymentModel
      .findOne({ _id: id, tenantId: req.tenantId })
      .populate('customerId')
      .populate('saleId')
      .populate('debtId')
      .exec();

    if (!payment) throw new NotFoundException('Payment record not found');
    return payment;
  }

  // Get full receipt for this payment
  @Get(':id/receipt')
  async getReceiptForPayment(@Req() req: any, @Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid payment ID');
    const payment = await this.paymentModel.findOne({ _id: id, tenantId: req.tenantId }).populate('customerId').exec();
    if (!payment) throw new NotFoundException('Payment record not found');

    // Find official receipt by receiptNumber
    let receipt = await this.receiptModel.findOne({ tenantId: req.tenantId, receiptNumber: payment.receiptNumber }).exec();

    if (!receipt && payment.saleId) {
      // Find sale and linked receipt
      const sale = await this.saleModel.findById(payment.saleId).exec();
      if (sale) {
        receipt = await this.receiptModel.findOne({ tenantId: req.tenantId, referenceId: sale._id }).exec();
      }
    }

    // If still not found, construct a valid receipt object
    if (!receipt) {
      const customer = payment.customerId as any;
      return {
        receiptNumber: payment.receiptNumber,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        items: [
          {
            productName: payment.reference || 'Payment Transaction',
            quantity: 1,
            unitPrice: payment.amount,
            total: payment.amount,
          },
        ],
        grandTotal: payment.amount,
        amountPaid: payment.amount,
        balanceRemaining: 0,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
        isCancelled: payment.isCancelled || false,
        createdAt: (payment as any).createdAt,
      };
    }

    return receipt;
  }

  // Edit payment / receipt details (notes, reference, paymentMethod)
  @Patch(':id')
  async updatePayment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid payment ID');
    const payment = await this.paymentModel.findOne({ _id: id, tenantId: req.tenantId }).exec();
    if (!payment) throw new NotFoundException('Payment record not found');

    if (body.paymentMethod) payment.paymentMethod = body.paymentMethod;
    if (body.reference !== undefined) payment.reference = body.reference;
    if (body.notes !== undefined) payment.notes = body.notes;

    const updatedPayment = await payment.save();

    // Also update corresponding Receipt
    await this.receiptModel.updateOne(
      { tenantId: req.tenantId, receiptNumber: payment.receiptNumber },
      {
        $set: {
          paymentMethod: body.paymentMethod || payment.paymentMethod,
          notes: body.notes !== undefined ? body.notes : payment.notes,
        },
      },
    );

    return {
      success: true,
      message: 'Xogta bixinta iyo recite-ka si guul leh ayaa loo cusbooneysiiyay',
      payment: updatedPayment,
    };
  }

  // Cancel / Void Payment (Kansal Garee)
  @Post(':id/cancel')
  async cancelPayment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid payment ID');
    const payment = await this.paymentModel.findOne({ _id: id, tenantId: req.tenantId }).exec();
    if (!payment) throw new NotFoundException('Payment record not found');

    if (payment.isCancelled) {
      throw new BadRequestException('Bixintan mar hore ayaa la kansalay');
    }

    // 1. Mark payment as cancelled
    payment.isCancelled = true;
    payment.cancelledAt = new Date();
    payment.cancellationReason = body.reason || 'Kansal gareeyay maamulaha';
    if (!payment.notes?.includes('[CANCELLED]')) {
      payment.notes = `${payment.notes ? payment.notes + ' ' : ''}[CANCELLED: ${payment.cancellationReason}]`;
    }
    await payment.save();

    // 2. Mark corresponding receipt as cancelled
    await this.receiptModel.updateOne(
      { tenantId: req.tenantId, receiptNumber: payment.receiptNumber },
      {
        $set: {
          isCancelled: true,
          notes: `[CANCELLED: ${payment.cancellationReason}]`,
        },
      },
    );

    // 3. If linked to Sale, update sale amountPaid and balanceDue
    if (payment.saleId) {
      const sale = await this.saleModel.findOne({ _id: payment.saleId, tenantId: req.tenantId }).exec();
      if (sale) {
        sale.amountPaid = Math.max(0, sale.amountPaid - payment.amount);
        sale.balanceDue = Math.max(0, sale.grandTotal - sale.amountPaid);
        sale.paymentStatus = sale.amountPaid === 0 ? 'UNPAID' : 'PARTIALLY_PAID';
        await sale.save();
      }
    }

    // 4. If linked to Debt, restore debt remaining balance and customer debt balance
    if (payment.debtId) {
      const debt = await this.debtModel.findOne({ _id: payment.debtId, tenantId: req.tenantId }).exec();
      if (debt) {
        debt.remainingBalance += payment.amount;
        debt.amountRepaid = Math.max(0, debt.amountRepaid - payment.amount);
        debt.status = debt.remainingBalance >= debt.totalSaleAmount ? DebtStatus.UNPAID : DebtStatus.PARTIALLY_PAID;
        await debt.save();

        if (payment.customerId) {
          await this.customerModel.updateOne(
            { _id: payment.customerId, tenantId: req.tenantId },
            { $inc: { currentDebtBalance: payment.amount, totalPaid: -payment.amount } },
          );
        }
      }
    }

    return {
      success: true,
      message: `Bixinta ${payment.paymentNumber} / Recite-ka ${payment.receiptNumber} si guul leh ayaa loo kansalay!`,
      payment,
    };
  }

  // Also support DELETE route as alias to cancel
  @Delete(':id')
  async deletePayment(@Req() req: any, @Param('id') id: string) {
    return this.cancelPayment(req, id, { reason: 'Tirtiray / Kansalay' });
  }
}
