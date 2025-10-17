import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  async getUserSettings(@Param('userId') userId: string) {
    return this.settingsService.getUserSettings(userId);
  }

  @Post(':userId/toggle')
  async toggleCaption(@Param('userId') userId: string) {
    return this.settingsService.toggleCaption(userId);
  }

  @Post(':userId/update')
  async updateSettings(
    @Param('userId') userId: string,
    @Body() body: { isCaptionEnabled: boolean; captionText?: string },
  ) {
    return this.settingsService.updateCaptionSettings(
      userId,
      body.isCaptionEnabled,
      body.captionText,
    );
  }
}
