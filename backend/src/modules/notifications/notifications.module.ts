import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller.js';
import { Notification, NotificationSchema } from '../../schemas/notification.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  exports: [MongooseModule],
})
export class NotificationsModule {}

