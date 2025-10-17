import { Injectable, Logger } from '@nestjs/common';
import { Translate } from '@google-cloud/translate/build/src/v2';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private client: Translate;
  private useSimulation = true;

  constructor() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new Translate();
        this.useSimulation = false;
        this.logger.log('Google Cloud Translation initialized');
      } else {
        this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not found. Using simulation mode for translation.');
        this.useSimulation = true;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud Translation:', error);
      this.useSimulation = true;
    }
  }

  /**
   * 텍스트를 목표 언어로 번역
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text || text.trim() === '') {
      return text;
    }

    if (this.useSimulation) {
      return this.simulateTranslation(text, targetLanguage);
    }

    try {
      const [translation] = await this.client.translate(text, targetLanguage);
      return translation;
    } catch (error) {
      this.logger.error('Translation error:', error);
      return text; // 번역 실패 시 원본 반환
    }
  }

  /**
   * 여러 텍스트를 한 번에 번역
   */
  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (this.useSimulation) {
      return texts.map(text => this.simulateTranslation(text, targetLanguage));
    }

    try {
      const [translations] = await this.client.translate(texts, targetLanguage);
      return Array.isArray(translations) ? translations : [translations];
    } catch (error) {
      this.logger.error('Batch translation error:', error);
      return texts; // 번역 실패 시 원본 반환
    }
  }

  /**
   * 언어 감지
   */
  async detectLanguage(text: string): Promise<string> {
    if (this.useSimulation) {
      // 한글이 포함되어 있으면 'ko', 아니면 'en'으로 가정
      return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text) ? 'ko' : 'en';
    }

    try {
      const [detection] = await this.client.detect(text);
      return detection.language;
    } catch (error) {
      this.logger.error('Language detection error:', error);
      return 'en';
    }
  }

  /**
   * 시뮬레이션 모드: 간단한 번역 규칙
   */
  private simulateTranslation(text: string, targetLanguage: string): string {
    // 한국어 -> 영어 시뮬레이션
    const koreanToEnglish: { [key: string]: string } = {
      '안녕하세요': 'Hello',
      '반갑습니다': 'Nice to meet you',
      '오늘 날씨가 정말 좋네요': 'The weather is really nice today',
      '이 영상이 매우 흥미롭습니다': 'This video is very interesting',
      '자막 서비스가 정상적으로 작동하고 있습니다': 'Subtitle service is working properly',
      '실시간 음성 인식 테스트 중입니다': 'Testing real-time speech recognition',
      '모바일 앱에서 자막을 확인해 보세요': 'Check subtitles on your mobile app',
      'AllSub 서비스를 이용해 주셔서 감사합니다': 'Thank you for using AllSub service',
      '음성 인식 기능이 활성화되었습니다': 'Speech recognition is activated',
      '안녕하세요, 반갑습니다.': 'Hello, nice to meet you.',
      '오늘 날씨가 좋네요': 'The weather is nice today',
      '자막 테스트 중입니다': 'Testing subtitles',
      '실시간 인식이 작동합니다': 'Real-time recognition is working',
      '음성을 텍스트로 변환합니다': 'Converting speech to text',
    };

    // 영어 -> 한국어 시뮬레이션
    const englishToKorean: { [key: string]: string } = {
      'Hello': '안녕하세요',
      'Nice to meet you': '반갑습니다',
      'The weather is really nice today': '오늘 날씨가 정말 좋네요',
      'This video is very interesting': '이 영상이 매우 흥미롭습니다',
      'Subtitle service is working properly': '자막 서비스가 정상적으로 작동하고 있습니다',
      'Testing real-time speech recognition': '실시간 음성 인식 테스트 중입니다',
    };

    if (targetLanguage === 'en' || targetLanguage === 'en-US') {
      return koreanToEnglish[text] || `[EN] ${text}`;
    } else if (targetLanguage === 'ko' || targetLanguage === 'ko-KR') {
      return englishToKorean[text] || `[KO] ${text}`;
    }

    return `[${targetLanguage.toUpperCase()}] ${text}`;
  }

  /**
   * 지원 언어 목록 가져오기
   */
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    if (this.useSimulation) {
      return [
        { code: 'ko', name: 'Korean' },
        { code: 'en', name: 'English' },
        { code: 'ja', name: 'Japanese' },
        { code: 'zh', name: 'Chinese' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
      ];
    }

    try {
      const [languages] = await this.client.getLanguages();
      return languages.map(lang => ({
        code: lang.code,
        name: lang.name,
      }));
    } catch (error) {
      this.logger.error('Error getting supported languages:', error);
      return [];
    }
  }
}

