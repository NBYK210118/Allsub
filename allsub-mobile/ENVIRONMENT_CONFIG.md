# 환경 설정 가이드 (Environment Configuration)

## 📁 설정 파일 위치
`src/config/environment.ts`

## 🎯 목적
iOS 시뮬레이터, Android 에뮬레이터, 실제 디바이스 등 각 환경에 맞는 API 엔드포인트를 자동으로 선택합니다.

---

## 📱 플랫폼별 설정

### 1. iOS 시뮬레이터 (기본)
```typescript
const IOS_SIMULATOR_CONFIG = {
  apiBaseUrl: 'http://localhost:3000',
  wsBaseUrl: 'http://localhost:3000',
};
```
- ✅ Xcode 시뮬레이터에서 자동 적용
- ✅ `localhost`가 맥의 로컬 서버를 가리킴
- 🔧 변경 필요: 없음 (기본값 사용)

### 2. Android 에뮬레이터
```typescript
const ANDROID_EMULATOR_CONFIG = {
  apiBaseUrl: 'http://10.0.2.2:3000',
  wsBaseUrl: 'http://10.0.2.2:3000',
};
```
- ✅ Android Studio 에뮬레이터에서 자동 적용
- ✅ `10.0.2.2`가 호스트 PC의 localhost를 가리킴
- 🔧 변경 필요: 없음 (기본값 사용)

### 3. 프로덕션 (실제 서버)
```typescript
const PRODUCTION_CONFIG = {
  apiBaseUrl: 'http://210.115.229.181:3000',
  wsBaseUrl: 'http://210.115.229.181:3000',
};
```
- ✅ 릴리즈 빌드에서 자동 적용
- 🔧 변경 필요: 실제 서버 주소로 수정

### 4. 개발 디바이스 (실제 폰으로 테스트)
```typescript
const DEV_DEVICE_CONFIG = {
  apiBaseUrl: 'http://192.168.0.100:3000',
  wsBaseUrl: 'http://192.168.0.100:3000',
};
```
- 실제 iPhone/Android 디바이스에서 테스트할 때 사용
- 🔧 변경 필요: **개발 PC의 WiFi IP 주소로 수정**

---

## 🔧 설정 변경 방법

### 방법 1: 실제 디바이스 테스트 시 (추천)

1. **개발 PC의 IP 주소 확인**
   ```bash
   # macOS
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # 또는
   ipconfig getifaddr en0
   ```
   예: `192.168.0.15`

2. **environment.ts 수정**
   ```typescript
   const DEV_DEVICE_CONFIG = {
     apiBaseUrl: 'http://192.168.0.15:3000',  // 여기에 실제 IP
     wsBaseUrl: 'http://192.168.0.15:3000',
   };
   ```

3. **코드 수정 (임시로 실제 디바이스에서 DEV_DEVICE_CONFIG 사용)**
   ```typescript
   function getEnvironmentConfig() {
     if (!__DEV__) {
       return PRODUCTION_CONFIG;
     }
     
     // 임시로 실제 디바이스 설정 사용
     return DEV_DEVICE_CONFIG;  // 이 줄 추가
     
     if (Platform.OS === 'ios') {
       return IOS_SIMULATOR_CONFIG;
     } else if (Platform.OS === 'android') {
       return ANDROID_EMULATOR_CONFIG;
     }
     
     return IOS_SIMULATOR_CONFIG;
   }
   ```

### 방법 2: 포트 변경

포트 3000이 아닌 다른 포트를 사용하는 경우:

```typescript
const IOS_SIMULATOR_CONFIG = {
  apiBaseUrl: 'http://localhost:8080',  // 포트 변경
  wsBaseUrl: 'http://localhost:8080',
};
```

### 방법 3: HTTPS 사용

프로덕션에서 HTTPS를 사용하는 경우:

```typescript
const PRODUCTION_CONFIG = {
  apiBaseUrl: 'https://api.yourserver.com',
  wsBaseUrl: 'wss://api.yourserver.com',  // WebSocket도 wss://
};
```

---

## 🚀 사용 예시

### API 서비스에서 사용
```typescript
// src/services/api.ts
import { API_BASE_URL } from '../config/environment';

export class ApiService {
  private static async request<T>(endpoint: string) {
    const url = `${API_BASE_URL}${endpoint}`;
    // 자동으로 현재 플랫폼에 맞는 URL 사용
    const response = await fetch(url);
    return response.json();
  }
}
```

### WebSocket 서비스에서 사용
```typescript
// src/services/subtitleService.ts
import { WS_BASE_URL } from '../config/environment';

const SERVER_URL = WS_BASE_URL;
// 자동으로 현재 플랫폼에 맞는 URL 사용
WebSocketService.connect(SERVER_URL);
```

---

## 📊 설정 확인 방법

앱 실행 시 콘솔에 다음과 같은 로그가 표시됩니다:

```
==================================================
📋 Environment Configuration
==================================================
Platform: ios
Environment: Development
API Base URL: http://localhost:3000
WebSocket URL: http://localhost:3000
==================================================
```

또는

```
==================================================
📋 Environment Configuration
==================================================
Platform: android
Environment: Development
API Base URL: http://10.0.2.2:3000
WebSocket URL: http://10.0.2.2:3000
==================================================
```

---

## 🎛️ 고급 설정

### 특정 플랫폼 설정 가져오기
```typescript
import { getConfigForPlatform } from '../config/environment';

// iOS 설정 강제 사용
const iosConfig = getConfigForPlatform('ios');

// Android 설정 강제 사용
const androidConfig = getConfigForPlatform('android');

// 실제 디바이스 설정 강제 사용
const devConfig = getConfigForPlatform('devDevice');
```

### 모든 설정 확인
```typescript
import { ALL_CONFIGS } from '../config/environment';

console.log('iOS:', ALL_CONFIGS.ios);
console.log('Android:', ALL_CONFIGS.android);
console.log('Production:', ALL_CONFIGS.production);
console.log('Dev Device:', ALL_CONFIGS.devDevice);
```

---

## 🔍 트러블슈팅

### 문제: "Network request failed"

**iOS 시뮬레이터:**
- ✅ 백엔드 서버가 `localhost:3000`에서 실행 중인지 확인
- ✅ 방화벽이 포트를 차단하지 않는지 확인

**Android 에뮬레이터:**
- ✅ 백엔드 서버가 실행 중인지 확인
- ✅ `10.0.2.2`가 제대로 작동하는지 확인
- ❌ `localhost` 사용 금지 (작동하지 않음)

**실제 디바이스:**
- ✅ 개발 PC와 디바이스가 **같은 WiFi**에 연결되어 있는지 확인
- ✅ `DEV_DEVICE_CONFIG`의 IP가 **개발 PC의 실제 IP**인지 확인
- ✅ 방화벽이 외부 연결을 허용하는지 확인

### 문제: iOS에서 "localhost" 연결 실패

macOS 방화벽 설정:
```bash
# 시스템 환경설정 > 보안 및 개인 정보 보호 > 방화벽
# Node.js 또는 터미널의 연결을 허용
```

### 문제: Android에서 "10.0.2.2" 연결 실패

에뮬레이터가 아닌 실제 디바이스를 사용 중일 수 있습니다:
- 실제 디바이스는 `DEV_DEVICE_CONFIG` 사용 필요

---

## 📝 체크리스트

### iOS 시뮬레이터 테스트 전
- [ ] 백엔드 서버가 `localhost:3000`에서 실행 중
- [ ] `IOS_SIMULATOR_CONFIG` 설정 확인
- [ ] 앱 재시작

### Android 에뮬레이터 테스트 전
- [ ] 백엔드 서버가 실행 중
- [ ] `ANDROID_EMULATOR_CONFIG`에 `10.0.2.2` 사용
- [ ] 에뮬레이터 재시작

### 실제 디바이스 테스트 전
- [ ] 개발 PC와 디바이스가 같은 WiFi 연결
- [ ] 개발 PC의 IP 주소 확인
- [ ] `DEV_DEVICE_CONFIG`에 실제 IP 입력
- [ ] 앱 재빌드

### 프로덕션 배포 전
- [ ] `PRODUCTION_CONFIG`에 실제 서버 주소 입력
- [ ] HTTPS/WSS 사용 확인
- [ ] 릴리즈 빌드 테스트

---

## 🎯 요약

| 환경 | URL 형식 | 자동 선택 | 변경 필요 |
|------|----------|-----------|-----------|
| iOS 시뮬레이터 | `http://localhost:3000` | ✅ | ❌ |
| Android 에뮬레이터 | `http://10.0.2.2:3000` | ✅ | ❌ |
| 실제 디바이스 (개발) | `http://192.168.x.x:3000` | ❌ | ✅ |
| 프로덕션 | `https://api.server.com` | ✅ | ✅ |

**핵심:** 대부분의 경우 설정 변경 없이 자동으로 작동합니다! 🎉

