# AllSub - Real-time Subtitle Service

실시간 음성 인식 및 자막 번역을 제공하는 모바일 애플리케이션입니다.

## 📱 프로젝트 구조

```
allsub/
├── allsub-mobile/          # React Native (Expo) 프론트엔드
└── allsub-backend/         # NestJS 백엔드
```

## 🚀 주요 기능

### 실시간 자막
- 마이크를 통한 음성 캡처
- 실시간 음성 인식 (Google Cloud Speech-to-Text)
- 다국어 번역 (Google Cloud Translation)
- WebSocket 기반 실시간 통신

### 모바일 UI
- 애니메이션 토글 버튼 (세로 방향)
- 그라디언트 배경 전환
- 자막 오버레이
- 로딩 화면 애니메이션

## 🛠 기술 스택

### Frontend (Mobile)
- **React Native + Expo**: 크로스 플랫폼 모바일 개발
- **TypeScript**: 타입 안전성
- **Zustand**: 상태 관리
- **Socket.IO Client**: 실시간 통신
- **Expo AV**: 오디오 녹음
- **Expo Linear Gradient**: 그라디언트 효과

### Backend
- **NestJS**: Node.js 프레임워크
- **TypeScript**: 타입 안전성
- **Socket.IO**: WebSocket 서버
- **Prisma**: ORM
- **SQLite**: 개발용 데이터베이스
- **Google Cloud Speech-to-Text**: 음성 인식 (선택적)
- **Google Cloud Translation**: 번역 (선택적)

## 📦 설치 및 실행

### 1. 백엔드 설정

```bash
cd allsub-backend

# 의존성 설치
npm install

# 데이터베이스 설정
npx prisma generate
npx prisma db push

# 개발 서버 실행
npm run start:dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 2. 프론트엔드 설정

```bash
cd allsub-mobile

# 의존성 설치
npm install

# Expo 실행
npx expo start --port 8082
```

Expo Go 앱으로 QR 코드를 스캔하여 실행합니다.

### 3. 서버 주소 설정

프론트엔드에서 백엔드 서버에 접근하려면 IP 주소를 설정해야 합니다.

#### `allsub-mobile/src/services/subtitleService.ts`
```typescript
const SERVER_URL = 'http://YOUR_COMPUTER_IP:3000';
```

#### `allsub-mobile/src/services/api.ts`
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000' 
  : 'http://localhost:3000';
```

컴퓨터의 IP 주소를 확인하려면:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## 🔧 Google Cloud 설정 (선택적)

실제 음성 인식과 번역을 사용하려면 Google Cloud 계정이 필요합니다.

### 1. Google Cloud 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. Speech-to-Text API 활성화
4. Translation API 활성화

### 2. 서비스 계정 생성
1. IAM & Admin → Service Accounts
2. 새 서비스 계정 생성
3. 역할 추가:
   - Cloud Speech-to-Text User
   - Cloud Translation API User
4. JSON 키 생성 및 다운로드

### 3. 환경 변수 설정

```bash
# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-key.json"

# Mac/Linux
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

백엔드 서버를 재시작하면 실제 Google Cloud API를 사용합니다.

### 시뮬레이션 모드

Google Cloud 키가 없어도 **시뮬레이션 모드**로 개발 및 테스트가 가능합니다:
- 음성 인식: 미리 정의된 샘플 텍스트 반환
- 번역: 기본 한↔영 번역 시뮬레이션

## 📖 사용 방법

### 1. 앱 시작
- 앱을 실행하면 로딩 화면이 표시됩니다
- 로고와 앱 이름이 페이드 인으로 등장
- 1.5초 후 홈 화면으로 전환

### 2. 자막 활성화
1. 중앙의 토글 버튼을 위로 스와이프하거나 탭
2. 버튼이 위로 이동하며 ON 상태로 전환
3. "Turned On" 메시지가 2초간 표시
4. 마이크 권한 허용
5. 자막 오버레이가 화면 하단에 표시

### 3. 자막 확인
- 화면 하단에 반투명 자막 박스 표시
- 원본 텍스트 (한국어) 상단에 표시
- 번역된 텍스트 (영어) 하단에 회색으로 표시
- "LIVE" 인디케이터로 실시간 상태 확인

### 4. 자막 비활성화
1. 토글 버튼을 아래로 스와이프하거나 탭
2. 버튼이 아래로 이동하며 OFF 상태로 전환
3. "Turned Off" 메시지가 2초간 표시
4. 자막 오버레이 사라짐

## 🏗 아키텍처

### 실시간 자막 플로우

```
[모바일 앱]                    [백엔드 서버]
    │                              │
    ├─ 1. 토글 ON                  │
    │                              │
    ├─ 2. WebSocket 연결 ──────►   │
    │                              │
    ├─ 4. 'start-subtitle' ────►   │
    │                              │
    ├─ 6. 마이크 권한 요청           │
    │                              │
    ├─ 7. 2초마다 오디오 녹음        │
    │                              │
    ├─ 8. 'audio-chunk' ────────►   │
    │     (Base64 오디오)           │
    │                              │
    │                              ├─ 9. 음성 인식
    │                              │
    │                              ├─ 10. 번역
    │                              │
    │  ◄────────────────────────── ├─ 11. 'subtitle-text'
    │                              │
    └─ 12. 화면에 자막 표시          │
```

### 주요 서비스

#### Backend
- **SubtitleGateway**: WebSocket 게이트웨이
- **SpeechService**: 음성 인식
- **TranslationService**: 번역
- **SettingsController**: REST API

#### Frontend
- **SubtitleService**: 자막 서비스 오케스트레이터
- **WebSocketService**: WebSocket 클라이언트
- **AudioService**: 오디오 녹음 및 스트리밍
- **ApiService**: REST API 클라이언트

## 📱 플랫폼별 권한

### Android
- `RECORD_AUDIO`: 마이크 접근
- `SYSTEM_ALERT_WINDOW`: 백그라운드 오버레이 (향후 기능)
- `FOREGROUND_SERVICE`: 백그라운드 실행
- `WAKE_LOCK`: 화면 잠금 방지

### iOS
- `NSMicrophoneUsageDescription`: 마이크 사용 이유
- `NSSpeechRecognitionUsageDescription`: 음성 인식 사용 이유

## ⚠️ 제한 사항

### 1. 시스템 오디오 캡처
현재 구현은 **마이크 입력**만 캡처합니다. 디바이스에서 재생되는 영상의 오디오를 직접 캡처하려면 네이티브 모듈이 필요합니다.

### 2. 백그라운드 오버레이
- **Android**: `SYSTEM_ALERT_WINDOW` 권한으로 가능 (미구현)
- **iOS**: 시스템 제약으로 불가능

### 3. 네트워크 연결 필수
WebSocket 서버에 연결되어야 자막 서비스가 작동합니다.

## 🔜 향후 개선 사항

- [ ] Android System Overlay (플로팅 버튼)
- [ ] iOS Live Activities 지원
- [ ] 시스템 오디오 직접 캡처 (네이티브 모듈)
- [ ] 다양한 언어 지원 확대
- [ ] 자막 스타일 커스터마이징
- [ ] 오프라인 모드 지원
- [ ] 자막 히스토리 저장
- [ ] 음성 인식 정확도 개선

## 📄 라이선스

MIT

## 👥 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

## 📞 문의

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

