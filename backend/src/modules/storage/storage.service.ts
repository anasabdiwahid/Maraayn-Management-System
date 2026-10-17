import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { StorageUsage, StorageUsageDocument } from '../../schemas/storage-usage.schema.js';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import { Notification, NotificationDocument } from '../../schemas/notification.schema.js';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema.js';
import { TenantStatus } from '../../common/constants/roles.enum.js';

@Injectable()
export class StorageService {
  private uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(
    @InjectModel(StorageUsage.name) private storageUsageModel: Model<StorageUsageDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleFileUpload(
    tenantId: Types.ObjectId,
    file: any,
    category: string = 'product',
    userId?: any,
  ) {
    if (!file) throw new BadRequestException('Fadlan soo dooro file-ka aad rabto inaad geliso');

    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');

    let storage = await this.storageUsageModel.findOne({ tenantId }).exec();
    if (!storage) {
      storage = await this.storageUsageModel.create({ tenantId, totalBytes: 0, files: [] });
    }

    const currentUsed = storage.totalBytes || 0;
    const quota = tenant.storageQuotaBytes || 4 * 1024 * 1024 * 1024;
    const newTotal = currentUsed + file.size;

    // Check quota before committing upload
    if (newTotal > quota) {
      // Clean up uploaded temp file if already written to disk
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }

      // Mark tenant over quota and auto-suspend
      tenant.isOverQuota = true;
      tenant.status = TenantStatus.SUSPENDED;
      tenant.suspensionReason = `Kootada Kaydka (Storage Quota) ayaa dhammaatay: Waxaad isticmaashay ${(currentUsed / (1024 * 1024 * 1024)).toFixed(2)} GB oo ka mid ah ${(quota / (1024 * 1024 * 1024)).toFixed(2)} GB.`;
      tenant.suspendedAt = new Date();
      await tenant.save();

      // Trigger high-priority notification
      await this.notificationModel.create({
        tenantId,
        title: 'Kaydka Waa Buuxsamay (Storage Limit Exceeded)',
        message: `Ganacsigaaga si toos ah ayaa loo joojiyay maadaama kootada ${(quota / (1024 * 1024 * 1024)).toFixed(2)} GB la dhaafay. Fadlan kordhi kootadaada.`,
        type: 'STORAGE_100',
      });

      throw new ForbiddenException(
        `Kaydka ganacsigaagu waa buuxsamay! Kootadaada (${(quota / (1024 * 1024 * 1024)).toFixed(2)} GB) waa la gaaray. Fadlan la xiriir maamulka Maraayn si laguu kordhiyo kootada.`,
      );
    }

    // Save file info
    const fileKey = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(this.uploadDir, fileKey);
    fs.writeFileSync(targetPath, file.buffer);

    const fileUrl = `/api/v1/storage/files/${fileKey}`;

    storage.files.push({
      fileKey,
      originalName: file.originalname,
      sizeBytes: file.size,
      category,
      url: fileUrl,
      uploadedAt: new Date(),
    });

    storage.totalBytes = newTotal;
    await storage.save();

    tenant.storageUsedBytes = newTotal;
    const usagePercent = (newTotal / quota) * 100;

    // Warning notifications at 80% and 90%
    if (usagePercent >= 90) {
      await this.notificationModel.create({
        tenantId,
        title: 'Digniin: Kaydkaagu wuxuu marayaa 90%',
        message: `Kaydkaagu wuxuu gaaray ${usagePercent.toFixed(1)}%. Fadlan kordhi kootada si aadan u joogsan.`,
        type: 'STORAGE_90',
      });
    } else if (usagePercent >= 80) {
      await this.notificationModel.create({
        tenantId,
        title: 'Digniin: Kaydkaagu wuxuu marayaa 80%',
        message: `Waxaad isticmaashay ${usagePercent.toFixed(1)}% kootadaada kaydka.`,
        type: 'STORAGE_80',
      });
    }

    await tenant.save();

    return {
      success: true,
      url: fileUrl,
      fileName: file.originalname,
      sizeBytes: file.size,
      storageUsedBytes: newTotal,
      quotaBytes: quota,
      percentage: Number(usagePercent.toFixed(1)),
    };
  }

  async getStoredFile(fileKey: string): Promise<{ stream: fs.ReadStream; mimeType: string }> {
    const filePath = path.join(this.uploadDir, path.basename(fileKey));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.svg': 'image/svg+xml',
    };

    return {
      stream: fs.createReadStream(filePath),
      mimeType: mimeTypes[ext] || 'application/octet-stream',
    };
  }
}

