# 시스템 오디오 캡처 테스트 가이드

## 🎯 테스트 목표

YouTube, Instagram 등의 앱에서 재생되는 오디오를 캡처하여 실시간 자막으로 변환하는 기능을 테스트합니다.

---

## 📋 사전 준비

### 1. 백엔드 서버 실행

```bash
cd allsub-backend
npm run start:dev

# 확인: 두 개의 포트가 열려있어야 함
# - Port 3000: WebSocket (자막 전송)
# - Port 3001: TCP Socket (오디오 스트림)
```

### 2. 앱 빌드 및 설치

```bash
cd allsub-mobile

# Development Build 생성 (Expo Go로는 불가능!)
npx expo run:android

# 또는 EAS Build
eas build --profile development --platform android
```

⚠️ **중요**: Expo Go에서는 시스템 오디오 캡처가 작동하지 않습니다!

---

## 🤖 Android 테스트 (Android 10+)

### 1단계: 앱 실행 및 권한 확인

```
1. AllSub 앱 실행
2. 토글을 OFF 상태에서 시작하는지 확인
3. 설정 > 앱 > AllSub > 권한 확인:
   - 마이크: 허용
   - 알림: 허용
```

### 2단계: 시스템 오디오 캡처 시작

```
1. AllSub 앱에서 토글을 ON으로 변경
2. "화면 캡처 시작" 권한 요청 팝업 확인
3. "지금 시작" 버튼 탭
4. 알림 바에 "AllSub - 실시간 자막 제공 중..." 확인
```

### 3단계: YouTube 앱에서 테스트

```
1. YouTube 앱 실행
2. 한국어 동영상 재생 (예: 뉴스, 브이로그)
3. AllSub 앱으로 돌아가기
4. 화면 하단의 자막 오버레이 확인:
   - 원본 텍스트 (한국어)
   - 번역 텍스트 (영어)
   - "LIVE" 인디케이터
```

### 4단계: Instagram 앱에서 테스트

```
1. Instagram 앱 실행
2. 스토리 또는 릴스 재생
3. AllSub 앱으로 돌아가기
4. 자막이 실시간으로 업데이트되는지 확인
```

### 5단계: 백그라운드 테스트

```
1. YouTube 영상 재생 중
2. 홈 버튼 눌러서 홈 화면으로
3. 백그라운드에서도 YouTube 오디오가 계속 재생됨
4. AllSub 앱으로 돌아가서 자막이 계속 업데이트되는지 확인
```

---

## 🐛 문제 해결

### 문제 1: "Android 10 or higher required" 에러

**원인**: 디바이스가 Android 9 이하
**해결**: Android 10 이상 디바이스 사용 필요

### 문제 2: "Permission denied" 에러

**원인**: MediaProjection 권한 거부
**해결**:
```
1. 토글을 다시 OFF → ON
2. 권한 요청 팝업에서 "지금 시작" 선택
```

### 문제 3: 자막이 나타나지 않음

**원인**: 백엔드 서버 미실행 또는 연결 실패
**해결**:
```bash
# 백엔드 로그 확인
cd allsub-backend
npm run start:dev

# 포트 확인
netstat -an | findstr "3000 3001"
```

### 문제 4: 특정 앱에서 오디오 캡처 안 됨

**원인**: DRM 보호된 콘텐츠 (Netflix, Disney+ 등)
**해결**: 보호되지 않은 앱(YouTube, Instagram)에서 테스트

### 문제 5: 오디오가 끊김

**원인**: 네트워크 지연 또는 서버 과부하
**해결**:
```typescript
// AudioCaptureService.java에서 버퍼 크기 조정
private static final int BUFFER_SIZE = 4096; // 2048에서 4096으로 증가
```

---

## 📊 성능 확인

### Android Logcat으로 확인

```bash
# AllSub 로그만 필터링
adb logcat | grep -i "allsub\|audiocapture"

# 확인할 로그:
# - "System audio capture started"
# - "Connected to server"
# - "Sent XXXX bytes"
```

### 예상 로그 출력

```
D/AudioCaptureService: Starting audio capture
D/AudioCaptureService: AudioRecord started
D/AudioCaptureService: Attempting to connect to 210.115.229.181:3001
D/AudioCaptureService: Connected to server
D/AudioCaptureService: Sent 2048 bytes
D/AudioCaptureService: Sent 2048 bytes
...
```

---

## ✅ 테스트 체크리스트

### 기본 기능
- [ ] 앱 실행 시 토글이 OFF 상태
- [ ] 토글 ON 시 MediaProjection 권한 요청
- [ ] 권한 승인 후 알림 표시
- [ ] 백엔드 서버 연결 성공

### 시스템 오디오 캡처
- [ ] YouTube 오디오 캡처 성공
- [ ] Instagram 오디오 캡처 성공
- [ ] Chrome 브라우저 오디오 캡처 성공
- [ ] 음악 앱 오디오 캡처 성공

### 자막 기능
- [ ] 한국어 음성 인식 정확도 (>80%)
- [ ] 영어 번역 정확도 (>70%)
- [ ] 실시간 업데이트 (지연 < 3초)
- [ ] 자막 오버레이 UI 정상 표시

### 안정성
- [ ] 1분 이상 연속 작동
- [ ] 앱 전환 후에도 계속 작동
- [ ] 토글 OFF 시 정상 종료
- [ ] 메모리 누수 없음

---

## 📈 성능 벤치마크

### 예상 성능

| 항목 | 목표 | 실제 |
|------|------|------|
| 오디오 캡처 지연 | < 500ms | |
| 음성 인식 시간 | < 1.5초 | |
| 번역 시간 | < 500ms | |
| 총 지연 시간 | < 2.5초 | |
| CPU 사용률 | < 15% | |
| 배터리 소모 | < 5%/hour | |

### 측정 방법

```bash
# CPU 사용률
adb shell top | grep allsubmobile

# 메모리 사용량
adb shell dumpsys meminfo com.anonymous.allsubmobile

# 네트워크 사용량
adb shell dumpsys package com.anonymous.allsubmobile | grep "Network"
```

---

## 🎥 테스트 시나리오

### 시나리오 1: 뉴스 시청

```
1. YouTube에서 한국 뉴스 영상 재생
2. AllSub 토글 ON
3. 3분간 시청
4. 자막 정확도 평가

예상 결과:
- 명확한 발음의 뉴스는 90% 이상 정확도
- 전문 용어는 70% 정도 정확도
```

### 시나리오 2: 브이로그 시청

```
1. YouTube에서 일상 브이로그 재생
2. AllSub 토글 ON
3. 5분간 시청
4. 빠른 대화 처리 확인

예상 결과:
- 일상 대화는 80% 정도 정확도
- 빠른 대화는 지연 발생 가능
```

### 시나리오 3: 음악 감상

```
1. 멜론/지니뮤직에서 한국 노래 재생
2. AllSub 토글 ON
3. 3분간 재생
4. 가사 인식 확인

예상 결과:
- 명확한 발음의 가사는 인식 가능
- 배경 음악 많으면 인식률 저하
```

---

## 📝 피드백 기록

### 테스트 일시: _______________

### 테스트 환경
- **디바이스**: _______________________
- **Android 버전**: ___________________
- **앱 버전**: ________________________

### 테스트 결과

#### 성공한 기능
- 
- 
- 

#### 실패한 기능
- 
- 
- 

#### 개선 필요 사항
- 
- 
- 

---

## 🚀 다음 단계

테스트 완료 후:

1. ✅ 버그 수정
2. ✅ 성능 최적화
3. ⏳ iOS Live Activities 구현
4. ⏳ Android System Overlay (플로팅 버튼) 추가
5. ⏳ 사용자 피드백 수집

---

테스트를 완료하면 결과를 GitHub Issues에 등록해주세요! 🎉

