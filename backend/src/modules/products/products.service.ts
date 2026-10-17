import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { InventoryMovement, InventoryMovementDocument } from '../../schemas/inventory-movement.schema.js';
import { InventoryMovementType } from '../../common/constants/roles.enum.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(InventoryMovement.name) private movementModel: Model<InventoryMovementDocument>,
  ) {}

  async findAll(tenantId: Types.ObjectId, query: { search?: string; category?: string; stockStatus?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId, status: 'ACTIVE' };

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { category: searchRegex },
      ];
    }

    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    if (query.stockStatus === 'LOW_STOCK') {
      filter.$expr = { $lte: ['$currentQuantity', '$minStockAlert'] };
    } else if (query.stockStatus === 'OUT_OF_STOCK') {
      filter.currentQuantity = { $lte: 0 };
    } else if (query.stockStatus === 'IN_STOCK') {
      filter.$expr = { $gt: ['$currentQuantity', '$minStockAlert'] };
    }

    const total = await this.productModel.countDocuments(filter);
    const products = await this.productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid product ID');
    const product = await this.productModel.findOne({ _id: id, tenantId }).exec();
    if (!product) throw new NotFoundException('Product not found in this business');

    const movements = await this.movementModel
      .find({ tenantId, productId: product._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return { product, movements };
  }

  async create(tenantId: Types.ObjectId, body: any, userId: any) {
    // Check SKU duplicate within tenant
    if (body.sku) {
      const existingSku = await this.productModel.findOne({ tenantId, sku: body.sku.trim() });
      if (existingSku) {
        throw new BadRequestException(`SKU "${body.sku}" horey ayaa loogu isticmaalay badeeco kale`);
      }
    } else {
      body.sku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const newProduct = new this.productModel({
      tenantId,
      name: body.name,
      sku: body.sku.trim(),
      barcode: body.barcode?.trim(),
      category: body.category || 'General',
      imageUrl: body.imageUrl,
      purchaseCost: Number(body.purchaseCost) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      currentQuantity: Number(body.currentQuantity) || 0,
      minStockAlert: Number(body.minStockAlert) || 5,
      unit: body.unit || 'pcs',
      supplier: body.supplier,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      description: body.description,
      status: 'ACTIVE',
    });

    const saved = await newProduct.save();

    // If initial quantity > 0, record movement
    if (saved.currentQuantity > 0) {
      await this.movementModel.create({
        tenantId,
        productId: saved._id,
        type: InventoryMovementType.PURCHASE,
        quantityDelta: saved.currentQuantity,
        balanceAfter: saved.currentQuantity,
        reason: 'Initial stock intake upon product registration',
        createdBy: userId,
      });
    }

    return saved;
  }

  async update(tenantId: Types.ObjectId, id: string, body: any, userId: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid product ID');
    const product = await this.productModel.findOne({ _id: id, tenantId }).exec();
    if (!product) throw new NotFoundException('Product not found');

    if (body.sku && body.sku !== product.sku) {
      const existing = await this.productModel.findOne({ tenantId, sku: body.sku.trim(), _id: { $ne: product._id } });
      if (existing) throw new BadRequestException(`SKU "${body.sku}" already exists`);
      product.sku = body.sku.trim();
    }

    if (body.name) product.name = body.name;
    if (body.barcode !== undefined) product.barcode = body.barcode?.trim();
    if (body.category) product.category = body.category;
    if (body.imageUrl !== undefined) product.imageUrl = body.imageUrl;
    if (body.purchaseCost !== undefined) product.purchaseCost = Number(body.purchaseCost);
    if (body.sellingPrice !== undefined) product.sellingPrice = Number(body.sellingPrice);
    if (body.currentQuantity !== undefined) product.currentQuantity = Number(body.currentQuantity);
    if (body.minStockAlert !== undefined) product.minStockAlert = Number(body.minStockAlert);
    if (body.unit) product.unit = body.unit;
    if (body.supplier !== undefined) product.supplier = body.supplier;
    if (body.expiryDate !== undefined) product.expiryDate = body.expiryDate ? new Date(body.expiryDate) : undefined;
    if (body.description !== undefined) product.description = body.description;

    return product.save();
  }

  async adjustStock(tenantId: Types.ObjectId, id: string, adjustment: { quantityDelta: number; reason: string }, userId: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid product ID');
    const product = await this.productModel.findOne({ _id: id, tenantId }).exec();
    if (!product) throw new NotFoundException('Product not found');

    const newQuantity = product.currentQuantity + adjustment.quantityDelta;
    if (newQuantity < 0) {
      throw new BadRequestException('Khadka kaydka (Stock) ma noqon karo mid ka yar 0');
    }

    product.currentQuantity = newQuantity;
    await product.save();

    const movement = await this.movementModel.create({
      tenantId,
      productId: product._id,
      type: InventoryMovementType.ADJUSTMENT,
      quantityDelta: adjustment.quantityDelta,
      balanceAfter: newQuantity,
      reason: adjustment.reason || 'Manual inventory adjustment',
      createdBy: userId,
    });

    return { product, movement };
  }

  async getLowStock(tenantId: Types.ObjectId) {
    return this.productModel
      .find({
        tenantId,
        status: 'ACTIVE',
        $expr: { $lte: ['$currentQuantity', '$minStockAlert'] },
      })
      .sort({ currentQuantity: 1 })
      .limit(10)
      .exec();
  }
}

