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
})
export class SubtitleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SubtitleGateway.name);
  private readonly sessions = new Map<string, ClientSession>();

  constructor(
    private readonly speechService: SpeechService,
    private readonly translationService: TranslationService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start-subtitle')
  async handleStartSubtitle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; language?: string; targetLanguage?: string },
  ) {
    this.logger.log(`Starting subtitle service for client: ${client.id}`);
    
    const session: ClientSession = {
      userId: data.userId,
      language: data.language || 'ko-KR',
      targetLanguage: data.targetLanguage || 'en',
      isActive: true,
    };
    
    this.sessions.set(client.id, session);
    
    client.emit('subtitle-status', { 
      status: 'started',
      message: '자막 서비스가 시작되었습니다.' 
    });
  }

  @SubscribeMessage('stop-subtitle')
  handleStopSubtitle(@ConnectedSocket() client: Socket) {
    this.logger.log(`Stopping subtitle service for client: ${client.id}`);
    
    const session = this.sessions.get(client.id);
    if (session) {
      session.isActive = false;
    }
    
    client.emit('subtitle-status', { 
      status: 'stopped',
      message: '자막 서비스가 중지되었습니다.' 
    });
  }

  @SubscribeMessage('audio-chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { audio: Buffer | string; encoding?: string },
  ) {
    const session = this.sessions.get(client.id);
    
    if (!session || !session.isActive) {
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

      // 음성 인식 수행
      const transcription = await this.speechService.transcribeAudio(
        audioBuffer,
        session.language,
      );

      if (transcription && transcription.trim()) {
        // 번역 수행 (필요한 경우)
        let translatedText = transcription;
        if (session.targetLanguage && session.targetLanguage !== session.language) {
          translatedText = await this.translationService.translate(
            transcription,
            session.targetLanguage,
          );
        }

        // 클라이언트에 자막 전송
        client.emit('subtitle-text', {
          original: transcription,
          translated: translatedText,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`Subtitle sent to ${client.id}: ${transcription}`);
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
    client.emit('pong');
  }
}

