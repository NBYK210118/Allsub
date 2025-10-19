# Android 에뮬레이터 설정 가이드

## 🎯 목표
Windows에서 Android 에뮬레이터를 설정하여 AllSub 앱 테스트

---

## 📦 1단계: Android Studio 설치

### 다운로드 및 설치

1. **Android Studio 다운로드**
   - https://developer.android.com/studio 접속
   - "Download Android Studio" 클릭
   - 약 1GB 다운로드

2. **설치 진행**
   ```
   - 설치 파일 실행
   - "Next" 클릭
   - Android SDK, Android Virtual Device 체크 (기본값)
   - 설치 경로: C:\Program Files\Android\Android Studio
   - "Install" 클릭
   ```

3. **초기 설정**
   ```
   - Android Studio 실행
   - "Standard" 설치 선택
   - Android SDK 다운로드 (약 3GB)
   - 완료까지 10-20분 소요
   ```

---

## 🔧 2단계: 환경 변수 설정

### ANDROID_HOME 설정

1. **시스템 환경 변수 열기**
   ```
   Windows 검색 → "환경 변수" → "시스템 환경 변수 편집"
   ```

2. **새로운 시스템 변수 추가**
   ```
   변수 이름: ANDROID_HOME
   변수 값: C:\Users\MMC\AppData\Local\Android\Sdk
   ```

3. **Path 변수에 추가**
   ```
   Path 편집 → 새로 만들기:
   - %ANDROID_HOME%\platform-tools
   - %ANDROID_HOME%\emulator
   - %ANDROID_HOME%\tools
   - %ANDROID_HOME%\tools\bin
   ```

4. **확인**
   ```powershell
   # PowerShell 새로 열어서 확인
   adb --version
   # 출력: Android Debug Bridge version ...
   ```

---

## 📱 3단계: 가상 디바이스(AVD) 생성

### Android Studio에서 생성

1. **Device Manager 열기**
   ```
   Android Studio 실행
   → 우측 상단 "Device Manager" 아이콘 클릭
   → "Create Device" 클릭
   ```

2. **디바이스 선택**
   ```
   Phone 카테고리:
   - Pixel 7 선택 (권장)
   - 또는 Pixel 6, Galaxy S22 등
   → "Next" 클릭
   ```

3. **시스템 이미지 선택**
   ```
   Recommended 탭:
   - API Level 33 (Android 13.0) 선택 (권장)
   - 또는 API Level 34 (Android 14.0)
   
   ⚠️ 중요: API 29 (Android 10) 이상 필요!
   → "Download" 클릭 (약 1GB, 첫 실행 시만)
   → 다운로드 완료 후 "Next"
   ```

4. **AVD 설정**
   ```
   AVD Name: Pixel_7_API_33
   
   Advanced Settings 클릭:
   - RAM: 4096 MB (권장)
   - VM heap: 512 MB
   - Internal Storage: 8192 MB
   
   → "Finish" 클릭
   ```

---

## 🚀 4단계: 에뮬레이터 실행

### 방법 A: Android Studio에서 실행

```
1. Device Manager에서 생성한 AVD 찾기
2. ▶️ (Play) 버튼 클릭
3. 에뮬레이터 창이 열림 (30초~1분 소요)
4. 잠금 화면 위로 스와이프
```

### 방법 B: 터미널에서 실행 (빠름)

```powershell
# 사용 가능한 AVD 목록 확인
emulator -list-avds

# 출력:
# Pixel_7_API_33

# 에뮬레이터 실행
emulator -avd Pixel_7_API_33

# 백그라운드로 실행하려면
Start-Process emulator -ArgumentList "-avd", "Pixel_7_API_33"
```

### 연결 확인

```powershell
# 에뮬레이터가 실행되면
adb devices

# 출력:
# List of devices attached
# emulator-5554    device
```

---

## 📲 5단계: AllSub 앱 설치 및 실행

### 에뮬레이터에 앱 설치

```powershell
cd C:\Users\MMC\Downloads\allsub\allsub-mobile

# 앱 빌드 및 설치 (첫 실행)
npx expo run:android

# Metro bundler가 자동으로 시작됨
# 에뮬레이터에 앱이 자동으로 설치되고 실행됨
```

### 이후 실행 (코드 수정 시)

```powershell
# 에뮬레이터가 이미 실행 중이면
cd C:\Users\MMC\Downloads\allsub\allsub-mobile
npm start

# 또는
npx expo start --android
```

---

## 🧪 6단계: 시스템 오디오 캡처 테스트

### 1. 백엔드 서버 실행 (별도 터미널)

```powershell
cd C:\Users\MMC\Downloads\allsub\allsub-backend
npm run start:dev

# 확인:
# - Port 3000: WebSocket
# - Port 3001: TCP Audio Stream
```

### 2. 에뮬레이터에서 AllSub 앱 실행

```
1. 에뮬레이터에서 AllSub 아이콘 탭
2. 로딩 화면 → 홈 화면 전환 확인
3. 토글이 OFF 상태인지 확인
```

### 3. MediaProjection 권한 테스트

```
1. 토글을 ON으로 변경
2. "화면 캡처 시작" 팝업 확인
   - "지금 시작" 버튼 탭
3. 알림 바에 "AllSub - 실시간 자막 제공 중..." 확인
```

### 4. 에뮬레이터에서 YouTube 테스트

```
방법 A: 브라우저 사용
1. Chrome 브라우저 열기
2. youtube.com 접속
3. 한국어 영상 재생
4. AllSub 앱으로 전환 (Recent Apps 버튼)
5. 자막 확인

방법 B: YouTube 앱 설치
1. Play Store 앱 실행
2. YouTube 앱 다운로드
3. 한국어 영상 재생
4. AllSub 앱으로 전환
5. 자막 확인
```

---

## 🔍 7단계: 로그 확인

### Logcat으로 실시간 로그 보기

```powershell
# 별도 PowerShell 창 열기
adb logcat | Select-String -Pattern "AllSub|AudioCapture"

# 또는 Android Studio에서
# View → Tool Windows → Logcat
# 필터: "package:com.anonymous.allsubmobile"
```

### 예상 로그 출력

```
D/AudioCaptureModule: Requesting MediaProjection permission
D/AudioCaptureModule: MediaProjection permission granted
D/AudioCaptureService: Service created
D/AudioCaptureService: Starting service with server: 210.115.229.181:3001
D/AudioCaptureService: Starting audio capture
D/AudioCaptureService: AudioRecord started
D/AudioCaptureService: Attempting to connect to 210.115.229.181:3001
D/AudioCaptureService: Connected to server
D/AudioCaptureService: Sent 2048 bytes
D/AudioCaptureService: Sent 4096 bytes
...
```

---

## 🐛 문제 해결

### 문제 1: 에뮬레이터가 느려요

**해결책**:
```
Android Studio → Device Manager → AVD 설정 편집:
- Graphics: Hardware - GLES 2.0
- Boot option: Cold Boot
- RAM: 최소 4GB

또는:
Intel HAXM 설치 (하드웨어 가속)
https://github.com/intel/haxm/releases
```

### 문제 2: adb 명령어가 안 먹혀요

**해결책**:
```powershell
# 환경 변수 확인
$env:ANDROID_HOME

# 없으면 설정
$env:ANDROID_HOME = "C:\Users\MMC\AppData\Local\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"

# PowerShell 재시작
```

### 문제 3: 에뮬레이터가 실행 안 돼요

**해결책**:
```powershell
# Hyper-V 비활성화 (필요 시)
bcdedit /set hypervisorlaunchtype off

# 재부팅 후 다시 시도
```

### 문제 4: Play Store가 없어요

**해결책**:
```
AVD 생성 시:
- System Image 선택할 때
- "Google Play" 아이콘이 있는 이미지 선택
- (Google APIs만 있는 건 Play Store 없음)
```

### 문제 5: 앱 설치 실패

**해결책**:
```powershell
# 에뮬레이터 재시작
adb reboot

# 또는 에뮬레이터 완전 종료 후 재실행
adb kill-server
adb start-server
```

---

## 💡 유용한 팁

### 에뮬레이터 스크린샷 찍기

```powershell
adb exec-out screencap -p > screenshot.png
```

### 에뮬레이터 화면 녹화

```powershell
adb shell screenrecord /sdcard/demo.mp4
# Ctrl+C로 중지
adb pull /sdcard/demo.mp4 .
```

### 에뮬레이터 빠르게 시작

```powershell
# Cold Boot 대신 Snapshot 사용
emulator -avd Pixel_7_API_33 -no-snapshot-load
```

### 여러 에뮬레이터 실행

```powershell
# 첫 번째 에뮬레이터
emulator -avd Pixel_7_API_33

# 두 번째 에뮬레이터 (다른 터미널에서)
emulator -avd Pixel_6_API_33
```

---

## 🎯 권장 에뮬레이터 사양

### 최소 사양
- **RAM**: 2GB
- **Storage**: 2GB
- **API Level**: 29 (Android 10)

### 권장 사양
- **RAM**: 4GB
- **Storage**: 8GB
- **API Level**: 33 (Android 13)
- **Graphics**: Hardware - GLES 2.0

### 최적 사양 (성능 테스트용)
- **RAM**: 8GB
- **Storage**: 16GB
- **API Level**: 34 (Android 14)
- **Graphics**: Hardware - GLES 3.0

---

## 🚀 빠른 시작 명령어 모음

```powershell
# 1. 에뮬레이터 실행
emulator -avd Pixel_7_API_33

# 2. 백엔드 서버 실행 (새 터미널)
cd C:\Users\MMC\Downloads\allsub\allsub-backend
npm run start:dev

# 3. 앱 실행 (새 터미널)
cd C:\Users\MMC\Downloads\allsub\allsub-mobile
npx expo run:android

# 4. 로그 확인 (새 터미널)
adb logcat | Select-String -Pattern "AllSub|AudioCapture"
```

---

## 📊 에뮬레이터 vs 실제 디바이스

| 항목 | 에뮬레이터 | 실제 디바이스 |
|------|-----------|-------------|
| 설치 난이도 | 쉬움 | 매우 쉬움 |
| 성능 | 느림 | 빠름 |
| 시스템 오디오 캡처 | ✅ 가능 | ✅ 가능 |
| MediaProjection | ✅ 작동 | ✅ 작동 |
| 카메라/센서 | ⚠️ 제한적 | ✅ 완전 |
| 비용 | 무료 | 디바이스 필요 |

**권장**: 개발은 에뮬레이터, 최종 테스트는 실제 디바이스

---

## 🎮 에뮬레이터 조작법

### 마우스 조작
- **클릭**: 탭
- **드래그**: 스와이프
- **우클릭 드래그**: 핀치 줌
- **스크롤**: 스크롤

### 키보드 단축키
- **홈**: `Home` 키
- **뒤로**: `Esc` 키
- **앱 전환**: `Ctrl + F1`
- **볼륨 up**: `Ctrl + =`
- **볼륨 down**: `Ctrl + -`
- **회전**: `Ctrl + F11` / `Ctrl + F12`

### 에뮬레이터 측면 패널
- **Volume**: 볼륨 조절
- **Rotate**: 화면 회전
- **Screenshot**: 스크린샷
- **Settings**: 에뮬레이터 설정
- **More**: 추가 기능 (위치, 배터리 등)

---

## 🎬 YouTube 앱 설치 방법

### 방법 1: Play Store 사용

```
1. 에뮬레이터에서 Play Store 앱 실행
2. Google 계정 로그인
3. "YouTube" 검색
4. "설치" 탭
5. 앱 실행
```

### 방법 2: APK 직접 설치

```powershell
# YouTube APK 다운로드 (APKMirror 등)
# 그 다음:
adb install youtube.apk
```

### 방법 3: Chrome 브라우저 사용

```
1. 에뮬레이터에서 Chrome 실행
2. youtube.com 접속
3. 동영상 재생
```

---

## 🔊 에뮬레이터 오디오 설정

### 오디오 출력 활성화

```
에뮬레이터 측면 패널:
1. "..." (More) 버튼 클릭
2. Settings → General 탭
3. "Audio output" 활성화
4. "Apply" 클릭
```

### 오디오 입력 (마이크) 설정

```
Settings → Microphone 탭:
- Host audio input 선택
- Virtual microphone 활성화
```

---

## ⚡ 성능 최적화

### Intel HAXM 설치 (하드웨어 가속)

```
1. Android Studio → SDK Manager
2. SDK Tools 탭
3. "Intel x86 Emulator Accelerator (HAXM installer)" 체크
4. "Apply" 클릭
5. 설치 완료 후 에뮬레이터 재시작
```

### Cold Boot 비활성화 (빠른 시작)

```
Device Manager → AVD 설정 편집:
- Boot option: Quick Boot
- "Save quick-boot state on exit" 체크
```

### GPU 가속 활성화

```
AVD 설정:
- Graphics: Hardware - GLES 2.0 또는 3.0
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 테스트

```
1. 에뮬레이터 실행
2. AllSub 앱 실행
3. 토글 ON → MediaProjection 권한 승인
4. Chrome에서 YouTube 영상 재생
5. AllSub 앱으로 전환
6. 자막 확인 ✅
```

### 시나리오 2: 백그라운드 테스트

```
1. AllSub 토글 ON
2. YouTube 앱에서 영상 재생
3. 홈 버튼 눌러서 홈 화면으로
4. AllSub 앱 다시 열기
5. 자막이 계속 업데이트되는지 확인 ✅
```

### 시나리오 3: 앱 전환 테스트

```
1. AllSub 토글 ON
2. YouTube → Instagram → Chrome 순서로 전환
3. 각 앱의 오디오가 모두 캡처되는지 확인 ✅
```

---

## 📱 에뮬레이터에서 로그 확인

### React Native 로그

```powershell
# Metro bundler 로그 (자동으로 표시됨)
# 또는
npx react-native log-android
```

### Native 로그 (Logcat)

```powershell
# 모든 로그
adb logcat

# AllSub 관련만
adb logcat | Select-String -Pattern "AllSub"

# 에러만
adb logcat *:E

# 특정 태그만
adb logcat -s AudioCaptureService
```

### 백엔드 로그

```powershell
cd allsub-backend
# 터미널에서 실시간으로 표시됨
```

---

## 🎥 화면 녹화 (데모 영상 만들기)

```powershell
# 녹화 시작
adb shell screenrecord /sdcard/allsub-demo.mp4

# ... 테스트 진행 (최대 3분) ...

# Ctrl+C로 중지

# PC로 가져오기
adb pull /sdcard/allsub-demo.mp4 .
```

---

## 🚀 완전 자동화 스크립트

### start-all.ps1 (모든 서비스 한 번에 시작)

```powershell
# 에뮬레이터 실행
Start-Process emulator -ArgumentList "-avd", "Pixel_7_API_33"

# 5초 대기 (에뮬레이터 부팅)
Start-Sleep -Seconds 5

# 백엔드 서버 시작
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\MMC\Downloads\allsub\allsub-backend; npm run start:dev"

# 3초 대기 (서버 시작)
Start-Sleep -Seconds 3

# 앱 실행
cd C:\Users\MMC\Downloads\allsub\allsub-mobile
npx expo run:android
```

---

## 📚 추가 리소스

- [Android Studio 공식 가이드](https://developer.android.com/studio/intro)
- [AVD 관리 가이드](https://developer.android.com/studio/run/managing-avds)
- [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/)

---

이 가이드를 따라하면 Windows에서 Android 에뮬레이터를 사용하여 AllSub 앱을 완벽하게 테스트할 수 있습니다! 🎉

