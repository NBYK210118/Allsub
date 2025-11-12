# AllSub 백엔드 설계 구조 상세 설명

## 📋 목차
1. [전체 아키텍처 개요](#전체-아키텍처-개요)
2. [모듈 구조 (NestJS)](#모듈-구조-nestjs)
3. [계층별 상세 설명](#계층별-상세-설명)
4. [WebSocket Gateway 설계](#websocket-gateway-설계)
5. [서비스 계층 설계](#서비스-계층-설계)
6. [데이터 흐름 및 처리 파이프라인](#데이터-흐름-및-처리-파이프라인)
7. [세션 관리 메커니즘](#세션-관리-메커니즘)
8. [오디오 버퍼링 전략](#오디오-버퍼링-전략)
9. [에러 핸들링 및 로깅](#에러-핸들링-및-로깅)
10. [확장성 고려사항](#확장성-고려사항)

---

## 전체 아키텍처 개요

### 기술 스택
- **프레임워크**: NestJS (Node.js)
- **언어**: TypeScript
- **WebSocket**: Socket.IO
- **ORM**: Prisma
- **데이터베이스**: SQLite (개발) / PostgreSQL (프로덕션 권장)
- **외부 API**: OpenAI Whisper API, OpenAI GPT-4 Mini API, Google Cloud Translation API

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Entry Point (main.ts)                     │
│  - NestFactory.create()                                      │
│  - CORS 설정                                                  │
│  - 포트 3000에서 리스닝                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    AppModule (루트 모듈)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ConfigModule │  │SettingsModule│  │SubtitleModule │     │
│  │  (Global)    │  │              │  │               │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              SubtitleModule (자막 서비스 모듈)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Subtitle      │  │Whisper       │  │Translation   │     │
│  │Gateway       │  │Service       │  │Service       │     │
│  │(WebSocket)   │  │(음성 인식)    │  │(번역)         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │Speech        │  │AudioStream  │                        │
│  │Service       │  │Gateway      │                        │
│  │(레거시)       │  │(TCP)        │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              SettingsModule (설정 관리 모듈)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Settings      │  │Settings      │  │Prisma        │     │
│  │Controller    │  │Service       │  │Service       │     │
│  │(REST API)    │  │(비즈니스 로직) │  │(ORM)         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │OpenAI        │  │Google Cloud  │  │SQLite/       │     │
│  │Whisper API   │  │Translation   │  │PostgreSQL    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 모듈 구조 (NestJS)

### 1. AppModule (루트 모듈)

**파일**: `src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // 전역 환경 변수 설정
    SettingsModule,                              // 설정 관리 모듈
    SubtitleModule,                              // 자막 서비스 모듈
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
```

**역할**:
- 전체 애플리케이션의 루트 모듈
- 모든 하위 모듈을 통합
- 전역 설정 관리 (ConfigModule)
- PrismaService를 전역으로 제공

### 2. SubtitleModule (자막 서비스 모듈)

**파일**: `src/subtitle/subtitle.module.ts`

```typescript
@Module({
  providers: [
    SubtitleGateway,      // WebSocket 게이트웨이
    AudioStreamGateway,   // TCP 스트림 게이트웨이 (선택적)
    SpeechService,       // Google Cloud Speech (레거시)
    WhisperService,       // OpenAI Whisper (현재 사용)
    TranslationService   // 번역 서비스
  ],
  exports: [SpeechService, WhisperService, TranslationService],
})
export class SubtitleModule {}
```

**역할**:
- 실시간 자막 처리의 핵심 모듈
- WebSocket 통신 관리
- 음성 인식 및 번역 서비스 제공
- 서비스들을 다른 모듈에서 사용 가능하도록 export

### 3. SettingsModule (설정 관리 모듈)

**파일**: `src/settings/settings.module.ts`

```typescript
@Module({
  controllers: [SettingsController],  // REST API 엔드포인트
  providers: [SettingsService, PrismaService],
})
export class SettingsModule {}
```

**역할**:
- 사용자 설정 관리
- REST API 제공
- 데이터베이스 연동

---

## 계층별 상세 설명

### 1. Gateway Layer (게이트웨이 계층)

#### SubtitleGateway (WebSocket Gateway)

**파일**: `src/subtitle/subtitle.gateway.ts`

**역할**: 클라이언트와의 실시간 양방향 통신 관리

**주요 기능**:

1. **연결 관리**
   ```typescript
   handleConnection(client: Socket) {
     // 클라이언트 연결 시 로깅 및 초기화
   }
   
   handleDisconnect(client: Socket) {
     // 세션 정리, 타이머 정리, 메모리 해제
   }
   ```

2. **이벤트 구독 (클라이언트 → 서버)**
   - `start-subtitle`: 자막 서비스 시작
   - `stop-subtitle`: 자막 서비스 중지
   - `audio-chunk`: 오디오 청크 수신
   - `set-translation-direction`: 번역 방향 변경
   - `set-microphone-mode`: 마이크 모드 변경
   - `set-push-to-talk-active`: Push-to-Talk 상태 변경
   - `ping`: 연결 상태 확인

3. **이벤트 전송 (서버 → 클라이언트)**
   - `subtitle-text`: 자막 텍스트 전송
   - `subtitle-status`: 서비스 상태 업데이트
   - `subtitle-error`: 에러 발생 시
   - `translation-direction-updated`: 번역 방향 업데이트 확인
   - `microphone-mode-updated`: 마이크 모드 업데이트 확인
   - `push-to-talk-active-updated`: Push-to-Talk 상태 업데이트 확인
   - `pong`: ping 응답

**설정**:
```typescript
@WebSocketGateway({
  cors: {
    origin: '*',           // 모든 origin 허용
    credentials: true,     // 인증 정보 포함 허용
  },
  transports: ['websocket', 'polling'],  // 폴백 지원
})
```

#### AudioStreamGateway (TCP 스트림 게이트웨이)

**파일**: `src/subtitle/audio-stream.gateway.ts`

**역할**: TCP 소켓을 통한 오디오 스트리밍 (선택적 기능)

**현재 상태**: 구현되어 있으나 SubtitleGateway가 주로 사용됨

---

### 2. Service Layer (서비스 계층)

#### WhisperService (음성 인식 서비스)

**파일**: `src/subtitle/whisper.service.ts`

**역할**: OpenAI Whisper API를 통한 음성 인식

**주요 메서드**:

```typescript
async transcribeAudio(audioBuffer: Buffer, languageCode: string): Promise<string>
```

**처리 과정**:
1. 오디오 버퍼를 임시 파일로 저장 (`.m4a` 형식)
2. OpenAI Whisper API 호출
3. 텍스트 결과 반환
4. 임시 파일 삭제

**시뮬레이션 모드**:
- `OPENAI_API_KEY`가 없을 경우 시뮬레이션 모드 활성화
- 빈 문자열 반환 (샘플 텍스트 제거)

**에러 처리**:
- API 호출 실패 시 빈 문자열 반환
- 로깅을 통한 에러 추적

#### TranslationService (번역 서비스)

**파일**: `src/subtitle/translation.service.ts`

**역할**: 텍스트 번역 (OpenAI GPT 우선, Google Cloud Fallback)

**주요 메서드**:

1. **`translate(text, targetLanguage)`**: 기본 번역
   - OpenAI GPT-4 Mini API 우선 사용
   - Google Cloud Translation API Fallback
   - 시뮬레이션 모드 (API 키 없을 시)

2. **`translateByDirection(text, direction)`**: 방향 기반 번역
   - `'ko-to-en'`: 한국어 → 영어
   - `'en-to-ko'`: 영어 → 한국어
   - 세션의 번역 방향에 따라 자동 타겟 언어 결정

3. **`translateBatch(texts, targetLanguage)`**: 일괄 번역
   - 여러 텍스트를 한 번에 번역
   - Google Cloud Translation API 사용

4. **`detectLanguage(text)`**: 언어 감지
   - 텍스트의 언어 자동 감지

**OpenAI GPT 설정**:
```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.3,        // 낮은 온도로 일관된 번역
  max_tokens: 200,         // 최대 토큰 수 제한
}
```

#### SpeechService (레거시 음성 인식)

**파일**: `src/subtitle/speech.service.ts`

**역할**: Google Cloud Speech-to-Text API (레거시)

**현재 상태**: WhisperService로 대체되었으나 호환성을 위해 유지

#### SettingsService (설정 관리 서비스)

**파일**: `src/settings/settings.service.ts`

**역할**: 사용자 설정 CRUD 작업

**주요 메서드**:

1. **`getUserSettings(userId)`**: 사용자 설정 조회
2. **`updateCaptionSettings(userId, isCaptionEnabled, captionText?)`**: 설정 업데이트/생성
3. **`toggleCaption(userId)`**: 자막 ON/OFF 토글

**Prisma ORM 사용**:
```typescript
// Upsert 패턴 (없으면 생성, 있으면 업데이트)
this.prisma.userSettings.upsert({
  where: { userId },
  update: { isCaptionEnabled, captionText },
  create: { userId, isCaptionEnabled, captionText },
});
```

---

### 3. Controller Layer (컨트롤러 계층)

#### SettingsController (REST API 컨트롤러)

**파일**: `src/settings/settings.controller.ts`

**역할**: REST API 엔드포인트 제공

**엔드포인트**:

1. **`GET /settings/:userId`**
   - 사용자 설정 조회
   - 응답: `{ id, userId, isCaptionEnabled, captionText, createdAt, updatedAt }`

2. **`POST /settings/:userId/toggle`**
   - 자막 ON/OFF 토글
   - 응답: 업데이트된 설정 객체

3. **`POST /settings/:userId/update`**
   - 설정 업데이트
   - Body: `{ isCaptionEnabled: boolean, captionText?: string }`
   - 응답: 업데이트된 설정 객체

---

### 4. Database Layer (데이터베이스 계층)

#### PrismaService (ORM 서비스)

**파일**: `src/prisma/prisma.service.ts`

**역할**: Prisma ORM 클라이언트 관리

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();  // 모듈 초기화 시 DB 연결
  }
}
```

#### 데이터베이스 스키마

**파일**: `prisma/schema.prisma`

```prisma
model UserSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  isCaptionEnabled Boolean  @default(false)
  captionText     String   @default("가나다라마바사아자카타파하")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("user_settings")
}
```

**필드 설명**:
- `id`: 고유 식별자 (CUID)
- `userId`: 사용자 ID (고유)
- `isCaptionEnabled`: 자막 활성화 여부
- `captionText`: 자막 텍스트 (기본값: 샘플 텍스트)
- `createdAt`: 생성 시간
- `updatedAt`: 업데이트 시간

---

## WebSocket Gateway 설계

### 세션 관리

**세션 저장소**: `Map<string, ClientSession>`

```typescript
private readonly sessions = new Map<string, ClientSession>();
```

**ClientSession 인터페이스**:
```typescript
interface ClientSession {
  userId: string;                    // 사용자 ID
  language: string;                  // 소스 언어 (예: 'ko-KR')
  targetLanguage: string;            // 타겟 언어 (예: 'en')
  translationDirection: 'ko-to-en' | 'en-to-ko';  // 번역 방향
  microphoneMode: 'auto' | 'push-to-talk';         // 마이크 모드
  isPushToTalkActive: boolean;       // Push-to-Talk 활성화 상태
  isActive: boolean;                 // 세션 활성화 여부
  audioBuffer: Buffer[];              // 오디오 버퍼 배열
  lastAudioTime: number;              // 마지막 오디오 수신 시간
  processingTimer?: NodeJS.Timeout;   // 배치 처리 타이머
}
```

### 이벤트 처리 흐름

#### 1. 자막 서비스 시작 (`start-subtitle`)

```
클라이언트 → 서버: 'start-subtitle' 이벤트
  ↓
서버: 세션 생성 및 저장
  ↓
서버 → 클라이언트: 'subtitle-status' (started)
```

**처리 로직**:
```typescript
@SubscribeMessage('start-subtitle')
async handleStartSubtitle(client: Socket, data) {
  const session: ClientSession = {
    userId: data.userId,
    language: data.language || 'ko-KR',
    targetLanguage: data.targetLanguage || 'en',
    translationDirection: data.translationDirection || 'ko-to-en',
    microphoneMode: data.microphoneMode || 'push-to-talk',
    isPushToTalkActive: false,
    isActive: true,
    audioBuffer: [],
    lastAudioTime: Date.now(),
  };
  
  this.sessions.set(client.id, session);
  client.emit('subtitle-status', { status: 'started', message: '...' });
}
```

#### 2. 오디오 청크 수신 (`audio-chunk`)

```
클라이언트 → 서버: 'audio-chunk' 이벤트 (Base64 오디오)
  ↓
서버: Base64 디코딩
  ↓
서버: audioBuffer에 추가
  ↓
서버: 1초 타이머 설정 (배치 처리)
  ↓
[1초 후 또는 묵음 감지]
  ↓
서버: 버퍼 합치기 → 음성 인식 → 번역
  ↓
서버 → 클라이언트: 'subtitle-text' 이벤트
```

**처리 로직**:
```typescript
@SubscribeMessage('audio-chunk')
async handleAudioChunk(client: Socket, data) {
  const session = this.sessions.get(client.id);
  
  // 세션 유효성 검증
  if (!session || !session.isActive) return;
  
  // 마이크 모드 확인
  if (session.microphoneMode === 'push-to-talk' && !session.isPushToTalkActive) {
    return;  // Push-to-Talk 모드에서 버튼이 눌리지 않으면 무시
  }
  
  // Base64 디코딩
  const audioBuffer = Buffer.from(data.audio, 'base64');
  
  // 버퍼에 추가
  session.audioBuffer.push(audioBuffer);
  session.lastAudioTime = Date.now();
  
  // 기존 타이머 취소
  if (session.processingTimer) {
    clearTimeout(session.processingTimer);
  }
  
  // 1초 후 배치 처리
  session.processingTimer = setTimeout(async () => {
    if (session.audioBuffer.length > 0) {
      const combinedBuffer = Buffer.concat(session.audioBuffer);
      session.audioBuffer = [];
      
      // 음성 인식
      const transcription = await this.whisperService.transcribeAudio(
        combinedBuffer,
        session.language
      );
      
      // 번역 및 전송
      await this.processTranscription(client, session, transcription);
    }
  }, 1000);
}
```

#### 3. 번역 방향 변경 (`set-translation-direction`)

```
클라이언트 → 서버: 'set-translation-direction' 이벤트
  ↓
서버: 세션의 translationDirection 업데이트
  ↓
서버 → 클라이언트: 'translation-direction-updated' 확인
```

#### 4. 마이크 모드 변경 (`set-microphone-mode`)

```
클라이언트 → 서버: 'set-microphone-mode' 이벤트
  ↓
서버: 세션의 microphoneMode 업데이트
  ↓
서버 → 클라이언트: 'microphone-mode-updated' 확인
```

#### 5. Push-to-Talk 상태 변경 (`set-push-to-talk-active`)

```
클라이언트 → 서버: 'set-push-to-talk-active' 이벤트
  ↓
서버: 세션의 isPushToTalkActive 업데이트
  ↓
서버 → 클라이언트: 'push-to-talk-active-updated' 확인
```

**중요**: `audio-chunk` 처리 시 `isPushToTalkActive` 상태를 확인하여 오디오 처리를 제어합니다.

---

## 서비스 계층 설계

### 의존성 주입 (Dependency Injection)

NestJS의 의존성 주입 시스템을 활용:

```typescript
@Injectable()
export class SubtitleGateway {
  constructor(
    private readonly speechService: SpeechService,
    private readonly whisperService: WhisperService,
    private readonly translationService: TranslationService,
  ) {}
}
```

**장점**:
- 느슨한 결합 (Loose Coupling)
- 테스트 용이성 (Mock 객체 주입 가능)
- 의존성 자동 관리

### 서비스 초기화 패턴

모든 서비스는 **생성자에서 초기화**를 수행:

```typescript
constructor() {
  try {
    if (process.env.OPENAI_API_KEY) {
      // 실제 API 초기화
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.useSimulation = false;
    } else {
      // 시뮬레이션 모드
      this.useSimulation = true;
    }
  } catch (error) {
    // 에러 발생 시 시뮬레이션 모드로 폴백
    this.useSimulation = true;
  }
}
```

**장점**:
- 서비스 시작 시점에 API 키 유효성 검증
- 시뮬레이션 모드 자동 활성화
- 에러 발생 시 우아한 폴백

---

## 데이터 흐름 및 처리 파이프라인

### 전체 처리 파이프라인

```
[클라이언트] 오디오 녹음 (1초)
    ↓
[클라이언트] Base64 인코딩
    ↓
[WebSocket] 'audio-chunk' 이벤트 전송
    ↓
[SubtitleGateway] 이벤트 수신
    ├─ 세션 유효성 검증
    ├─ 마이크 모드 확인
    └─ Base64 디코딩
    ↓
[SubtitleGateway] 오디오 버퍼링
    ├─ audioBuffer 배열에 추가
    ├─ lastAudioTime 업데이트
    └─ 1초 타이머 설정
    ↓
[1초 후 또는 묵음 감지]
    ↓
[SubtitleGateway] 버퍼 합치기
    └─ Buffer.concat(session.audioBuffer)
    ↓
[WhisperService] 음성 인식
    ├─ 임시 파일 생성 (.m4a)
    ├─ OpenAI Whisper API 호출
    └─ 텍스트 결과 반환
    ↓
[TranslationService] 번역
    ├─ 번역 방향 확인 (ko-to-en / en-to-ko)
    ├─ 타겟 언어 결정
    ├─ OpenAI GPT API 호출 (우선)
    └─ 번역 결과 반환
    ↓
[SubtitleGateway] 결과 전송
    └─ 'subtitle-text' 이벤트 전송
    ↓
[클라이언트] 자막 표시
```

### 오디오 버퍼링 전략

**문제점**:
- 짧은 오디오 청크만으로는 문장이 완성되지 않음
- 음성 인식 정확도 저하
- API 호출 횟수 증가 (비용 증가)

**해결책**: 1초 단위 버퍼링 및 배치 처리

**구현**:
```typescript
// 오디오 청크 수신 시
session.audioBuffer.push(audioBuffer);
session.lastAudioTime = Date.now();

// 기존 타이머 취소
if (session.processingTimer) {
  clearTimeout(session.processingTimer);
}

// 1초 후 배치 처리
session.processingTimer = setTimeout(async () => {
  const timeSinceLastAudio = Date.now() - session.lastAudioTime;
  
  // 1초 이상 묵음이 있었으면 처리
  if (timeSinceLastAudio >= 1000 && session.audioBuffer.length > 0) {
    const combinedBuffer = Buffer.concat(session.audioBuffer);
    session.audioBuffer = [];
    
    // 음성 인식 및 번역 수행
    await this.processTranscription(...);
  }
}, 1000);
```

**효과**:
- ✅ 문장 완성도 향상
- ✅ 음성 인식 정확도 향상
- ✅ API 호출 횟수 감소 (비용 절감)
- ✅ 서버 부하 감소

---

## 세션 관리 메커니즘

### 세션 생성

**시점**: `start-subtitle` 이벤트 수신 시

**저장소**: `Map<string, ClientSession>`
- Key: `client.id` (Socket ID)
- Value: `ClientSession` 객체

**초기화**:
```typescript
const session: ClientSession = {
  userId: data.userId,
  language: data.language || 'ko-KR',
  targetLanguage: data.targetLanguage || 'en',
  translationDirection: data.translationDirection || 'ko-to-en',
  microphoneMode: data.microphoneMode || 'push-to-talk',
  isPushToTalkActive: false,
  isActive: true,
  audioBuffer: [],
  lastAudioTime: Date.now(),
};

this.sessions.set(client.id, session);
```

### 세션 업데이트

**동적 설정 변경**:
- `set-translation-direction`: `session.translationDirection` 업데이트
- `set-microphone-mode`: `session.microphoneMode` 업데이트
- `set-push-to-talk-active`: `session.isPushToTalkActive` 업데이트

**특징**: 실시간으로 설정 변경 가능 (서비스 중지 없이)

### 세션 정리

**시점**: 
1. `stop-subtitle` 이벤트 수신 시
2. 클라이언트 연결 해제 시 (`handleDisconnect`)

**정리 과정**:
```typescript
// 1. 타이머 정리
if (session.processingTimer) {
  clearTimeout(session.processingTimer);
  session.processingTimer = undefined;
}

// 2. 버퍼 초기화
session.audioBuffer = [];

// 3. 세션 비활성화
session.isActive = false;

// 4. 세션 삭제
this.sessions.delete(client.id);
```

**중요**: 메모리 누수 방지를 위해 반드시 타이머와 버퍼를 정리해야 함

---

## 오디오 버퍼링 전략

### 버퍼링 목적

1. **문장 완성도 향상**: 짧은 청크를 모아 완전한 문장으로 처리
2. **API 호출 최적화**: 배치 처리로 호출 횟수 감소
3. **비용 절감**: API 호출 횟수 감소로 비용 절감
4. **정확도 향상**: 더 긴 오디오로 인식 정확도 향상

### 버퍼링 메커니즘

**버퍼 저장소**: `session.audioBuffer: Buffer[]`

**처리 조건**:
1. **시간 기반**: 마지막 오디오 수신 후 1초 경과
2. **묵음 감지**: `timeSinceLastAudio >= 1000ms`

**처리 과정**:
```typescript
// 1. 모든 버퍼 합치기
const combinedBuffer = Buffer.concat(session.audioBuffer);

// 2. 버퍼 초기화
session.audioBuffer = [];

// 3. 음성 인식 수행
const transcription = await this.whisperService.transcribeAudio(
  combinedBuffer,
  session.language
);
```

### 타이머 관리

**타이머 취소 패턴**:
- 새로운 오디오 청크가 오면 기존 타이머 취소
- 새로운 타이머 설정 (1초 후 처리)

**이유**: 연속된 오디오 청크를 계속 수집하기 위해

**구현**:
```typescript
// 기존 타이머 취소
if (session.processingTimer) {
  clearTimeout(session.processingTimer);
}

// 새로운 타이머 설정
session.processingTimer = setTimeout(async () => {
  // 배치 처리
}, 1000);
```

---

## 에러 핸들링 및 로깅

### 에러 처리 전략

#### 1. 서비스 초기화 에러

**패턴**: 시뮬레이션 모드로 폴백

```typescript
constructor() {
  try {
    if (process.env.OPENAI_API_KEY) {
      // API 초기화
    } else {
      this.useSimulation = true;
    }
  } catch (error) {
    this.logger.error('Failed to initialize:', error);
    this.useSimulation = true;  // 폴백
  }
}
```

#### 2. API 호출 에러

**WhisperService**:
```typescript
try {
  const transcription = await this.openai.audio.transcriptions.create(...);
  return text;
} catch (error) {
  this.logger.error('❌ Whisper API 에러:', error?.message);
  return '';  // 빈 문자열 반환 (시뮬레이션 사용 안 함)
}
```

**TranslationService**:
```typescript
try {
  const translation = await this.openai.chat.completions.create(...);
  return translation;
} catch (error) {
  this.logger.error('OpenAI Translation error:', error);
  return text;  // 번역 실패 시 원본 반환
}
```

#### 3. 세션 에러

**패턴**: 에러 이벤트 전송

```typescript
try {
  await this.processTranscription(...);
} catch (error) {
  this.logger.error(`Error processing transcription: ${error.message}`);
  client.emit('subtitle-error', {
    error: 'Failed to process transcription',
    message: error.message
  });
}
```

### 로깅 전략

**NestJS Logger 사용**:
```typescript
private readonly logger = new Logger(SubtitleGateway.name);
```

**로깅 레벨**:
- `logger.log()`: 일반 정보
- `logger.warn()`: 경고 (시뮬레이션 모드 등)
- `logger.error()`: 에러

**상세 로깅**:
- 모든 WebSocket 이벤트 수신/전송 로깅
- 세션 생성/업데이트/삭제 로깅
- API 호출 시작/완료 로깅
- 에러 발생 시 상세 정보 로깅

---

## 확장성 고려사항

### 현재 구조의 확장 가능성

#### 1. 다중 언어 지원

**현재**: 한국어 ↔ 영어

**확장 방법**:
- `translationDirection`에 새로운 방향 추가
- `TranslationService.translateByDirection()` 메서드 확장

#### 2. 다양한 마이크 모드

**현재**: `auto`, `push-to-talk`

**확장 방법**:
- `microphoneMode` 타입 확장
- `handleAudioChunk`에서 새로운 모드 처리 로직 추가

#### 3. 다중 클라이언트 지원

**현재**: 세션별 독립 관리 (이미 지원)

**확장 방법**:
- Redis를 통한 세션 공유 (다중 서버 지원)
- 로드 밸런싱 지원

#### 4. 다른 외부 API 통합

**현재**: OpenAI Whisper, OpenAI GPT, Google Cloud Translation

**확장 방법**:
- 새로운 서비스 클래스 추가
- Strategy Pattern 적용

### 성능 최적화 방안

#### 1. 오디오 스트리밍 최적화

**현재**: Base64 인코딩

**개선 방안**:
- WebRTC 사용
- 바이너리 스트리밍

#### 2. 배치 처리 최적화

**현재**: 1초 단위 배치 처리

**개선 방안**:
- 동적 버퍼링 (묵음 감지 기반)
- 병렬 처리 (여러 클라이언트 동시 처리)

#### 3. 캐싱

**개선 방안**:
- 번역 결과 캐싱 (Redis)
- 자주 사용되는 번역 저장

### 확장성 제약사항

#### 1. 메모리 관리

**현재**: 인메모리 세션 관리 (`Map`)

**제약**: 서버 재시작 시 세션 손실

**해결책**: Redis 세션 저장소 사용

#### 2. 단일 서버 제약

**현재**: 단일 서버에서 모든 세션 관리

**제약**: 수평 확장 불가

**해결책**: Redis를 통한 세션 공유

---

## 결론

AllSub 백엔드는 **NestJS 모듈 기반 아키텍처**로 설계되었으며, 다음과 같은 특징을 가집니다:

### 핵심 설계 원칙

1. **모듈화**: 기능별로 독립적인 모듈 구성
2. **의존성 주입**: 느슨한 결합 및 테스트 용이성
3. **세션 관리**: 클라이언트별 독립적인 상태 관리
4. **오디오 버퍼링**: 배치 처리로 성능 및 비용 최적화
5. **에러 핸들링**: 우아한 폴백 및 시뮬레이션 모드
6. **확장성**: 새로운 기능 추가 용이

### 기술적 강점

- ✅ **실시간 통신**: WebSocket 기반 양방향 통신
- ✅ **성능 최적화**: 오디오 버퍼링 및 배치 처리
- ✅ **안정성**: 에러 핸들링 및 자동 폴백
- ✅ **확장성**: 모듈화된 구조로 기능 추가 용이
- ✅ **유지보수성**: 명확한 계층 분리 및 책임 분리

이러한 설계를 통해 **안정적이고 확장 가능한 실시간 자막 서비스 백엔드**를 구현했습니다.



