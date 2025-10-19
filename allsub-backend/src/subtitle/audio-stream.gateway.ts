import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import { SpeechService } from './speech.service';
import { TranslationService } from './translation.service';

interface AudioStream {
  socket: net.Socket;
  userId: string;
  buffer: Buffer;
}

@Injectable()
export class AudioStreamGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AudioStreamGateway.name);
  private server: net.Server;
  private readonly port = 3001; // WebSocket(3000)과 분리된 포트
  private activeStreams = new Map<string, AudioStream>();

  constructor(
    private readonly speechService: SpeechService,
    private readonly translationService: TranslationService,
  ) {}

  onModuleInit() {
    this.startTcpServer();
  }

  onModuleDestroy() {
    this.stopTcpServer();
  }

  private startTcpServer() {
    this.server = net.createServer((socket) => {
      const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
      this.logger.log(`New audio stream connection: ${clientId}`);

      const stream: AudioStream = {
        socket,
        userId: 'demo-user-1', // 실제로는 인증 필요
        buffer: Buffer.alloc(0),
      };

      this.activeStreams.set(clientId, stream);

      // 데이터 수신
      socket.on('data', async (data) => {
        try {
          // Base64로 인코딩된 오디오 데이터 수신
          const lines = data.toString().split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                // Base64 디코딩
                const audioBuffer = Buffer.from(line.trim(), 'base64');
                
                // 버퍼에 추가
                stream.buffer = Buffer.concat([stream.buffer, audioBuffer]);

                // 일정 크기 이상이 되면 처리
                if (stream.buffer.length >= 4096) {
                  await this.processAudioBuffer(stream);
                  stream.buffer = Buffer.alloc(0);
                }
              } catch (err) {
                // Base64 디코딩 실패는 무시 (부분 데이터일 수 있음)
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error processing audio data: ${error.message}`);
        }
      });

      // 연결 종료
      socket.on('close', () => {
        this.logger.log(`Audio stream closed: ${clientId}`);
        this.activeStreams.delete(clientId);
      });

      // 에러 처리
      socket.on('error', (error) => {
        this.logger.error(`Socket error for ${clientId}: ${error.message}`);
        this.activeStreams.delete(clientId);
      });
    });

    this.server.listen(this.port, () => {
      this.logger.log(`Audio stream server listening on port ${this.port}`);
    });

    this.server.on('error', (error) => {
      this.logger.error(`Server error: ${error.message}`);
    });
  }

  private async processAudioBuffer(stream: AudioStream) {
    try {
      // 음성 인식 수행
      const transcription = await this.speechService.transcribeAudio(
        stream.buffer,
        'ko-KR',
      );

      if (transcription && transcription.trim()) {
        this.logger.log(`Transcription: ${transcription}`);

        // 번역 수행
        const translation = await this.translationService.translate(
          transcription,
          'en',
        );

        this.logger.log(`Translation: ${translation}`);

        // TODO: WebSocket을 통해 클라이언트에 전송
        // 현재는 로그만 출력
        // 실제로는 SubtitleGateway와 연동 필요
      }
    } catch (error) {
      this.logger.error(`Error processing audio buffer: ${error.message}`);
    }
  }

  private stopTcpServer() {
    if (this.server) {
      this.server.close(() => {
        this.logger.log('Audio stream server closed');
      });

      // 모든 활성 연결 종료
      for (const [clientId, stream] of this.activeStreams.entries()) {
        stream.socket.destroy();
        this.logger.log(`Closed connection: ${clientId}`);
      }

      this.activeStreams.clear();
    }
  }

  // WebSocket Gateway와의 통합을 위한 메서드
  getActiveStreams(): Map<string, AudioStream> {
    return this.activeStreams;
  }
}

