# WebSocket 연결 실패 & 자막 서비스 시작 실패 - 원인 분석 및 해결

## 🔍 주요 원인 TOP 5

---

## ❌ 원인 1: 백엔드 서버 미실행 (가장 흔함)

### 증상:
```
Failed to connect to WebSocket server
WebSocket connection error: Error: xhr poll error
Subtitle service start result: false
```

### 확인 방법:
```bash
# 터미널에서 확인
lsof -i :3000
# 아무것도 안 나오면 서버 미실행
```

### 해결:
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev
```

### 확인:
```
Application is running on: http://localhost:3000
```

---

## ❌ 원인 2: 잘못된 URL 설정

### 증상:
- iOS 시뮬레이터에서 `10.0.2.2` 사용 (Android용 주소)
- Android에서 `localhost` 사용 (iOS용 주소)

### 확인:
`src/config/environment.ts` 파일 확인:
```typescript
// iOS 시뮬레이터
const IOS_SIMULATOR_CONFIG = {
  wsBaseUrl: 'http://localhost:3000',  // ✅ 올바름
};

// Android 에뮬레이터
const ANDROID_EMULATOR_CONFIG = {
  wsBaseUrl: 'http://10.0.2.2:3000',   // ✅ 올바름
};
```

### iOS 시뮬레이터에서 실행 시:
```javascript
// 콘솔에서 확인
📱 Using iOS SIMULATOR config
WebSocket URL: http://localhost:3000
```

### Android 에뮬레이터에서 실행 시:
```javascript
// 콘솔에서 확인
🤖 Using ANDROID EMULATOR config
WebSocket URL: http://10.0.2.2:3000
```

### 해결:
환경 설정이 자동으로 선택되므로 별도 수정 불필요.
만약 문제가 있다면 `src/config/environment.ts`의 로직 확인.

---

## ❌ 원인 3: 방화벽/보안 소프트웨어 차단

### 증상:
```
WebSocket connection error: Connection refused
Failed to connect to server
```

### 확인:
```bash
# 백엔드 서버가 실행 중인지 확인
curl http://localhost:3000

# 응답이 없으면 방화벽 문제
```

### macOS 방화벽 확인:
```
시스템 환경설정 
→ 보안 및 개인 정보 보호 
→ 방화벽 
→ Node.js 또는 터미널 허용 확인
```

### 해결:
1. 방화벽에서 Node.js 허용
2. 또는 방화벽 임시 비활성화 후 테스트

---

## ❌ 원인 4: WebSocket 라이브러리 설치 문제

### 증상:
```
Cannot find module 'socket.io-client'
WebSocketService initialization failed
```

### 확인:
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-mobile
cat package.json | grep socket.io-client
```

### 해결:
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-mobile
npm install socket.io-client@^4.8.1
cd ios && pod install
```

---

## ❌ 원인 5: 마이크 권한 거부

### 증상:
```
✅ WebSocket connected (연결은 성공)
❌ Failed to start subtitle service (자막 서비스 실패)
Audio permission denied
Failed to start audio recording
```

### 확인:
iOS 시뮬레이터/디바이스:
```
설정 → AllSub → 마이크 → 확인
```

### 해결:
1. 앱 삭제
2. 재설치
3. 마이크 권한 팝업에서 "확인" 선택

---

## ❌ 원인 6: 포트 충돌

### 증상:
```
백엔드 시작 시:
Error: listen EADDRINUSE: address already in use :::3000
```

### 확인:
```bash
lsof -i :3000
```

### 해결:
```bash
# 기존 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
PORT=3001 npm run start:dev
```

프론트엔드도 수정:
```typescript
// src/config/environment.ts
wsBaseUrl: 'http://localhost:3001',  // 포트 변경
```

---

## ❌ 원인 7: Google Cloud API 설정 문제

### 증상:
```
✅ WebSocket connected
✅ Audio recording started
❌ No subtitles appearing
Backend error: Google Cloud credentials not found
```

### 확인:
백엔드 콘솔에서:
```
Error: Could not load the default credentials
GOOGLE_APPLICATION_CREDENTIALS not set
```

### 해결:
```bash
# 1. Google Cloud 서비스 계정 키 다운로드
# 2. 환경 변수 설정
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# 3. 백엔드 재시작
npm run start:dev
```

---

## ❌ 원인 8: 네트워크 타임아웃

### 증상:
```
WebSocket connection timeout
Failed to connect within 10 seconds
```

### 확인:
`src/services/websocketService.ts` 파일:
```typescript
setTimeout(() => {
  if (!this.isConnected) {
    resolve(false);
  }
}, 10000);  // 10초 타임아웃
```

### 해결:
1. 네트워크 연결 확인
2. VPN 사용 시 비활성화
3. 백엔드 서버 응답 속도 확인

---

## ❌ 원인 9: iOS 시뮬레이터 특정 문제

### 증상:
- 실제 디바이스에서는 작동
- 시뮬레이터에서만 연결 실패

### 해결:
```bash
# 1. 시뮬레이터 재시작
# iOS Simulator → Device → Restart

# 2. 시뮬레이터 완전 삭제 후 재생성
xcrun simctl delete all
xcrun simctl create "iPhone 14 Pro" "iPhone 14 Pro"

# 3. Xcode 재시작
```

---

## ❌ 원인 10: CORS 문제 (WebSocket)

### 증상:
```
WebSocket connection failed
Access-Control-Allow-Origin error
```

### 확인:
`allsub-backend/src/subtitle/subtitle.gateway.ts`:
```typescript
@WebSocketGateway({
  cors: {
    origin: '*',        // 모든 origin 허용
    credentials: true,
  },
})
```

### 해결:
이미 설정되어 있으므로 문제 없음.
만약 변경되었다면 위 코드로 수정.

---

## 🔧 단계별 디버깅 가이드

### Step 1: 백엔드 확인
```bash
# 1. 백엔드 실행 확인
lsof -i :3000

# 2. 백엔드 로그 확인
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev

# 3. 정상 실행 시 로그:
Application is running on: http://localhost:3000
```

### Step 2: 프론트엔드 환경 설정 확인
```bash
# 앱 실행 후 콘솔에서 확인
📱 Using iOS SIMULATOR config
WebSocket URL: http://localhost:3000
```

### Step 3: WebSocket 연결 시도
```bash
# 앱에서 Toggle ON 후 콘솔:
Connecting to WebSocket server...
WebSocket connected  ← ✅ 성공
```

### Step 4: 자막 서비스 시작
```bash
# 콘솔:
Subtitle service started successfully  ← ✅ 성공
Audio recording started               ← ✅ 성공
```

### Step 5: 오디오 전송 확인
```bash
# 프론트엔드 콘솔:
Sending audio chunk...

# 백엔드 콘솔:
Client connected: <socket-id>
Starting subtitle service for client: <socket-id>
Received audio chunk
```

### Step 6: 자막 수신 확인
```bash
# 프론트엔드 콘솔:
Received subtitle: { original: '안녕하세요', translated: 'Hello' }
```

---

## 🎯 빠른 해결 체크리스트

### ✅ 연결 전 체크리스트
- [ ] 백엔드 서버 실행 중? (`lsof -i :3000`)
- [ ] 올바른 URL 사용? (iOS: localhost, Android: 10.0.2.2)
- [ ] 방화벽 허용?
- [ ] socket.io-client 설치됨?
- [ ] 네트워크 연결 정상?

### ✅ 연결 후 체크리스트
- [ ] WebSocket connected 로그?
- [ ] 마이크 권한 허용?
- [ ] Audio recording started 로그?
- [ ] Google Cloud API 설정됨? (백엔드)
- [ ] 오디오 청크 전송 중?

---

## 🚨 에러별 빠른 해결

| 에러 메시지 | 원인 | 해결 |
|-----------|------|------|
| `Connection refused` | 백엔드 미실행 | `npm run start:dev` |
| `xhr poll error` | 잘못된 URL | environment.ts 확인 |
| `Connection timeout` | 네트워크 문제 | VPN 끄기, 네트워크 확인 |
| `Audio permission denied` | 마이크 권한 | 앱 재설치, 권한 허용 |
| `Google Cloud credentials` | API 키 없음 | 환경 변수 설정 |
| `Port already in use` | 포트 충돌 | 프로세스 종료 |

---

## 💡 실시간 디버깅 팁

### 프론트엔드 디버깅
```typescript
// src/services/websocketService.ts에 로그 추가
connect(serverUrl: string) {
  console.log('🔌 Connecting to:', serverUrl);
  
  this.socket.on('connect', () => {
    console.log('✅ Connected!');
  });
  
  this.socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    console.log('Server URL:', serverUrl);
    console.log('Error details:', JSON.stringify(error));
  });
}
```

### 백엔드 디버깅
```typescript
// src/subtitle/subtitle.gateway.ts
handleConnection(client: Socket) {
  this.logger.log(`✅ Client connected: ${client.id}`);
  this.logger.log(`Client address: ${client.handshake.address}`);
}

@SubscribeMessage('audio-chunk')
async handleAudioChunk(client, data) {
  this.logger.log(`🎤 Audio chunk received from ${client.id}`);
  this.logger.log(`Audio size: ${data.audio.length} bytes`);
}
```

---

## 🎉 성공 확인

다음 로그가 모두 보이면 성공:

### 프론트엔드:
```
📱 Using iOS SIMULATOR config
WebSocket URL: http://localhost:3000
🔌 Connecting to WebSocket server...
✅ WebSocket connected
🎙️ Subtitle service started successfully
🎤 Audio recording started
📨 Sending audio chunk...
📬 Received subtitle: 안녕하세요 → Hello
```

### 백엔드:
```
Application is running on: http://localhost:3000
✅ Client connected: abc123
🎯 Starting subtitle service for client: abc123
🎤 Audio chunk received
🗣️ Transcription: 안녕하세요
🌍 Translation: Hello
📤 Subtitle sent to abc123
```

---

## 📞 추가 도움

위 방법으로도 해결되지 않으면:

1. **프론트엔드 콘솔 로그** 전체 복사
2. **백엔드 콘솔 로그** 전체 복사
3. 에러 메시지와 함께 질문

이렇게 하면 정확한 원인을 찾을 수 있습니다! 🚀

