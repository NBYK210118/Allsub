import { Injectable, Logger } from '@nestjs/common';
import * as speech from '@google-cloud/speech';
import { Readable } from 'stream';

@Injectable()
export class SpeechService {
  private readonly logger = new Logger(SpeechService.name);
  private client: speech.SpeechClient;
  private useSimulation = true; // Google Cloud 키가 없을 경우 시뮬레이션 모드

  constructor() {
    try {
      // Google Cloud 인증 정보가 있으면 실제 API 사용
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new speech.SpeechClient();
        this.useSimulation = false;
        this.logger.log('Google Cloud Speech-to-Text initialized');
      } else {
        this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not found. Using simulation mode.');
        this.useSimulation = true;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud Speech-to-Text:', error);
      this.useSimulation = true;
    }
  }

  /**
   * 오디오 버퍼를 텍스트로 변환
   */
  async transcribeAudio(audioBuffer: Buffer, languageCode: string = 'ko-KR'): Promise<string> {
    if (this.useSimulation) {
      return this.simulateTranscription(audioBuffer);
    }

    try {
      const audio = {
        content: audioBuffer.toString('base64'),
      };

      const config = {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .filter(text => text)
        .join('\n');

      return transcription || '';
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      return '';
    }
  }

  /**
   * 스트리밍 음성 인식 (실시간)
   */
  createStreamingRecognition(
    languageCode: string = 'ko-KR',
    onData: (text: string) => void,
    onError: (error: Error) => void,
  ) {
    if (this.useSimulation) {
      return this.createSimulationStream(onData);
    }

    try {
      const request = {
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      };

      const recognizeStream = this.client
        .streamingRecognize(request)
        .on('data', (data: any) => {
          const result = data.results?.[0];
          if (result && result.alternatives?.[0]) {
            const transcript = result.alternatives[0].transcript;
            if (transcript) {
              onData(transcript);
            }
          }
        })
        .on('error', (error: Error) => {
          this.logger.error('Streaming recognition error:', error);
          onError(error);
        });

      return recognizeStream;
    } catch (error) {
      this.logger.error('Failed to create streaming recognition:', error);
      return this.createSimulationStream(onData);
    }
  }

  /**
   * 시뮬레이션 모드: 랜덤 텍스트 반환
   */
  private simulateTranscription(audioBuffer: Buffer): string {
    const sampleTexts = [
      '안녕하세요, 반갑습니다.',
      '오늘 날씨가 정말 좋네요.',
      '이 영상이 매우 흥미롭습니다.',
      '자막 서비스가 정상적으로 작동하고 있습니다.',
      '실시간 음성 인식 테스트 중입니다.',
      '모바일 앱에서 자막을 확인해 보세요.',
      'AllSub 서비스를 이용해 주셔서 감사합니다.',
      '음성 인식 기능이 활성화되었습니다.',
    ];

    // 오디오 버퍼 크기에 따라 다른 텍스트 반환
    const index = audioBuffer.length % sampleTexts.length;
    return sampleTexts[index];
  }

  /**
   * 시뮬레이션 스트림 생성
   */
  private createSimulationStream(onData: (text: string) => void) {
    const sampleTexts = [
      '안녕하세요',
      '오늘 날씨가 좋네요',
      '자막 테스트 중입니다',
      '실시간 인식이 작동합니다',
      '음성을 텍스트로 변환합니다',
    ];

    let index = 0;
    const interval = setInterval(() => {
      onData(sampleTexts[index % sampleTexts.length]);
      index++;
    }, 3000);

    // Writable stream처럼 동작하도록
    const stream = new Readable({
      read() {},
    });

    (stream as any).end = () => {
      clearInterval(interval);
    };

    return stream;
  }
}

