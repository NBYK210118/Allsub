import { Platform } from 'react-native';

/**
 * 환경 설정
 * 플랫폼별로 다른 API 엔드포인트를 사용합니다.
 */

// 현재 네트워크 환경에 맞는 IP 주소들
const NETWORK_IPS = {
  // ⚠️ 현재 개발 PC IP - ifconfig로 확인 후 업데이트하세요!
  current: '10.50.215.125', // ← 현재 WiFi IP (업데이트됨)
  // 이전 IP들 (백업용)
  previous: '192.168.0.78',
  // 로컬호스트 (명시적 IP 사용)
  localhost: '127.0.0.1', // localhost 대신 127.0.0.1 사용 (React Native 호환)
  // Android 에뮬레이터 특별 IP
  androidEmulator: '10.0.2.2',
};

// iOS 시뮬레이터 설정
const IOS_SIMULATOR_CONFIG = {
  apiBaseUrl: `http://${NETWORK_IPS.localhost}:3000`, // localhost 사용 (네트워크 변경 무관)
  wsBaseUrl: `http://${NETWORK_IPS.localhost}:3000`,
  // iOS 시뮬레이터는 호스트의 localhost에 직접 접근 가능
};

// Android 에뮬레이터 설정
const ANDROID_EMULATOR_CONFIG = {
  apiBaseUrl: `http://${NETWORK_IPS.localhost}:3000`, // 127.0.0.1 사용 (adb reverse 필요)
  wsBaseUrl: `http://${NETWORK_IPS.localhost}:3000`,
  // Android 에뮬레이터: ./setup-android-dev.sh 실행 또는 adb reverse tcp:3000 tcp:3000
};

// 실제 디바이스 설정 (프로덕션)
const PRODUCTION_CONFIG = {
  apiBaseUrl: 'http://210.115.229.181:3000',
  wsBaseUrl: 'http://210.115.229.181:3000',
  // 실제 서버 IP 주소
};

// 개발 환경에서 실제 디바이스 테스트용 (WiFi 같은 네트워크에 있을 때)
const DEV_DEVICE_CONFIG = {
  apiBaseUrl: `http://${NETWORK_IPS.current}:3000`, // 현재 개발 PC의 실제 IP
  wsBaseUrl: `http://${NETWORK_IPS.current}:3000`,
  // 개발 PC의 현재 IP 주소 (같은 네트워크에 있어야 함)
};

/**
 * 현재 환경에 맞는 설정을 반환합니다.
 */
function getEnvironmentConfig() {
  console.log('');
  console.log('[Environment] Selecting configuration');
  console.log('  Platform.OS:', Platform.OS);
  console.log('  __DEV__:', __DEV__);
  console.log('');

  // 프로덕션 환경
  if (!__DEV__) {
    console.log('Using PRODUCTION config');
    console.log('  API:', PRODUCTION_CONFIG.apiBaseUrl);
    console.log('  WS:', PRODUCTION_CONFIG.wsBaseUrl);
    console.log('');
    return PRODUCTION_CONFIG;
  }

  // 개발 환경 - Expo Go는 실제 디바이스처럼 실제 IP 필요
  // Expo Go에서는 localhost/127.0.0.1이 작동하지 않음!
  console.log('Using DEV DEVICE config (Expo Go)');
  console.log('  API:', DEV_DEVICE_CONFIG.apiBaseUrl);
  console.log('  WS:', DEV_DEVICE_CONFIG.wsBaseUrl);
  console.log('');
  console.log('Expo Go requires the actual network IP');
  console.log('Update NETWORK_IPS.current when the network changes');
  console.log('');
  return DEV_DEVICE_CONFIG;
}

// 환경 설정 내보내기
export const ENV_CONFIG = getEnvironmentConfig();

// 개별 설정 내보내기 (직접 접근용)
export const API_BASE_URL = ENV_CONFIG.apiBaseUrl;
export const WS_BASE_URL = ENV_CONFIG.wsBaseUrl;

// 설정 타입
export interface EnvironmentConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
}

// 모든 설정 내보내기 (테스트나 디버깅용)
export const ALL_CONFIGS = {
  ios: IOS_SIMULATOR_CONFIG,
  android: ANDROID_EMULATOR_CONFIG,
  production: PRODUCTION_CONFIG,
  devDevice: DEV_DEVICE_CONFIG,
};

/**
 * 특정 플랫폼의 설정을 가져옵니다.
 * @param platform - 'ios' | 'android' | 'production' | 'devDevice'
 */
export function getConfigForPlatform(
  platform: 'ios' | 'android' | 'production' | 'devDevice'
): EnvironmentConfig {
  switch (platform) {
    case 'ios':
      return IOS_SIMULATOR_CONFIG;
    case 'android':
      return ANDROID_EMULATOR_CONFIG;
    case 'production':
      return PRODUCTION_CONFIG;
    case 'devDevice':
      return DEV_DEVICE_CONFIG;
    default:
      return IOS_SIMULATOR_CONFIG;
  }
}

// 현재 사용 중인 설정 정보 로깅
console.log('');
console.log('[Environment] Active configuration');
console.log(`  Platform: ${Platform.OS}`);
console.log(`  Environment: ${__DEV__ ? 'Development' : 'Production'}`);
console.log(`  Current Network IP: ${NETWORK_IPS.current}`);
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log(`  WebSocket URL: ${WS_BASE_URL}`);
console.log(`  Loaded at: ${new Date().toLocaleString('ko-KR')}`);
console.log('Update NETWORK_IPS.current if your network changes');
console.log('');

