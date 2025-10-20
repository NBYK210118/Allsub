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
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔌 WebSocket 연결 시도');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📍 Server URL:', serverUrl);
        console.log('⏱️  Timeout: 10초');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        
        this.socket = io(serverUrl, {
          transports: ['websocket'],  // WebSocket만 사용 (Android 에뮬레이터 호환)
          upgrade: false,  // polling에서 websocket으로 업그레이드 시도 안 함
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
          forceNew: true,
          autoConnect: true,
          path: '/socket.io',  // 끝 슬래시 제거
          secure: false,  // HTTPS 사용 안 함
          rejectUnauthorized: false,  // 인증서 검증 안 함
        });

        this.socket.on('connect', () => {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ WebSocket 연결 성공!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🆔 Socket ID:', this.socket?.id);
          console.log('📡 Transport:', this.socket?.io.engine.transport.name);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectedCallback?.();
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔌 WebSocket 연결 해제');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📍 Reason:', reason);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          this.isConnected = false;
          this.onDisconnectedCallback?.();
        });

        this.socket.on('connect_error', (error) => {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('❌ WebSocket 연결 에러');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📍 Server URL:', serverUrl);
          console.log('🔢 시도 횟수:', this.reconnectAttempts + 1, '/', this.maxReconnectAttempts);
          console.log('❗ Error:', error.message);
          console.log('');
          console.log('💡 해결 방법:');
          console.log('   1. 백엔드 서버 실행 확인: lsof -i :3000');
          console.log('   2. URL 확인:', serverUrl);
          console.log('   3. 방화벽 확인');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onErrorCallback?.('연결 실패: 서버에 접속할 수 없습니다.');
            resolve(false);
          }
        });

        // 자막 데이터 수신
        this.socket.on('subtitle-text', (data: SubtitleData) => {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📬 자막 수신!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🇰🇷 원본:', data.original);
          console.log('🇺🇸 번역:', data.translated);
          console.log('⏰ 타임스탬프:', data.timestamp);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⏱️  WebSocket 연결 타임아웃 (10초)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📍 Server URL:', serverUrl);
            console.log('🔢 재연결 시도:', this.reconnectAttempts, '/', this.maxReconnectAttempts);
            console.log('');
            console.log('💡 가능한 원인:');
            console.log('   1. 백엔드 서버가 실행되지 않음');
            console.log('   2. 잘못된 URL:', serverUrl);
            console.log('   3. 네트워크 연결 문제');
            console.log('   4. 방화벽 차단');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            resolve(false);
          }
        }, 10000);
      } catch (error) {
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ WebSocket 생성 중 예외 발생');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📍 Server URL:', serverUrl);
        console.log('❗ Error:', error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
      // 연결되지 않은 상태에서 stop은 정상 (무시)
      return;
    }

    this.socket.emit('stop-subtitle');
  }

  /**
   * 오디오 청크 전송
   */
  sendAudioChunk(audioData: string | Buffer, encoding: string = 'base64') {
    if (!this.socket || !this.isConnected) {
      console.error('❌ 오디오 전송 실패: WebSocket 연결되지 않음');
      return;
    }

    const dataSize = typeof audioData === 'string' 
      ? Math.round(audioData.length / 1024) 
      : Math.round(audioData.length / 1024);
    
    console.log('📨 오디오 청크 전송 중... (', dataSize, 'KB)');
    
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

