#!/bin/bash

echo ""
echo "----------------------------------------"
echo "Android 에뮬레이터 개발 환경 설정"
echo "----------------------------------------"
echo ""

# adb reverse로 localhost 포트포워딩
echo "Android 에뮬레이터 포트포워딩 설정 중..."
adb reverse tcp:3000 tcp:3000
adb reverse tcp:3001 tcp:3001

if [ $? -eq 0 ]; then
  echo "포트포워딩 설정 완료"
  echo ""
  echo "설정된 포트:"
  echo "   - 3000: HTTP & WebSocket"
  echo "   - 3001: Audio Stream"
  echo ""
  echo "이제 Android 에뮬레이터에서 localhost:3000으로 백엔드 접근 가능합니다!"
else
  echo "포트포워딩 설정 실패"
  echo ""
  echo "확인사항:"
  echo "   1. Android 에뮬레이터가 실행 중인지 확인"
  echo "   2. adb가 설치되어 있는지 확인"
  echo "   3. 에뮬레이터가 제대로 감지되는지 확인: adb devices"
fi

echo ""
echo "----------------------------------------"
echo ""




