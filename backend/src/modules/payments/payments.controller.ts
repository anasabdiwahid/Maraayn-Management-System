import { Controller, Get, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentsController {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
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
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { tenantId: req.tenantId };
    if (method && method !== 'ALL') {
      filter.paymentMethod = method;
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ paymentNumber: searchRegex }, { receiptNumber: searchRegex }, { reference: searchRegex }];
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
    return this.paymentModel
      .findOne({ _id: id, tenantId: req.tenantId })
      .populate('customerId')
      .populate('saleId')
      .populate('debtId')
      .exec();
  }
}

