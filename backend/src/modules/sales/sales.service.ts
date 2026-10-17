import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument, SaleItem } from '../../schemas/sale.schema.js';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Debt, DebtDocument } from '../../schemas/debt.schema.js';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema.js';
import { InventoryMovement, InventoryMovementDocument } from '../../schemas/inventory-movement.schema.js';
import { SaleType, PaymentMethod, DebtStatus, InventoryMovementType, ReceiptType } from '../../common/constants/roles.enum.js';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
    @InjectModel(InventoryMovement.name) private movementModel: Model<InventoryMovementDocument>,
  ) {}

  async findAll(tenantId: Types.ObjectId, query: { search?: string; saleType?: string; paymentStatus?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId };
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { saleNumber: searchRegex },
        { receiptNumber: searchRegex },
        { customerName: searchRegex },
      ];
    }
    if (query.saleType && query.saleType !== 'ALL') {
      filter.saleType = query.saleType;
    }
    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      filter.paymentStatus = query.paymentStatus;
    }

    const total = await this.saleModel.countDocuments(filter);
    const sales = await this.saleModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid sale ID');
    const sale = await this.saleModel.findOne({ _id: id, tenantId }).exec();
    if (!sale) throw new NotFoundException('Sale record not found');

    const receipt = await this.receiptModel.findOne({ tenantId, referenceId: sale._id }).exec();
    const debt = await this.debtModel.findOne({ tenantId, saleId: sale._id }).exec();

    return { sale, receipt, debt };
  }

  async createSale(tenantId: Types.ObjectId, body: any, userId: any) {
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Fadlan ku dar ugu yaraan hal badeeco');
    }

    const isCredit = body.saleType === SaleType.CREDIT_SALE;
    let customerDoc: CustomerDocument | null = null;

    if (isCredit) {
      if (!body.customerId) {
        throw new BadRequestException('Daynta waa in loo qoraa macmiil diiwaangashan (Customer is required for credit sales)');
      }
      customerDoc = await this.customerModel.findOne({ _id: body.customerId, tenantId }).exec();
      if (!customerDoc) {
        throw new BadRequestException('Macmiilka la doortay lama helin');
      }
    } else if (body.customerId) {
      customerDoc = await this.customerModel.findOne({ _id: body.customerId, tenantId }).exec();
    }

    // Process and validate items + inventory
    const processedItems: SaleItem[] = [];
    let subtotal = 0;

    for (const item of body.items) {
      if (!Types.ObjectId.isValid(item.productId)) {
        throw new BadRequestException(`Badeecada ID "${item.productId}" ma shaqaynayso`);
      }

      const product = await this.productModel.findOne({ _id: item.productId, tenantId }).exec();
      if (!product) {
        throw new BadRequestException(`Badeecada lama helin ganacsigaaga`);
      }

      const qty = Number(item.quantity) || 1;
      if (qty <= 0) {
        throw new BadRequestException('Tirada badeecada waa inay ka weynaataa 0');
      }

      // Stock validation
      if (product.currentQuantity < qty) {
        throw new BadRequestException(
          `Badeecada "${product.name}" kuma filna kaydka. Waxaa haray: ${product.currentQuantity}, laakiin waxaad rabtaa: ${qty}`,
        );
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
      const discount = Number(item.discount) || 0;
      const lineTotal = Math.max(0, unitPrice * qty - discount);

      processedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        unitPrice,
        costPrice: product.purchaseCost,
        quantity: qty,
        discount,
        total: lineTotal,
      });

      subtotal += lineTotal;

      // Deduct inventory
      product.currentQuantity -= qty;
      await product.save();

      // Record movement
      await this.movementModel.create({
        tenantId,
        productId: product._id,
        type: isCredit ? InventoryMovementType.CREDIT_SALE : InventoryMovementType.SALE,
        quantityDelta: -qty,
        balanceAfter: product.currentQuantity,
        reason: `${isCredit ? 'Credit' : 'Cash'} sale deduction`,
        createdBy: userId,
      });
    }

    const totalDiscount = Number(body.totalDiscount) || 0;
    const grandTotal = Math.max(0, subtotal - totalDiscount);

    let amountPaid = Number(body.amountPaid) || 0;
    if (!isCredit) {
      amountPaid = grandTotal; // Cash sale is fully paid
    }

    if (amountPaid > grandTotal) {
      amountPaid = grandTotal;
    }

    const balanceDue = Math.max(0, grandTotal - amountPaid);

    let paymentStatus = 'PAID';
    if (balanceDue > 0) {
      paymentStatus = amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const saleNumber = `SALE-${new Date().getFullYear()}-${randomNum}`;
    const receiptNumber = `RCP-${randomNum}`;

    const newSale = new this.saleModel({
      tenantId,
      saleNumber,
      customerId: customerDoc ? customerDoc._id : null,
      customerName: customerDoc ? customerDoc.name : body.customerName || 'Walk-in Customer',
      customerPhone: customerDoc ? customerDoc.phone : body.customerPhone || '',
      items: processedItems,
      subtotal,
      totalDiscount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentMethod: body.paymentMethod || PaymentMethod.CASH,
      saleType: isCredit ? SaleType.CREDIT_SALE : SaleType.CASH_SALE,
      paymentStatus,
      receiptNumber,
      notes: body.notes,
      createdBy: userId,
    });

    const savedSale = await newSale.save();

    // If initial payment was made (or full cash payment)
    if (amountPaid > 0) {
      await this.paymentModel.create({
        tenantId,
        paymentNumber: `PMT-${randomNum}`,
        saleId: savedSale._id,
        customerId: customerDoc ? customerDoc._id : null,
        amount: amountPaid,
        paymentMethod: body.paymentMethod || PaymentMethod.CASH,
        paymentDate: new Date(),
        reference: `Initial payment for ${saleNumber}`,
        receiptNumber,
        recordedBy: userId,
      });
    }

    // If credit sale with balance due, create Debt Ledger record
    let createdDebt: any = null;
    if (isCredit && balanceDue > 0 && customerDoc) {
      const debtNumber = `DBT-${randomNum}`;
      const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      const newDebt = new this.debtModel({
        tenantId,
        debtNumber,
        customerId: customerDoc._id,
        saleId: savedSale._id,
        saleDate: new Date(),
        totalSaleAmount: grandTotal,
        initialPayment: amountPaid,
        amountRepaid: 0,
        remainingBalance: balanceDue,
        dueDate,
        status: amountPaid > 0 ? DebtStatus.PARTIALLY_PAID : DebtStatus.UNPAID,
        transactionHistory:
          amountPaid > 0
            ? [
                {
                  amount: amountPaid,
                  date: new Date(),
                  method: body.paymentMethod || PaymentMethod.CASH,
                  reference: 'Initial down payment',
                  balanceAfter: balanceDue,
                  recordedBy: userId,
                },
              ]
            : [],
        notes: body.notes,
      });

      createdDebt = await newDebt.save();

      // Update customer balance
      customerDoc.currentDebtBalance += balanceDue;
      customerDoc.totalPurchases += grandTotal;
      customerDoc.totalPaid += amountPaid;
      await customerDoc.save();
    } else if (customerDoc) {
      customerDoc.totalPurchases += grandTotal;
      customerDoc.totalPaid += amountPaid;
      await customerDoc.save();
    }

    // Create Receipt record
    const receipt = await this.receiptModel.create({
      tenantId,
      receiptNumber,
      receiptType: isCredit ? ReceiptType.CREDIT_SALE : ReceiptType.CASH_SALE,
      referenceId: savedSale._id,
      customerName: savedSale.customerName,
      customerPhone: savedSale.customerPhone,
      items: processedItems,
      subtotal,
      grandTotal,
      amountPaid,
      balanceRemaining: balanceDue,
      paymentMethod: savedSale.paymentMethod,
      notes: body.notes,
    });

    return {
      success: true,
      sale: savedSale,
      debt: createdDebt,
      receipt,
    };
  }
}

