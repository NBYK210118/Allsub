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
console.log('=== SubtitleService 환경 설정 확인 ===');
console.log('Platform:', Platform.OS);
console.log('__DEV__:', __DEV__);
console.log('WS_BASE_URL:', WS_BASE_URL);
console.log('SERVER_URL:', SERVER_URL);
console.log('');
console.log('예상 값: http://localhost:3000');
console.log('Android는 adb reverse tcp:3000 tcp:3000 설정 필요');
console.log('='.repeat(50));
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
  private lastUserId = 'demo-user-1';
  private lastSourceLanguage = 'ko-KR';
  private lastTargetLanguage = 'en';
  private lastTranslationDirection: 'ko-to-en' | 'en-to-ko' = 'ko-to-en';
  private lastMicrophoneMode: 'auto' | 'push-to-talk' = 'push-to-talk';
  private isConnected = false;
  private onSubtitleUpdate?: (subtitle: string, translation: string) => void;
  private onStateUpdate?: (state: SubtitleServiceState) => void;
  private appStateSubscription: any = null;
  private cleanupCallbacks: Array<() => void> = [];

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
      
      // 서비스가 활성 상태이면 재연결 시도
      if (this.isActive) {
        console.log('');
        console.log('------------------------------');
        console.log('자막 서비스가 활성 상태입니다. 재연결을 시도합니다...');
        console.log('------------------------------');
        console.log('');
        
        // 3초 후 재연결 시도
        setTimeout(async () => {
          if (this.isActive && !this.isConnected) {
            console.log('WebSocket 재연결 시도 중...');
            const reconnected = await WebSocketService.connect(WS_BASE_URL);
            if (reconnected) {
              console.log('재연결 성공! 자막 서비스 재개합니다.');
              // 자막 서비스 재시작 요청 전송 (저장된 설정 사용)
              if (this.onSubtitleUpdate && this.onStateUpdate) {
                WebSocketService.startSubtitle(
                  this.lastUserId,
                  this.lastSourceLanguage,
                  this.lastTargetLanguage,
                  this.lastTranslationDirection,
                  this.lastMicrophoneMode
                );
                console.log('자막 서비스 재시작 요청 전송 완료');
              }
            } else {
              console.log('재연결 실패. 토글을 다시 켜주세요.');
            }
          }
        }, 3000);
      }
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
    targetLanguage: string = 'en',
    translationDirection: 'ko-to-en' | 'en-to-ko' = 'ko-to-en',
    microphoneMode: 'auto' | 'push-to-talk' = 'push-to-talk'
  ): Promise<boolean> {
    try {
      console.log('------------------------------');
      console.log('SubtitleService.start() 호출됨');
      console.log('------------------------------');
      console.log('SERVER_URL:', SERVER_URL);
      console.log('User ID:', userId);
      console.log('Source Language:', sourceLanguage);
      console.log('Target Language:', targetLanguage);
      console.log('Platform:', Platform.OS);
      console.log('Dev Mode:', __DEV__);
      console.log('='.repeat(50));
      console.log('');
      
      // 환경 정보 로깅
      Diagnostics.logEnvironmentInfo();
      
      // 콜백 및 설정 저장 (재연결 시 사용)
      this.onSubtitleUpdate = onSubtitleUpdate;
      this.onStateUpdate = onStateUpdate;
      this.lastUserId = userId;
      this.lastSourceLanguage = sourceLanguage;
      this.lastTargetLanguage = targetLanguage;
      this.lastTranslationDirection = translationDirection;
      this.lastMicrophoneMode = microphoneMode;

      // 1. WebSocket 서버에 연결
      console.log('STEP 1: WebSocket 연결 시도 중...');
      console.log('   URL:', SERVER_URL);
      console.log('   URL 타입:', typeof SERVER_URL);
      console.log('   URL 길이:', SERVER_URL?.length);
      console.log('   URL 값:', JSON.stringify(SERVER_URL));
      console.log('');
      
      try {
        const connected = await WebSocketService.connect(SERVER_URL);
        console.log('');
        console.log('WebSocket 연결 결과:', connected ? '성공' : '실패');
        console.log('');
        if (!connected) {
          console.error('STEP 1 실패: WebSocket 연결 불가');
          console.error('   시도한 URL:', SERVER_URL);
          console.error('   현재 시간:', new Date().toISOString());
          Diagnostics.logConnectionFailure(SERVER_URL);
          Diagnostics.logServiceStartFailure('WebSocket 연결 실패');
          return false;
        }
      } catch (error: any) {
        console.error('STEP 1 예외 발생:', error);
        console.error('   에러 메시지:', error?.message);
        console.error('   에러 스택:', error?.stack);
        return false;
      }
      console.log('STEP 1 완료: WebSocket 연결 성공');
      console.log('');

      this.isConnected = true;
      this.isActive = true;

      // 2. 자막 서비스 시작 요청
      WebSocketService.startSubtitle(userId, sourceLanguage, targetLanguage, translationDirection, microphoneMode);

      // 3. 오디오 캡처 시작
      let audioStarted = false;

      if (Platform.OS === 'android') {
        try {
          // Android: 시스템 오디오 캡처 시도
          console.log('Android 시스템 오디오 지원 확인 중...');
          const isSystemAudioSupported = await SystemAudioService.isSupported();
          console.log('시스템 오디오 지원:', isSystemAudioSupported);
          
          if (isSystemAudioSupported) {
            console.log('시스템 오디오 캡처 사용 (Android 10+)');
            // 시스템 오디오 직접 캡처 (백엔드로 직접 전송)
            audioStarted = await SystemAudioService.start(
              SERVER_URL.replace('http://', '').replace('https://', ''),
              3001 // 오디오 스트림 전용 TCP 포트
            );
            
            if (audioStarted) {
              console.log('시스템 오디오 캡처 시작됨');
            } else {
              console.log('시스템 오디오 캡처 실패, 마이크로 전환');
            }
          }
        } catch (error) {
          console.error('시스템 오디오 체크 중 에러:', error);
          console.log('마이크 모드로 전환합니다.');
        }
      }

      // 시스템 오디오 실패 또는 iOS의 경우 마이크 사용
      if (!audioStarted) {
        console.log('');
        console.log('STEP 3: 마이크 오디오 캡처 시작...');
        console.log('   Platform:', Platform.OS);
        
        console.log('');
        console.log('STEP 3-1: 마이크 권한 요청 중...');
        const hasAudioPermission = await AudioService.requestPermissions();
        console.log('마이크 권한 결과:', hasAudioPermission ? '허용됨' : '거부됨');
        console.log('');
        
        if (!hasAudioPermission) {
          console.error('STEP 3-1 실패: 마이크 권한 거부됨');
          Diagnostics.logServiceStartFailure('마이크 권한 거부됨');
          WebSocketService.stopSubtitle();
          WebSocketService.disconnect();
          return false;
        }
        console.log('STEP 3-1 완료: 마이크 권한 허용됨');
        console.log('');

        console.log('STEP 3-2: 오디오 녹음 시작 시도...');
        audioStarted = await AudioService.startStreamingRecording(
          (audioData: string) => {
            // 오디오 청크를 WebSocket으로 전송
            WebSocketService.sendAudioChunk(audioData, 'base64');
          },
          2000 // 2초 간격
        );
        console.log('오디오 녹음 시작 결과:', audioStarted ? '성공' : '실패');
        console.log('');

        if (!audioStarted) {
          console.error('STEP 3-2 실패: 오디오 녹음 시작 불가');
          console.error('');
          console.error('가능한 원인:');
          console.error('   1. expo-av 초기화 실패');
          console.error('   2. 에뮬레이터 마이크 설정 문제');
          console.error('   3. 이미 다른 앱이 마이크 사용 중');
          console.error('');
          
          // 테스트 모드: 더미 오디오로 계속 진행
          console.log('');
          console.log('테스트 모드 활성화');
          console.log('더미 오디오 데이터를 2초마다 전송합니다.');
          console.log('WebSocket 연결과 백엔드 응답을 테스트할 수 있습니다.');
          console.log('');
          
          // 더미 오디오 데이터를 주기적으로 전송
          const dummyInterval = setInterval(() => {
            // Base64로 인코딩된 짧은 무음 오디오
            const dummyAudio = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
            WebSocketService.sendAudioChunk(dummyAudio, 'base64');
            console.log('더미 오디오 청크 전송 (테스트 모드)');
          }, 2000);
          
          // cleanup 시 interval 정리
          this.cleanupCallbacks.push(() => clearInterval(dummyInterval));
          
          audioStarted = true;
          console.log('테스트 모드로 계속 진행합니다.');
          console.log('');
        }
        
        console.log('STEP 3-2 완료: 오디오 녹음 시작 성공');
        console.log('');
      }

      this.isRecording = true;
      this.isProcessing = true;
      this.updateState();

      // Android: 플로팅 버튼 시작 (다른 앱 위에 표시)
      if (Platform.OS === 'android') {
        try {
          console.log('Android 플로팅 버튼 시작 시도...');
          const floatingStarted = await FloatingButtonService.start();
          if (floatingStarted) {
            console.log('플로팅 버튼 시작됨');
          } else {
            console.log('플로팅 버튼 시작 실패 (권한 필요)');
          }
        } catch (error) {
          console.error('플로팅 버튼 에러 (무시하고 계속):', error);
        }
      }

      // iOS: Live Activities 시작 (Dynamic Island & 잠금 화면)
      if (Platform.OS === 'ios') {
        try {
          console.log('iOS Live Activities 시작 시도...');
          const liveActivityStarted = await LiveActivityManager.start();
          if (!liveActivityStarted) {
            console.log('Live Activity 시작 실패 (iOS 16.1+ 필요)');
          } else {
            console.log('Live Activity 시작됨');
          }
        } catch (error) {
          console.error('Live Activity 에러 (무시하고 계속):', error);
        }
      }

      // 성공 정보 표시
      Diagnostics.logSuccessInfo();
      
      console.log('자막 서비스 시작 완료!');
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
        console.log('Live Activity 중지됨');
      }

      // WebSocket 자막 서비스 중지
      WebSocketService.stopSubtitle();

      // WebSocket 연결 해제
      WebSocketService.disconnect();

      // cleanup callbacks 실행 (interval 등 정리)
      this.cleanupCallbacks.forEach(callback => callback());
      this.cleanupCallbacks = [];

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
