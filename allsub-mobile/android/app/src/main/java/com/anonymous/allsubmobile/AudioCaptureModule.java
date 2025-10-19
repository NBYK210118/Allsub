package com.anonymous.allsubmobile;

import android.app.Activity;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AudioCaptureModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String TAG = "AudioCaptureModule";
    private static final int REQUEST_CODE = 1001;
    
    private Promise startPromise;
    private String serverUrl;
    private int serverPort;

    public AudioCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "AudioCaptureModule";
    }

    @ReactMethod
    public void isSupported(Promise promise) {
        // Android 10 (API 29) 이상에서만 지원
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;
        promise.resolve(supported);
    }

    @ReactMethod
    public void requestPermissionAndStart(String url, int port, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.reject("NOT_SUPPORTED", "Android 10 or higher required");
            return;
        }

        this.serverUrl = url;
        this.serverPort = port;
        this.startPromise = promise;

        Log.d(TAG, "Requesting MediaProjection permission");

        MediaProjectionManager projectionManager = 
            (MediaProjectionManager) activity.getSystemService(Activity.MEDIA_PROJECTION_SERVICE);
        
        if (projectionManager == null) {
            promise.reject("NO_SERVICE", "MediaProjection service not available");
            return;
        }

        Intent captureIntent = projectionManager.createScreenCaptureIntent();
        activity.startActivityForResult(captureIntent, REQUEST_CODE);
    }

    @ReactMethod
    public void stop(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, AudioCaptureService.class);
            context.stopService(serviceIntent);
            Log.d(TAG, "Service stop requested");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping service", e);
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null && startPromise != null) {
                Log.d(TAG, "MediaProjection permission granted");
                
                try {
                    // 서비스 시작
                    Intent serviceIntent = new Intent(getReactApplicationContext(), AudioCaptureService.class);
                    serviceIntent.putExtra("resultCode", resultCode);
                    serviceIntent.putExtra("data", data);
                    serviceIntent.putExtra("serverUrl", serverUrl);
                    serviceIntent.putExtra("serverPort", serverPort);
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        getReactApplicationContext().startForegroundService(serviceIntent);
                    } else {
                        getReactApplicationContext().startService(serviceIntent);
                    }
                    
                    Log.d(TAG, "Service started");
                    startPromise.resolve(true);
                } catch (Exception e) {
                    Log.e(TAG, "Error starting service", e);
                    startPromise.reject("START_ERROR", e.getMessage());
                }
            } else {
                Log.d(TAG, "MediaProjection permission denied");
                if (startPromise != null) {
                    startPromise.reject("PERMISSION_DENIED", "User denied permission");
                }
            }
            startPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not used
    }
}

