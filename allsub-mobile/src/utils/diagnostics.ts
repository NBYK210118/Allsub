/**
 * 진단 유틸리티
 * WebSocket 연결 및 자막 서비스 문제를 진단합니다
 */

import { Platform } from 'react-native';
import { API_BASE_URL, WS_BASE_URL } from '../config/environment';

export class Diagnostics {
  /**
   * 환경 설정 진단
   */
  static logEnvironmentInfo() {
    console.log('');
    console.log('--- 환경 설정 진단 ---');
    console.log('');
    console.log('Platform:', Platform.OS);
    console.log('Environment:', __DEV__ ? 'Development' : 'Production');
    console.log('');
    console.log('API 설정:');
    console.log('   REST API URL:', API_BASE_URL);
    console.log('   WebSocket URL:', WS_BASE_URL);
    console.log('');
    console.log('권장 설정:');
    console.log('   iOS & Android: http://localhost:3000');
    console.log('   (Android는 adb reverse tcp:3000 tcp:3000 필요)');
    console.log('');
    console.log('------------------------------');
    console.log('');
  }

  /**
   * 연결 실패 진단
   */
  static logConnectionFailure(serverUrl: string, error?: any) {
    console.log('');
    console.log('--- WebSocket 연결 실패 진단 ---');
    console.log('');
    console.log('시도한 URL:', serverUrl);
    if (error) {
      console.log('에러 메시지:', error.message || error);
    }
    console.log('');
    console.log('가능한 원인:');
    console.log('');
    console.log('1) 백엔드 서버 미실행');
    console.log('   - 확인: lsof -i :3000');
    console.log('   - 실행: cd allsub-backend && npm run start:dev');
    console.log('');
    console.log('2) 잘못된 URL 설정');
    console.log('   - 현재 URL:', serverUrl);
    console.log('   - 올바른 URL: http://localhost:3000 (adb reverse 사용)');
    console.log('');
    console.log('3) 방화벽 차단');
    console.log('   - macOS: 시스템 환경설정 > 보안 > 방화벽');
    console.log('   - Node.js 허용 상태 확인');
    console.log('');
    console.log('4) 네트워크 문제');
    console.log('   - VPN 사용 중이면 비활성화');
    console.log('   - WiFi 연결 상태 확인');
    console.log('');
    console.log('5) 포트 충돌');
    console.log('   - 다른 앱이 3000 포트를 사용 중일 수 있음');
    console.log('   - lsof -i :3000 으로 확인');
    console.log('');
    console.log('------------------------------');
    console.log('');
  }

  /**
   * 자막 서비스 시작 실패 진단
   */
  static logServiceStartFailure(reason: string) {
    console.log('');
    console.log('--- 자막 서비스 시작 실패 진단 ---');
    console.log('');
    console.log('실패 원인:', reason);
    console.log('');
    console.log('체크리스트:');
    console.log('');
    console.log('[ ] WebSocket 연결 성공 여부');
    console.log('    - "WebSocket 연결 성공!" 로그 확인');
    console.log('');
    console.log('[ ] 마이크 권한 허용 여부');
    console.log('    - "마이크 권한 허용됨!" 로그 확인');
    console.log('    - 권한 팝업에서 "확인"을 선택했는지 확인');
    console.log('');
    console.log('[ ] 오디오 녹음 시작 성공 여부');
    console.log('    - "오디오 녹음 시작 성공!" 로그 확인');
    console.log('');
    console.log('[ ] 백엔드 서버 정상 작동 여부');
    console.log('    - 백엔드 콘솔에서 에러 확인');
    console.log('');
    console.log('해결 방법:');
    console.log('   1. 앱 재시작');
    console.log('   2. 앱 삭제 후 재설치 (권한 초기화)');
    console.log('   3. 시뮬레이터 재시작');
    console.log('');
    console.log('------------------------------');
    console.log('');
  }

  /**
   * 연결 성공 정보
   */
  static logSuccessInfo() {
    console.log('');
    console.log('--- 자막 서비스 정상 작동 중 ---');
    console.log('');
    console.log('WebSocket 연결됨');
    console.log('마이크 권한 허용됨');
    console.log('오디오 녹음 중');
    console.log('서버와 통신 중');
    console.log('');
    console.log('사용 방법:');
    console.log('   1. 좌측 하단 플로팅 버튼 클릭');
    console.log('   2. 한국어로 말하기');
    console.log('   3. 2초 후 자막 확인');
    console.log('');
    console.log('Live Activities (iOS 16.1+):');
    console.log('   - Command + L (잠금 화면)');
    console.log('   - Dynamic Island 확인');
    console.log('');
    console.log('------------------------------');
    console.log('');
  }
}

export default Diagnostics;

