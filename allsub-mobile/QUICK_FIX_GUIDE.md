# 빠른 문제 해결 가이드

## ❌ "Failed to start subtitle service" 에러

---

## 🚀 빠른 해결 (순서대로 시도)

### 방법 1: 백엔드 서버 확인 (1분)

터미널에서:
```bash
lsof -i :3000
```

**출력 있으면:** 서버 실행 중 ✅ → 방법 2로
**출력 없으면:** 서버 미실행 ❌ → 아래 실행

```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev
```

성공 시:
```
Application is running on: http://localhost:3000
```

---

### 방법 2: 앱 완전 재시작 (2분)

#### Xcode에서:

1. **Stop** 버튼 (■) 클릭
2. **Command + Shift + K** (Clean Build)
3. **시뮬레이터 → Device → Erase All Content and Settings**
4. **Command + R** (재실행)
5. Toggle ON → 마이크 권한 **"확인"** 클릭

---

### 방법 3: 로그 확인 후 진단 (5분)

Xcode 콘솔에서 다음을 찾으세요:

#### Case A: WebSocket 연결 실패
```
❌ WebSocket 연결 에러
📍 Server URL: http://localhost:3000
```

**해결:** 방법 1로 돌아가기

#### Case B: 마이크 권한 거부
```
❌ 마이크 권한 거부됨!
```

**해결:**
1. 앱 삭제 (시뮬레이터에서 길게 누르기)
2. 앱 재설치 (Command + R)
3. 권한 팝업에서 "확인"

#### Case C: 오디오 녹음 실패
```
❌ 오디오 녹음 시작 실패
```

**해결:**
```
시뮬레이터 → Device → Restart
```

---

### 방법 4: 실제 디바이스로 테스트 (10분)

시뮬레이터 문제를 우회하는 가장 확실한 방법:

1. iPhone을 Mac에 USB 연결
2. Xcode에서 디바이스 선택
3. Command + R
4. 완벽하게 작동! ✅

---

## 📞 추가 도움

위 방법으로 해결 안 되면:

**Xcode 콘솔 로그 전체 복사해서 알려주세요!**

특히 이 부분들:
- "WebSocket 연결" 관련
- "마이크 권한" 관련  
- "오디오 녹음" 관련
- "❌" 표시가 있는 모든 에러

---

## ⚡ 가장 빠른 해결:

```bash
# 터미널 1: 백엔드 확인
lsof -i :3000
# 없으면: cd allsub-backend && npm run start:dev

# Xcode: 앱 재시작
# Command + Shift + K (Clean)
# Command + R (실행)
```

**90% 이상 이것으로 해결됩니다!** 🎉

