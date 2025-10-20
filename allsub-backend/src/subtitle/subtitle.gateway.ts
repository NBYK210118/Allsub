import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { SpeechService } from './speech.service';
import { WhisperService } from './whisper.service';
import { TranslationService } from './translation.service';

interface ClientSession {
  userId: string;
  language: string;
  targetLanguage: string;
  isActive: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SubtitleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SubtitleGateway.name);
  private readonly sessions = new Map<string, ClientSession>();

  constructor(
    private readonly speechService: SpeechService,
    private readonly whisperService: WhisperService,
    private readonly translationService: TranslationService,
  ) {}

  handleConnection(client: Socket) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WebSocket 클라이언트 연결됨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Socket ID:', client.id);
    console.log('📡 Transport:', client.conn.transport.name);
    console.log('🌐 Client IP:', client.handshake.address);
    console.log('📋 Headers:', JSON.stringify(client.handshake.headers, null, 2));
    console.log('🔗 Query:', client.handshake.query);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 WebSocket 클라이언트 연결 해제됨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Socket ID:', client.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    this.logger.log(`Client disconnected: ${client.id}`);
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start-subtitle')
  async handleStartSubtitle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; language?: string; targetLanguage?: string },
  ) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [start-subtitle] 요청 수신');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Client ID:', client.id);
    console.log('👤 User ID:', data.userId);
    console.log('🗣️  Source Language:', data.language || 'ko-KR');
    console.log('🌍 Target Language:', data.targetLanguage || 'en');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    this.logger.log(`Starting subtitle service for client: ${client.id}`);
    
    const session: ClientSession = {
      userId: data.userId,
      language: data.language || 'ko-KR',
      targetLanguage: data.targetLanguage || 'en',
      isActive: true,
    };
    
    this.sessions.set(client.id, session);
    
    console.log('✅ 세션 생성 완료. 총 활성 세션:', this.sessions.size);
    
    client.emit('subtitle-status', { 
      status: 'started',
      message: '자막 서비스가 시작되었습니다.' 
    });
    
    console.log('📤 subtitle-status 이벤트 전송 완료');
    console.log('');
  }

  @SubscribeMessage('stop-subtitle')
  handleStopSubtitle(@ConnectedSocket() client: Socket) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 [stop-subtitle] 요청 수신');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Client ID:', client.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    this.logger.log(`Stopping subtitle service for client: ${client.id}`);
    
    const session = this.sessions.get(client.id);
    if (session) {
      session.isActive = false;
      console.log('✅ 세션 비활성화 완료');
    } else {
      console.log('⚠️  세션을 찾을 수 없음');
    }
    
    client.emit('subtitle-status', { 
      status: 'stopped',
      message: '자막 서비스가 중지되었습니다.' 
    });
    
    console.log('📤 subtitle-status 이벤트 전송 완료');
    console.log('');
  }

  @SubscribeMessage('audio-chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { audio: Buffer | string; encoding?: string },
  ) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎤 [audio-chunk] 요청 수신');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Client ID:', client.id);
    console.log('📦 Data type:', typeof data.audio);
    console.log('📏 Data size:', typeof data.audio === 'string' ? data.audio.length + ' chars' : 'buffer');
    console.log('🔢 Encoding:', data.encoding || 'unknown');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const session = this.sessions.get(client.id);
    
    if (!session || !session.isActive) {
      console.log('⚠️  세션이 비활성화되어 있거나 존재하지 않음');
      console.log('');
      return;
    }

    try {
      // Buffer로 변환
      let audioBuffer: Buffer;
      if (typeof data.audio === 'string') {
        // Base64 디코딩
        audioBuffer = Buffer.from(data.audio, 'base64');
      } else {
        audioBuffer = Buffer.from(data.audio);
      }

      // 음성 인식 수행 (Whisper API 우선 사용)
      this.logger.log(`🎤 오디오 처리 시작 (크기: ${audioBuffer.length} bytes)`);
      
      const transcription = await this.whisperService.transcribeAudio(
        audioBuffer,
        session.language,
      );

      if (transcription && transcription.trim()) {
        this.logger.log(`📝 음성 인식 결과: ${transcription}`);
        
        // 번역 수행 (필요한 경우)
        let translatedText = transcription;
        if (session.targetLanguage && session.targetLanguage !== session.language) {
          translatedText = await this.translationService.translate(
            transcription,
            session.targetLanguage,
          );
          this.logger.log(`🌍 번역 결과: ${translatedText}`);
        }

        // 클라이언트에 자막 전송
        client.emit('subtitle-text', {
          original: transcription,
          translated: translatedText,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`📤 자막 전송 완료 → ${client.id}`);
      } else {
        this.logger.warn('⚠️  음성 인식 결과 없음 (소리가 감지되지 않았거나 너무 짧음)');
      }
    } catch (error) {
      this.logger.error(`Error processing audio chunk: ${error.message}`);
      client.emit('subtitle-error', { 
        error: 'Failed to process audio',
        message: error.message 
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    console.log('🏓 [ping] 수신 → [pong] 전송 (Client ID:', client.id + ')');
    client.emit('pong');
  }
}

