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
        this.socket = io(serverUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectedCallback?.();
          resolve(true);
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.onDisconnectedCallback?.();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onErrorCallback?.('연결 실패: 서버에 접속할 수 없습니다.');
            resolve(false);
          }
        });

        // 자막 데이터 수신
        this.socket.on('subtitle-text', (data: SubtitleData) => {
          console.log('Received subtitle:', data);
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
            resolve(false);
          }
        }, 10000);
      } catch (error) {
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
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * 자막 서비스 시작 요청
   */
  startSubtitle(userId: string, language: string = 'ko-KR', targetLanguage: string = 'en') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('start-subtitle', {
      userId,
      language,
      targetLanguage,
    });
  }

  /**
   * 자막 서비스 중지 요청
   */
  stopSubtitle() {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('stop-subtitle');
  }

  /**
   * 오디오 청크 전송
   */
  sendAudioChunk(audioData: string | Buffer, encoding: string = 'base64') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

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

