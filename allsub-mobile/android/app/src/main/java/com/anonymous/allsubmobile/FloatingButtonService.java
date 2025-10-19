package com.anonymous.allsubmobile;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;

public class FloatingButtonService extends Service {
    private static final String TAG = "FloatingButtonService";
    private WindowManager windowManager;
    private View floatingButton;
    private boolean isExpanded = false;
    private View subtitleOverlay;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createFloatingButton();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        return START_STICKY;
    }

    private void createFloatingButton() {
        // 플로팅 버튼 레이아웃 생성
        floatingButton = new FrameLayout(this);
        floatingButton.setBackgroundColor(0xFF8B5CF6); // 보라색
        
        TextView arrow = new TextView(this);
        arrow.setText("▶");
        arrow.setTextSize(24);
        arrow.setTextColor(0xFFFFFFFF);
        arrow.setGravity(Gravity.CENTER);
        
        ((FrameLayout) floatingButton).addView(arrow);

        // 윈도우 매니저 파라미터 설정
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            dpToPx(60), // width
            dpToPx(60), // height
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.START | Gravity.CENTER_VERTICAL;
        params.x = 0;
        params.y = 0;

        // 드래그 가능하게 설정
        floatingButton.setOnTouchListener(new FloatingOnTouchListener(params));

        // 클릭 리스너
        floatingButton.setOnClickListener(v -> {
            Log.d(TAG, "Floating button clicked");
            toggleSubtitleOverlay();
        });

        try {
            windowManager.addView(floatingButton, params);
            Log.d(TAG, "Floating button added to window");
        } catch (Exception e) {
            Log.e(TAG, "Error adding floating button", e);
        }
    }

    private void toggleSubtitleOverlay() {
        if (isExpanded) {
            hideSubtitleOverlay();
        } else {
            showSubtitleOverlay();
        }
    }

    private void showSubtitleOverlay() {
        if (subtitleOverlay != null) {
            return; // 이미 표시 중
        }

        // 자막 오버레이 생성
        subtitleOverlay = LayoutInflater.from(this).inflate(
            android.R.layout.simple_list_item_1, null
        );
        
        TextView subtitleText = subtitleOverlay.findViewById(android.R.id.text1);
        subtitleText.setText("실시간 자막이 여기에 표시됩니다");
        subtitleText.setTextColor(0xFFFFFFFF);
        subtitleText.setBackgroundColor(0xCC000000);
        subtitleText.setPadding(dpToPx(20), dpToPx(16), dpToPx(20), dpToPx(16));
        subtitleText.setTextSize(16);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.y = dpToPx(50);

        try {
            windowManager.addView(subtitleOverlay, params);
            isExpanded = true;
            Log.d(TAG, "Subtitle overlay shown");
        } catch (Exception e) {
            Log.e(TAG, "Error showing subtitle overlay", e);
        }
    }

    private void hideSubtitleOverlay() {
        if (subtitleOverlay != null) {
            try {
                windowManager.removeView(subtitleOverlay);
                subtitleOverlay = null;
                isExpanded = false;
                Log.d(TAG, "Subtitle overlay hidden");
            } catch (Exception e) {
                Log.e(TAG, "Error hiding subtitle overlay", e);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");

        if (floatingButton != null) {
            try {
                windowManager.removeView(floatingButton);
            } catch (Exception e) {
                Log.e(TAG, "Error removing floating button", e);
            }
        }

        hideSubtitleOverlay();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    // 드래그 리스너
    private class FloatingOnTouchListener implements View.OnTouchListener {
        private WindowManager.LayoutParams params;
        private int initialX;
        private int initialY;
        private float initialTouchX;
        private float initialTouchY;

        FloatingOnTouchListener(WindowManager.LayoutParams params) {
            this.params = params;
        }

        @Override
        public boolean onTouch(View v, MotionEvent event) {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    initialX = params.x;
                    initialY = params.y;
                    initialTouchX = event.getRawX();
                    initialTouchY = event.getRawY();
                    return false; // false로 하면 onClick도 작동

                case MotionEvent.ACTION_MOVE:
                    params.x = initialX + (int) (event.getRawX() - initialTouchX);
                    params.y = initialY + (int) (event.getRawY() - initialTouchY);
                    windowManager.updateViewLayout(floatingButton, params);
                    return true;
            }
            return false;
        }
    }
}

