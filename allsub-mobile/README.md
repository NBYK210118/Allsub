# AllSub Mobile

영상의 음성을 실시간으로 인식하여 자막을 제공하는 모바일 앱입니다.

## 기술 스택

- **React Native + Expo**: 크로스 플랫폼 모바일 개발
- **Zustand**: 상태 관리
- **Socket.IO Client**: 실시간 통신
- **Expo AV**: 오디오 녹음
- **TypeScript**: 타입 안전성

## 주요 기능

### 1. 실시간 음성 인식 및 자막
- 마이크를 통해 주변 음성 캡처
- 2초 간격으로 오디오 청크를 서버로 전송
- 실시간 음성 인식 결과 수신
- 화면 하단 오버레이로 자막 표시

### 2. 자동 번역
- 원본 언어 (한국어) 인식
- 영어로 자동 번역
- 원본과 번역본 동시 표시

### 3. 토글 버튼
- 세로 방향의 애니메이션 토글
- ON: 위쪽 (자막 활성화)
- OFF: 아래쪽 (자막 비활성화)
- 그라디언트 색상 전환 애니메이션

### 4. 백그라운드 지원
- 앱이 백그라운드로 이동해도 자막 서비스 유지
- AppState 감지로 상태 관리

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 백엔드 서버 주소 설정

`src/services/subtitleService.ts` 파일에서 서버 URL을 설정합니다:

```typescript
const SERVER_URL = 'http://YOUR_COMPUTER_IP:3000';
```

또는 `src/services/api.ts`에서:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000' 
  : 'http://localhost:3000';
```

### 3. 앱 실행

**Expo Go 사용 (권장)**
```bash
npx expo start --port 8082
```

그 다음:
1. 모바일에서 Expo Go 앱 설치
2. QR 코드 스캔
3. 앱 실행

**개발 빌드**
```bash
npx expo run:android
# 또는
npx expo run:ios
```

## 사용 방법

### 1. 앱 시작
1. 앱을 실행하면 로딩 화면 표시
2. 로고와 앱 이름이 페이드 인으로 등장
3. 1.5초 후 홈 화면으로 전환

### 2. 자막 활성화
1. 중앙의 토글 버튼을 위로 스와이프하거나 탭
2. 버튼이 위로 이동하며 ON 상태로 전환
3. "Turned On" 메시지가 2초간 표시
4. 자막 오버레이가 화면 하단에 표시

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

### 5. 메뉴 사용
1. 우측 상단 햄버거 메뉴 탭
2. "Support" 또는 "Share" 선택
3. Share 선택 시 소셜 미디어 공유 옵션 표시

## 아키텍처

### 서비스 계층

#### `SubtitleService`
- WebSocket 연결 관리
- 자막 서비스 시작/중지
- 오디오 스트리밍 오케스트레이션
- 상태 관리

#### `WebSocketService`
- Socket.IO 클라이언트
- 서버와 실시간 통신
- 이벤트 리스닝 및 전송
- 재연결 로직

#### `AudioService`
- 마이크 권한 요청
- 오디오 녹음 (2초 청크)
- Base64 인코딩
- 파일 시스템 관리

#### `ApiService`
- REST API 호출
- 사용자 설정 관리
- 에러 처리

### 컴포넌트

#### `HomeScreen`
- 메인 화면
- 토글 버튼 및 상태 관리
- 자막 서비스 라이프사이클 관리
- 그라디언트 배경 애니메이션

#### `AnimatedToggle`
- 세로 토글 버튼
- 그라디언트 및 블러 효과
- 스프링 애니메이션
- 그림자 효과

#### `SubtitleOverlay`
- 자막 표시 오버레이
- 원본 + 번역 텍스트
- LIVE 인디케이터
- 페이드 애니메이션

#### `LoadingScreen`
- 앱 시작 로딩 화면
- 로고 페이드 인 애니메이션
- 화면 전환 효과

### 상태 관리

#### Zustand Store (`useAppStore`)
- `isCaptionEnabled`: 자막 ON/OFF 상태
- `captionText`: 자막 텍스트 (설정용)
- `userId`: 사용자 ID
- `toggleCaption()`: 자막 토글
- `loadUserSettings()`: 설정 로드

## 권한 요구사항

### Android
- `RECORD_AUDIO`: 마이크 접근
- `SYSTEM_ALERT_WINDOW`: 백그라운드 오버레이 (선택적)
- `FOREGROUND_SERVICE`: 백그라운드 실행
- `WAKE_LOCK`: 화면 잠금 방지

### iOS
- `NSMicrophoneUsageDescription`: 마이크 사용 이유
- `NSSpeechRecognitionUsageDescription`: 음성 인식 사용 이유

## 디렉토리 구조

```
src/
├── components/
│   ├── HomeScreen.tsx           # 메인 화면
│   ├── AnimatedToggle.tsx       # 토글 버튼
│   ├── SubtitleOverlay.tsx      # 자막 오버레이
│   └── LoadingScreen.tsx        # 로딩 화면
├── services/
│   ├── subtitleService.ts       # 자막 서비스 오케스트레이터
│   ├── websocketService.ts      # WebSocket 클라이언트
│   ├── audioService.ts          # 오디오 녹음
│   ├── speechService.ts         # (레거시)
│   └── api.ts                   # REST API 클라이언트
├── store/
│   └── useAppStore.ts           # Zustand 상태 관리
└── assets/
    └── bear-logo.png            # 앱 로고
```

## 작동 원리

### 실시간 자막 플로우

```
1. 사용자가 토글 ON
   ↓
2. SubtitleService.start()
   ↓
3. WebSocket 서버 연결 (210.115.229.181:3000)
   ↓
4. 마이크 권한 요청
   ↓
5. AudioService가 2초마다 오디오 청크 녹음
   ↓
6. Base64로 인코딩하여 WebSocket으로 전송
   ↓
7. 서버에서 음성 인식 + 번역 수행
   ↓
8. 'subtitle-text' 이벤트로 결과 수신
   ↓
9. SubtitleOverlay에 자막 표시
   ↓
10. 사용자가 토글 OFF할 때까지 반복
```

## 주의사항

### 1. 시스템 오디오 캡처 제한
현재 구현은 **마이크 입력**만 캡처합니다. 디바이스에서 재생되는 영상의 오디오를 직접 캡처하려면:

- **Android**: MediaProjection API 사용 (네이티브 모듈 필요)
- **iOS**: 시스템 오디오 캡처 불가능

### 2. 백그라운드 오버레이 제한
- **Android**: `SYSTEM_ALERT_WINDOW` 권한으로 가능하나 추가 설정 필요
- **iOS**: 백그라운드 오버레이 불가능

### 3. 네트워크 연결 필수
- WebSocket 서버에 연결되어야 작동
- 오프라인 시 로컬 상태만 변경

## 트러블슈팅

### WebSocket 연결 실패
```typescript
// src/services/subtitleService.ts
const SERVER_URL = 'http://YOUR_IP:3000';  // localhost가 아닌 실제 IP 사용
```

### 오디오 권한 거부
- 앱 설정에서 마이크 권한 확인
- 디바이스 재시작

### 자막이 표시되지 않음
1. 백엔드 서버 실행 확인
2. WebSocket 연결 상태 확인 (콘솔 로그)
3. 마이크 입력 확인

## 개발 팁

### 로그 확인
```bash
npx expo start --port 8082
# 콘솔에서 로그 확인
```

### 디버깅
- React Native Debugger 사용
- Chrome DevTools 연결
- `console.log`로 상태 추적

### 핫 리로드
- 코드 수정 시 자동 반영
- Expo Go에서 Shake > Reload

## 향후 개선 사항

- [ ] 시스템 오디오 직접 캡처 (네이티브 모듈)
- [ ] 다양한 언어 지원
- [ ] 자막 스타일 커스터마이징
- [ ] 오프라인 모드 지원
- [ ] 자막 히스토리 저장
- [ ] 음성 인식 정확도 개선

## 라이선스

MIT
