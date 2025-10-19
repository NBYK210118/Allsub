# Android System Overlay 구현 가이드

## ⚠️ 중요 사항

Android System Overlay는 **Expo Go에서 작동하지 않습니다**. 
**Development Build** 또는 **Production Build**가 필요합니다.

## 🛠 구현 방법

### Option 1: Expo Config Plugin 사용 (권장)

#### 1. 필요한 패키지 설치
```bash
npx expo install expo-dev-client
npx expo install react-native-system-overlay
```

#### 2. app.json 수정
```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true
          }
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.FOREGROUND_SERVICE"
      ]
    }
  }
}
```

#### 3. Prebuild 실행
```bash
npx expo prebuild --platform android
```

#### 4. Development Build 생성
```bash
npx expo run:android
```

---

### Option 2: 네이티브 모듈 직접 작성

#### 파일 구조
```
android/
├── app/
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/allsubmobile/
│           │       ├── FloatingButtonModule.java
│           │       └── FloatingButtonService.java
│           └── AndroidManifest.xml
```

#### FloatingButtonService.java
```java
package com.allsubmobile;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;

public class FloatingButtonService extends Service {
    private WindowManager windowManager;
    private View floatingButton;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        // 플로팅 버튼 레이아웃 생성
        floatingButton = LayoutInflater.from(this).inflate(R.layout.floating_button, null);

        // 윈도우 매니저 파라미터 설정
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.START | Gravity.CENTER_VERTICAL;
        params.x = 0;
        params.y = 0;

        // 버튼 클릭 리스너
        floatingButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // 자막 오버레이 표시
                showSubtitleOverlay();
            }
        });

        windowManager.addView(floatingButton, params);
    }

    private void showSubtitleOverlay() {
        // TODO: 자막 오버레이 표시 로직
        Intent intent = new Intent(this, SubtitleOverlayActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingButton != null) {
            windowManager.removeView(floatingButton);
        }
    }
}
```

---

## 📱 테스트 방법

### 1. 권한 요청
앱 최초 실행 시 "다른 앱 위에 그리기" 권한 요청

### 2. 서비스 시작
```javascript
import { NativeModules } from 'react-native';
const { FloatingButtonModule } = NativeModules;

// 플로팅 버튼 시작
FloatingButtonModule.startFloatingButton();

// 플로팅 버튼 중지
FloatingButtonModule.stopFloatingButton();
```

### 3. 실제 디바이스에서 테스트
```bash
# USB 디버깅 연결
adb devices

# 앱 실행
npx expo run:android

# 다른 앱(YouTube 등)을 열어서 플로팅 버튼 확인
```

---

## 🎨 UI 커스터마이징

### res/layout/floating_button.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content">

    <ImageView
        android:id="@+id/floating_icon"
        android:layout_width="60dp"
        android:layout_height="60dp"
        android:src="@drawable/arrow_icon"
        android:background="@drawable/floating_button_bg"
        android:padding="12dp"
        android:elevation="8dp" />
</FrameLayout>
```

### res/drawable/floating_button_bg.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#8B5CF6" />
    <stroke
        android:width="2dp"
        android:color="#FFFFFF" />
</shape>
```

---

## 🔐 권한 처리

### AndroidManifest.xml
```xml
<manifest>
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application>
        <service
            android:name=".FloatingButtonService"
            android:enabled="true"
            android:exported="false" />
    </application>
</manifest>
```

### JavaScript에서 권한 확인
```javascript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestOverlayPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
    );
    
    if (!granted) {
      // 설정 화면으로 이동
      const { Settings } = require('react-native');
      Settings.openSettings();
    }
  }
}
```

---

## 📊 제약 사항

1. **Android 6.0 (API 23) 이상** 필요
2. **배터리 최적화** 예외 설정 필요 (백그라운드 실행을 위해)
3. **일부 제조사** (Xiaomi, Huawei 등)는 추가 권한 필요
4. **Expo Go 불가** - Development Build 필수

---

## 🐛 디버깅

### 로그 확인
```bash
# Android 로그 실시간 확인
adb logcat *:E

# AllSub 앱 로그만 필터링
adb logcat | grep -i allsub
```

### 권한 확인
```bash
# 앱 권한 상태 확인
adb shell dumpsys package com.allsubmobile | grep permission
```

---

## 📚 참고 자료

- [Android WindowManager 공식 문서](https://developer.android.com/reference/android/view/WindowManager)
- [SYSTEM_ALERT_WINDOW 권한](https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW)
- [Expo Custom Native Code](https://docs.expo.dev/workflow/customizing/)

