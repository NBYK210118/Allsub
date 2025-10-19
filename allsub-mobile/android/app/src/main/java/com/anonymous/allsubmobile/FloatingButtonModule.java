package com.anonymous.allsubmobile;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FloatingButtonModule extends ReactContextBaseJavaModule {
    private static final String TAG = "FloatingButtonModule";

    public FloatingButtonModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "FloatingButtonModule";
    }

    @ReactMethod
    public void checkPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean hasPermission = Settings.canDrawOverlays(getReactApplicationContext());
            promise.resolve(hasPermission);
        } else {
            // Android 6.0 미만은 권한 불필요
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getReactApplicationContext())) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getReactApplicationContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                try {
                    getReactApplicationContext().startActivity(intent);
                    Log.d(TAG, "Opened overlay permission settings");
                    promise.resolve(true);
                } catch (Exception e) {
                    Log.e(TAG, "Error opening permission settings", e);
                    promise.reject("PERMISSION_ERROR", e.getMessage());
                }
            } else {
                promise.resolve(true);
            }
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void start(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(context)) {
                    promise.reject("NO_PERMISSION", "Overlay permission not granted");
                    return;
                }
            }

            Intent serviceIntent = new Intent(context, FloatingButtonService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "Floating button service started");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting floating button service", e);
            promise.reject("START_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stop(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, FloatingButtonService.class);
            context.stopService(serviceIntent);
            
            Log.d(TAG, "Floating button service stopped");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping floating button service", e);
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }
}

