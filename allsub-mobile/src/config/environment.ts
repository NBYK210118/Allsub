import { Platform } from 'react-native';

/**
 * 환경 설정
 * 플랫폼별로 다른 API 엔드포인트를 사용합니다.
 */

// iOS 시뮬레이터 설정
const IOS_SIMULATOR_CONFIG = {
  apiBaseUrl: 'http://localhost:3000',
  wsBaseUrl: 'http://localhost:3000',
  // iOS 시뮬레이터에서는 localhost가 맥의 로컬 서버를 가리킴
};

// Android 에뮬레이터 설정
const ANDROID_EMULATOR_CONFIG = {
  apiBaseUrl: 'http://10.0.2.2:3000',
  wsBaseUrl: 'http://10.0.2.2:3000',
  // Android 에뮬레이터에서 10.0.2.2는 호스트 PC의 localhost를 가리킴
};

// 실제 디바이스 설정 (프로덕션)
const PRODUCTION_CONFIG = {
  apiBaseUrl: 'http://210.115.229.181:3000',
  wsBaseUrl: 'http://210.115.229.181:3000',
  // 실제 서버 IP 주소
};

// 개발 환경에서 실제 디바이스 테스트용 (WiFi 같은 네트워크에 있을 때)
const DEV_DEVICE_CONFIG = {
  apiBaseUrl: 'http://192.168.0.100:3000', // 여기에 개발 PC의 실제 IP를 입력
  wsBaseUrl: 'http://192.168.0.100:3000',
  // 개발 PC의 WiFi IP 주소 (같은 네트워크에 있어야 함)
};

/**
 * 현재 환경에 맞는 설정을 반환합니다.
 */
function getEnvironmentConfig() {
  // 프로덕션 환경
  if (!__DEV__) {
    console.log('🚀 Using PRODUCTION config');
    return PRODUCTION_CONFIG;
  }

  // 개발 환경
  if (Platform.OS === 'ios') {
    console.log('📱 Using iOS SIMULATOR config');
    return IOS_SIMULATOR_CONFIG;
  } else if (Platform.OS === 'android') {
    console.log('🤖 Using ANDROID EMULATOR config');
    return ANDROID_EMULATOR_CONFIG;
  }

  // 기본값 (web 등)
  console.log('🌐 Using default config');
  return IOS_SIMULATOR_CONFIG;
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
console.log('='.repeat(50));
console.log('📋 Environment Configuration');
console.log('='.repeat(50));
console.log(`Platform: ${Platform.OS}`);
console.log(`Environment: ${__DEV__ ? 'Development' : 'Production'}`);
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`WebSocket URL: ${WS_BASE_URL}`);
console.log('='.repeat(50));

