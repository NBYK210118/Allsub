#!/bin/bash

# AllSub 백엔드 개발 서버 시작 스크립트
# 포트 충돌 자동 해결

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AllSub 백엔드 서버 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 포트 3000 체크
echo "🔍 포트 3000 확인 중..."
PORT_3000=$(lsof -ti:3000)

if [ ! -z "$PORT_3000" ]; then
  echo "⚠️  포트 3000이 이미 사용 중입니다 (PID: $PORT_3000)"
  echo "🛑 기존 프로세스 종료 중..."
  kill -9 $PORT_3000
  sleep 1
  echo "✅ 포트 3000 해제 완료"
else
  echo "✅ 포트 3000 사용 가능"
fi

echo ""

# 2. 포트 3001 체크 (AudioStreamGateway용)
echo "🔍 포트 3001 확인 중..."
PORT_3001=$(lsof -ti:3001)

if [ ! -z "$PORT_3001" ]; then
  echo "⚠️  포트 3001이 이미 사용 중입니다 (PID: $PORT_3001)"
  echo "🛑 기존 프로세스 종료 중..."
  kill -9 $PORT_3001
  sleep 1
  echo "✅ 포트 3001 해제 완료"
else
  echo "✅ 포트 3001 사용 가능"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶️  백엔드 서버 실행 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. 백엔드 서버 실행
npm run start:dev

