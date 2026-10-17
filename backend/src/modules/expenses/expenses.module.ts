import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesController } from './expenses.controller.js';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [ExpensesController],
  exports: [MongooseModule],
})
export class ExpensesModule {}

