import { AppState, Platform } from 'react-native';
import AudioService from './audioService';
import SystemAudioService from './systemAudioService';
import FloatingButtonService from './floatingButtonService';
import WebSocketService, { SubtitleData } from './websocketService';
import LiveActivityManager from './liveActivityManager';
import { WS_BASE_URL } from '../config/environment';
import Diagnostics from '../utils/diagnostics';

// WebSocket 서버 URL (환경 설정에서 가져옴)
const SERVER_URL = WS_BASE_URL;

// 환경 설정 디버깅 로그
console.log('');
console.log('╔═══════════════════════════════════════════════╗');
console.log('║   🔍 SubtitleService 환경 설정 확인          ║');
console.log('╚═══════════════════════════════════════════════╝');
console.log('📱 Platform:', Platform.OS);
console.log('🔧 __DEV__:', __DEV__);
console.log('🌐 WS_BASE_URL:', WS_BASE_URL);
console.log('📍 SERVER_URL:', SERVER_URL);
console.log('');
console.log('💡 예상 값:');
console.log('   iOS 시뮬레이터: http://localhost:3000');
console.log('   Android 에뮬레이터: http://10.0.2.2:3000');
console.log('');
if (Platform.OS === 'ios' && SERVER_URL !== 'http://localhost:3000') {
  console.log('⚠️  경고: iOS 시뮬레이터인데 localhost:3000이 아닙니다!');
  console.log('   현재 값:', SERVER_URL);
  console.log('   environment.ts 파일을 확인하세요.');
}
if (Platform.OS === 'android' && SERVER_URL !== 'http://10.0.2.2:3000') {
  console.log('⚠️  경고: Android 에뮬레이터인데 10.0.2.2:3000이 아닙니다!');
  console.log('   현재 값:', SERVER_URL);
  console.log('   environment.ts 파일을 확인하세요.');
}
console.log('═'.repeat(50));
console.log('');

export interface SubtitleServiceState {
  isActive: boolean;
  currentSubtitle: string;
  currentTranslation: string;
  isRecording: boolean;
  isProcessing: boolean;
  isConnected: boolean;
}

class SubtitleService {
  private isActive = false;
  private currentSubtitle = '';
  private currentTranslation = '';
  private isRecording = false;
  private isProcessing = false;
  private isConnected = false;
  private onSubtitleUpdate?: (subtitle: string, translation: string) => void;
  private onStateUpdate?: (state: SubtitleServiceState) => void;
  private appStateSubscription: any = null;

  constructor() {
    this.setupAppStateListener();
    this.setupWebSocketCallbacks();
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (this.isActive) {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          console.log('App moved to background - subtitle service continues');
        } else if (nextAppState === 'active') {
          console.log('App moved to foreground - subtitle service active');
        }
      }
    });
  }

  private setupWebSocketCallbacks() {
    // WebSocket 연결 상태 콜백
    WebSocketService.onConnected(() => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.updateState();
    });

    WebSocketService.onDisconnected(() => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.updateState();
    });

    // 자막 데이터 수신 콜백
    WebSocketService.onSubtitle((data: SubtitleData) => {
      this.currentSubtitle = data.original;
      this.currentTranslation = data.translated;
      
      // Live Activity 업데이트 (iOS 16.1+)
      if (Platform.OS === 'ios' && LiveActivityManager.isActive()) {
        LiveActivityManager.update(data.original, data.translated);
      }
      
      this.onSubtitleUpdate?.(data.original, data.translated);
      this.updateState();
    });

    // 상태 업데이트 콜백
    WebSocketService.onStatus((status) => {
      console.log('Subtitle status:', status.message);
      this.isProcessing = status.status === 'started';
      this.updateState();
    });

    // 에러 콜백
    WebSocketService.onError((error) => {
      console.error('WebSocket error:', error);
      this.isProcessing = false;
      this.updateState();
    });
  }

  async start(
    onSubtitleUpdate: (subtitle: string, translation: string) => void,
    onStateUpdate: (state: SubtitleServiceState) => void,
    userId: string = 'demo-user-1',
    sourceLanguage: string = 'ko-KR',
    targetLanguage: string = 'en'
  ): Promise<boolean> {
    try {
      console.log('');
      console.log('╔═══════════════════════════════════════════════╗');
      console.log('║   🚀 SubtitleService.start() 호출됨          ║');
      console.log('╚═══════════════════════════════════════════════╝');
      console.log('📍 SERVER_URL:', SERVER_URL);
      console.log('👤 User ID:', userId);
      console.log('🗣️  Source Language:', sourceLanguage);
      console.log('🌍 Target Language:', targetLanguage);
      console.log('═'.repeat(50));
      console.log('');
      
      // 환경 정보 로깅
      Diagnostics.logEnvironmentInfo();
      
      this.onSubtitleUpdate = onSubtitleUpdate;
      this.onStateUpdate = onStateUpdate;

      // 1. WebSocket 서버에 연결
      console.log('🔌 WebSocket 연결 시도 중...');
      console.log('   URL:', SERVER_URL);
      const connected = await WebSocketService.connect(SERVER_URL);
      console.log('🔌 WebSocket 연결 결과:', connected);
      if (!connected) {
        Diagnostics.logConnectionFailure(SERVER_URL);
        Diagnostics.logServiceStartFailure('WebSocket 연결 실패');
        return false;
      }

      this.isConnected = true;
      this.isActive = true;

      // 2. 자막 서비스 시작 요청
      WebSocketService.startSubtitle(userId, sourceLanguage, targetLanguage);

      // 3. 오디오 캡처 시작
      let audioStarted = false;

      if (Platform.OS === 'android') {
        // Android: 시스템 오디오 캡처 시도
        const isSystemAudioSupported = await SystemAudioService.isSupported();
        
        if (isSystemAudioSupported) {
          console.log('Using system audio capture (Android 10+)');
          // 시스템 오디오 직접 캡처 (백엔드로 직접 전송)
          audioStarted = await SystemAudioService.start(
            SERVER_URL.replace('http://', '').replace('https://', ''),
            3001 // 오디오 스트림 전용 TCP 포트
          );
          
          if (audioStarted) {
            console.log('System audio capture started');
          } else {
            console.log('System audio capture failed, falling back to microphone');
          }
        }
      }

      // 시스템 오디오 실패 또는 iOS의 경우 마이크 사용
      if (!audioStarted) {
        console.log('Using microphone audio capture');
        const hasAudioPermission = await AudioService.requestPermissions();
        if (!hasAudioPermission) {
          console.error('Audio permission denied');
          Diagnostics.logServiceStartFailure('마이크 권한 거부됨');
          WebSocketService.stopSubtitle();
          WebSocketService.disconnect();
          return false;
        }

        audioStarted = await AudioService.startStreamingRecording(
          (audioData: string) => {
            // 오디오 청크를 WebSocket으로 전송
            WebSocketService.sendAudioChunk(audioData, 'base64');
          },
          2000 // 2초 간격
        );

        if (!audioStarted) {
          console.error('Failed to start audio recording');
          Diagnostics.logServiceStartFailure('오디오 녹음 시작 실패');
          WebSocketService.stopSubtitle();
          WebSocketService.disconnect();
          return false;
        }
      }

      this.isRecording = true;
      this.isProcessing = true;
      this.updateState();

      // Android: 플로팅 버튼 시작 (다른 앱 위에 표시)
      if (Platform.OS === 'android') {
        const floatingStarted = await FloatingButtonService.start();
        if (floatingStarted) {
          console.log('Floating button started');
        } else {
          console.log('Floating button failed (권한 필요 또는 에러)');
        }
      }

      // iOS: Live Activities 시작 (Dynamic Island & 잠금 화면)
      if (Platform.OS === 'ios') {
        const liveActivityStarted = await LiveActivityManager.start();
        if (!liveActivityStarted) {
          console.log('Live Activity 시작 실패 (iOS 16.1+ 필요)');
        }
      }

      // 성공 정보 표시
      Diagnostics.logSuccessInfo();
      
      console.log('✅ 자막 서비스 시작 완료!');
      return true;
    } catch (error) {
      console.error('Failed to start subtitle service:', error);
      this.cleanup();
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('Stopping subtitle service...');

      this.isActive = false;
      this.isRecording = false;
      this.isProcessing = false;

      // 오디오 녹음 중지
      if (Platform.OS === 'android' && SystemAudioService.getIsCapturing()) {
        await SystemAudioService.stop();
      } else {
        await AudioService.stopRecording();
      }

      // Android: 플로팅 버튼 중지
      if (Platform.OS === 'android' && FloatingButtonService.getIsActive()) {
        await FloatingButtonService.stop();
      }

      // iOS: Live Activities 중지
      if (Platform.OS === 'ios' && LiveActivityManager.isActive()) {
        await LiveActivityManager.stop();
        console.log('🛑 Live Activity 중지됨');
      }

      // WebSocket 자막 서비스 중지
      WebSocketService.stopSubtitle();

      // WebSocket 연결 해제
      WebSocketService.disconnect();

      this.isConnected = false;
      this.currentSubtitle = '';
      this.currentTranslation = '';
      this.updateState();

      console.log('Subtitle service stopped');
    } catch (error) {
      console.error('Failed to stop subtitle service:', error);
    }
  }

  private updateState() {
    const state: SubtitleServiceState = {
      isActive: this.isActive,
      currentSubtitle: this.currentSubtitle,
      currentTranslation: this.currentTranslation,
      isRecording: this.isRecording,
      isProcessing: this.isProcessing,
      isConnected: this.isConnected,
    };
    this.onStateUpdate?.(state);
  }

  getState(): SubtitleServiceState {
    return {
      isActive: this.isActive,
      currentSubtitle: this.currentSubtitle,
      currentTranslation: this.currentTranslation,
      isRecording: this.isRecording,
      isProcessing: this.isProcessing,
      isConnected: this.isConnected,
    };
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.stop();
  }
}

export default new SubtitleService();
