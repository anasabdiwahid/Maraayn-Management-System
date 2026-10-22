import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Debt, DebtDocument } from '../../schemas/debt.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema.js';
import { DebtStatus, PaymentMethod, ReceiptType } from '../../common/constants/roles.enum.js';

@Injectable()
export class DebtsService {
  constructor(
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
  ) {}

  async findAll(tenantId: Types.ObjectId, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId };

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const total = await this.debtModel.countDocuments(filter);
    const debts = await this.debtModel
      .find(filter)
      .populate('customerId', 'name phone email code currentDebtBalance')
      .populate('saleId', 'saleNumber receiptNumber saleType customerName customerPhone grandTotal amountPaid balanceDue paymentMethod notes items createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Check for overdue debts and update in memory
    const now = new Date();
    debts.forEach((debt) => {
      if (debt.status !== DebtStatus.PAID && debt.dueDate && new Date(debt.dueDate) < now) {
        debt.status = DebtStatus.OVERDUE;
      }
    });

    return {
      data: debts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid debt ID');
    const debt = await this.debtModel
      .findOne({ _id: id, tenantId })
      .populate('customerId')
      .populate('saleId')
      .exec();

    if (!debt) throw new NotFoundException('Debt record not found');
    return debt;
  }

  async recordPayment(
    tenantId: Types.ObjectId,
    debtId: string,
    body: { amount: number; paymentMethod?: PaymentMethod; reference?: string; notes?: string },
    userId: any,
  ) {
    if (!Types.ObjectId.isValid(debtId)) throw new BadRequestException('Invalid debt ID');

    const debt = await this.debtModel.findOne({ _id: debtId, tenantId }).exec();
    if (!debt) throw new NotFoundException('Debt record not found');

    const paymentAmount = Number(body.amount);
    if (!paymentAmount || paymentAmount <= 0) {
      throw new BadRequestException('Fadlan geli lacag sax ah oo ka weyn 0');
    }

    if (paymentAmount > debt.remainingBalance) {
      throw new BadRequestException(
        `Lacagta la bixinayo ($${paymentAmount}) kama weynaan karto daynta hartay ($${debt.remainingBalance})`,
      );
    }

    const remainingAfter = debt.remainingBalance - paymentAmount;
    debt.remainingBalance = remainingAfter;
    debt.amountRepaid += paymentAmount;

    if (remainingAfter <= 0) {
      debt.status = DebtStatus.PAID;
    } else {
      debt.status = DebtStatus.PARTIALLY_PAID;
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const receiptNumber = `RCP-PMT-${randomNum}`;

    debt.transactionHistory.push({
      amount: paymentAmount,
      date: new Date(),
      method: body.paymentMethod || PaymentMethod.CASH,
      reference: body.reference || '',
      balanceAfter: remainingAfter,
      recordedBy: userId,
    });

    await debt.save();

    // Update Customer debt balance
    const customer = await this.customerModel.findOne({ _id: debt.customerId, tenantId }).exec();
    if (customer) {
      customer.currentDebtBalance = Math.max(0, customer.currentDebtBalance - paymentAmount);
      customer.totalPaid += paymentAmount;
      await customer.save();
    }

    // Create Payment record
    const payment = await this.paymentModel.create({
      tenantId,
      paymentNumber: `PMT-${randomNum}`,
      saleId: debt.saleId,
      debtId: debt._id,
      customerId: debt.customerId,
      amount: paymentAmount,
      paymentMethod: body.paymentMethod || PaymentMethod.CASH,
      paymentDate: new Date(),
      reference: body.reference || `Repayment for debt ${debt.debtNumber}`,
      notes: body.notes,
      receiptNumber,
      recordedBy: userId,
    });

    // Create Receipt record
    const receipt = await this.receiptModel.create({
      tenantId,
      receiptNumber,
      receiptType: ReceiptType.DEBT_PAYMENT,
      referenceId: payment._id,
      customerName: customer?.name || 'Customer',
      customerPhone: customer?.phone || '',
      items: [
        {
          productName: `Debt Repayment (${debt.debtNumber})`,
          quantity: 1,
          unitPrice: paymentAmount,
          total: paymentAmount,
        },
      ],
      subtotal: paymentAmount,
      grandTotal: paymentAmount,
      amountPaid: paymentAmount,
      balanceRemaining: remainingAfter,
      paymentMethod: body.paymentMethod || PaymentMethod.CASH,
      notes: body.notes || `Debt balance after payment: $${remainingAfter}`,
    });

    return {
      success: true,
      message: 'Lacag-bixinta daynta si guul leh ayaa loo diiwaangeliyay',
      debt,
      payment,
      receipt,
      customer,
    };
  }

  async getDebtSummary(tenantId: Types.ObjectId) {
    const debts = await this.debtModel.find({ tenantId }).exec();
    let totalOutstanding = 0;
    let totalRepaid = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    const now = new Date();

    debts.forEach((d) => {
      totalOutstanding += d.remainingBalance;
      totalRepaid += d.amountRepaid;
      if (d.status !== DebtStatus.PAID) {
        unpaidCount++;
        if (d.dueDate && new Date(d.dueDate) < now) {
          overdueCount++;
        }
      }
    });

    return {
      totalOutstanding,
      totalRepaid,
      unpaidCount,
      overdueCount,
    };
  }
}

