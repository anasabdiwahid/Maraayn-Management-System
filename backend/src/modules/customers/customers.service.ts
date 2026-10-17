import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Sale, SaleDocument } from '../../schemas/sale.schema.js';
import { Debt, DebtDocument } from '../../schemas/debt.schema.js';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async findAll(tenantId: Types.ObjectId, query: { search?: string; hasDebt?: boolean; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId, status: 'ACTIVE' };
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { code: searchRegex },
      ];
    }

    if (query.hasDebt === true || (query.hasDebt as any) === 'true') {
      filter.currentDebtBalance = { $gt: 0 };
    }

    const total = await this.customerModel.countDocuments(filter);
    const customers = await this.customerModel
      .find(filter)
      .sort({ currentDebtBalance: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid customer ID');
    const customer = await this.customerModel.findOne({ _id: id, tenantId }).exec();
    if (!customer) throw new NotFoundException('Customer not found');

    const sales = await this.saleModel
      .find({ tenantId, customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();

    const debts = await this.debtModel
      .find({ tenantId, customerId: customer._id })
      .sort({ createdAt: -1 })
      .exec();

    const payments = await this.paymentModel
      .find({ tenantId, customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();

    return { customer, sales, debts, payments };
  }

  async create(tenantId: Types.ObjectId, body: any) {
    // Check duplicate phone in same tenant
    const existing = await this.customerModel.findOne({ tenantId, phone: body.phone.trim() });
    if (existing) {
      throw new BadRequestException(`Macmiil leh lambarka ${body.phone} horey ayaa ugu diiwaangashan yahay ganacsigaaga`);
    }

    const code = body.code || `CUS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCustomer = new this.customerModel({
      tenantId,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim().toLowerCase(),
      address: body.address?.trim(),
      code,
      openingBalance: Number(body.openingBalance) || 0,
      currentDebtBalance: Number(body.openingBalance) || 0,
      totalPurchases: 0,
      totalPaid: 0,
      notes: body.notes,
      status: 'ACTIVE',
    });

    return newCustomer.save();
  }

  async update(tenantId: Types.ObjectId, id: string, body: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid customer ID');
    const customer = await this.customerModel.findOne({ _id: id, tenantId }).exec();
    if (!customer) throw new NotFoundException('Customer not found');

    if (body.phone && body.phone.trim() !== customer.phone) {
      const existing = await this.customerModel.findOne({
        tenantId,
        phone: body.phone.trim(),
        _id: { $ne: customer._id },
      });
      if (existing) {
        throw new BadRequestException(`Number ${body.phone} already belongs to another customer`);
      }
      customer.phone = body.phone.trim();
    }

    if (body.name) customer.name = body.name.trim();
    if (body.email !== undefined) customer.email = body.email?.trim().toLowerCase();
    if (body.address !== undefined) customer.address = body.address?.trim();
    if (body.notes !== undefined) customer.notes = body.notes;

    return customer.save();
  }
}

