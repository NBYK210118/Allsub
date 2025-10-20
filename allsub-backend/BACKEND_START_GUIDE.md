# 🚀 AllSub 백엔드 실행 가이드

## ⚡ 빠른 시작 (포트 충돌 자동 해결)

### 방법 1: 스크립트 사용 (추천!)

```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev:clean
```

**자동으로:**
- ✅ 포트 3000, 3001 사용 중인지 확인
- ✅ 사용 중이면 프로세스 자동 종료
- ✅ 백엔드 서버 실행

---

### 방법 2: 직접 스크립트 실행

```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
./start-dev.sh
```

---

### 방법 3: 포트만 정리

```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run kill-port
npm run start:dev
```

---

### 방법 4: 수동 정리 (기존 방식)

```bash
# 1. 포트 확인
lsof -i :3000

# 2. 프로세스 종료
kill -9 <PID>

# 3. 서버 시작
npm run start:dev
```

---

## 📝 실행 예시

### 성공 시 출력:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AllSub 백엔드 서버 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 포트 3000 확인 중...
⚠️  포트 3000이 이미 사용 중입니다 (PID: 12345)
🛑 기존 프로세스 종료 중...
✅ 포트 3000 해제 완료

🔍 포트 3001 확인 중...
✅ 포트 3001 사용 가능

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶️  백엔드 서버 실행 중...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Nest] Starting Nest application...
⚠️  OPENAI_API_KEY not found. Using simulation mode.
💡 실제 음성 인식을 사용하려면:
   1. OpenAI API 키 발급
   2. 환경 변수 설정
   3. 서버 재시작

Application is running on: http://localhost:3000
```

---

## 🎯 추천 명령어

### 평소 개발 시:
```bash
npm run start:dev:clean
```

### 빠른 재시작:
```bash
npm run kill-port
npm run start:dev
```

### 포트만 정리:
```bash
npm run kill-port
```

---

## 💡 자주 묻는 질문

### Q: 왜 포트 충돌이 자주 발생하나요?

**A:** 
- Ctrl+C로 종료해도 프로세스가 완전히 종료 안 될 수 있음
- 여러 터미널에서 실행했을 수 있음
- 에러로 인한 비정상 종료

### Q: 매번 이 스크립트를 써야 하나요?

**A:**
```bash
# 한 번만 설정:
alias backend='cd /Users/ieunho/Downloads/Allsub/allsub-backend && npm run start:dev:clean'

# 이후 어디서든:
backend
```

---

## 🚀 전체 프로젝트 실행

### 터미널 1: 백엔드
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev:clean
```

### 터미널 2: iOS 앱 (또는 Xcode)
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-mobile
npx expo run:ios
```

---

## ✅ 성공 확인

백엔드 정상 실행 시:
```
✅ Application is running on: http://localhost:3000
[SubtitleGateway] subscribed to messages
[AudioStreamGateway] listening on port 3001
```

---

**이제 포트 충돌 걱정 없이 백엔드를 실행하세요!** 🎉

