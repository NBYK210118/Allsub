import { NativeModules, Platform } from 'react-native';

const { FloatingButtonModule } = NativeModules;

class FloatingButtonService {
  private isActive = false;

  /**
   * 오버레이 권한 확인
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Floating button only available on Android');
      return false;
    }

    try {
      const hasPermission = await FloatingButtonModule.checkPermission();
      return hasPermission;
    } catch (error) {
      console.error('Error checking overlay permission:', error);
      return false;
    }
  }

  /**
   * 오버레이 권한 요청
   * 설정 화면으로 이동
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      await FloatingButtonModule.requestPermission();
      return true;
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
      return false;
    }
  }

  /**
   * 플로팅 버튼 시작
   */
  async start(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Floating button only available on Android');
      return false;
    }

    if (this.isActive) {
      console.log('Floating button already active');
      return true;
    }

    try {
      // 권한 확인
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.log('Overlay permission not granted, requesting...');
        await this.requestPermission();
        return false; // 사용자가 설정에서 권한 부여 후 다시 시도해야 함
      }

      // 플로팅 버튼 서비스 시작
      await FloatingButtonModule.start();
      this.isActive = true;
      console.log('Floating button started');
      return true;
    } catch (error: any) {
      console.error('Failed to start floating button:', error);
      
      if (error.code === 'NO_PERMISSION') {
        console.log('Please grant overlay permission in settings');
      }
      
      return false;
    }
  }

  /**
   * 플로팅 버튼 중지
   */
  async stop(): Promise<void> {
    if (Platform.OS !== 'android' || !this.isActive) {
      return;
    }

    try {
      await FloatingButtonModule.stop();
      this.isActive = false;
      console.log('Floating button stopped');
    } catch (error) {
      console.error('Failed to stop floating button:', error);
    }
  }

  /**
   * 활성 상태 확인
   */
  getIsActive(): boolean {
    return this.isActive;
  }
}

export default new FloatingButtonService();

