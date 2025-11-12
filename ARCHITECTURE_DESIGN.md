# AllSub 프로젝트 기능 설계 구조

## 📋 목차
1. [시스템 아키텍처 개요](#시스템-아키텍처-개요)
2. [3-Tier 아키텍처 구조](#3-tier-아키텍처-구조)
3. [실시간 자막 처리 파이프라인](#실시간-자막-처리-파이프라인)
4. [주요 설계 패턴 및 결정사항](#주요-설계-패턴-및-결정사항)
5. [데이터 흐름 및 상태 관리](#데이터-흐름-및-상태-관리)
6. [확장성 및 안정성 고려사항](#확장성-및-안정성-고려사항)

---

## 시스템 아키텍처 개요

### 전체 구조
AllSub는 **실시간 음성 인식 및 자막 번역 서비스**로, 다음과 같은 3-Tier 아키텍처로 설계되었습니다:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│              (React Native Mobile App)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │ Service Layer│  │  State Mgmt  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↕ WebSocket / REST API
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                  (NestJS Backend Server)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Gateway     │  │   Service    │  │   Database   │      │
│  │  (WebSocket) │  │   (Business)  │  │   (Prisma)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                    External Services Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OpenAI       │  │ Google Cloud │  │   (Future)   │      │
│  │ Whisper API  │  │ Translation  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3-Tier 아키텍처 구조

### 1. Presentation Layer (프론트엔드)

#### 1.1 UI Layer (컴포넌트 계층)

**역할**: 사용자 인터페이스 렌더링 및 사용자 상호작용 처리

**주요 컴포넌트**:

- **HomeScreen.tsx**
  - 메인 화면 컨테이너
  - 자막 서비스 라이프사이클 관리
  - 토글 상태와 자막 오버레이 표시 제어
  - 그라디언트 배경 애니메이션

- **AnimatedToggle.tsx**
  - 세로 방향 애니메이션 토글 버튼
  - ON/OFF 상태에 따른 위치 이동 (위/아래)
  - 스프링 애니메이션으로 부드러운 전환

- **SubtitleOverlay.tsx**
  - 자막 표시 오버레이
  - 드래그 가능한 위치 조정
  - 자막 히스토리 관리 (최대 3개)
  - Push-to-Talk 버튼 및 모드 전환 UI

- **TranslationModeModal.tsx**
  - 번역 방향 선택 모달
  - 한국어↔영어 양방향 선택

#### 1.2 Service Layer (서비스 계층)

**역할**: 비즈니스 로직 처리 및 외부 서비스와의 통신

**주요 서비스**:

- **SubtitleService** (오케스트레이터)
  - 자막 서비스의 전체 라이프사이클 관리
  - WebSocket 연결 관리
  - 오디오 스트리밍 오케스트레이션
  - 재연결 로직 (연결 끊김 시 3초 후 자동 재시도)
  - AppState 감지 (백그라운드/포그라운드 전환)

- **WebSocketService**
  - Socket.IO 클라이언트 관리
  - 실시간 이벤트 리스닝 및 전송
  - 자동 재연결 (최대 5회, 1초 간격)
  - 이벤트: `start-subtitle`, `audio-chunk`, `subtitle-text`, `set-translation-direction`

- **AudioService**
  - 마이크 권한 요청 및 관리
  - 1초 단위 오디오 청크 녹음
  - Base64 인코딩
  - Recording 객체 재사용 방지 (메모리 누수 방지)

- **ApiService**
  - REST API 호출
  - 사용자 설정 CRUD
  - Graceful Degradation (서버 미연결 시 로컬 상태 유지)

#### 1.3 State Management (상태 관리)

**Zustand Store (`useAppStore.ts`)**:
- `isCaptionEnabled`: 자막 ON/OFF 상태
- `translationDirection`: 번역 방향 ('ko-to-en' | 'en-to-ko')
- `microphoneMode`: 마이크 모드 ('auto' | 'push-to-talk')
- `isPushToTalkActive`: Push-to-Talk 버튼 활성화 상태
- **Optimistic Update**: 토글 시 즉시 로컬 상태 변경 후 서버 동기화

---

### 2. Application Layer (백엔드)

#### 2.1 Gateway Layer (게이트웨이 계층)

**SubtitleGateway** (WebSocket Gateway):
- **역할**: 클라이언트와의 실시간 양방향 통신 관리
- **주요 기능**:
  - 클라이언트 세션 관리 (`Map<socketId, ClientSession>`)
  - 이벤트 구독: `start-subtitle`, `stop-subtitle`, `audio-chunk`, `set-translation-direction`, `set-microphone-mode`, `set-push-to-talk-active`
  - 오디오 버퍼링 및 배치 처리 (1초 단위)
  - 마이크 모드에 따른 오디오 처리 제어

**ClientSession 인터페이스**:
```typescript
interface ClientSession {
  userId: string;
  language: string;
  targetLanguage: string;
  translationDirection: 'ko-to-en' | 'en-to-ko';
  microphoneMode: 'auto' | 'push-to-talk';
  isPushToTalkActive: boolean;
  isActive: boolean;
  audioBuffer: Buffer[];        // 오디오 버퍼링
  lastAudioTime: number;        // 마지막 오디오 수신 시간
  processingTimer?: NodeJS.Timeout;  // 배치 처리 타이머
}
```

#### 2.2 Service Layer (비즈니스 로직 계층)

**WhisperService** (음성 인식):
- OpenAI Whisper API 통합
- 오디오 버퍼를 텍스트로 변환
- 다국어 지원 (한국어, 영어 등)
- 시뮬레이션 모드 지원 (API 키 없을 시)

**TranslationService** (번역):
- OpenAI GPT-4 Mini API 우선 사용
- Google Cloud Translation API Fallback
- 양방향 번역 지원 (`translateByDirection` 메서드)
- 자연스러운 번역 품질 (temperature: 0.3)

**SettingsService** (사용자 설정):
- Prisma ORM을 통한 데이터베이스 접근
- 사용자별 설정 CRUD
- REST API 제공

#### 2.3 Database Layer (데이터베이스 계층)

**Prisma ORM + SQLite**:
- 개발 환경: SQLite
- 프로덕션 환경: PostgreSQL 권장
- 사용자 설정 스키마 관리

---

### 3. External Services Layer (외부 서비스 계층)

- **OpenAI Whisper API**: 음성 인식
- **OpenAI GPT-4 Mini API**: 번역 (우선)
- **Google Cloud Translation API**: 번역 (Fallback)

---

## 실시간 자막 처리 파이프라인

### 전체 플로우

```
[사용자 액션]
    ↓
[토글 ON]
    ↓
[SubtitleService.start()]
    ├─ WebSocket 연결 (자동 재연결 지원)
    ├─ 마이크 권한 요청
    └─ 'start-subtitle' 이벤트 전송
    ↓
[백엔드: SubtitleGateway]
    ├─ 세션 생성 및 저장
    └─ 'subtitle-status' 이벤트 전송 (시작 확인)
    ↓
[AudioService: 오디오 녹음 루프]
    ├─ 1초 단위로 오디오 청크 녹음
    ├─ Base64 인코딩
    └─ 'audio-chunk' 이벤트 전송
    ↓
[백엔드: 오디오 버퍼링]
    ├─ audioBuffer에 청크 추가
    ├─ 1초 경과 또는 버퍼 크기 초과 시
    └─ 배치 처리 시작
    ↓
[백엔드: 음성 인식]
    ├─ WhisperService.transcribeAudio()
    └─ OpenAI Whisper API 호출
    ↓
[백엔드: 번역]
    ├─ TranslationService.translateByDirection()
    ├─ 번역 방향에 따라 타겟 언어 결정
    └─ OpenAI GPT API 또는 Google Cloud API 호출
    ↓
[백엔드: 결과 전송]
    └─ 'subtitle-text' 이벤트 전송
    ↓
[프론트엔드: 자막 표시]
    ├─ SubtitleOverlay에 자막 추가
    ├─ 자막 히스토리 업데이트 (최대 3개)
    └─ Live Activity 업데이트 (iOS)
```

### 오디오 버퍼링 전략

**문제**: 짧은 오디오 청크만으로는 문장이 완성되지 않아 음성 인식 정확도가 낮음

**해결책**: 1초 단위 버퍼링 및 배치 처리

```typescript
// 백엔드: subtitle.gateway.ts
@SubscribeMessage('audio-chunk')
async handleAudioChunk(...) {
  const session = this.sessions.get(client.id);
  
  // 오디오 버퍼에 추가
  session.audioBuffer.push(audioBuffer);
  session.lastAudioTime = Date.now();
  
  // 기존 타이머가 있으면 취소
  if (session.processingTimer) {
    clearTimeout(session.processingTimer);
  }
  
  // 1초 후 배치 처리
  session.processingTimer = setTimeout(async () => {
    await this.processTranscription(session, client);
  }, 1000);
}
```

**효과**:
- 문장 완성도 향상
- API 호출 횟수 감소 (비용 절감)
- 음성 인식 정확도 향상

---

## 주요 설계 패턴 및 결정사항

### 1. Observer Pattern (옵저버 패턴)

**WebSocketService**에서 콜백 기반 이벤트 처리:
```typescript
class WebSocketService {
  private onSubtitleCallback?: (data: SubtitleData) => void;
  
  onSubtitle(callback: (data: SubtitleData) => void) {
    this.onSubtitleCallback = callback;
  }
  
  // 이벤트 수신 시 콜백 호출
  this.onSubtitleCallback?.(data);
}
```

**장점**: 느슨한 결합, 확장성

### 2. Strategy Pattern (전략 패턴)

**마이크 모드 전략**:
- `auto`: 자동 녹음 (토글 ON 시 계속 녹음)
- `push-to-talk`: 수동 녹음 (버튼 누를 때만 녹음)

```typescript
// 백엔드: subtitle.gateway.ts
if (session.microphoneMode === 'push-to-talk' && !session.isPushToTalkActive) {
  return; // 오디오 처리 건너뛰기
}
```

### 3. Optimistic Update (낙관적 업데이트)

**프론트엔드 상태 관리**:
```typescript
toggleCaption: async () => {
  // 1. 즉시 로컬 상태 변경 (빠른 UI 반응)
  const newState = !get().isCaptionEnabled;
  set({ isCaptionEnabled: newState });
  
  // 2. 백엔드 동기화 (백그라운드)
  try {
    const settings = await ApiService.toggleCaption(userId);
    // 서버 상태와 다르면 서버 상태로 업데이트
  } catch (error) {
    // 로컬 상태 유지 (오프라인 모드)
  }
}
```

**장점**: 즉각적인 UI 반응, 오프라인 지원

### 4. Graceful Degradation (우아한 성능 저하)

**서버 미연결 시**:
- 로컬 상태만 변경
- 사용자에게 에러 메시지 표시
- 재연결 시 자동 동기화

### 5. Session Management (세션 관리)

**백엔드에서 클라이언트별 세션 관리**:
```typescript
private readonly sessions = new Map<string, ClientSession>();

// 세션 생성
this.sessions.set(client.id, session);

// 세션 조회
const session = this.sessions.get(client.id);

// 세션 정리 (연결 해제 시)
this.sessions.delete(client.id);
```

**장점**: 클라이언트별 독립적인 설정 관리

---

## 데이터 흐름 및 상태 관리

### 상태 동기화 전략

#### 1. 프론트엔드 → 백엔드 (실시간 설정 변경)

```
[사용자 액션]
    ↓
[Zustand Store 업데이트]
    ↓
[WebSocket 이벤트 전송]
    ├─ set-translation-direction
    ├─ set-microphone-mode
    └─ set-push-to-talk-active
    ↓
[백엔드: 세션 업데이트]
    └─ ClientSession 업데이트
```

#### 2. 백엔드 → 프론트엔드 (자막 데이터)

```
[백엔드: 음성 인식 + 번역 완료]
    ↓
['subtitle-text' 이벤트 전송]
    ↓
[WebSocketService: 이벤트 수신]
    ↓
[SubtitleService: 콜백 호출]
    ↓
[HomeScreen: 상태 업데이트]
    ↓
[SubtitleOverlay: UI 렌더링]
```

### 상태 관리 계층

```
┌─────────────────────────────────────┐
│   Global State (Zustand)            │
│   - isCaptionEnabled                │
│   - translationDirection            │
│   - microphoneMode                  │
└─────────────────────────────────────┘
            ↕
┌─────────────────────────────────────┐
│   Component State (React Hooks)     │
│   - showSubtitleOverlay             │
│   - subtitleServiceState            │
│   - showTranslationModal            │
└─────────────────────────────────────┘
            ↕
┌─────────────────────────────────────┐
│   Service State (SubtitleService)   │
│   - isActive                        │
│   - isConnected                     │
│   - currentSubtitle                │
└─────────────────────────────────────┘
```

---

## 확장성 및 안정성 고려사항

### 1. 자동 재연결 메커니즘

**프론트엔드**:
- Socket.IO 자동 재연결 (최대 5회, 1초 간격)
- 수동 재연결 로직 (연결 끊김 시 3초 후 재시도)

**백엔드**:
- 클라이언트 연결 해제 시 세션 정리
- 타이머 정리 (메모리 누수 방지)

### 2. 오디오 버퍼링 및 배치 처리

**효과**:
- API 호출 횟수 감소 (비용 절감)
- 음성 인식 정확도 향상
- 서버 부하 감소

### 3. 메모리 관리

**프론트엔드**:
- Recording 객체 재사용 방지
- 자막 히스토리 제한 (최대 3개)
- cleanupCallbacks 배열로 리소스 정리

**백엔드**:
- 세션별 독립적인 버퍼 관리
- 연결 해제 시 즉시 정리

### 4. 에러 핸들링

**계층별 에러 처리**:
- **UI Layer**: 사용자 친화적 에러 메시지
- **Service Layer**: 로깅 및 재시도 로직
- **Gateway Layer**: 세션 유효성 검증

### 5. 확장성 고려사항

**현재 구조의 확장 가능성**:
- ✅ 다중 언어 지원 (번역 방향만 추가)
- ✅ 다양한 마이크 모드 추가
- ✅ 다른 외부 API 통합 (번역 서비스 교체 가능)
- ✅ 다중 클라이언트 지원 (세션 관리로 확장 가능)

**향후 개선 방향**:
- Redis를 통한 세션 공유 (다중 서버 지원)
- 오디오 스트리밍 최적화 (WebRTC 고려)
- 오프라인 모드 (온디바이스 음성 인식)

---

## 기술적 특징 요약

### 1. 실시간 통신
- **WebSocket (Socket.IO)**: 양방향 실시간 통신
- **이벤트 기반 아키텍처**: 느슨한 결합

### 2. 성능 최적화
- **오디오 버퍼링**: 1초 단위 배치 처리
- **Optimistic Update**: 즉각적인 UI 반응
- **메모리 관리**: 리소스 자동 정리

### 3. 사용자 경험
- **자동 재연결**: 네트워크 불안정 상황 대응
- **Graceful Degradation**: 오프라인 모드 지원
- **드래그 가능한 UI**: 사용자 맞춤 위치 조정

### 4. 확장성
- **모듈화된 구조**: 서비스별 독립적 관리
- **세션 관리**: 다중 클라이언트 지원
- **외부 API 추상화**: API 교체 용이

---

## 결론

AllSub는 **3-Tier 아키텍처**를 기반으로 설계되었으며, 다음과 같은 특징을 가집니다:

1. **실시간성**: WebSocket 기반 양방향 통신
2. **확장성**: 모듈화된 구조로 기능 추가 용이
3. **안정성**: 자동 재연결 및 에러 핸들링
4. **사용자 경험**: Optimistic Update 및 Graceful Degradation
5. **성능**: 오디오 버퍼링 및 배치 처리

이러한 설계를 통해 **안정적이고 확장 가능한 실시간 자막 서비스**를 구현했습니다.

