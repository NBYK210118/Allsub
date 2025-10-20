# Live Activities 빠른 시작 가이드

## 🎉 React Native 코드는 완료되었습니다!

이제 Xcode에서 Widget Extension만 추가하면 됩니다.

---

## 📝 1단계: Xcode 열기

터미널에서 실행:
```bash
cd /Users/ieunho/Downloads/Allsub/allsub-mobile
open ios/allsubmobile.xcworkspace
```

**⚠️ 주의:** `.xcworkspace` 파일을 열어야 합니다 (`.xcodeproj` 아님!)

---

## 🔧 2단계: Widget Extension Target 추가

### 2.1 New Target 생성
1. Xcode 메뉴: `File` → `New` → `Target...`
2. 검색창에 "widget" 입력
3. **"Widget Extension"** 선택
4. `Next` 클릭

### 2.2 설정
- **Product Name:** `AllSubWidget`
- **Include Configuration Intent:** ❌ 체크 해제
- **Include Live Activity:** ✅ **체크 필수!**
- **Team:** 본인 계정 선택
- **Language:** Swift
- **Finish** 클릭

### 2.3 Activate Scheme?
- "Activate 'AllSubWidget' scheme?" 팝업이 뜨면 **"Activate"** 클릭

---

## 📝 3단계: Swift 파일 수정

Xcode 왼쪽 네비게이터에서 `AllSubWidget` 폴더를 찾으세요.

### 3.1 AllSubWidgetLiveActivity.swift 파일 전체 교체

기존 내용을 모두 지우고 아래 코드로 교체:

```swift
import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes
struct AllSubActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var originalSubtitle: String
        var translatedSubtitle: String
        var isRecording: Bool
    }
    
    var appName: String
}

// MARK: - Live Activity Widget
struct AllSubWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AllSubActivityAttributes.self) { context in
            // 잠금 화면 UI
            LockScreenLiveActivityView(context: context)
            
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
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
                        if !context.state.originalSubtitle.isEmpty {
                            HStack(alignment: .top, spacing: 4) {
                                Text("🇰🇷")
                                Text(context.state.originalSubtitle)
                                    .font(.caption)
                                    .lineLimit(2)
                            }
                        }
                        
                        if !context.state.translatedSubtitle.isEmpty {
                            HStack(alignment: .top, spacing: 4) {
                                Text("🇺🇸")
                                Text(context.state.translatedSubtitle)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                
            } compactLeading: {
                Image(systemName: "captions.bubble.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.purple)
                
            } compactTrailing: {
                if context.state.isRecording {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 8, height: 8)
                }
                
            } minimal: {
                Image(systemName: "captions.bubble.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.purple)
            }
        }
    }
}

// MARK: - Lock Screen View
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<AllSubActivityAttributes>
    
    var body: some View {
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
            
            // 자막 내용
            if !context.state.originalSubtitle.isEmpty || 
               !context.state.translatedSubtitle.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
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
                }
            } else {
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
    }
}
```

**저장:** `Command + S`

---

## 🔨 4단계: 빌드 및 실행

### 4.1 Scheme 선택
- Xcode 상단 중앙의 Scheme 선택기 클릭
- **"allsubmobile"** 선택 (AllSubWidget이 아님!)
- 시뮬레이터: **iPhone 14 Pro** 이상 권장 (Dynamic Island 테스트용)

### 4.2 빌드
- `Command + B` 또는
- Product → Build

### 4.3 실행
- `Command + R` 또는
- Play 버튼 (▶️) 클릭

---

## 5단계: 테스트

### 테스트 1: 기본 동작 확인
1. 앱이 시뮬레이터에서 실행됨
2. Toggle 버튼을 위로 (ON)
3. **"Live Activities 활성화됨"** 안내 메시지 확인
4. 콘솔에 "Live Activity 시작됨!" 로그 확인

### 테스트 2: 잠금 화면 확인
1. `Command + L` (시뮬레이터 잠금)
2. 잠금 화면에 AllSub Live Activity 위젯 표시 확인
3. 자막 내용이 실시간으로 업데이트되는지 확인

### 테스트 3: Dynamic Island 확인 (iPhone 14 Pro+)
1. 다른 앱으로 전환 (Safari 등)
2. 화면 상단 Dynamic Island 확인
3. Dynamic Island를 길게 탭하여 확장 상태 확인  

### 테스트 4: YouTube Premium 시나리오
1. YouTube Premium 앱 실행 (또는 Safari)
2. 영상 재생
3. 백그라운드로 전환 (홈 버튼)
4. 잠금 화면에서 실시간 자막 확인

---

## 🎉 완료!

이제 다음이 가능합니다:
- ✅ 앱 내 플로팅 버튼으로 자막 확인
- ✅ 잠금 화면에서 실시간 자막 확인
- ✅ Dynamic Island에서 자막 확인
- ✅ YouTube Premium 백그라운드 재생 중 자막 확인

---

## 🔧 트러블슈팅

### 문제: "Live Activity 시작 실패" 로그
**원인:** iOS 16.1 미만 또는 Live Activities 비활성화

**해결:**
1. 시뮬레이터: iOS 16.1 이상 선택
2. 실제 기기: 설정 → Face ID 및 암호 → Live Activities 활성화

### 문제: Dynamic Island에 표시 안 됨
**원인:** iPhone 14 Pro 미만 기기

**해결:**
- 시뮬레이터에서 iPhone 14 Pro 이상 선택
- 실제 기기는 iPhone 14 Pro 이상 필요

### 문제: 빌드 에러
**해결:**
1. Clean Build Folder: `Command + Shift + K`
2. Derived Data 삭제:
   - Xcode → Preferences → Locations
   - Derived Data 경로 옆 화살표 클릭
   - DerivedData 폴더 전체 삭제
3. 재빌드

---

## 📚 다음으로 할 일

### 선택 1: Android 플로팅 버튼 구현
Android에서는 진짜 시스템 오버레이가 가능합니다!
- 다른 앱 위에 플로팅 버튼
- 이미 코드 준비됨

### 선택 2: UI 개선
- 자막 스타일 커스터마이징
- 다양한 언어 지원
- 자막 히스토리 저장

---

**궁금한 점이 있으면 언제든 문의하세요!** 🚀

