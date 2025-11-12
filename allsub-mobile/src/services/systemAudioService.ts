import { NativeModules, Platform } from 'react-native';

const { AudioCaptureModule } = NativeModules;

class SystemAudioService {
  private isCapturing = false;
  private serverUrl = '';
  private serverPort = 0;

  /**
   * Android 10 이상 지원 여부 확인
   */
  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AudioCaptureModule) {
      return false;
    }

    try {
      const supported = await AudioCaptureModule.isSupported();
      return supported;
    } catch (error) {
      console.error('Error checking support:', error);
      return false;
    }
  }

  /**
   * 시스템 오디오 캡처 시작
   * MediaProjection 권한을 요청하고 서비스를 시작합니다
   */
  async start(serverUrl: string, serverPort: number): Promise<boolean> {
    if (Platform.OS !== 'android' || !AudioCaptureModule) {
      return false;
    }

    if (this.isCapturing) {
      console.log('Already capturing');
      return true;
    }

    try {
      // 지원 여부 확인
      const supported = await this.isSupported();
      if (!supported) {
        console.error('System audio capture not supported on this device (Android 10+ required)');
        return false;
      }

      this.serverUrl = serverUrl;
      this.serverPort = serverPort;

      console.log(`Starting system audio capture to ${serverUrl}:${serverPort}`);

      // MediaProjection 권한 요청 및 서비스 시작
      await AudioCaptureModule.requestPermissionAndStart(serverUrl, serverPort);
      
      this.isCapturing = true;
      console.log('System audio capture started successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to start system audio capture:', error);
      
      if (error.code === 'PERMISSION_DENIED') {
        console.log('User denied MediaProjection permission');
      } else if (error.code === 'NOT_SUPPORTED') {
        console.log('Android 10 or higher required');
      }
      
      return false;
    }
  }

  /**
   * 시스템 오디오 캡처 중지
   */
  async stop(): Promise<void> {
    if (Platform.OS !== 'android' || !this.isCapturing) {
      return;
    }

    try {
      await AudioCaptureModule.stop();
      this.isCapturing = false;
      console.log('System audio capture stopped');
    } catch (error) {
      console.error('Failed to stop system audio capture:', error);
    }
  }

  /**
   * 현재 캡처 상태 확인
   */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * 현재 서버 정보
   */
  getServerInfo(): { url: string; port: number } {
    return {
      url: this.serverUrl,
      port: this.serverPort,
    };
  }
}

export default new SystemAudioService();

