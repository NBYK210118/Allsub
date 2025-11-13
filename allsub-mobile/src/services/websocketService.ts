import { io, Socket } from 'socket.io-client';

export interface SubtitleData {
  original: string;
  translated: string;
  timestamp: string;
}

export interface SubtitleStatus {
  status: 'started' | 'stopped';
  message: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // 콜백 함수들
  private onSubtitleCallback?: (data: SubtitleData) => void;
  private onStatusCallback?: (status: SubtitleStatus) => void;
  private onErrorCallback?: (error: string) => void;
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: () => void;

  /**
   * WebSocket 서버에 연결
   */
  connect(serverUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 기존 연결이 있으면 먼저 완전히 정리
        if (this.socket) {
          console.log('[WebSocketService] Cleaning up existing socket');
          try {
            this.socket.removeAllListeners();
            this.socket.close();
            this.socket = null;
          } catch (e) {
            // 정리 중 에러 무시
          }
        }
        
        // 상태 초기화
        this.isConnected = false;
        this.reconnectAttempts = 0;
        
        console.log('');
        console.log('[WebSocketService] Attempting connection');
        console.log('  Server URL:', serverUrl);
        console.log('  Timeout: 20 seconds');
        console.log('  Transport: polling -> websocket');
        console.log('');
        
        // Socket.IO 함수 존재 확인
        console.log('[WebSocketService] Checking socket.io factory');
        console.log('  typeof io:', typeof io);
        console.log('  io available:', !!io);
        
        if (!io) {
          console.error('Socket.IO client is not available');
          console.error('Ensure socket.io-client package is installed');
          resolve(false);
          return;
        }
        
        try {
          console.log('[WebSocketService] Calling io() factory');
          this.socket = io(serverUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            path: '/socket.io/',
          });
          
          console.log('Socket created:', !!this.socket);
          console.log('  Socket type:', typeof this.socket);
          console.log('  Socket ID:', this.socket?.id);
        } catch (socketError) {
          const socketErr = socketError as { message?: string; stack?: string };
          console.error('Error creating socket:');
          console.error('  Error object:', socketError);
          console.error('  Message:', socketErr?.message ?? String(socketError));
          console.error('  Stack:', socketErr?.stack ?? 'N/A');
          this.socket = null;
          resolve(false);
          return;
        }

        this.socket.on('connect', () => {
          console.log('');
          console.log('[WebSocketService] Connected');
          console.log('  Socket ID:', this.socket?.id);
          console.log('  Transport:', this.socket?.io.engine.transport.name);
          console.log('');
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectedCallback?.();
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('');
          console.log('[WebSocketService] Disconnected');
          console.log('  Reason:', reason);
          console.log('');
          
          this.isConnected = false;
          this.onDisconnectedCallback?.();
          
          // 자동 재연결 안내
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            console.log('Intentional disconnect - automatic reconnect disabled');
          } else {
            console.log('Unexpected disconnect - Socket.IO will attempt to reconnect');
          }
        });

        // 재연결 시도 이벤트
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Reconnect attempt ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // 재연결 성공 이벤트
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('');
          console.log('[WebSocketService] Reconnected');
          console.log(`  Attempts: ${attemptNumber}`);
          console.log('');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectedCallback?.();
        });

        // 재연결 실패 이벤트
        this.socket.on('reconnect_failed', () => {
          console.log('');
          console.log('[WebSocketService] Reconnect failed (5 attempts)');
          console.log('Turn the subtitle toggle off and on to retry');
          console.log('');
          this.isConnected = false;
          this.onErrorCallback?.('재연결 실패 - 토글을 다시 켜주세요');
        });

        // 재연결 에러 이벤트
        this.socket.on('reconnect_error', (error) => {
          const reconnectErr = error as { message?: string };
          console.log(`Reconnect error: ${reconnectErr?.message || reconnectErr || 'Unknown error'}`);
        });

        this.socket.on('connect_error', (error) => {
          const connectErr = error as { message?: string };
          console.log('');
          console.log('[WebSocketService] Connection error');
          console.log('  Server URL:', serverUrl);
          console.log('  Message:', connectErr?.message || 'Unknown error');
          console.log('  Raw error:', error);
          console.log('');
          this.onErrorCallback?.(connectErr?.message || 'Connection failed');
          resolve(false);
        });

        // 자막 데이터 수신
        this.socket.on('subtitle-text', (data: SubtitleData) => {
          console.log('');
          console.log('[WebSocketService] Subtitle received');
          console.log('  Original:', data.original);
          console.log('  Translated:', data.translated);
          console.log('  Timestamp:', data.timestamp);
          console.log('');
          
          this.onSubtitleCallback?.(data);
        });

        // 상태 업데이트 수신
        this.socket.on('subtitle-status', (status: SubtitleStatus) => {
          console.log('Subtitle status:', status);
          this.onStatusCallback?.(status);
        });

        // 에러 수신
        this.socket.on('subtitle-error', (error: { error: string; message: string }) => {
          console.error('Subtitle error:', error);
          this.onErrorCallback?.(error.message);
        });

        // Pong 응답
        this.socket.on('pong', () => {
          console.log('Pong received');
        });

        // 연결 타임아웃 설정
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('');
            console.log('[WebSocketService] Connection timeout (20s)');
            console.log('  Server URL:', serverUrl);
            console.log('  Socket exists:', !!this.socket);
            console.log('  Socket connected:', this.socket?.connected);
            console.log('  Socket ID:', this.socket?.id);
            console.log('  Reconnect attempts:', this.reconnectAttempts, '/', this.maxReconnectAttempts);
            console.log('');
            console.log('Possible causes:');
            console.log('  1. Backend server is not running');
            console.log('  2. Invalid URL:', serverUrl);
            console.log('  3. Network connectivity issue');
            console.log('  4. Firewall blocking the connection');
            console.log('');
            resolve(false);
          }
        }, 20000);
      } catch (error) {
        console.log('');
        console.log('[WebSocketService] Exception while creating socket');
        console.log('  Server URL:', serverUrl);
        console.log('  Error:', error);
        console.log('');
        console.error('Failed to create socket connection:', error);
        resolve(false);
      }
    });
  }

  /**
   * 서버 연결 해제
   */
  disconnect() {
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.close();
      } catch (e) {
        // 에러 무시
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * 자막 서비스 시작 요청
   */
  startSubtitle(userId: string, language: string = 'ko-KR', targetLanguage: string = 'en', translationDirection: 'ko-to-en' | 'en-to-ko' = 'ko-to-en', microphoneMode: 'auto' | 'push-to-talk' = 'push-to-talk') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('start-subtitle', {
      userId,
      language,
      targetLanguage,
      translationDirection,
      microphoneMode,
    });
  }

  /**
   * 자막 서비스 중지 요청
   */
  stopSubtitle() {
    if (!this.socket || !this.isConnected) {
      // 연결되지 않은 상태에서 stop은 정상 (무시)
      return;
    }

    this.socket.emit('stop-subtitle');
  }

  /**
   * 번역 방향 설정
   */
  setTranslationDirection(direction: 'ko-to-en' | 'en-to-ko') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('set-translation-direction', {
      translationDirection: direction,
    });
  }

  /**
   * 마이크 모드 설정
   */
  setMicrophoneMode(mode: 'auto' | 'push-to-talk') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('set-microphone-mode', {
      microphoneMode: mode,
    });
  }

  /**
   * Push-to-Talk 활성화 상태 설정
   */
  setPushToTalkActive(active: boolean) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('set-push-to-talk-active', {
      isPushToTalkActive: active,
    });
  }

  /**
   * 오디오 청크 전송
   */
  sendAudioChunk(audioData: string | Buffer, encoding: string = 'base64') {
    if (!this.socket || !this.isConnected) {
      console.error('Audio send failed: socket is not connected');
      return;
    }

    const dataSize = typeof audioData === 'string' 
      ? Math.round(audioData.length / 1024) 
      : Math.round(audioData.length / 1024);
    
    console.log('Sending audio chunk (', dataSize, 'KB)');
    
    this.socket.emit('audio-chunk', {
      audio: audioData,
      encoding,
    });
  }

  /**
   * Ping 전송 (연결 상태 확인)
   */
  ping() {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('ping');
  }

  /**
   * 콜백 함수 등록
   */
  onSubtitle(callback: (data: SubtitleData) => void) {
    this.onSubtitleCallback = callback;
  }

  onStatus(callback: (status: SubtitleStatus) => void) {
    this.onStatusCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onConnected(callback: () => void) {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback: () => void) {
    this.onDisconnectedCallback = callback;
  }

  /**
   * 연결 상태 확인
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new WebSocketService();

