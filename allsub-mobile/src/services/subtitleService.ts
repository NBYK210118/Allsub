import { AppState, Platform } from 'react-native';
import AudioService from './audioService';
import SystemAudioService from './systemAudioService';
import WebSocketService, { SubtitleData } from './websocketService';

const SERVER_URL = 'http://210.115.229.181:3000'; // 백엔드 서버 주소

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
      this.onSubtitleUpdate = onSubtitleUpdate;
      this.onStateUpdate = onStateUpdate;

      // 1. WebSocket 서버에 연결
      console.log('Connecting to WebSocket server...');
      const connected = await WebSocketService.connect(SERVER_URL);
      if (!connected) {
        console.error('Failed to connect to WebSocket server');
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
            3000 // 별도 포트 사용 (WebSocket과 분리)
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
          WebSocketService.stopSubtitle();
          WebSocketService.disconnect();
          return false;
        }
      }

      this.isRecording = true;
      this.isProcessing = true;
      this.updateState();

      console.log('Subtitle service started successfully');
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
