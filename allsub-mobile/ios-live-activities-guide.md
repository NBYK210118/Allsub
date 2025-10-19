# iOS Live Activities 구현 가이드

## ⚠️ 중요 사항

- **iOS 16.1 이상** 필요
- **Dynamic Island**: iPhone 14 Pro, 15 Pro 이상
- **Expo Go 불가** - Development Build 또는 EAS Build 필수
- **macOS + Xcode** 필요

---

## 🛠 구현 방법

### 1. 필요한 패키지 설치

```bash
npx expo install expo-live-activities
npx expo install expo-dev-client
```

### 2. app.json 설정

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.allsubmobile",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "...",
        "NSSpeechRecognitionUsageDescription": "...",
        "NSSupportsLiveActivities": true
      }
    },
    "plugins": [
      [
        "expo-live-activities",
        {
          "frequentUpdates": true
        }
      ]
    ]
  }
}
```

---

## 📱 Live Activities 구현

### SubtitleLiveActivity.swift

Widget Extension을 생성해야 합니다.

```swift
import ActivityKit
import WidgetKit
import SwiftUI

// Live Activity Attributes
struct SubtitleAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var subtitle: String
        var translation: String
        var timestamp: Date
    }
    
    var userId: String
}

// Live Activity Widget
@main
struct SubtitleLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SubtitleAttributes.self) { context in
            // Lock Screen UI
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "text.bubble.fill")
                        .foregroundColor(.purple)
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    Text("LIVE")
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(4)
                        .background(Color.red.opacity(0.2))
                        .cornerRadius(4)
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.state.subtitle)
                            .font(.body)
                            .lineLimit(2)
                        
                        if !context.state.translation.isEmpty {
                            Text(context.state.translation)
                                .font(.caption)
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Spacer()
                        Text(context.state.timestamp, style: .time)
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
            } compactLeading: {
                // Compact Leading (왼쪽 작은 아이콘)
                Image(systemName: "text.bubble.fill")
                    .foregroundColor(.purple)
            } compactTrailing: {
                // Compact Trailing (오른쪽 작은 텍스트)
                Text("字幕")
                    .font(.caption2)
            } minimal: {
                // Minimal (최소화)
                Image(systemName: "text.bubble.fill")
                    .foregroundColor(.purple)
            }
        }
    }
}

// Lock Screen View
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<SubtitleAttributes>
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "text.bubble.fill")
                    .foregroundColor(.purple)
                
                Text("AllSub")
                    .font(.headline)
                
                Spacer()
                
                Text("LIVE")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.red)
                    .cornerRadius(4)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(context.state.subtitle)
                    .font(.body)
                    .foregroundColor(.white)
                
                if !context.state.translation.isEmpty {
                    Text(context.state.translation)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color.black.opacity(0.8))
        .cornerRadius(12)
    }
}
```

---

## 🔧 JavaScript/TypeScript 연동

### LiveActivityService.ts

```typescript
import { Platform } from 'react-native';
import * as LiveActivities from 'expo-live-activities';

interface SubtitleActivityState {
  subtitle: string;
  translation: string;
  timestamp: Date;
}

class LiveActivityService {
  private activityId: string | null = null;
  private isActive = false;

  async startLiveActivity(userId: string): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('Live Activities only available on iOS');
      return false;
    }

    try {
      // Live Activity 시작
      const activityId = await LiveActivities.startActivity({
        activityType: 'SubtitleActivity',
        attributes: {
          userId: userId,
        },
        contentState: {
          subtitle: '음성을 인식하고 있습니다...',
          translation: '',
          timestamp: new Date(),
        },
      });

      this.activityId = activityId;
      this.isActive = true;

      console.log('Live Activity started:', activityId);
      return true;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      return false;
    }
  }

  async updateLiveActivity(subtitle: string, translation: string): Promise<void> {
    if (!this.activityId || !this.isActive) {
      console.log('Live Activity not active');
      return;
    }

    try {
      await LiveActivities.updateActivity({
        activityId: this.activityId,
        contentState: {
          subtitle: subtitle,
          translation: translation,
          timestamp: new Date(),
        },
      });

      console.log('Live Activity updated');
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }

  async stopLiveActivity(): Promise<void> {
    if (!this.activityId || !this.isActive) {
      return;
    }

    try {
      await LiveActivities.endActivity(this.activityId);
      this.activityId = null;
      this.isActive = false;

      console.log('Live Activity stopped');
    } catch (error) {
      console.error('Failed to stop Live Activity:', error);
    }
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}

export default new LiveActivityService();
```

---

## 🎨 UI 커스터마이징

### Dynamic Island 크기별 레이아웃

#### Minimal (최소화)
- 아이콘만 표시
- 약 44x44pt

#### Compact (컴팩트)
- 왼쪽/오른쪽 아이콘
- 약 52x52pt

#### Expanded (확장)
- 전체 자막 + 번역
- 최대 408x160pt

---

## 📱 HomeScreen 통합

```typescript
// HomeScreen.tsx
import LiveActivityService from '../services/liveActivityService';

// 자막 서비스 시작 시
useEffect(() => {
  if (isCaptionEnabled) {
    if (Platform.OS === 'ios') {
      // iOS: Live Activity 시작
      LiveActivityService.startLiveActivity('demo-user-1');
    }
    
    SubtitleService.start(
      (subtitle: string, translation: string) => {
        // 자막 업데이트
        if (Platform.OS === 'ios') {
          LiveActivityService.updateLiveActivity(subtitle, translation);
        }
        // ... 기존 로직
      },
      // ... 기타 파라미터
    );
  } else {
    if (Platform.OS === 'ios') {
      LiveActivityService.stopLiveActivity();
    }
    SubtitleService.stop();
  }
}, [isCaptionEnabled]);
```

---

## 🧪 테스트 방법

### 1. Xcode 프로젝트 생성

```bash
# Prebuild 실행
npx expo prebuild --platform ios

# Xcode에서 열기
open ios/AllsubMobile.xcworkspace
```

### 2. Widget Extension 추가

1. Xcode에서 **File > New > Target**
2. **Widget Extension** 선택
3. Product Name: `SubtitleWidget`
4. Include Live Activity 체크

### 3. 실제 기기에서 테스트

```bash
# Development Build 실행
npx expo run:ios --device

# 또는 EAS Build
eas build --profile development --platform ios
```

### 4. 테스트 시나리오

1. AllSub 앱에서 토글 ON
2. 홈 버튼 눌러서 홈 화면으로 이동
3. Dynamic Island 확인 (iPhone 14 Pro+)
4. Lock Screen에서 확인
5. 다른 앱(YouTube 등) 열기
6. Live Activity가 계속 업데이트되는지 확인

---

## 🎯 Dynamic Island 테스트

### iPhone 14 Pro 이상에서만 가능
- iPhone 14 Pro / Pro Max
- iPhone 15 Pro / Pro Max
- 기타 기기는 상단 배너로 표시

### 시뮬레이터 테스트
```bash
# Xcode Simulator 실행
open -a Simulator

# iPhone 15 Pro 선택
xcrun simctl list devices
```

---

## 📊 제약 사항

1. **최대 8시간** Live Activity 지속 가능
2. **업데이트 빈도 제한**: 초당 1회 권장
3. **배터리 소모** 고려 필요
4. **백그라운드 새로고침** 권한 필요

---

## 🔐 권한 설정

### Info.plist
```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

---

## 🐛 디버깅

### Xcode 콘솔에서 로그 확인
```swift
print("Live Activity state: \(context.state.subtitle)")
```

### JavaScript 로그
```typescript
console.log('Live Activity ID:', activityId);
```

---

## 📚 참고 자료

- [Apple ActivityKit 공식 문서](https://developer.apple.com/documentation/activitykit)
- [Dynamic Island 디자인 가이드](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- [expo-live-activities](https://github.com/expo/expo/tree/main/packages/expo-live-activities)

