# iOS Live Activities로 실시간 자막 표시하기

## 개요
iOS에서는 시스템 오버레이가 불가능하지만, **Live Activities**를 사용하면 Dynamic Island와 잠금 화면에 실시간 자막을 표시할 수 있습니다.

## Live Activities란?
- iOS 16.1 이상에서 사용 가능
- Dynamic Island (iPhone 14 Pro 이상)에 표시
- 잠금 화면과 홈 화면에서도 표시 가능
- 실시간으로 업데이트 가능
- 스포츠 경기, 음식 배달, 운동 추적 등에 사용

## 우리 앱에 적용하면?
```
📱 홈 화면으로 나가도:
┌─────────────────────────────┐
│ 🐻 AllSub        [LIVE 🔴] │
│ "안녕하세요"                 │
│ "Hello"                      │
└─────────────────────────────┘
   ↑ 잠금 화면 / Dynamic Island에 표시
```

## 구현 방법

### 1. 필요한 패키지 설치
```bash
# Expo Config Plugin for Live Activities
npx expo install react-native-live-activities
```

### 2. iOS 네이티브 코드 작성 (WidgetKit)
- Swift로 Widget Extension 생성
- ActivityKit 사용
- 자막 데이터 표시 UI 구현

### 3. React Native에서 제어
```typescript
import LiveActivities from 'react-native-live-activities';

// Live Activity 시작
const activityId = await LiveActivities.startActivity({
  appName: 'AllSub',
  subtitle: '안녕하세요',
  translation: 'Hello',
  status: 'live'
});

// 실시간 업데이트
await LiveActivities.updateActivity(activityId, {
  subtitle: newSubtitle,
  translation: newTranslation
});

// 종료
await LiveActivities.endActivity(activityId);
```

### 4. 장점
✅ 다른 앱 사용 중에도 자막 표시
✅ 잠금 화면에서도 보임
✅ Dynamic Island 활용 (iPhone 14 Pro+)
✅ 네이티브 iOS 디자인
✅ 배터리 효율적

### 5. 단점
❌ iOS 16.1+ 전용
❌ 네이티브 모듈 개발 필요
❌ Expo Go에서 테스트 불가 (개발 빌드 필요)
❌ UI 커스터마이징 제한적 (SwiftUI로 작성)

## 구현 난이도
⭐⭐⭐ 중상 (네이티브 Swift 코드 + WidgetKit 지식 필요)

## 예상 개발 시간
- iOS 네이티브 개발자: 2-3일
- React Native 개발자 (Swift 초보): 1주일

---

## 옵션 2: Picture-in-Picture (PiP) 모드

### 개요
비디오 재생을 위한 기능이지만, 창의적으로 활용할 수 있습니다.

### 구현 아이디어
```typescript
// 투명한 비디오를 재생하면서 자막을 오버레이
// PiP 창에 자막 표시
```

### 장점
✅ 다른 앱 위에 떠있음
✅ 크기 조절 가능
✅ 위치 이동 가능

### 단점
❌ 비디오가 반드시 재생 중이어야 함
❌ Apple 심사 거부 가능 (원래 목적과 다른 사용)
❌ UI가 비디오 플레이어 형태로 제한됨

---

## 옵션 3: 백그라운드 실행 + 로컬 알림

### 개요
앱이 백그라운드에 있어도 계속 자막을 생성하고, 알림으로 표시

### 구현
```typescript
import * as Notifications from 'expo-notifications';

// 자막이 업데이트될 때마다 알림 표시
await Notifications.scheduleNotificationAsync({
  content: {
    title: '🐻 AllSub',
    body: `${subtitle}\n${translation}`,
    sound: false,
    priority: 'high'
  },
  trigger: null // 즉시 표시
});
```

### 장점
✅ 구현 간단
✅ 모든 iOS 버전 지원
✅ Expo Go에서도 테스트 가능

### 단점
❌ 알림이 너무 자주 뜨면 사용자 경험 나쁨
❌ 알림 권한 필요
❌ 자막이 빠르게 바뀌면 따라가기 어려움

---

## 추천 접근 방법

### 현실적인 구현 순서:

1. **단기 (지금 바로)**
   - 백그라운드에서 자막 서비스 계속 실행
   - 앱으로 돌아오면 최신 자막 표시
   - 로컬 알림으로 중요한 자막만 표시

2. **중기 (1-2주)**
   - Live Activities 구현 (iOS 16.1+)
   - Dynamic Island + 잠금 화면 활용
   - 최고의 사용자 경험

3. **장기 (Android 버전)**
   - Android용 시스템 오버레이 구현
   - 이미 코드에 FloatingButtonService 있음
   - SYSTEM_ALERT_WINDOW 권한 활용

---

## 코드 예시: 백그라운드 실행 개선

현재 코드는 이미 백그라운드 실행을 지원합니다:
- `AppState.addEventListener` 사용 중
- 백그라운드에서도 WebSocket 연결 유지
- 오디오 녹음 계속 진행

개선할 점:
1. 백그라운드 권한 설정 (app.json)
2. 백그라운드 태스크 등록
3. 배터리 최적화 고려

```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "audio",
          "fetch",
          "processing"
        ]
      }
    }
  }
}
```

## 결론

**iOS에서 진정한 플로팅 버튼은 불가능**하지만, Live Activities가 가장 근접한 대안입니다.

현재는:
1. 앱이 백그라운드에서도 자막 생성 계속
2. 앱으로 돌아오면 즉시 최신 자막 확인
3. 플로팅 버튼은 앱 내부에서만 작동

나중에 Android 버전을 만들면 진정한 시스템 오버레이 구현 가능!

