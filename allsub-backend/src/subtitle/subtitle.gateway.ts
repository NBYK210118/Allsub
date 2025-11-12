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
  translationDirection: 'ko-to-en' | 'en-to-ko';
  microphoneMode: 'auto' | 'push-to-talk';
  isPushToTalkActive: boolean;
  isActive: boolean;
  audioBuffer: Buffer[];
  lastAudioTime: number;
  processingTimer?: NodeJS.Timeout;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
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
    console.log('--- WebSocket 클라이언트 연결 ---');
    console.log('Socket ID:', client.id);
    console.log('Transport:', client.conn.transport.name);
    console.log('Client IP:', client.handshake.address);
    console.log('연결 시간:', new Date().toLocaleString('ko-KR'));
    console.log('총 활성 연결:', this.sessions.size + 1);
    console.log('------------------------------');
    console.log('');

    this.logger.log(`WebSocket client connected - Socket ID: ${client.id}, IP: ${client.handshake.address}`);
  }

  handleDisconnect(client: Socket) {
    console.log('');
    console.log('--- WebSocket 클라이언트 연결 해제 ---');
    console.log('Socket ID:', client.id);
    console.log('------------------------------');
    console.log('');
    
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // 세션 정리 (타이머 포함)
    const session = this.sessions.get(client.id);
    if (session?.processingTimer) {
      clearTimeout(session.processingTimer);
    }
    
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start-subtitle')
  async handleStartSubtitle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; language?: string; targetLanguage?: string; translationDirection?: 'ko-to-en' | 'en-to-ko'; microphoneMode?: 'auto' | 'push-to-talk' },
  ) {
    console.log('');
    console.log('--- 토글 ON (WebSocket) ---');
    console.log('Client ID:', client.id);
    console.log('User ID:', data.userId);
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('Source Language:', data.language || 'ko-KR');
    console.log('Target Language:', data.targetLanguage || 'en');
    console.log('Translation Direction:', data.translationDirection || 'ko-to-en');
    console.log('Microphone Mode:', data.microphoneMode || 'push-to-talk');
    console.log('------------------------------');
    console.log('');

    this.logger.log(`TOGGLE ON - Starting subtitle service for client: ${client.id}, user: ${data.userId}`);

    const session: ClientSession = {
      userId: data.userId,
      language: data.language || 'ko-KR',
      targetLanguage: data.targetLanguage || 'en',
      translationDirection: data.translationDirection || 'ko-to-en',
      microphoneMode: data.microphoneMode || 'push-to-talk', // 기본값: 눌러서 말하기
      isPushToTalkActive: false,
      isActive: true,
      audioBuffer: [],
      lastAudioTime: Date.now(),
    };
    
    this.sessions.set(client.id, session);
    
    console.log('세션 생성 완료');
    console.log('총 활성 세션:', this.sessions.size);
    console.log('');
    
    client.emit('subtitle-status', { 
      status: 'started',
      message: '자막 서비스가 시작되었습니다.' 
    });
    
    console.log('subtitle-status 이벤트 전송 완료');
    console.log('------------------------------');
    console.log('');
  }

  @SubscribeMessage('set-translation-direction')
  async handleSetTranslationDirection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { translationDirection: 'ko-to-en' | 'en-to-ko' },
  ) {
    console.log('');
    console.log('--- [set-translation-direction] 요청 수신 ---');
    console.log('Client ID:', client.id);
    console.log('Translation Direction:', data.translationDirection);
    console.log('------------------------------');
    console.log('');

    const session = this.sessions.get(client.id);
    if (session) {
      session.translationDirection = data.translationDirection;
      this.sessions.set(client.id, session);

      console.log('번역 방향 업데이트 완료:', data.translationDirection);

      client.emit('translation-direction-updated', {
        translationDirection: data.translationDirection,
        message: '번역 방향이 업데이트되었습니다.'
      });

      console.log('translation-direction-updated 이벤트 전송 완료');
    } else {
      console.log('세션을 찾을 수 없습니다.');
      client.emit('error', { message: '세션을 찾을 수 없습니다.' });
    }

    console.log('');
  }

  @SubscribeMessage('set-microphone-mode')
  async handleSetMicrophoneMode(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { microphoneMode: 'auto' | 'push-to-talk' },
  ) {
    console.log('');
    console.log('--- [set-microphone-mode] 요청 수신 ---');
    console.log('Client ID:', client.id);
    console.log('Microphone Mode:', data.microphoneMode);
    console.log('------------------------------');
    console.log('');

    const session = this.sessions.get(client.id);
    if (session) {
      session.microphoneMode = data.microphoneMode;
      this.sessions.set(client.id, session);

      console.log('마이크 모드 업데이트 완료:', data.microphoneMode);

      client.emit('microphone-mode-updated', {
        microphoneMode: data.microphoneMode,
        message: '마이크 모드가 업데이트되었습니다.'
      });

      console.log('microphone-mode-updated 이벤트 전송 완료');
    } else {
      console.log('세션을 찾을 수 없습니다.');
      client.emit('error', { message: '세션을 찾을 수 없습니다.' });
    }

    console.log('');
  }

  @SubscribeMessage('set-push-to-talk-active')
  async handleSetPushToTalkActive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isPushToTalkActive: boolean },
  ) {
    console.log('');
    console.log('--- [set-push-to-talk-active] 요청 수신 ---');
    console.log('Client ID:', client.id);
    console.log('Push-to-Talk Active:', data.isPushToTalkActive);
    console.log('------------------------------');
    console.log('');

    const session = this.sessions.get(client.id);
    if (session) {
      session.isPushToTalkActive = data.isPushToTalkActive;
      this.sessions.set(client.id, session);

      console.log('Push-to-Talk 상태 업데이트 완료:', data.isPushToTalkActive);

      client.emit('push-to-talk-active-updated', {
        isPushToTalkActive: data.isPushToTalkActive,
        message: 'Push-to-Talk 상태가 업데이트되었습니다.'
      });

      console.log('push-to-talk-active-updated 이벤트 전송 완료');
    } else {
      console.log('세션을 찾을 수 없습니다.');
      client.emit('error', { message: '세션을 찾을 수 없습니다.' });
    }

    console.log('');
  }

  @SubscribeMessage('stop-subtitle')
  handleStopSubtitle(@ConnectedSocket() client: Socket) {
    console.log('');
    console.log('--- 토글 OFF (WebSocket) ---');
    console.log('Client ID:', client.id);
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('------------------------------');
    console.log('');
    
    const session = this.sessions.get(client.id);
    if (session) {
      console.log('User ID:', session.userId);
      this.logger.log(`TOGGLE OFF - Stopping subtitle service for client: ${client.id}, user: ${session.userId}`);
      
      session.isActive = false;
      
      // 타이머가 있으면 정리
      if (session.processingTimer) {
        clearTimeout(session.processingTimer);
        session.processingTimer = undefined;
      }
      
      // 버퍼 초기화
      session.audioBuffer = [];
      
      console.log('세션 비활성화 완료');
      console.log('총 활성 세션:', this.sessions.size - 1);
    } else {
      console.log('세션을 찾을 수 없음');
      this.logger.warn(`Session not found for client: ${client.id}`);
    }
    
    client.emit('subtitle-status', { 
      status: 'stopped',
      message: '자막 서비스가 중지되었습니다.' 
    });
    
    console.log('subtitle-status 이벤트 전송 완료');
    console.log('------------------------------');
    console.log('');
  }

  @SubscribeMessage('audio-chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { audio: Buffer | string; encoding?: string },
  ) {
    console.log('');
    console.log('--- [audio-chunk] 요청 수신 ---');
    console.log('Client ID:', client.id);
    console.log('Data type:', typeof data.audio);
    console.log('Data size:', typeof data.audio === 'string' ? data.audio.length + ' chars' : 'buffer');
    console.log('Encoding:', data.encoding || 'unknown');
    console.log('------------------------------');
    console.log('');
    
    const session = this.sessions.get(client.id);
    
    if (!session || !session.isActive) {
      console.log('세션이 비활성화되어 있거나 존재하지 않음');
      console.log('');
      return;
    }

    // 마이크 모드 확인
    if (session.microphoneMode === 'push-to-talk' && !session.isPushToTalkActive) {
      console.log('Push-to-Talk 버튼이 눌리지 않아 오디오 처리를 건너뜁니다.');
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

      // 오디오 버퍼에 추가
      session.audioBuffer.push(audioBuffer);
      session.lastAudioTime = Date.now();

      // 기존 타이머가 있으면 취소
      if (session.processingTimer) {
        clearTimeout(session.processingTimer);
      }

      // 1초 후 오디오 처리 (묵음 대기)
      session.processingTimer = setTimeout(async () => {
        const timeSinceLastAudio = Date.now() - session.lastAudioTime;
        
        // 1초 이상 묵음이 있었으면 처리
        if (timeSinceLastAudio >= 1000 && session.audioBuffer.length > 0) {
          this.logger.log(`오디오 처리 시작 (버퍼 개수: ${session.audioBuffer.length}개)`);
          
          // 모든 버퍼를 하나로 합침
          const combinedBuffer = Buffer.concat(session.audioBuffer);
          session.audioBuffer = []; // 버퍼 초기화
          
          this.logger.log(`합쳐진 오디오 크기: ${combinedBuffer.length} bytes`);
          
          // 음성 인식 수행 (Whisper API 우선 사용)
          const transcription = await this.whisperService.transcribeAudio(
            combinedBuffer,
            session.language,
          );

          await this.processTranscription(client, session, transcription);
        }
      }, 1000);

      // 즉시 처리는 하지 않음 (1초 묵음 대기)
      return;
    } catch (error) {
      this.logger.error(`Error processing audio chunk: ${error.message}`);
    }
  }

  /**
   * 음성 인식 결과를 처리하고 번역하여 클라이언트에 전송
   */
  private async processTranscription(
    client: Socket,
    session: ClientSession,
    transcription: string
  ) {
    try {
      if (transcription && transcription.trim()) {
        this.logger.log(` 음성 인식 결과: ${transcription}`);
        
        // 번역 수행 (번역 방향에 따라)
        let translatedText = transcription;
        this.logger.log(` 세션 번역 방향: ${session.translationDirection}`);
        
        if (session.translationDirection) {
          this.logger.log(` 번역 시작: ${transcription} (${session.translationDirection})`);
          translatedText = await this.translationService.translateByDirection(
            transcription,
            session.translationDirection,
          );
          this.logger.log(`번역 결과 (${session.translationDirection}): ${translatedText}`);
        } else {
          this.logger.warn(`번역 방향이 설정되지 않았습니다!`);
        }

        // 클라이언트에 자막 전송
        client.emit('subtitle-text', {
          original: transcription,
          translated: translatedText,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`자막 전송 완료 -> ${client.id}`);
      } else {
        this.logger.warn('  음성 인식 결과 없음 (소리가 감지되지 않았거나 너무 짧음)');
      }
    } catch (error) {
      this.logger.error(`Error processing transcription: ${error.message}`);
      client.emit('subtitle-error', { 
        error: 'Failed to process transcription',
        message: error.message 
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    console.log('[ping] 수신 -> [pong] 전송 (Client ID:', client.id + ')');
    client.emit('pong');
  }
}

