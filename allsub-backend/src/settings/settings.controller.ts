import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  async getUserSettings(@Param('userId') userId: string) {
    console.log('');
    console.log('[SettingsController] GET /settings/:userId');
    console.log(`  User ID: ${userId}`);
    console.log(`  Timestamp: ${new Date().toLocaleString('ko-KR')}`);
    console.log('----------------------------------------');
    console.log('');

    this.logger.log(`REQUEST RECEIVED - GET /settings/${userId}`);

    return this.settingsService.getUserSettings(userId);
  }

  @Post(':userId/toggle')
  async toggleCaption(@Param('userId') userId: string) {
    console.log('');
    console.log('[SettingsController] POST /settings/:userId/toggle');
    console.log(`  User ID: ${userId}`);
    console.log(`  Timestamp: ${new Date().toLocaleString('ko-KR')}`);
    console.log('----------------------------------------');
    console.log('');

    this.logger.log(`REQUEST RECEIVED - POST /settings/${userId}/toggle`);

    const beforeSettings = await this.settingsService.getUserSettings(userId);
    const beforeState = beforeSettings?.isCaptionEnabled ? 'ON' : 'OFF';
    console.log('Current state:', beforeState);
    console.log('');
    
    const result = await this.settingsService.toggleCaption(userId);
    const afterState = result.isCaptionEnabled ? 'ON' : 'OFF';
    
    console.log('Toggle completed');
    console.log('  Previous state:', beforeState, '-> New state:', afterState);
    console.log('----------------------------------------');
    console.log('');
    
    this.logger.log(`Toggle caption for user ${userId}: ${beforeState} -> ${afterState}`);
    
    return result;
  }

  @Post(':userId/update')
  async updateSettings(
    @Param('userId') userId: string,
    @Body() body: { isCaptionEnabled: boolean; captionText?: string },
  ) {
    console.log('');
    console.log('[SettingsController] POST /settings/:userId/update');
    console.log(`  User ID: ${userId}`);
    console.log(`  isCaptionEnabled: ${body.isCaptionEnabled ? 'ON' : 'OFF'}`);
    console.log(`  Timestamp: ${new Date().toLocaleString('ko-KR')}`);
    console.log('----------------------------------------');
    console.log('');
    
    const result = await this.settingsService.updateCaptionSettings(
      userId,
      body.isCaptionEnabled,
      body.captionText,
    );
    
    this.logger.log(`Update settings for user ${userId}: isCaptionEnabled=${body.isCaptionEnabled}`);
    
    return result;
  }
}
