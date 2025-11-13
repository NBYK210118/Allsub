/**
 * 진단 유틸리티
 * WebSocket 연결 및 자막 서비스 문제를 진단합니다
 */

import { Platform } from 'react-native';
import { API_BASE_URL, WS_BASE_URL } from '../config/environment';

export class Diagnostics {
  /**
   * 환경 설정 진단
   */
  static logEnvironmentInfo() {
    console.log('');
    console.log('[Diagnostics] Environment check');
    console.log('  Platform:', Platform.OS);
    console.log('  Environment:', __DEV__ ? 'Development' : 'Production');
    console.log('');
    console.log('API configuration:');
    console.log('  REST API URL:', API_BASE_URL);
    console.log('  WebSocket URL:', WS_BASE_URL);
    console.log('');
    console.log('Recommended values:');
    console.log('  iOS & Android: http://localhost:3000');
    console.log('  (Android requires adb reverse tcp:3000 tcp:3000)');
    console.log('');
  }

  /**
   * 연결 실패 진단
   */
  static logConnectionFailure(serverUrl: string, error?: any) {
    console.log('');
    console.log('[Diagnostics] WebSocket connection failure');
    console.log('');
    console.log('Attempted URL:', serverUrl);
    if (error) {
      console.log('Error message:', error.message || error);
    }
    console.log('');
    console.log('Possible causes:');
    console.log('');
    console.log(' 1. Backend server is not running');
    console.log('    - Check: lsof -i :3000');
    console.log('    - Start: cd allsub-backend && npm run start:dev');
    console.log('');
    console.log(' 2. Incorrect URL configuration');
    console.log(`    - Current URL: ${serverUrl}`);
    console.log('    - Expected: http://localhost:3000 (use adb reverse on Android)');
    console.log('');
    console.log(' 3. Firewall blocking the connection');
    console.log('    - macOS: System Settings -> Security -> Firewall');
    console.log('    - Ensure Node.js is allowed');
    console.log('');
    console.log(' 4. Network connectivity issues');
    console.log('    - Disable VPN if active');
    console.log('    - Verify WiFi connection');
    console.log('');
    console.log(' 5. Port conflict');
    console.log('    - Another process may be using port 3000');
    console.log('    - Check with lsof -i :3000');
    console.log('');
  }

  /**
   * 자막 서비스 시작 실패 진단
   */
  static logServiceStartFailure(reason: string) {
    console.log('');
    console.log('[Diagnostics] Subtitle service failed to start');
    console.log('');
    console.log('Reason:', reason);
    console.log('');
    console.log('Checklist:');
    console.log('');
    console.log(' - WebSocket connected? (check connection logs)');
    console.log(' - Microphone permission granted? (verify permission logs)');
    console.log(' - Audio recording started?');
    console.log(' - Backend server running without errors?');
    console.log('');
    console.log('Suggested actions:');
    console.log(' 1. Restart the app');
    console.log(' 2. Reinstall the app to reset permissions');
    console.log(' 3. Restart the simulator or device');
    console.log('');
  }

  /**
   * 연결 성공 정보
   */
  static logSuccessInfo() {
    console.log('');
    console.log('[Diagnostics] Subtitle service operational');
    console.log('');
    console.log('Status checklist:');
    console.log(' - WebSocket connected');
    console.log(' - Microphone permission granted');
    console.log(' - Audio recording active');
    console.log(' - Server communication established');
    console.log('');
    console.log('Usage tips:');
    console.log(' 1. Tap the floating button in the lower left');
    console.log(' 2. Speak in Korean');
    console.log(' 3. Check subtitles after about two seconds');
    console.log('');
    console.log('iOS Live Activities (iOS 16.1+):');
    console.log('  - Command + L (lock screen)');
    console.log('  - Check Dynamic Island');
    console.log('');
  }
}

export default Diagnostics;

