import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getUserSettings(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async updateCaptionSettings(userId: string, isCaptionEnabled: boolean, captionText?: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        isCaptionEnabled,
        ...(captionText && { captionText }),
      },
      create: {
        userId,
        isCaptionEnabled,
        captionText: captionText || '가나다라마바사아자카타파하',
      },
    });
  }

  async toggleCaption(userId: string) {
    const settings = await this.getUserSettings(userId);
    if (!settings) {
      return this.updateCaptionSettings(userId, true);
    }
    return this.updateCaptionSettings(userId, !settings.isCaptionEnabled);
  }
}
