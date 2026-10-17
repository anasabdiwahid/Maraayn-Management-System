import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('expenses')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExpensesController {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { tenantId: req.tenantId };
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (search) {
      filter.title = new RegExp(search.trim(), 'i');
    }

    const total = await this.expenseModel.countDocuments(filter);
    const expenses = await this.expenseModel
      .find(filter)
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      data: expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Post()
  async create(@Req() req: any, @Body() body: any, @CurrentUser('_id') userId: any) {
    if (!body.title || !body.amount) {
      throw new BadRequestException('Ciwaanka iyo cadadka kharashka waa loo baahan yahay');
    }

    const newExpense = new this.expenseModel({
      tenantId: req.tenantId,
      title: body.title.trim(),
      category: body.category || 'General',
      amount: Number(body.amount),
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      paymentMethod: body.paymentMethod || 'CASH',
      description: body.description,
      attachmentUrl: body.attachmentUrl,
      recordedBy: userId,
    });

    return newExpense.save();
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid expense ID');
    const expense = await this.expenseModel.findOne({ _id: id, tenantId: req.tenantId }).exec();
    if (!expense) throw new NotFoundException('Expense record not found');

    if (body.title) expense.title = body.title.trim();
    if (body.category) expense.category = body.category;
    if (body.amount !== undefined) expense.amount = Number(body.amount);
    if (body.expenseDate) expense.expenseDate = new Date(body.expenseDate);
    if (body.paymentMethod) expense.paymentMethod = body.paymentMethod;
    if (body.description !== undefined) expense.description = body.description;
    if (body.attachmentUrl !== undefined) expense.attachmentUrl = body.attachmentUrl;

    return expense.save();
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid expense ID');
    const result = await this.expenseModel.deleteOne({ _id: id, tenantId: req.tenantId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Expense not found');
    return { success: true, message: 'Expense deleted successfully' };
  }
}

