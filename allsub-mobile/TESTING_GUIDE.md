# AllSub 테스트 가이드

OS별 UI를 보면서 테스트하는 방법을 자세히 안내합니다.

---

## 📋 테스트 환경 준비

### **공통 요구사항**
- Node.js 18+ 설치
- Git 설치
- 백엔드 서버 실행 중

### **Android 테스트 환경**
- Android Studio 설치
- JDK 17+ 설치
- Android SDK 설치
- 실제 Android 디바이스 (권장) 또는 에뮬레이터

### **iOS 테스트 환경**
- macOS (필수)
- Xcode 15+ 설치
- CocoaPods 설치
- 실제 iPhone (필수 - Live Activities 테스트)
- Apple Developer 계정

---

## 🤖 Android 테스트 방법

### Option 1: 실제 Android 디바이스 (권장)

#### 1️⃣ USB 디버깅 활성화

```
1. 설정 > 휴대전화 정보
2. "빌드 번호"를 7번 탭 (개발자 옵션 활성화)
3. 설정 > 개발자 옵션
4. "USB 디버깅" 활성화
```

#### 2️⃣ 디바이스 연결 확인

```bash
# USB로 디바이스 연결
adb devices

# 출력 예시:
# List of devices attached
# 1234567890ABCDEF    device
```

#### 3️⃣ Development Build 설치

```bash
cd allsub-mobile

# 첫 실행 (prebuild + 빌드 + 설치)
npx expo run:android

# 이후 실행 (코드 변경 시)
npm start
```

#### 4️⃣ System Overlay 권한 부여

```
1. 앱 실행
2. 토글을 ON으로 변경
3. "다른 앱 위에 그리기" 권한 요청 팝업
4. "설정으로 이동" 탭
5. AllSub 앱 찾기
6. "다른 앱 위에 표시" 권한 활성화
7. 앱으로 돌아오기
```

#### 5️⃣ 플로팅 버튼 테스트

```
1. AllSub 앱에서 토글 ON
2. 홈 버튼 눌러서 홈 화면으로
3. 화면 왼쪽에 플로팅 버튼(화살표) 확인
4. YouTube 앱 실행
5. 영상 재생 중 플로팅 버튼 탭
6. 자막 오버레이가 YouTube 위에 표시되는지 확인
```

---

### Option 2: Android Studio 에뮬레이터

#### 1️⃣ AVD 생성

```
1. Android Studio 실행
2. Tools > Device Manager
3. Create Device
4. Phone > Pixel 7 선택
5. System Image > Android 13.0 (API 33) 선택
6. Finish
```

#### 2️⃣ 에뮬레이터 실행

```bash
# Android Studio에서 실행 버튼 클릭
# 또는 터미널에서:
emulator -avd Pixel_7_API_33
```

#### 3️⃣ 앱 실행

```bash
cd allsub-mobile
npx expo run:android

# 에뮬레이터가 자동 감지되어 설치됨
```

#### 4️⃣ 테스트

```
에뮬레이터에서도 실제 디바이스와 동일하게 테스트
(단, 성능은 실제 디바이스가 더 우수)
```

---

### 🎬 Android UI 스크린샷 캡처

```bash
# 스크린샷 찍기
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png .

# 화면 녹화 (최대 3분)
adb shell screenrecord /sdcard/demo.mp4
# ... 테스트 진행 ...
# Ctrl+C로 중지
adb pull /sdcard/demo.mp4 .
```

---

## 🍎 iOS 테스트 방법

### Option 1: 실제 iPhone (필수)

#### 1️⃣ Apple Developer 계정 설정

```
1. Xcode 실행
2. Xcode > Settings > Accounts
3. Apple ID 추가
4. Team 선택 (Personal Team도 가능)
```

#### 2️⃣ Provisioning Profile 생성

```bash
cd allsub-mobile

# Prebuild 실행
npx expo prebuild --platform ios

# Xcode 프로젝트 열기
open ios/AllsubMobile.xcworkspace
```

```
Xcode에서:
1. 프로젝트 선택 (최상단)
2. Signing & Capabilities 탭
3. Team 선택
4. "Automatically manage signing" 체크
5. Bundle Identifier 확인: com.allsubmobile
```

#### 3️⃣ iPhone 연결 및 신뢰

```
1. Lightning/USB-C 케이블로 iPhone 연결
2. iPhone 잠금 해제
3. "이 컴퓨터를 신뢰하시겠습니까?" → 신뢰
4. Xcode 상단에서 연결된 iPhone 선택
```

#### 4️⃣ Development Build 설치

```bash
# 터미널에서 실행
npx expo run:ios --device

# 또는 Xcode에서 ▶️ 버튼 클릭
```

#### 5️⃣ 개발자 앱 신뢰 설정

```
첫 설치 시:
1. 설정 > 일반 > VPN 및 기기 관리
2. 개발자 앱 섹션에서 본인 Apple ID 탭
3. "신뢰" 탭
```

#### 6️⃣ Live Activities 테스트

```
1. AllSub 앱 실행
2. 토글 ON
3. 홈 버튼 눌러서 홈 화면으로
4. Dynamic Island 확인 (iPhone 14 Pro 이상)
   - Minimal: 작은 아이콘
   - 탭하면 Expanded로 확장
5. Lock Screen에서 확인
6. YouTube 앱 실행
7. 영상 재생하면서 Live Activity 업데이트 확인
```

---

### Option 2: Xcode Simulator (제한적)

#### 1️⃣ Simulator 실행

```bash
# Simulator 실행
open -a Simulator

# 특정 디바이스 실행
xcrun simctl boot "iPhone 15 Pro"
```

#### 2️⃣ 앱 실행

```bash
cd allsub-mobile
npx expo run:ios

# Simulator가 자동으로 감지되어 설치됨
```

#### 3️⃣ 제약사항

```
⚠️ Simulator 제약:
- Live Activities 제한적 지원
- Dynamic Island 시뮬레이션만 가능
- 실제 동작과 다를 수 있음
- 권장: 실제 iPhone 사용
```

---

### 🎬 iOS UI 스크린샷 캡처

#### Xcode에서 캡처

```
1. Xcode > Window > Devices and Simulators
2. 연결된 iPhone 선택
3. "Take Screenshot" 버튼 클릭
```

#### 화면 녹화

```
iPhone에서:
1. 제어 센터 열기
2. 화면 녹화 버튼 탭
3. 3초 카운트다운 후 녹화 시작
4. 완료 후 상단 빨간 바 탭 → 중지
5. 사진 앱에서 확인
```

---

## 🔄 동시 테스트 (Android + iOS)

### 백엔드 서버 하나로 둘 다 테스트

```bash
# 터미널 1: 백엔드 서버
cd allsub-backend
npm run start:dev

# 터미널 2: Android
cd allsub-mobile
npx expo run:android

# 터미널 3: iOS (macOS에서만)
cd allsub-mobile
npx expo run:ios --device
```

### 네트워크 설정

```typescript
// src/services/subtitleService.ts
const SERVER_URL = 'http://YOUR_COMPUTER_IP:3000';

// YOUR_COMPUTER_IP 찾기:
// Windows: ipconfig
// Mac/Linux: ifconfig
// 예: http://192.168.1.100:3000
```

---

## 📊 테스트 체크리스트

### ✅ Android System Overlay

- [ ] 플로팅 버튼이 화면 왼쪽에 표시됨
- [ ] 버튼을 드래그하여 이동 가능
- [ ] 버튼 탭하면 자막 오버레이 표시
- [ ] 다른 앱(YouTube, Chrome 등) 위에서 작동
- [ ] 자막이 실시간으로 업데이트됨
- [ ] 토글 OFF하면 플로팅 버튼 사라짐

### ✅ iOS Live Activities

- [ ] 토글 ON 시 Live Activity 시작됨
- [ ] Dynamic Island에 아이콘 표시 (iPhone 14 Pro+)
- [ ] 탭하면 확장되어 전체 자막 표시
- [ ] 상단 배너에 자막 표시 (기타 iPhone)
- [ ] Lock Screen에 자막 표시
- [ ] 다른 앱에서도 업데이트 확인 가능
- [ ] 토글 OFF하면 Live Activity 종료

### ✅ 공통 기능

- [ ] 음성 인식 정상 작동
- [ ] 한국어 → 영어 번역 정상
- [ ] WebSocket 연결 안정적
- [ ] 배터리 소모 적절함
- [ ] 백그라운드에서 지속적으로 작동

---

## 🐛 문제 해결

### Android

#### "다른 앱 위에 그리기" 권한이 안 보여요
```
설정 > 앱 > AllSub > 권한 > 추가 권한
에서 "다른 앱 위에 표시" 찾기
```

#### 플로팅 버튼이 안 보여요
```bash
# 로그 확인
adb logcat | grep -i allsub

# 서비스 실행 확인
adb shell dumpsys activity services | grep FloatingButton
```

### iOS

#### "신뢰할 수 없는 개발자"
```
설정 > 일반 > VPN 및 기기 관리
에서 개발자 앱 신뢰
```

#### Live Activities가 안 나타나요
```
1. iOS 16.1 이상인지 확인
2. 설정 > 알림 > AllSub
   "Live Activities" 활성화 확인
3. Xcode 콘솔에서 에러 확인
```

---

## 📚 추가 리소스

### Android
- [Android Developer Console](https://developer.android.com/)
- [ADB 명령어 치트시트](https://developer.android.com/tools/adb)

### iOS
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)

---

## 💡 팁

### 빠른 개발 워크플로우

```bash
# 코드 변경 후 핫 리로드
# Android/iOS 앱에서 Shake → Reload
# 또는 터미널에서 'r' 입력
```

### 디버깅

```typescript
// 개발 모드에서 콘솔 로그 확인
console.log('Floating button tapped');
console.log('Live Activity updated:', subtitle);
```

### 성능 모니터링

```bash
# Android 메모리 사용량
adb shell dumpsys meminfo com.allsubmobile

# iOS 성능 (Xcode Instruments 사용)
```

---

이 가이드를 따라하면 Android와 iOS 모두에서 UI를 직접 보면서 테스트할 수 있습니다! 🎉

