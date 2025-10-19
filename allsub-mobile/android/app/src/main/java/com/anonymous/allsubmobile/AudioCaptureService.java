package com.anonymous.allsubmobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

public class AudioCaptureService extends Service {
    private static final String TAG = "AudioCaptureService";
    private static final String CHANNEL_ID = "AudioCaptureChannel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int SAMPLE_RATE = 16000;
    private static final int BUFFER_SIZE = 2048;
    
    private AudioRecord audioRecord;
    private Thread captureThread;
    private boolean isCapturing = false;
    private MediaProjection mediaProjection;
    
    private String serverUrl;
    private int serverPort;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        createNotificationChannel();
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            Log.e(TAG, "Intent is null");
            stopSelf();
            return START_NOT_STICKY;
        }

        int resultCode = intent.getIntExtra("resultCode", -1);
        Intent data = intent.getParcelableExtra("data");
        serverUrl = intent.getStringExtra("serverUrl");
        serverPort = intent.getIntExtra("serverPort", 3000);

        Log.d(TAG, "Starting service with server: " + serverUrl + ":" + serverPort);

        if (resultCode == -1 || data == null) {
            Log.e(TAG, "Invalid MediaProjection data");
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

        if (mediaProjection == null) {
            Log.e(TAG, "Failed to create MediaProjection");
            stopSelf();
            return START_NOT_STICKY;
        }

        // 오디오 캡처 시작
        startAudioCapture();

        return START_STICKY;
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void startAudioCapture() {
        try {
            Log.d(TAG, "Starting audio capture");

            // AudioPlaybackCaptureConfiguration 생성
            AudioPlaybackCaptureConfiguration config = 
                new AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
                    .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                    .addMatchingUsage(AudioAttributes.USAGE_GAME)
                    .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
                    .build();

            // AudioFormat 설정
            AudioFormat audioFormat = new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                .build();

            int minBufferSize = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            );

            int bufferSize = Math.max(minBufferSize, BUFFER_SIZE);

            // AudioPlaybackCapture를 사용한 AudioRecord 생성
            audioRecord = new AudioRecord.Builder()
                .setAudioFormat(audioFormat)
                .setBufferSizeInBytes(bufferSize * 2)
                .setAudioPlaybackCaptureConfig(config)
                .build();

            if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord not initialized");
                return;
            }

            audioRecord.startRecording();
            isCapturing = true;
            Log.d(TAG, "AudioRecord started");

            // 별도 스레드에서 오디오 캡처
            captureThread = new Thread(this::captureAndSendAudio);
            captureThread.start();

        } catch (Exception e) {
            Log.e(TAG, "Error starting audio capture", e);
        }
    }

    private void captureAndSendAudio() {
        byte[] buffer = new byte[BUFFER_SIZE];
        Socket socket = null;
        OutputStream outputStream = null;
        int failedAttempts = 0;
        final int MAX_FAILED_ATTEMPTS = 3;

        Log.d(TAG, "Capture thread started");

        try {
            // 백엔드 서버에 소켓 연결 (재시도 로직 포함)
            while (failedAttempts < MAX_FAILED_ATTEMPTS && socket == null) {
                try {
                    Log.d(TAG, "Attempting to connect to " + serverUrl + ":" + serverPort);
                    socket = new Socket(serverUrl, serverPort);
                    outputStream = socket.getOutputStream();
                    Log.d(TAG, "Connected to server");
                } catch (IOException e) {
                    failedAttempts++;
                    Log.e(TAG, "Connection attempt " + failedAttempts + " failed", e);
                    if (failedAttempts < MAX_FAILED_ATTEMPTS) {
                        Thread.sleep(1000); // 1초 대기 후 재시도
                    }
                }
            }

            if (socket == null || outputStream == null) {
                Log.e(TAG, "Failed to connect after " + MAX_FAILED_ATTEMPTS + " attempts");
                return;
            }

            long lastLogTime = System.currentTimeMillis();
            int totalBytesSent = 0;

            while (isCapturing && audioRecord != null) {
                int bytesRead = audioRecord.read(buffer, 0, buffer.length);
                
                if (bytesRead > 0) {
                    try {
                        // Base64로 인코딩하여 전송 (WebSocket과 호환)
                        String base64Audio = Base64.encodeToString(buffer, 0, bytesRead, Base64.NO_WRAP);
                        outputStream.write(base64Audio.getBytes());
                        outputStream.write('\n'); // 구분자
                        outputStream.flush();
                        
                        totalBytesSent += bytesRead;

                        // 1초마다 로그
                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastLogTime >= 1000) {
                            Log.d(TAG, "Sent " + totalBytesSent + " bytes");
                            lastLogTime = currentTime;
                            totalBytesSent = 0;
                        }
                    } catch (IOException e) {
                        Log.e(TAG, "Error sending audio data", e);
                        break;
                    }
                } else if (bytesRead < 0) {
                    Log.e(TAG, "AudioRecord read error: " + bytesRead);
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in capture thread", e);
        } finally {
            try {
                if (outputStream != null) outputStream.close();
                if (socket != null) socket.close();
                Log.d(TAG, "Socket closed");
            } catch (IOException e) {
                Log.e(TAG, "Error closing socket", e);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        
        isCapturing = false;

        if (audioRecord != null) {
            try {
                audioRecord.stop();
                audioRecord.release();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping AudioRecord", e);
            }
            audioRecord = null;
        }

        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }

        if (captureThread != null) {
            try {
                captureThread.join(1000);
            } catch (InterruptedException e) {
                Log.e(TAG, "Error joining capture thread", e);
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
                "AllSub Audio Capture",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("실시간 자막 제공 중");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AllSub")
            .setContentText("실시간 자막 제공 중...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }
}

