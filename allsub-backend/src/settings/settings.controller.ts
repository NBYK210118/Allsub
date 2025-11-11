import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  async getUserSettings(@Param('userId') userId: string) {
    console.log('');
    console.log('=== 요청 도달 (백엔드 컨트롤러) ===');
    console.log('경로: GET /settings/:userId');
    console.log('User ID:', userId);
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('==============================');
    
    this.logger.log(`REQUEST RECEIVED - GET /settings/${userId}`);
    
    return this.settingsService.getUserSettings(userId);
  }

  @Post(':userId/toggle')
  async toggleCaption(@Param('userId') userId: string) {
    console.log('');
    console.log('=== 요청 도달 (백엔드 컨트롤러) ===');
    console.log('경로: POST /settings/:userId/toggle');
    console.log('User ID:', userId);
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('------------------------------');
    
    this.logger.log(`REQUEST RECEIVED - POST /settings/${userId}/toggle`);
    
    const beforeSettings = await this.settingsService.getUserSettings(userId);
    const beforeState = beforeSettings?.isCaptionEnabled ? 'ON' : 'OFF';
    console.log('현재 상태:', beforeState);
    console.log('');
    
    const result = await this.settingsService.toggleCaption(userId);
    const afterState = result.isCaptionEnabled ? 'ON' : 'OFF';
    
    console.log('토글 완료');
    console.log('이전 상태:', beforeState, '-> 새로운 상태:', afterState);
    console.log('==============================');
    
    this.logger.log(`Toggle caption for user ${userId}: ${beforeState} -> ${afterState}`);
    
    return result;
  }

  @Post(':userId/update')
  async updateSettings(
    @Param('userId') userId: string,
    @Body() body: { isCaptionEnabled: boolean; captionText?: string },
  ) {
    console.log('');
    console.log('=== 설정 업데이트 요청 수신 (REST API) ===');
    console.log('User ID:', userId);
    console.log('isCaptionEnabled:', body.isCaptionEnabled ? 'ON' : 'OFF');
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('==============================');
    
    const result = await this.settingsService.updateCaptionSettings(
      userId,
      body.isCaptionEnabled,
      body.captionText,
    );
    
    this.logger.log(`Update settings for user ${userId}: isCaptionEnabled=${body.isCaptionEnabled}`);
    
    return result;
  }
}
