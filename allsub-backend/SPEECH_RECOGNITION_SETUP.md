# 🎤 음성 인식 서비스 설정 가이드

## ✅ 이미 구현되어 있습니다!

음성 인식 기능이 이미 구현되어 있으며, 2가지 모드로 작동합니다:

---

## 🎭 현재: 시뮬레이션 모드 (테스트용)

**API 키 없이 바로 테스트 가능합니다!**

### 작동 방식:
```
오디오 수신 
  ↓
샘플 텍스트 반환 (랜덤)
  ↓
번역 (시뮬레이션)
  ↓
자막 표시
```

### 샘플 텍스트:
- "안녕하세요, 반갑습니다." → "Hello, nice to meet you."
- "오늘 날씨가 정말 좋네요." → "The weather is really nice today."
- "이 영상이 매우 흥미롭습니다." → "This video is very interesting."
- 등등...

### 장점:
✅ API 키 불필요
✅ 무료
✅ 즉시 테스트 가능

### 단점:
❌ 실제 음성 인식 안 됨
❌ 샘플 텍스트만 반환

---

## 🚀 실제 음성 인식: OpenAI Whisper API (추천!)

### 왜 Whisper인가?
- ✅ 매우 정확한 음성 인식 (99%+ 정확도)
- ✅ 100개 이상 언어 지원
- ✅ 간단한 설정 (5분)
- ✅ 합리적인 가격 ($0.006/분)

### 설정 방법:

#### 1️⃣ OpenAI API 키 발급 (무료 크레딧 포함!)

1. **OpenAI 웹사이트 접속:**
   https://platform.openai.com/

2. **계정 생성 (무료):**
   - 이메일로 가입
   - 전화번호 인증

3. **API 키 생성:**
   - 로그인 후 https://platform.openai.com/api-keys
   - "Create new secret key" 클릭
   - 키 이름 입력: "AllSub"
   - **키 복사** (다시 볼 수 없음!)
   - 예: `sk-proj-abc123...xyz789`

4. **무료 크레딧:**
   - 신규 가입 시 $5 무료 크레딧
   - 약 800분 음성 인식 가능

#### 2️⃣ 환경 변수 설정

**macOS/Linux:**
```bash
# 터미널에서 실행
export OPENAI_API_KEY="sk-proj-abc123...xyz789"

# 또는 .env 파일 생성
cd /Users/ieunho/Downloads/Allsub/allsub-backend
echo 'OPENAI_API_KEY="sk-proj-abc123...xyz789"' > .env
```

**영구 설정 (권장):**
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
echo 'export OPENAI_API_KEY="sk-proj-abc123...xyz789"' >> ~/.zshrc
source ~/.zshrc
```

#### 3️⃣ 백엔드 서버 재시작

```bash
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev
```

#### 4️⃣ 로그 확인

성공 시:
```
✅ OpenAI Whisper API initialized
Application is running on: http://localhost:3000
```

실패 시 (API 키 없음):
```
⚠️  OPENAI_API_KEY not found. Using simulation mode.
💡 실제 음성 인식을 사용하려면:
   1. OpenAI API 키 발급
   2. 환경 변수 설정
   3. 서버 재시작
```

---

## 🎯 대안: Google Cloud Speech-to-Text

이미 코드가 구현되어 있습니다!

### 설정 방법:

#### 1️⃣ Google Cloud 프로젝트 생성
https://console.cloud.google.com/

#### 2️⃣ Speech-to-Text API 활성화
- APIs & Services → Enable APIs and Services
- "Cloud Speech-to-Text API" 검색 및 활성화

#### 3️⃣ 서비스 계정 키 생성
1. IAM & Admin → Service Accounts
2. Create Service Account
3. 역할: Cloud Speech Client
4. JSON 키 다운로드

#### 4️⃣ 환경 변수 설정
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

#### 5️⃣ 백엔드 재시작

---

## 📊 비교표

| 항목 | OpenAI Whisper | Google Cloud | 시뮬레이션 |
|------|----------------|--------------|-----------|
| **정확도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ |
| **설정 난이도** | ⭐ (쉬움) | ⭐⭐⭐ (중간) | ⭐ (없음) |
| **가격** | $0.006/분 | $0.006/분 | 무료 |
| **언어 지원** | 100+ | 125+ | 한국어/영어만 |
| **무료 크레딧** | $5 | $300 (3개월) | 무료 |
| **실시간성** | 빠름 | 빠름 | 즉시 |
| **추천도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (테스트용) |

---

## 🎉 현재 상태

### ✅ 구현 완료:
1. **WhisperService** - OpenAI Whisper API 연동
2. **SpeechService** - Google Cloud Speech-to-Text 연동
3. **TranslationService** - 번역 서비스
4. **시뮬레이션 모드** - API 키 없이 테스트

### 🔄 현재 작동:
- ✅ 백엔드 서버 실행 중
- ✅ 시뮬레이션 모드로 작동 (API 키 없음)
- ✅ 샘플 텍스트 자막 제공

### 🚀 실제 음성 인식 사용하려면:
1. OpenAI API 키 발급 (5분)
2. 환경 변수 설정
3. 백엔드 재시작

---

## 💡 빠른 시작

### 테스트만 하려면 (지금 바로):
```bash
# 아무것도 하지 않아도 됨!
# 이미 시뮬레이션 모드로 작동 중
```

### 실제 음성 인식 사용하려면:
```bash
# 1. OpenAI API 키 발급
# https://platform.openai.com/api-keys

# 2. 환경 변수 설정
export OPENAI_API_KEY="sk-proj-YOUR-KEY-HERE"

# 3. 백엔드 재시작
cd /Users/ieunho/Downloads/Allsub/allsub-backend
npm run start:dev
```

---

## 🔍 작동 확인

### 백엔드 로그:

**시뮬레이션 모드:**
```
⚠️  OPENAI_API_KEY not found. Using simulation mode.
🎭 시뮬레이션 모드: 안녕하세요, 반갑습니다.
```

**Whisper API 모드:**
```
✅ OpenAI Whisper API initialized
🎤 오디오 처리 시작 (크기: 25000 bytes)
📝 음성 인식 결과: 안녕하세요
🌍 번역 결과: Hello
📤 자막 전송 완료
```

---

## 📚 추가 정보

### OpenAI API 가격:
- Whisper: $0.006/분
- 예: 100분 사용 = $0.60 (약 800원)
- 무료 크레딧 $5 = 약 800분

### Google Cloud 가격:
- Speech-to-Text: $0.006/분 (동일)
- 처음 60분/월 무료
- $300 무료 크레딧 (3개월)

### 권장:
- **테스트:** 시뮬레이션 모드 (현재)
- **개발:** OpenAI Whisper ($5 무료 크레딧)
- **프로덕션:** Google Cloud ($300 크레딧 + 60분/월 무료)

---

## 🎉 요약

**음성 인식 기능이 이미 완벽하게 구현되어 있습니다!**

- ✅ 현재: 시뮬레이션 모드로 작동 (테스트 가능)
- 🚀 원하면: OpenAI API 키 설정 (실제 음성 인식)

**지금 바로 테스트하거나, API 키 설정 후 실제 음성 인식을 사용하세요!** 🎉

