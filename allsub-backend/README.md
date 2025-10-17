# AllSub Backend

실시간 음성 인식 및 자막 번역 서비스의 백엔드 서버입니다.

## 기술 스택

- **NestJS**: Node.js 프레임워크
- **Socket.IO**: 실시간 WebSocket 통신
- **Google Cloud Speech-to-Text**: 음성 인식 (선택적)
- **Google Cloud Translation**: 번역 (선택적)
- **Prisma + SQLite**: 데이터베이스 ORM
- **TypeScript**: 타입 안전성

## 주요 기능

### 1. WebSocket 실시간 통신 (`SubtitleGateway`)
- 클라이언트와 실시간 양방향 통신
- 오디오 청크 수신 및 처리
- 자막 및 번역 결과 실시간 전송

### 2. 음성 인식 (`SpeechService`)
- **프로덕션 모드**: Google Cloud Speech-to-Text API 사용
- **시뮬레이션 모드**: Google Cloud 키가 없을 경우 샘플 텍스트 반환
- 실시간 스트리밍 인식 지원
- 다양한 언어 지원 (한국어, 영어 등)

### 3. 번역 (`TranslationService`)
- **프로덕션 모드**: Google Cloud Translation API 사용
- **시뮬레이션 모드**: 미리 정의된 번역 제공
- 언어 자동 감지
- 일괄 번역 지원

### 4. 사용자 설정 관리 (`SettingsController`)
- 사용자별 자막 ON/OFF 설정
- 자막 텍스트 커스터마이징
- REST API 제공

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 데이터베이스 설정
```bash
npx prisma generate
npx prisma db push
```

### 3. 서버 실행

**개발 모드 (시뮬레이션)**
```bash
npm run start:dev
```

**프로덕션 모드 (Google Cloud 사용)**
```bash
# 환경 변수 설정
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

npm run build
npm run start:prod
```

## API 엔드포인트

### REST API

#### 사용자 설정 조회
```
GET /settings/:userId
```

#### 자막 ON/OFF 토글
```
POST /settings/:userId/toggle
```

#### 설정 업데이트
```
POST /settings/:userId/update
Body: { isCaptionEnabled: boolean, captionText?: string }
```

### WebSocket 이벤트

#### 클라이언트 → 서버

**자막 서비스 시작**
```javascript
socket.emit('start-subtitle', {
  userId: 'user-id',
  language: 'ko-KR',        // 소스 언어
  targetLanguage: 'en'      // 번역 타겟 언어
});
```

**자막 서비스 중지**
```javascript
socket.emit('stop-subtitle');
```

**오디오 청크 전송**
```javascript
socket.emit('audio-chunk', {
  audio: base64AudioData,   // Base64 인코딩된 오디오
  encoding: 'base64'
});
```

#### 서버 → 클라이언트

**자막 텍스트 수신**
```javascript
socket.on('subtitle-text', (data) => {
  console.log(data.original);     // 원본 텍스트
  console.log(data.translated);   // 번역된 텍스트
  console.log(data.timestamp);    // 타임스탬프
});
```

**상태 업데이트**
```javascript
socket.on('subtitle-status', (status) => {
  console.log(status.status);   // 'started' | 'stopped'
  console.log(status.message);
});
```

**에러 수신**
```javascript
socket.on('subtitle-error', (error) => {
  console.error(error.message);
});
```

## Google Cloud 설정 (선택적)

### 1. Google Cloud 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Speech-to-Text API 활성화
3. Translation API 활성화

### 2. 서비스 계정 생성
1. IAM & Admin → Service Accounts
2. 새 서비스 계정 생성
3. 역할 추가:
   - Cloud Speech-to-Text User
   - Cloud Translation API User
4. JSON 키 생성 및 다운로드

### 3. 환경 변수 설정
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

## 시뮬레이션 모드

Google Cloud 키가 없어도 개발/테스트가 가능합니다:

- **음성 인식**: 미리 정의된 샘플 텍스트 반환
- **번역**: 기본적인 한↔영 번역 시뮬레이션
- 실제 프로덕션과 동일한 인터페이스 제공

## 디렉토리 구조

```
src/
├── subtitle/
│   ├── subtitle.gateway.ts      # WebSocket 게이트웨이
│   ├── speech.service.ts        # 음성 인식 서비스
│   ├── translation.service.ts   # 번역 서비스
│   └── subtitle.module.ts       # 모듈 정의
├── settings/
│   ├── settings.controller.ts   # REST API 컨트롤러
│   ├── settings.service.ts      # 비즈니스 로직
│   └── settings.module.ts       # 모듈 정의
├── prisma/
│   └── prisma.service.ts        # Prisma ORM 서비스
├── app.module.ts                # 루트 모듈
└── main.ts                      # 앱 진입점
```

## 포트

- **HTTP/WebSocket**: 3000

## 데이터베이스

- **개발**: SQLite (`prisma/dev.db`)
- **프로덕션**: PostgreSQL 권장

## 라이선스

MIT
