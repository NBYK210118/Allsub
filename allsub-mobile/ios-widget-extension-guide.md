# iOS Widget Extension 수동 생성 가이드

## ⚠️ 중요: 아래 단계는 Xcode에서 수행해야 합니다

`npx expo prebuild` 실행 후, Xcode에서 다음 단계를 따라하세요.

---

## 1. Widget Extension 생성

### 1.1 Xcode에서 프로젝트 열기
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-mobile
npx expo prebuild --platform ios
open ios/allsubmobile.xcworkspace
```

### 1.2 Widget Extension Target 추가
1. Xcode에서 File → New → Target
2. "Widget Extension" 선택
3. Product Name: `AllSubWidget`
4. Include Live Activity: ✅ **체크**
5. Finish 클릭

---

## 2. AllSubActivityAttributes.swift 생성

Widget Extension이 생성되면 자동으로 생성된 파일들을 수정합니다.

### 2.1 AllSubActivityAttributes.swift 파일 생성 (또는 수정)

```swift
import ActivityKit
import Foundation

struct AllSubActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // 실시간으로 업데이트되는 데이터
        var originalSubtitle: String
        var translatedSubtitle: String
        var isRecording: Bool
    }
    
    // 고정 데이터 (Activity 시작 시에만 설정)
    var appName: String
}
```

---

## 3. AllSubLiveActivity.swift 수정

자동 생성된 Live Activity 파일을 수정합니다.

```swift
import ActivityKit
import WidgetKit
import SwiftUI

struct AllSubLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AllSubActivityAttributes.self) { context in
            // 잠금 화면 UI
            VStack(alignment: .leading, spacing: 12) {
                // 헤더
                HStack {
                    Image(systemName: "captions.bubble.fill")
                        .font(.system(size: 18))
                        .foregroundColor(.purple)
                    
                    Text(context.attributes.appName)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    // LIVE 표시
                    if context.state.isRecording {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 8, height: 8)
                            Text("LIVE")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                
                Divider()
                
                // 원본 자막 (한국어)
                if !context.state.originalSubtitle.isEmpty {
                    HStack(alignment: .top, spacing: 8) {
                        Text("🇰🇷")
                            .font(.system(size: 20))
                        Text(context.state.originalSubtitle)
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                            .lineLimit(3)
                    }
                }
                
                // 번역 자막 (영어)
                if !context.state.translatedSubtitle.isEmpty {
                    HStack(alignment: .top, spacing: 8) {
                        Text("🇺🇸")
                            .font(.system(size: 20))
                        Text(context.state.translatedSubtitle)
                            .font(.callout)
                            .foregroundColor(.secondary)
                            .italic()
                            .lineLimit(3)
                    }
                }
                
                // 플레이스홀더
                if context.state.originalSubtitle.isEmpty && 
                   context.state.translatedSubtitle.isEmpty {
                    Text("음성을 인식하고 있습니다...")
                        .font(.callout)
                        .foregroundColor(.secondary)
                        .italic()
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 8)
                }
            }
            .padding(16)
            .activityBackgroundTint(Color(white: 0.95))
            .activitySystemActionForegroundColor(Color.purple)
            
        } dynamicIsland: { context in
            // Dynamic Island UI (iPhone 14 Pro+)
            DynamicIsland {
                // Expanded (확장된 상태)
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: "captions.bubble.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.purple)
                        Text("AllSub")
                            .font(.caption)
                            .fontWeight(.medium)
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
                                .fontWeight(.bold)
                        }
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 8) {
                        // 원본 자막
                        if !context.state.originalSubtitle.isEmpty {
                            HStack(alignment: .top, spacing: 4) {
                                Text("🇰🇷")
                                    .font(.system(size: 16))
                                Text(context.state.originalSubtitle)
                                    .font(.caption)
                                    .lineLimit(2)
                            }
                        }
                        
                        // 번역 자막
                        if !context.state.translatedSubtitle.isEmpty {
                            HStack(alignment: .top, spacing: 4) {
                                Text("🇺🇸")
                                    .font(.system(size: 16))
                                Text(context.state.translatedSubtitle)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    // 하단 영역 (선택 사항)
                    EmptyView()
                }
                
            } compactLeading: {
                // Compact Leading (압축 상태 - 왼쪽)
                Image(systemName: "captions.bubble.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.purple)
                
            } compactTrailing: {
                // Compact Trailing (압축 상태 - 오른쪽)
                if context.state.isRecording {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 8, height: 8)
                }
                
            } minimal: {
                // Minimal (최소 상태)
                Image(systemName: "captions.bubble.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.purple)
            }
        }
    }
}

// 프리뷰 (Xcode에서 미리보기용)
#Preview("Live Activity", as: .content, using: AllSubActivityAttributes.preview) {
   AllSubLiveActivity()
} contentStates: {
    AllSubActivityAttributes.ContentState.sampleData
}

extension AllSubActivityAttributes {
    fileprivate static var preview: AllSubActivityAttributes {
        AllSubActivityAttributes(appName: "AllSub")
    }
}

extension AllSubActivityAttributes.ContentState {
    fileprivate static var sampleData: AllSubActivityAttributes.ContentState {
         AllSubActivityAttributes.ContentState(
            originalSubtitle: "안녕하세요, 오늘 날씨가 정말 좋네요!",
            translatedSubtitle: "Hello, the weather is really nice today!",
            isRecording: true
        )
    }
}
```

---

## 4. Info.plist 설정

Widget Extension의 Info.plist에 다음 추가:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

메인 앱의 Info.plist에도 동일하게 추가.

---

## 5. App Groups 설정 (선택 사항)

Widget과 메인 앱 간 데이터 공유가 필요한 경우:

1. Signing & Capabilities 탭
2. "+ Capability" 클릭
3. "App Groups" 추가
4. Group ID 생성: `group.com.anonymous.allsubmobile`
5. 메인 앱과 Widget 모두에 동일한 Group ID 추가

---

## 6. 빌드 및 실행

### 6.1 Scheme 설정
1. Xcode 상단의 Scheme 선택 (Product → Scheme)
2. "allsubmobile" 선택 (Widget이 아님)

### 6.2 빌드
```
Command + B
```

### 6.3 실행
```
Command + R
```

또는 터미널에서:
```bash
npx expo run:ios
```

---

## 7. 테스트 방법

### 7.1 앱에서 자막 ON
1. AllSub 앱 열기
2. Toggle 버튼을 위로 (ON)
3. "Live Activities 활성화됨" 메시지 확인

### 7.2 잠금 화면 확인
1. 홈 버튼 또는 제스처로 홈 화면으로
2. 잠금 화면에 AllSub Live Activity 표시 확인
3. 실시간 자막 업데이트 확인

### 7.3 Dynamic Island 확인 (iPhone 14 Pro+)
1. 다른 앱 실행
2. 화면 상단 Dynamic Island 확인
3. Dynamic Island 탭하여 확장 상태 확인

### 7.4 YouTube Premium 테스트
1. YouTube Premium 앱 실행
2. 영상 재생 → 백그라운드로 전환
3. 홈 화면 또는 다른 앱 사용
4. 잠금 화면/Dynamic Island에서 실시간 자막 확인

---

## 8. 트러블슈팅

### 문제: Live Activity가 표시되지 않음
**해결:**
1. iOS 16.1 이상인지 확인
2. 설정 → Face ID 및 암호 → Live Activities 활성화 확인
3. 앱 재빌드 및 재설치

### 문제: Dynamic Island에 표시되지 않음
**해결:**
1. iPhone 14 Pro 이상인지 확인
2. 시뮬레이터는 iPhone 14 Pro 선택
3. Dynamic Island 설정 확인

### 문제: 빌드 에러
**해결:**
1. Clean Build Folder (Command + Shift + K)
2. Derived Data 삭제
3. Pods 재설치:
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

---

## 9. 다음 단계

✅ Widget Extension 생성 완료
✅ Swift UI 구현 완료
✅ Live Activities 테스트 완료

이제 다음을 즐기세요:
- 🏃‍♂️ 운동하면서 YouTube 듣기 + 자막 확인
- 🚇 출퇴근하면서 팟캐스트 + 자막 확인
- 🧹 집안일하면서 YouTube + 자막 확인

---

## 📚 참고 자료

- [Apple ActivityKit 공식 문서](https://developer.apple.com/documentation/activitykit)
- [WidgetKit 가이드](https://developer.apple.com/documentation/widgetkit)
- [Live Activities 튜토리얼](https://developer.apple.com/videos/play/wwdc2022/10184/)

---

## 🎉 완성!

YouTube Premium 사용자를 위한 최고의 자막 경험을 만들었습니다!

궁금한 점이 있으면 언제든지 문의하세요. 🚀

