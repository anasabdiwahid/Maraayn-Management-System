import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument } from '../../schemas/sale.schema.js';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Debt, DebtDocument } from '../../schemas/debt.schema.js';
import { Payment, PaymentDocument } from '../../schemas/payment.schema.js';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema.js';
import { DebtStatus, SaleType } from '../../common/constants/roles.enum.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  private getDateRange(period: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
    const now = new Date();
    let start = new Date(0);
    const end = new Date();

    if (customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    return { start, end };
  }

  async getBusinessDashboardStats(tenantId: Types.ObjectId, period = 'month', startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(period, startDate, endDate);

    // Products & Inventory Value (current snapshot)
    const products = await this.productModel.find({ tenantId, status: 'ACTIVE' }).exec();
    const totalProducts = products.length;
    let totalInventoryValue = 0;
    let totalStockQuantity = 0;
    products.forEach((p) => {
      totalInventoryValue += (p.currentQuantity || 0) * (p.purchaseCost || 0);
      totalStockQuantity += p.currentQuantity || 0;
    });

    // Customers count
    const totalCustomers = await this.customerModel.countDocuments({ tenantId, status: 'ACTIVE' });

    // Sales within period
    const salesFilter: any = {
      tenantId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: { $ne: 'CANCELLED' },
    };
    const sales = await this.saleModel.find(salesFilter).exec();
    const totalSalesCount = sales.length;

    let totalRevenue = 0;
    let costOfGoodsSold = 0;
    let totalItemsSold = 0;
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    sales.forEach((s) => {
      totalRevenue += s.grandTotal || 0;

      s.items?.forEach((item) => {
        costOfGoodsSold += (item.costPrice || 0) * (item.quantity || 1);
        totalItemsSold += item.quantity || 1;
        const pKey = item.productId?.toString() || item.productName;
        if (!productSalesMap[pKey]) {
          productSalesMap[pKey] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSalesMap[pKey].quantity += item.quantity || 1;
        productSalesMap[pKey].revenue += item.total || 0;
      });
    });

    // Expenses within period
    const expenses = await this.expenseModel.find({
      tenantId,
      expenseDate: { $gte: start, $lte: end },
    }).exec();

    let totalExpenses = 0;
    expenses.forEach((e) => {
      totalExpenses += e.amount || 0;
    });

    // Collections include sale down-payments and later debt repayments.
    const periodPayments = await this.paymentModel.find({
      tenantId,
      paymentDate: { $gte: start, $lte: end },
      isCancelled: { $ne: true },
    }).exec();
    let totalCollected = 0;
    const paymentMethodTotals: Record<string, number> = {};
    periodPayments.forEach((payment) => {
      totalCollected += payment.amount || 0;
      paymentMethodTotals[payment.paymentMethod] = (paymentMethodTotals[payment.paymentMethod] || 0) + (payment.amount || 0);
    });

    const paymentSaleIds = [...new Set(
      periodPayments
        .map((payment) => payment.saleId?.toString())
        .filter((id): id is string => Boolean(id)),
    )];
    const creditSalesForPayments = paymentSaleIds.length
      ? await this.saleModel.find({
          tenantId,
          _id: { $in: paymentSaleIds },
          saleType: SaleType.CREDIT_SALE,
          paymentStatus: { $ne: 'CANCELLED' },
        }).exec()
      : [];
    const creditSaleById = new Map(creditSalesForPayments.map((sale) => [sale._id.toString(), sale]));
    const getSaleCost = (sale: SaleDocument) => sale.items?.reduce(
      (sum, item) => sum + (item.costPrice || 0) * (item.quantity || 1),
      0,
    ) || 0;
    const getSaleProfitMargin = (sale: SaleDocument) => sale.grandTotal > 0
      ? (sale.grandTotal - getSaleCost(sale)) / sale.grandTotal
      : 0;

    // Credit-sale profit is recognized as its payments arrive. This keeps a repayment
    // from being counted twice when the sale and its repayment fall in one period.
    const creditSalesProfitBooked = sales
      .filter((sale) => sale.saleType === SaleType.CREDIT_SALE)
      .reduce((sum, sale) => sum + (sale.grandTotal || 0) - getSaleCost(sale), 0);
    const creditCollectionProfit = periodPayments.reduce((sum, payment) => {
      const sale = payment.saleId ? creditSaleById.get(payment.saleId.toString()) : undefined;
      return sale ? sum + (payment.amount || 0) * getSaleProfitMargin(sale) : sum;
    }, 0);
    const debtRepaymentProfit = periodPayments.reduce((sum, payment) => {
      if (!payment.debtId || !payment.saleId) return sum;
      const sale = creditSaleById.get(payment.saleId.toString());
      return sale ? sum + (payment.amount || 0) * getSaleProfitMargin(sale) : sum;
    }, 0);
    const grossProfit = totalRevenue - costOfGoodsSold - creditSalesProfitBooked + creditCollectionProfit;
    const netProfit = grossProfit - totalExpenses;

    // Profit / Breakeven / Loss classification per user request:
    // "alabta isla qimahoda lagu gaday, alabta fa idada laga helay, iyo alabta qasarada laga helay intaba"
    let profitableSalesCount = 0;
    let profitableItemsCount = 0;
    let totalProfitEarned = 0;

    let breakevenSalesCount = 0;
    let breakevenItemsCount = 0;
    let totalBreakevenRevenue = 0;

    let lossSalesCount = 0;
    let lossItemsCount = 0;
    let totalLossIncurred = 0;

    sales.forEach((s) => {
      let saleProfit = 0;
      let saleLoss = 0;
      let saleBreakeven = 0;
      const itemRevenueTotal = s.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      s.items?.forEach((item) => {
        const qty = item.quantity || 1;
        const cost = item.costPrice !== undefined ? item.costPrice : 0;
        const itemRevenue = item.total || (item.unitPrice || 0) * qty;
        const allocatedDiscount = itemRevenueTotal > 0
          ? (s.totalDiscount || 0) * itemRevenue / itemRevenueTotal
          : 0;
        const netItemRevenue = Math.max(0, itemRevenue - allocatedDiscount);
        const diff = netItemRevenue - cost * qty;

        if (diff > 0.001) {
          saleProfit += diff;
          profitableItemsCount += qty;
        } else if (diff < -0.001) {
          saleLoss += Math.abs(diff);
          lossItemsCount += qty;
        } else {
          saleBreakeven += netItemRevenue;
          breakevenItemsCount += qty;
        }
      });

      if (saleProfit > 0) {
        profitableSalesCount++;
        totalProfitEarned += saleProfit;
      }
      if (saleLoss > 0) {
        lossSalesCount++;
        totalLossIncurred += saleLoss;
      }
      if (saleBreakeven > 0 && saleProfit === 0 && saleLoss === 0) {
        breakevenSalesCount++;
        totalBreakevenRevenue += saleBreakeven;
      }
    });

    const profitClassification = {
      profitable: {
        salesCount: profitableSalesCount,
        itemsCount: profitableItemsCount,
        totalProfit: Number(totalProfitEarned.toFixed(2)),
      },
      breakeven: {
        salesCount: breakevenSalesCount,
        itemsCount: breakevenItemsCount,
        totalRevenue: Number(totalBreakevenRevenue.toFixed(2)),
      },
      loss: {
        salesCount: lossSalesCount,
        itemsCount: lossItemsCount,
        totalLoss: Number(totalLossIncurred.toFixed(2)),
      },
    };

    // Debts & Repayments (all-time snapshot or period)
    const allDebts = await this.debtModel.find({ tenantId }).exec();
    let totalOutstandingDebt = 0;
    const now = new Date();
    let overdueCount = 0;

    allDebts.forEach((d) => {
      if (
        (d.remainingBalance || 0) > 0 &&
        d.status !== DebtStatus.PAID &&
        d.status !== DebtStatus.CANCELLED
      ) {
        totalOutstandingDebt += d.remainingBalance || 0;
      }
      if (d.status !== DebtStatus.PAID && d.dueDate && new Date(d.dueDate) < now) {
        overdueCount++;
      }
    });

    const debtPaymentTotals = await this.paymentModel.aggregate([
      {
        $match: {
          tenantId,
          debtId: { $exists: true, $ne: null },
          isCancelled: { $ne: true },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).exec();
    const totalDebtRepaid = debtPaymentTotals[0]?.total || 0;

    // Best-selling products
    const bestSelling = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales by Payment method array
    const salesByPaymentMethod = Object.keys(paymentMethodTotals).map((method) => ({
      method,
      amount: Number((paymentMethodTotals[method] || 0).toFixed(2)),
    }));

    // Daily trends (last 7 or 14 points)
    const trendMap: Record<string, { date: string; sales: number; revenue: number; expenses: number }> = {};
    const daysToShow = period === 'today' ? 1 : period === '7days' ? 7 : 14;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      trendMap[key] = { date: key, sales: 0, revenue: 0, expenses: 0 };
    }

    sales.forEach((s) => {
      const d = new Date(s.createdAt as any);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (trendMap[key]) {
        trendMap[key].sales += 1;
        trendMap[key].revenue = Number(((trendMap[key].revenue || 0) + (s.grandTotal || 0)).toFixed(2));
      }
    });

    expenses.forEach((e) => {
      const d = new Date(e.expenseDate);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (trendMap[key]) {
        trendMap[key].expenses = Number(((trendMap[key].expenses || 0) + (e.amount || 0)).toFixed(2));
      }
    });

    const salesTrend = Object.values(trendMap);

    // Recent items
    const recentSales = await this.saleModel
      .find({ tenantId, paymentStatus: { $ne: 'CANCELLED' } })
      .sort({ createdAt: -1 })
      .limit(6)
      .exec();

    const recentPayments = await this.paymentModel
      .find({ tenantId, isCancelled: { $ne: true } })
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(6)
      .exec();

    const lowStockProducts = await this.productModel
      .find({
        tenantId,
        status: 'ACTIVE',
        $expr: { $lte: ['$currentQuantity', '$minStockAlert'] },
      })
      .sort({ currentQuantity: 1 })
      .limit(6)
      .exec();

    return {
      period,
      stats: {
        totalProducts,
        totalStockQuantity,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        totalSalesCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalItemsSold,
        costOfGoodsSold: Number(costOfGoodsSold.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalCollected: Number(totalCollected.toFixed(2)),
        debtRepaymentProfit: Number(debtRepaymentProfit.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        totalOutstandingDebt: Number(totalOutstandingDebt.toFixed(2)),
        totalDebtRepaid: Number(totalDebtRepaid.toFixed(2)),
        totalCustomers,
        overdueCount,
        profitClassification,
      },
      charts: {
        salesTrend,
        bestSelling,
        salesByPaymentMethod,
      },
      recent: {
        recentSales,
        recentPayments,
        lowStockProducts,
      },
    };
  }

  async getDetailedReport(tenantId: Types.ObjectId, reportType: string, period = 'month', startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(period, startDate, endDate);

    if (reportType === 'sales') {
      return this.saleModel
        .find({ tenantId, createdAt: { $gte: start, $lte: end } })
        .sort({ createdAt: -1 })
        .exec();
    } else if (reportType === 'inventory') {
      return this.productModel
        .find({ tenantId, status: 'ACTIVE' })
        .sort({ currentQuantity: 1 })
        .exec();
    } else if (reportType === 'debts') {
      return this.debtModel
        .find({ tenantId, remainingBalance: { $gt: 0 } })
        .populate('customerId', 'name phone email code')
        .sort({ remainingBalance: -1 })
        .exec();
    } else if (reportType === 'expenses') {
      return this.expenseModel
        .find({ tenantId, expenseDate: { $gte: start, $lte: end } })
        .sort({ expenseDate: -1 })
        .exec();
    }

    throw new BadRequestException('Invalid report type specified');
  }
}

