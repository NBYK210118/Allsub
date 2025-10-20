# 플랫폼별 설정 가이드

## 🎯 한눈에 보는 설정

```
┌─────────────────────────────────────────────────────────────┐
│                    환경별 자동 설정                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📱 iOS 시뮬레이터                                            │
│  ├─ API URL:        http://localhost:3000                   │
│  ├─ WebSocket URL:  http://localhost:3000                   │
│  └─ ✅ 자동 선택 (설정 변경 불필요)                           │
│                                                               │
│  🤖 Android 에뮬레이터                                        │
│  ├─ API URL:        http://10.0.2.2:3000                    │
│  ├─ WebSocket URL:  http://10.0.2.2:3000                    │
│  └─ ✅ 자동 선택 (설정 변경 불필요)                           │
│                                                               │
│  📲 실제 디바이스 (개발용)                                     │
│  ├─ API URL:        http://192.168.x.x:3000                 │
│  ├─ WebSocket URL:  http://192.168.x.x:3000                 │
│  └─ ⚙️ 수동 설정 필요 (WiFi IP 입력)                         │
│                                                               │
│  🚀 프로덕션                                                  │
│  ├─ API URL:        http://210.115.229.181:3000             │
│  ├─ WebSocket URL:  http://210.115.229.181:3000             │
│  └─ ✅ 자동 선택 (릴리즈 빌드 시)                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 빠른 시작

### iOS 시뮬레이터에서 실행
```bash
# 1. 백엔드 서버 실행 (터미널 1)
cd allsub-backend
npm run start:dev

# 2. 앱 실행 (터미널 2)
cd allsub-mobile
npx expo run:ios
```
✅ **설정 변경 불필요!** 자동으로 `localhost:3000` 사용

---

### Android 에뮬레이터에서 실행
```bash
# 1. 백엔드 서버 실행 (터미널 1)
cd allsub-backend
npm run start:dev

# 2. 앱 실행 (터미널 2)
cd allsub-mobile
npx expo run:android
```
✅ **설정 변경 불필요!** 자동으로 `10.0.2.2:3000` 사용

---

### 실제 iPhone/Android 디바이스에서 실행

#### Step 1: 개발 PC의 IP 주소 확인
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# 또는
ipconfig getifaddr en0

# 예시 출력: 192.168.0.15
```

#### Step 2: 환경 설정 파일 수정
`src/config/environment.ts` 파일 열기:
```typescript
const DEV_DEVICE_CONFIG = {
  apiBaseUrl: 'http://192.168.0.15:3000',  // ⬅️ 여기에 실제 IP
  wsBaseUrl: 'http://192.168.0.15:3000',
};
```

#### Step 3: 백엔드 서버 실행
```bash
cd allsub-backend
npm run start:dev
```

#### Step 4: 앱 실행
```bash
cd allsub-mobile
npx expo run:ios    # iPhone의 경우
npx expo run:android # Android의 경우
```

⚠️ **주의:** 개발 PC와 디바이스가 **같은 WiFi 네트워크**에 연결되어 있어야 합니다!

---

## 🔍 설정 확인 방법

앱 실행 후 우측 하단의 **⚙️ 버튼**을 탭하면 현재 설정을 확인할 수 있습니다:

```
🔧 환경 설정 디버그
├─ 📱 현재 사용 중인 설정
│  ├─ 플랫폼: iOS
│  ├─ 환경: Development
│  ├─ API URL: http://localhost:3000
│  └─ WebSocket URL: http://localhost:3000
├─ 🍎 iOS 시뮬레이터 설정
├─ 🤖 Android 에뮬레이터 설정
├─ 📲 실제 디바이스 설정
└─ 🚀 프로덕션 설정
```

---

## 📂 파일 구조

```
allsub-mobile/
├─ src/
│  ├─ config/
│  │  └─ environment.ts          ← 🎯 환경 설정 파일
│  ├─ services/
│  │  ├─ api.ts                  ← API 호출 (environment.ts 사용)
│  │  └─ subtitleService.ts      ← WebSocket (environment.ts 사용)
│  └─ components/
│     ├─ DebugConfig.tsx         ← 설정 확인 UI
│     └─ ...
├─ ENVIRONMENT_CONFIG.md          ← 상세 설정 가이드
└─ PLATFORM_SETUP_GUIDE.md        ← 이 파일
```

---

## 💡 자주 묻는 질문

### Q1: iOS에서 "Network request failed" 에러
**A:** 백엔드 서버가 `localhost:3000`에서 실행 중인지 확인하세요.
```bash
cd allsub-backend
npm run start:dev
```

### Q2: Android에서 "Network request failed" 에러
**A:** 
- 에뮬레이터 사용 중: 백엔드 서버 실행 확인
- 실제 디바이스 사용 중: `DEV_DEVICE_CONFIG`에 WiFi IP 입력

### Q3: 설정을 변경했는데 적용이 안 됨
**A:** 앱을 완전히 재시작하세요:
```bash
# 앱 종료 후 다시 빌드
npx expo run:ios     # 또는 run:android
```

### Q4: WiFi IP를 어떻게 찾나요?
**A:** 
```bash
# macOS
ipconfig getifaddr en0

# Windows
ipconfig | findstr IPv4

# Linux
ip addr show | grep inet
```

### Q5: 프로덕션 배포 시 설정 변경 필요한가요?
**A:** 아니요! 자동으로 `PRODUCTION_CONFIG`가 사용됩니다.
필요하다면 `src/config/environment.ts`의 `PRODUCTION_CONFIG`만 수정하세요.

---

## 🎓 고급 설정

### 포트 변경
백엔드가 3000이 아닌 다른 포트를 사용한다면:
```typescript
// src/config/environment.ts
const IOS_SIMULATOR_CONFIG = {
  apiBaseUrl: 'http://localhost:8080',  // 포트 변경
  wsBaseUrl: 'http://localhost:8080',
};
```

### HTTPS 사용 (프로덕션)
```typescript
const PRODUCTION_CONFIG = {
  apiBaseUrl: 'https://api.yourserver.com',
  wsBaseUrl: 'wss://api.yourserver.com',  // wss:// 사용
};
```

### 여러 환경 전환
```typescript
// 임시로 다른 설정 사용하려면
function getEnvironmentConfig() {
  // 강제로 실제 디바이스 설정 사용
  return DEV_DEVICE_CONFIG;
  
  // 원래 로직은 주석 처리
  // if (Platform.OS === 'ios') { ... }
}
```

---

## ✅ 체크리스트

### iOS 시뮬레이터
- [ ] Xcode 설치됨
- [ ] 백엔드 서버 `localhost:3000`에서 실행 중
- [ ] `npx expo run:ios` 실행
- [ ] 앱에서 ⚙️ 버튼으로 설정 확인

### Android 에뮬레이터
- [ ] Android Studio 설치됨
- [ ] 백엔드 서버 실행 중
- [ ] `npx expo run:android` 실행
- [ ] 앱에서 ⚙️ 버튼으로 설정 확인

### 실제 디바이스
- [ ] 개발 PC의 WiFi IP 확인
- [ ] `environment.ts`의 `DEV_DEVICE_CONFIG` 수정
- [ ] 디바이스와 PC가 같은 WiFi 연결
- [ ] 백엔드 서버 실행 중
- [ ] 앱 빌드 및 설치
- [ ] 앱에서 ⚙️ 버튼으로 설정 확인

---

## 📚 추가 문서

- [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 상세 환경 설정 가이드
- [README.md](./README.md) - 프로젝트 전체 문서
- [IOS_LIVE_ACTIVITIES_IMPLEMENTATION.md](./IOS_LIVE_ACTIVITIES_IMPLEMENTATION.md) - iOS Live Activities 구현

---

## 🎉 요약

**대부분의 경우 설정 변경이 필요 없습니다!**

- ✅ iOS 시뮬레이터: 그냥 실행
- ✅ Android 에뮬레이터: 그냥 실행
- ⚙️ 실제 디바이스: WiFi IP만 입력하면 됨

궁금한 점이 있으면 앱의 ⚙️ 디버그 버튼을 눌러보세요! 🚀

