import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../../schemas/notification.schema.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  @Get()
  async getNotifications(@Req() req: any) {
    const filter: any = {};
    if (req.user?.tenantId) {
      filter.$or = [{ tenantId: req.user.tenantId }, { userId: req.user._id }];
    } else {
      filter.userId = req.user._id;
    }

    const notifications = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();

    const unreadCount = await this.notificationModel.countDocuments({
      ...filter,
      isRead: false,
    });

    return { notifications, unreadCount };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationModel.findByIdAndUpdate(id, { isRead: true });
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const filter: any = {};
    if (req.user?.tenantId) {
      filter.$or = [{ tenantId: req.user.tenantId }, { userId: req.user._id }];
    } else {
      filter.userId = req.user._id;
    }

    await this.notificationModel.updateMany(filter, { isRead: true });
    return { success: true };
  }
}

