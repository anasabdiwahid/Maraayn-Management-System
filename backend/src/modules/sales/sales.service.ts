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
      if (body.customerId && Types.ObjectId.isValid(body.customerId)) {
        customerDoc = await this.customerModel.findOne({ _id: body.customerId, tenantId }).exec();
      }

      // If customer was not selected by ID, lookup or auto-create by phone / name
      if (!customerDoc) {
        const rawPhone = (body.customerPhone || '').trim();
        const rawName = (body.customerName || '').trim();

        if (rawPhone) {
          customerDoc = await this.customerModel.findOne({ tenantId, phone: rawPhone }).exec();
        }

        if (!customerDoc && rawName && rawName !== 'Walk-in Customer') {
          customerDoc = await this.customerModel.findOne({
            tenantId,
            name: { $regex: new RegExp(`^${rawName}$`, 'i') },
          }).exec();
        }

        // If not found, auto-create customer so cashiers are never blocked
        if (!customerDoc) {
          customerDoc = await this.customerModel.create({
            tenantId,
            name: rawName || 'Macmiil Dayn',
            phone: rawPhone || '',
            currentDebtBalance: 0,
            totalPurchases: 0,
            totalPaid: 0,
          });
        }
      }
    } else if (body.customerId && Types.ObjectId.isValid(body.customerId)) {
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

    // Check if customer already has an active open credit debt to consolidate with ("recite-kii hore lee ha loo saxo")
    let existingOpenDebt: any = null;
    let existingSale: any = null;

    if (isCredit && customerDoc) {
      existingOpenDebt = await this.debtModel.findOne({
        tenantId,
        customerId: customerDoc._id,
        status: { $in: [DebtStatus.UNPAID, DebtStatus.PARTIALLY_PAID] },
      }).sort({ createdAt: -1 }).exec();

      if (existingOpenDebt && existingOpenDebt.saleId) {
        existingSale = await this.saleModel.findOne({
          _id: existingOpenDebt.saleId,
          tenantId,
          paymentStatus: { $ne: 'CANCELLED' },
        }).exec();
      }
    }

    if (isCredit && existingSale && existingOpenDebt && customerDoc) {
      // 1. Append items to existing sale
      existingSale.items.push(...processedItems);
      existingSale.subtotal += subtotal;
      existingSale.totalDiscount = (existingSale.totalDiscount || 0) + totalDiscount;
      existingSale.grandTotal += grandTotal;
      existingSale.amountPaid += amountPaid;
      existingSale.balanceDue += balanceDue;
      existingSale.paymentStatus = existingSale.balanceDue > 0
        ? (existingSale.amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID')
        : 'PAID';
      if (body.notes) {
        existingSale.notes = `${existingSale.notes ? existingSale.notes + ' | ' : ''}${body.notes}`;
      }
      const savedSale = await existingSale.save();

      // 2. Record payment if down payment made
      if (amountPaid > 0) {
        await this.paymentModel.create({
          tenantId,
          paymentNumber: `PMT-${randomNum}`,
          saleId: savedSale._id,
          customerId: customerDoc._id,
          amount: amountPaid,
          paymentMethod: body.paymentMethod || PaymentMethod.CASH,
          paymentDate: new Date(),
          reference: `Down payment for added credit items on ${savedSale.saleNumber}`,
          receiptNumber: savedSale.receiptNumber,
          recordedBy: userId,
        });
      }

      // 3. Update existing debt record
      existingOpenDebt.totalSaleAmount += grandTotal;
      existingOpenDebt.initialPayment += amountPaid;
      existingOpenDebt.remainingBalance += balanceDue;
      if (body.dueDate) {
        existingOpenDebt.dueDate = new Date(body.dueDate);
      }
      if (amountPaid > 0) {
        existingOpenDebt.transactionHistory.push({
          amount: amountPaid,
          date: new Date(),
          method: body.paymentMethod || PaymentMethod.CASH,
          reference: 'Additional down payment',
          balanceAfter: existingOpenDebt.remainingBalance,
          recordedBy: userId,
        });
      }
      existingOpenDebt.status = existingOpenDebt.remainingBalance <= 0
        ? DebtStatus.PAID
        : (existingOpenDebt.amountRepaid > 0 || existingOpenDebt.initialPayment > 0
          ? DebtStatus.PARTIALLY_PAID
          : DebtStatus.UNPAID);
      await existingOpenDebt.save();

      // 4. Update customer running balance
      customerDoc.currentDebtBalance += balanceDue;
      customerDoc.totalPurchases += grandTotal;
      customerDoc.totalPaid += amountPaid;
      await customerDoc.save();

      // 5. Update existing receipt so it retains the original receipt number with consolidated items
      let receipt = await this.receiptModel.findOne({
        tenantId,
        receiptNumber: savedSale.receiptNumber,
      }).exec();

      if (receipt) {
        receipt.items = savedSale.items;
        receipt.subtotal = savedSale.subtotal;
        receipt.grandTotal = savedSale.grandTotal;
        receipt.amountPaid = savedSale.amountPaid;
        receipt.balanceRemaining = savedSale.balanceDue;
        if (body.notes) {
          receipt.notes = savedSale.notes;
        }
        await receipt.save();
      } else {
        receipt = await this.receiptModel.create({
          tenantId,
          receiptNumber: savedSale.receiptNumber,
          receiptType: ReceiptType.CREDIT_SALE,
          referenceId: savedSale._id,
          customerName: savedSale.customerName,
          customerPhone: savedSale.customerPhone,
          items: savedSale.items,
          subtotal: savedSale.subtotal,
          grandTotal: savedSale.grandTotal,
          amountPaid: savedSale.amountPaid,
          balanceRemaining: savedSale.balanceDue,
          paymentMethod: savedSale.paymentMethod,
          notes: savedSale.notes,
        });
      }

      return {
        success: true,
        sale: savedSale,
        debt: existingOpenDebt,
        receipt,
        consolidated: true,
      };
    }

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
      const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;

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

  async updateSale(tenantId: Types.ObjectId, id: string, body: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid sale ID');
    const sale = await this.saleModel.findOne({ _id: id, tenantId }).exec();
    if (!sale) throw new NotFoundException('Sale not found');

    if (body.customerName) sale.customerName = body.customerName;
    if (body.customerPhone !== undefined) sale.customerPhone = body.customerPhone;
    if (body.notes !== undefined) sale.notes = body.notes;
    if (body.paymentMethod) sale.paymentMethod = body.paymentMethod;

    await sale.save();

    await this.receiptModel.updateOne(
      { tenantId, receiptNumber: sale.receiptNumber },
      {
        $set: {
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          notes: sale.notes,
          paymentMethod: sale.paymentMethod,
        },
      },
    );

    return { success: true, message: 'Iibka iyo recite-ka waa la cusbooneysiiyay', sale };
  }

  async cancelSale(tenantId: Types.ObjectId, id: string, userId: any, reason?: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid sale ID');
    const sale = await this.saleModel.findOne({ _id: id, tenantId }).exec();
    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.paymentStatus === 'CANCELLED') {
      throw new BadRequestException('Iibkan mar hore ayaa la kansalay');
    }

    // 1. Revert product stocks back to inventory
    for (const item of sale.items) {
      if (item.productId) {
        const product = await this.productModel.findOne({ _id: item.productId, tenantId }).exec();
        if (product) {
          product.currentQuantity += item.quantity;
          await product.save();

          await this.movementModel.create({
            tenantId,
            productId: product._id,
            type: InventoryMovementType.ADJUSTMENT,
            quantityDelta: item.quantity,
            balanceAfter: product.currentQuantity,
            reason: `Kansal garaynta iibka #${sale.saleNumber}`,
            createdBy: userId,
          });
        }
      }
    }

    // 2. If credit sale with debt, cancel debt & adjust customer balance
    if (sale.saleType === SaleType.CREDIT_SALE && sale.customerId) {
      await this.debtModel.updateMany(
        { tenantId, saleId: sale._id },
        { $set: { status: DebtStatus.PAID, notes: `[CANCELLED: ${reason || 'Iibka ayaa la kansalay'}]` } },
      );
      if (sale.balanceDue > 0) {
        await this.customerModel.updateOne(
          { _id: sale.customerId, tenantId },
          { $inc: { currentDebtBalance: -sale.balanceDue } },
        );
      }
    }

    // 3. Mark sale as CANCELLED
    sale.paymentStatus = 'CANCELLED';
    sale.notes = `${sale.notes ? sale.notes + ' ' : ''}[CANCELLED: ${reason || 'Kansal gareeyay'}]`;
    await sale.save();

    // 4. Mark linked payments as cancelled
    await this.paymentModel.updateMany(
      { tenantId, saleId: sale._id },
      { $set: { isCancelled: true, notes: `[CANCELLED: ${reason || 'Iibka ayaa la kansalay'}]` } },
    );

    // 5. Mark linked receipt as cancelled
    await this.receiptModel.updateMany(
      { tenantId, referenceId: sale._id },
      { $set: { isCancelled: true, notes: `[CANCELLED: ${reason || 'Iibka ayaa la kansalay'}]` } },
    );

    return {
      success: true,
      message: `Iibka ${sale.saleNumber} iyo recite-ka ${sale.receiptNumber} si guul leh ayaa loo kansalay, badeecadihiina kaydka ayaa lagu celiyay!`,
      sale,
    };
  }
}

