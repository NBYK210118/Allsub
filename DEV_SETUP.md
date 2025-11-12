# 🚀 AllSub 개발 환경 설정 가이드

## 📱 네트워크 설정

### ✅ **localhost 사용 (권장)**

개발 환경에서는 **네트워크 IP가 변경되어도** 항상 작동하도록 `localhost`를 사용합니다.

#### **iOS 시뮬레이터**
- ✅ 자동으로 `localhost` 사용
- ✅ 추가 설정 불필요
- ✅ WiFi 변경해도 작동

#### **Android 에뮬레이터**
- ⚠️ `adb reverse` 명령어 필요
- 📋 설정 방법:
  ```bash
  cd allsub-mobile
  ./setup-android-dev.sh
  ```
  또는 수동 설정:
  ```bash
  adb reverse tcp:3000 tcp:3000
  adb reverse tcp:3001 tcp:3001
  ```

---

## 🔧 개발 서버 실행

### **백엔드**
```bash
cd allsub-backend
npm run start:dev:clean
```

### **프론트엔드**
```bash
cd allsub-mobile
npx expo start --clear
```

---

## 🌐 플랫폼별 URL 설정

| 플랫폼 | URL | 비고 |
|--------|-----|------|
| **iOS 시뮬레이터** | `http://localhost:3000` | 자동 설정 ✅ |
| **Android 에뮬레이터** | `http://localhost:3000` | `adb reverse` 필요 ⚠️ |
| **실제 디바이스 (WiFi)** | `http://{개발PC IP}:3000` | 같은 WiFi 네트워크 필요 |
| **프로덕션** | `http://210.115.229.181:3000` | 실제 서버 |

---

## 💡 환경 전환

### **개발 모드 (localhost)**
- 기본 설정으로 작동
- 네트워크 변경 무관
- 빠른 개발 및 테스트

### **실제 디바이스 테스트**
실제 모바일 기기에서 테스트하려면:

1. `allsub-mobile/src/config/environment.ts` 열기
2. `NETWORK_IPS.current`를 현재 개발 PC의 IP로 업데이트
3. `getEnvironmentConfig()` 함수를 수정하여 `DEV_DEVICE_CONFIG` 사용

---

## 🔍 문제 해결

### **연결 실패 시**
1. 백엔드 서버 실행 확인: `lsof -i :3000`
2. iOS: 앱 재시작 (⌘ + R)
3. Android: `adb reverse` 재실행

### **포트 충돌 시**
```bash
cd allsub-backend
npm run start:dev:clean  # 자동으로 포트 정리 후 시작
```

---

## ✨ 개발 팁

- **빠른 재시작**: Expo에서 `r` 키
- **디버그 메뉴**: 앱에서 환경설정 → 디버그
- **네트워크 확인**: 디버그 메뉴에서 현재 URL 확인
- **로그 확인**: 백엔드와 프론트엔드 콘솔 동시 모니터링




