# Live Activities 구현 계획

## 🎯 목표
YouTube Premium 백그라운드 재생 중에도 실시간 자막을 Dynamic Island와 잠금 화면에 표시

## 📱 사용자 시나리오

### 주요 사용 케이스
1. **YouTube Premium 백그라운드 재생** + Live Activities
   - 운동 중 영어 강의 듣기
   - 출퇴근 중 팟캐스트 듣기
   - 집안일 하면서 YouTube 듣기

2. **다른 앱 사용 중** + Live Activities
   - 메신저, SNS 사용하면서
   - Dynamic Island에서 실시간 자막 확인

3. **잠금 화면** + Live Activities
   - 폰을 주머니에 넣고
   - 필요할 때만 잠금 화면에서 자막 확인

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────┐
│              React Native App                   │
│  ┌───────────────────────────────────────────┐ │
│  │ SubtitleService (기존)                    │ │
│  │ - 마이크로 오디오 캡처                    │ │
│  │ - WebSocket으로 서버 전송                │ │
│  │ - 실시간 자막 수신                        │ │
│  └──────────────┬────────────────────────────┘ │
│                 │                                │
│  ┌──────────────▼────────────────────────────┐ │
│  │ LiveActivityManager (신규)                │ │
│  │ - React Native → Native Bridge           │ │
│  │ - Activity 시작/업데이트/종료             │ │
│  └──────────────┬────────────────────────────┘ │
└─────────────────┼────────────────────────────────┘
                  │ Native Bridge
┌─────────────────▼────────────────────────────────┐
│              iOS Native (Swift)                  │
│  ┌───────────────────────────────────────────┐  │
│  │ AllSubActivityAttributes (신규)          │  │
│  │ - ActivityKit 구조체 정의                 │  │
│  │ - 자막 데이터 모델                        │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ Widget Extension (신규)                   │  │
│  │ - Dynamic Island UI (SwiftUI)            │  │
│  │ - 잠금 화면 UI (SwiftUI)                 │  │
│  │ - 실시간 자막 표시                        │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## 📝 구현 단계

### Phase 1: 네이티브 모듈 설정 (1일)

#### 1.1 Expo Config Plugin 추가
```bash
npx expo install react-native-live-activities
```

#### 1.2 app.json 설정
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-live-activities",
        {
          "frequency": "live"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSSupportsLiveActivities": true
      }
    }
  }
}
```

#### 1.3 개발 빌드 생성
```bash
npx expo prebuild --platform ios
npx expo run:ios
```

### Phase 2: Swift Widget Extension 개발 (2-3일)

#### 2.1 AllSubActivityAttributes.swift 생성
```swift
import ActivityKit

struct AllSubActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // 실시간 업데이트되는 데이터
        var originalSubtitle: String
        var translatedSubtitle: String
        var isRecording: Bool
        var timestamp: Date
    }
    
    // 고정 데이터
    var appName: String
}
```

#### 2.2 Dynamic Island UI (SwiftUI)
```swift
struct AllSubLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AllSubActivityAttributes.self) { context in
            // 잠금 화면 UI
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "captions.bubble.fill")
                        .foregroundColor(.purple)
                    Text("AllSub")
                        .font(.headline)
                    Spacer()
                    if context.state.isRecording {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 8, height: 8)
                            Text("LIVE")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
                
                // 원본 자막
                Text(context.state.originalSubtitle)
                    .font(.body)
                    .foregroundColor(.primary)
                
                // 번역 자막
                Text(context.state.translatedSubtitle)
                    .font(.callout)
                    .foregroundColor(.secondary)
                    .italic()
            }
            .padding()
            .activityBackgroundTint(Color.purple.opacity(0.1))
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "captions.bubble.fill")
                            .foregroundColor(.purple)
                        Text("AllSub")
                            .font(.caption)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isRecording {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 6, height: 6)
                            Text("LIVE")
                                .font(.caption2)
                        }
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.originalSubtitle)
                            .font(.caption)
                            .lineLimit(2)
                        
                        Text(context.state.translatedSubtitle)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
            } compactLeading: {
                // Compact Leading (아이콘)
                Image(systemName: "captions.bubble.fill")
                    .foregroundColor(.purple)
            } compactTrailing: {
                // Compact Trailing (LIVE 표시)
                if context.state.isRecording {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 6, height: 6)
                }
            } minimal: {
                // Minimal (가장 작을 때)
                Image(systemName: "captions.bubble.fill")
                    .foregroundColor(.purple)
            }
        }
    }
}
```

### Phase 3: React Native 브릿지 (1일)

#### 3.1 LiveActivityManager 서비스 생성
```typescript
// src/services/liveActivityManager.ts
import LiveActivities from 'react-native-live-activities';

interface SubtitleActivityState {
  originalSubtitle: string;
  translatedSubtitle: string;
  isRecording: boolean;
  timestamp: Date;
}

class LiveActivityManager {
  private activityId: string | null = null;

  async start(): Promise<boolean> {
    try {
      // Live Activity 시작
      this.activityId = await LiveActivities.startActivity({
        appName: 'AllSub',
        originalSubtitle: '음성을 인식하고 있습니다...',
        translatedSubtitle: 'Listening...',
        isRecording: true,
        timestamp: new Date(),
      });
      
      console.log('Live Activity started:', this.activityId);
      return true;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      return false;
    }
  }

  async update(subtitle: string, translation: string): Promise<void> {
    if (!this.activityId) {
      console.warn('Live Activity not started');
      return;
    }

    try {
      await LiveActivities.updateActivity(this.activityId, {
        originalSubtitle: subtitle,
        translatedSubtitle: translation,
        isRecording: true,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.activityId) {
      return;
    }

    try {
      await LiveActivities.endActivity(this.activityId);
      console.log('Live Activity stopped');
      this.activityId = null;
    } catch (error) {
      console.error('Failed to stop Live Activity:', error);
    }
  }

  isActive(): boolean {
    return this.activityId !== null;
  }
}

export default new LiveActivityManager();
```

#### 3.2 SubtitleService 통합
```typescript
// src/services/subtitleService.ts에 추가
import LiveActivityManager from './liveActivityManager';

class SubtitleService {
  async start(...) {
    // 기존 코드...
    
    // Live Activity 시작 (iOS 16.1+)
    if (Platform.OS === 'ios') {
      const liveActivityStarted = await LiveActivityManager.start();
      if (liveActivityStarted) {
        console.log('Live Activity started');
      }
    }
  }
  
  private setupWebSocketCallbacks() {
    WebSocketService.onSubtitle((data: SubtitleData) => {
      this.currentSubtitle = data.original;
      this.currentTranslation = data.translated;
      
      // Live Activity 업데이트
      if (Platform.OS === 'ios' && LiveActivityManager.isActive()) {
        LiveActivityManager.update(data.original, data.translated);
      }
      
      this.onSubtitleUpdate?.(data.original, data.translated);
      this.updateState();
    });
  }
  
  async stop() {
    // 기존 코드...
    
    // Live Activity 종료
    if (Platform.OS === 'ios') {
      await LiveActivityManager.stop();
    }
  }
}
```

### Phase 4: UI 개선 (0.5일)

#### 4.1 설정 화면에 Live Activities 안내 추가
```typescript
// HomeScreen에 안내 추가
{Platform.OS === 'ios' && (
  <View style={styles.liveActivityNotice}>
    <Text style={styles.noticeText}>
      💡 YouTube Premium 백그라운드 재생 시{'\n'}
      Dynamic Island와 잠금 화면에서 자막을 확인할 수 있습니다!
    </Text>
  </View>
)}
```

### Phase 5: 테스트 (1일)

#### 5.1 테스트 시나리오
1. ✅ AllSub에서 자막 ON
2. ✅ Live Activity 시작 확인
3. ✅ YouTube Premium 백그라운드 재생
4. ✅ Dynamic Island에서 자막 확인 (iPhone 14 Pro+)
5. ✅ 잠금 화면에서 자막 확인
6. ✅ 다른 앱 사용하면서 자막 확인
7. ✅ 자막 실시간 업데이트 확인
8. ✅ AllSub 자막 OFF → Live Activity 종료 확인

## 📋 요구사항

### 1. 하드웨어/소프트웨어
- ✅ iOS 16.1 이상
- ✅ iPhone (Dynamic Island는 iPhone 14 Pro 이상)
- ✅ Xcode 14 이상
- ✅ macOS Ventura 이상

### 2. 개발 환경
- ✅ Expo SDK 51+ (Prebuild 지원)
- ✅ Swift 5.7+
- ✅ SwiftUI

### 3. 라이브러리
```bash
npm install react-native-live-activities
```

## ⚠️ 제한사항 및 고려사항

### 1. 오디오 캡처 제한
- iOS는 시스템 오디오 직접 캡처 불가
- 스피커에서 나오는 소리를 마이크로 녹음
- 이어폰 사용 시 자막 정확도 저하 가능

### 2. 배터리 소모
- 백그라운드 마이크 사용
- 지속적인 음성 인식
- 네트워크 통신
→ 사용자에게 배터리 소모 안내 필요

### 3. Live Activities 제한
- 최대 8시간 자동 종료
- 8시간 후 수동으로 재시작 필요

### 4. UI 제한
- Live Activities UI는 SwiftUI로만 작성
- Dynamic Island 크기/레이아웃 제한적
- 상호작용 제한적 (버튼 클릭만 가능)

## 📊 예상 일정

| 단계 | 작업 | 예상 시간 |
|-----|------|----------|
| Phase 1 | 네이티브 모듈 설정 | 1일 |
| Phase 2 | Swift Widget Extension | 2-3일 |
| Phase 3 | React Native 브릿지 | 1일 |
| Phase 4 | UI 개선 | 0.5일 |
| Phase 5 | 테스트 | 1일 |
| **합계** | | **5.5-6.5일** |

## 🎯 성공 지표

1. ✅ YouTube Premium 백그라운드 재생 중 자막 표시
2. ✅ Dynamic Island에서 실시간 자막 업데이트 (iPhone 14 Pro+)
3. ✅ 잠금 화면에서 자막 확인 가능
4. ✅ 다른 앱 사용 중에도 자막 표시
5. ✅ 자막 지연 시간 < 3초
6. ✅ 배터리 소모 < 10%/시간

## 🚀 다음 단계

구현을 시작하시겠습니까?

1. **지금 바로 시작** → Phase 1부터 단계별 구현
2. **나중에 구현** → 문서로 저장해두고 추후 진행
3. **Android 먼저** → Android 플로팅 버튼 구현 후 iOS Live Activities

결정해주시면 바로 진행하겠습니다!

