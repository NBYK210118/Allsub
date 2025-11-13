import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private openai: OpenAI | null = null;
  private useSimulation = true;

  constructor() {
    try {
      // OpenAI API 키가 있으면 실제 Whisper API 사용
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.useSimulation = false;
        this.logger.log('OpenAI Whisper API initialized');
      } else {
        this.logger.warn('OPENAI_API_KEY not found. Using simulation mode.');
        this.logger.warn('실제 음성 인식을 사용하려면:');
        this.logger.warn('   1. OpenAI API 키 발급: https://platform.openai.com/api-keys');
        this.logger.warn('   2. 환경 변수 설정: export OPENAI_API_KEY="sk-..."');
        this.logger.warn('   3. 서버 재시작');
        this.useSimulation = true;
      }
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI Whisper:', error);
      this.useSimulation = true;
    }
  }

  /**
   * 오디오 버퍼를 텍스트로 변환 (Whisper API)
   */
  async transcribeAudio(audioBuffer: Buffer, languageCode: string = 'ko'): Promise<string> {
    if (this.useSimulation) {
      this.logger.warn('시뮬레이션 모드: 실제 음성 인식을 사용하려면 OPENAI_API_KEY를 설정하세요');
      return ''; // 시뮬레이션 샘플 텍스트 제거
    }

    try {
      // 임시 파일 생성 (Whisper API는 파일 필요)
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `audio_${randomUUID()}.m4a`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      this.logger.log(`Whisper API 호출 중... (언어: ${languageCode})`);

      // Whisper API 호출
      const transcription = await this.openai!.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: languageCode === 'ko-KR' ? 'ko' : languageCode,
        response_format: 'text',
      });

      // 임시 파일 삭제
      fs.unlinkSync(tempFilePath);

      const text = transcription.trim();
      
      if (text) {
        this.logger.log(`음성 인식 완료: ${text.substring(0, 50)}...`);
      } else {
          this.logger.warn('음성 인식 결과 없음 (소리가 너무 작거나 없음)');
      }

      return text;
    } catch (error: any) {
      this.logger.error('Whisper API 에러:', error?.message);
      this.logger.error('상세 에러:', error);
      
      // 에러 발생 시 빈 문자열 반환 (시뮬레이션 사용 안 함)
      return '';
    }
  }

  /**
   * 시뮬레이션 모드: 테스트용 샘플 텍스트 반환
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
    const text = sampleTexts[index];
    
    this.logger.log(`🎭 시뮬레이션 모드: ${text}`);
    
    return text;
  }

  /**
   * 현재 모드 확인
   */
  isUsingSimulation(): boolean {
    return this.useSimulation;
  }

  /**
   * 서비스 상태 정보
   */
  getStatus() {
    return {
      mode: this.useSimulation ? 'simulation' : 'whisper-api',
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      ready: true,
    };
  }
}

