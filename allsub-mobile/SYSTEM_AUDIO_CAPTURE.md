# 시스템 오디오 캡처 구현 가이드

## 🎯 목표
YouTube, Instagram 등 **모바일에서 재생되는 모든 오디오**를 캡처하여 백엔드로 전송

---

## 🤖 Android 구현 (AudioPlaybackCapture)

### ✅ 가능한 이유
Android 10 (API 29)부터 `AudioPlaybackCapture` API 지원
- 다른 앱의 재생 오디오 캡처 가능
- 시스템 전체 오디오 믹싱

### 📋 요구사항
- Android 10 (API 29) 이상
- `MediaProjection` 권한
- Foreground Service

---

## 🛠 Android 네이티브 모듈 구현

### 1. 권한 설정

#### AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 기존 권한 -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    
    <!-- Android 14+ 필요 -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application>
        <!-- Foreground Service -->
        <service
            android:name=".AudioCaptureService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaProjection" />
    </application>
</manifest>
```

---

### 2. AudioCaptureService.java

```java
package com.allsubmobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

public class AudioCaptureService extends Service {
    private static final String CHANNEL_ID = "AudioCaptureChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private AudioRecord audioRecord;
    private Thread captureThread;
    private boolean isCapturing = false;
    
    private MediaProjection mediaProjection;
    private String serverUrl;
    private int serverPort;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // MediaProjection 데이터 가져오기
        int resultCode = intent.getIntExtra("resultCode", -1);
        Intent data = intent.getParcelableExtra("data");
        serverUrl = intent.getStringExtra("serverUrl");
        serverPort = intent.getIntExtra("serverPort", 3000);

        if (resultCode == -1 || data == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        // Foreground Service 시작
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);

        // MediaProjection 획득
        MediaProjectionManager projectionManager = 
            (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
        mediaProjection = projectionManager.getMediaProjection(resultCode, data);

        // 오디오 캡처 시작
        startAudioCapture();

        return START_STICKY;
    }

    private void startAudioCapture() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // Android 10 미만은 지원하지 않음
            return;
        }

        try {
            // AudioPlaybackCaptureConfiguration 생성
            AudioPlaybackCaptureConfiguration config = 
                new AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
                    .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                    .addMatchingUsage(AudioAttributes.USAGE_GAME)
                    .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
                    .build();

            // AudioRecord 설정
            AudioFormat audioFormat = new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(16000)
                .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                .build();

            int bufferSize = AudioRecord.getMinBufferSize(
                16000,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            );

            // AudioPlaybackCapture를 사용한 AudioRecord 생성
            audioRecord = new AudioRecord.Builder()
                .setAudioFormat(audioFormat)
                .setBufferSizeInBytes(bufferSize)
                .setAudioPlaybackCaptureConfig(config)
                .build();

            audioRecord.startRecording();
            isCapturing = true;

            // 별도 스레드에서 오디오 캡처
            captureThread = new Thread(this::captureAndSendAudio);
            captureThread.start();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void captureAndSendAudio() {
        byte[] buffer = new byte[1024];
        Socket socket = null;
        OutputStream outputStream = null;

        try {
            // 백엔드 서버에 소켓 연결
            socket = new Socket(serverUrl, serverPort);
            outputStream = socket.getOutputStream();

            while (isCapturing && audioRecord != null) {
                int bytesRead = audioRecord.read(buffer, 0, buffer.length);
                
                if (bytesRead > 0) {
                    // 오디오 데이터를 서버로 전송
                    outputStream.write(buffer, 0, bytesRead);
                    outputStream.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (outputStream != null) outputStream.close();
                if (socket != null) socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isCapturing = false;

        if (audioRecord != null) {
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }

        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }

        if (captureThread != null) {
            try {
                captureThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Audio Capture Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AllSub")
            .setContentText("실시간 자막 제공 중...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
}
```

---

### 3. AudioCaptureModule.java (React Native Bridge)

```java
package com.allsubmobile;

import android.app.Activity;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AudioCaptureModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int REQUEST_CODE = 1001;
    private Promise startPromise;

    public AudioCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "AudioCaptureModule";
    }

    @ReactMethod
    public void requestPermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available");
            return;
        }

        startPromise = promise;

        MediaProjectionManager projectionManager = 
            (MediaProjectionManager) activity.getSystemService(Activity.MEDIA_PROJECTION_SERVICE);
        
        Intent captureIntent = projectionManager.createScreenCaptureIntent();
        activity.startActivityForResult(captureIntent, REQUEST_CODE);
    }

    @ReactMethod
    public void startCapture(String serverUrl, int serverPort, Promise promise) {
        // 권한이 승인된 후 서비스 시작
        // (onActivityResult에서 처리)
        promise.resolve(true);
    }

    @ReactMethod
    public void stopCapture(Promise promise) {
        ReactApplicationContext context = getReactApplicationContext();
        Intent serviceIntent = new Intent(context, AudioCaptureService.class);
        context.stopService(serviceIntent);
        promise.resolve(true);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && startPromise != null) {
                // 권한 승인됨 - 서비스 시작
                Intent serviceIntent = new Intent(getReactApplicationContext(), AudioCaptureService.class);
                serviceIntent.putExtra("resultCode", resultCode);
                serviceIntent.putExtra("data", data);
                serviceIntent.putExtra("serverUrl", "192.168.1.100"); // 서버 IP
                serviceIntent.putExtra("serverPort", 3000);
                
                getReactApplicationContext().startService(serviceIntent);
                startPromise.resolve(true);
            } else if (startPromise != null) {
                startPromise.reject("PERMISSION_DENIED", "User denied permission");
            }
            startPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not used
    }
}
```

---

### 4. JavaScript/TypeScript 연동

#### systemAudioService.ts
```typescript
import { NativeModules, Platform } from 'react-native';

const { AudioCaptureModule } = NativeModules;

class SystemAudioService {
  private isCapturing = false;

  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('System audio capture only available on Android 10+');
      return false;
    }

    try {
      await AudioCaptureModule.requestPermission();
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startCapture(serverUrl: string, serverPort: number): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      await AudioCaptureModule.startCapture(serverUrl, serverPort);
      this.isCapturing = true;
      console.log('System audio capture started');
      return true;
    } catch (error) {
      console.error('Failed to start capture:', error);
      return false;
    }
  }

  async stopCapture(): Promise<void> {
    if (Platform.OS !== 'android' || !this.isCapturing) {
      return;
    }

    try {
      await AudioCaptureModule.stopCapture();
      this.isCapturing = false;
      console.log('System audio capture stopped');
    } catch (error) {
      console.error('Failed to stop capture:', error);
    }
  }

  getIsCapturing(): boolean {
    return this.isCapturing;
  }
}

export default new SystemAudioService();
```

---

## 🍎 iOS 구현 (불가능 → 대안)

### ❌ 시스템 오디오 직접 캡처: **불가능**
iOS는 보안상 다른 앱의 오디오를 캡처할 수 없습니다.

### ✅ 대안 방법

#### 방법 1: ReplayKit의 Audio App Extension (제한적)
- 화면 녹화와 함께 오디오 캡처
- 사용자가 명시적으로 시작해야 함
- 백그라운드 제약 많음

#### 방법 2: 앱 내 브라우저 (권장)
```
AllSub 앱 내에서:
- WKWebView로 YouTube, Instagram 등 재생
- JavaScript로 오디오 스트림 추출
- 백엔드로 전송
```

#### 방법 3: AirPlay Audio Routing
- AirPlay를 통한 오디오 라우팅
- 제한적이고 복잡함

---

## 🎯 권장 구현 방식

### **크로스 플랫폼 전략**

```
Android: AudioPlaybackCapture ✅
  → 시스템 오디오 직접 캡처
  → 모든 앱의 오디오 가능

iOS: 앱 내 브라우저 ⚠️
  → AllSub 내에서 콘텐츠 재생
  → 오디오 스트림 추출
```

---

## 📱 사용자 플로우

### Android
```
1. AllSub 앱 실행
2. 토글 ON
3. "화면 캡처 시작" 권한 승인
4. YouTube 앱으로 이동
5. 영상 재생
6. AllSub이 자동으로 오디오 캡처
7. 실시간 자막 표시
```

### iOS
```
1. AllSub 앱 실행
2. 토글 ON
3. 앱 내 브라우저로 YouTube 접속
4. 영상 재생
5. AllSub이 오디오 캡처
6. 실시간 자막 표시
```

---

## 🔧 백엔드 수정 (오디오 스트림 수신)

### 기존: Base64 청크
```typescript
socket.emit('audio-chunk', {
  audio: base64String,
  encoding: 'base64'
});
```

### 신규: Raw 바이너리 스트림
```typescript
// TCP Socket으로 직접 전송
const socket = new net.Socket();
socket.connect(3001, 'server-ip');
socket.write(audioBuffer);
```

---

## ⚡ 성능 최적화

### 샘플레이트
```
16000 Hz (권장) - Speech recognition에 최적
44100 Hz - 고품질 (불필요하게 무거움)
```

### 버퍼 크기
```
1024 bytes - 낮은 지연
2048 bytes - 균형
4096 bytes - 안정성
```

---

## 🐛 문제 해결

### Android 10 미만에서는?
```
마이크 입력으로 폴백
또는 "Android 10+ 필요" 메시지 표시
```

### 특정 앱에서 캡처 안 됨
```
일부 앱(Netflix, Disney+ 등)은 
AUDIO_FLAG_CONTENT_PROTECTED 플래그로 보호됨
→ 캡처 불가능
```

### iOS에서 완전 자동화는?
```
불가능합니다.
사용자가 AllSub 앱 내에서 콘텐츠를 재생해야 합니다.
```

---

## 📊 비교표

| 기능 | Android | iOS |
|------|---------|-----|
| 시스템 오디오 캡처 | ✅ 가능 (Android 10+) | ❌ 불가능 |
| 다른 앱 위에서 작동 | ✅ 가능 | ❌ 불가능 |
| 백그라운드 실행 | ✅ 가능 | ⚠️ 제한적 |
| 권한 요청 | 1회 (화면 캡처) | N/A |
| 구현 난이도 | 중간 | 높음 |

---

## 🚀 다음 단계

1. ✅ Android AudioPlaybackCapture 구현
2. ✅ 백엔드에 바이너리 스트림 수신 추가
3. ⚠️ iOS 앱 내 브라우저 구현 (선택)
4. ✅ 테스트 및 최적화

---

이 가이드를 따라하면 **실제 시스템 오디오**를 캡처할 수 있습니다! 🎉

