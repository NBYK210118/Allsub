import { Injectable, Logger } from '@nestjs/common';
import { Translate } from '@google-cloud/translate/build/src/v2';
import OpenAI from 'openai';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private client: Translate;
  private openai: OpenAI | null = null;
  private useSimulation = true;

  constructor() {
    try {
      // OpenAI API 우선 사용
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.useSimulation = false;
        this.logger.log('OpenAI Translation API initialized');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new Translate();
        this.useSimulation = false;
        this.logger.log('Google Cloud Translation initialized');
      } else {
        this.logger.warn('OPENAI_API_KEY 또는 GOOGLE_APPLICATION_CREDENTIALS not found. Using simulation mode for translation.');
        this.useSimulation = true;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Translation:', error);
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

    // OpenAI API 사용
    if (this.openai) {
      try {
        const targetLangName = targetLanguage === 'en' || targetLanguage === 'en-US' ? 'English' : 'Korean';
        
        this.logger.log(`🤖 OpenAI 번역 시작: ${text} → ${targetLangName}`);
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the given text to ${targetLangName}. Only return the translated text without any explanation or additional comments.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        });

        const translation = response.choices[0]?.message?.content?.trim() || text;
          this.logger.log(`OpenAI 번역 완료: ${translation}`);
        return translation;
      } catch (error) {
        this.logger.error('OpenAI Translation error:', error);
        return text; // 번역 실패 시 원본 반환
      }
    }

    // Google Cloud Translation API 사용
    try {
      const [translation] = await this.client.translate(text, targetLanguage);
      return translation;
    } catch (error) {
      this.logger.error('Translation error:', error);
      return text; // 번역 실패 시 원본 반환
    }
  }

  /**
   * 번역 방향에 따라 텍스트를 번역
   * @param text 원본 텍스트
   * @param direction 번역 방향 ('ko-to-en' | 'en-to-ko')
   */
  async translateByDirection(text: string, direction: 'ko-to-en' | 'en-to-ko'): Promise<string> {
    if (!text || text.trim() === '') {
      return text;
    }

    this.logger.log(`translateByDirection 호출됨`);
    this.logger.log(`   원본 텍스트: ${text}`);
    this.logger.log(`   번역 방향: ${direction}`);
    
    const targetLanguage = direction === 'ko-to-en' ? 'en' : 'ko';
    this.logger.log(`   타겟 언어: ${targetLanguage}`);
    
    const result = await this.translate(text, targetLanguage);
    this.logger.log(`   번역 결과: ${result}`);
    
    return result;
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
    // 간단한 규칙 기반 번역 (시뮬레이션)
    // 실제로는 사전에 없는 모든 텍스트를 번역하지 않고 [EN] 또는 [KO] 태그만 붙임
        this.logger.log(`시뮬레이션 모드: 사전에 없는 텍스트는 태그만 추가됩니다`);
      this.logger.log(`Google Cloud Translation API를 사용하려면 GOOGLE_APPLICATION_CREDENTIALS를 설정하세요`);
    
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
      '이 영상은 유료광고를 포함하고 있습니다': 'This video contains paid advertisements',
      'MBC 뉴스 이덕영입니다': 'This is MBC News, Lee Deok-young',
      '삐-': 'Beep-',
      '고맙습니다.': 'Thank you.',
      '시청해주셔서 감사합니다!': 'Thank you for watching!',
      '시청해 주셔서 감사합니다.': 'Thank you for watching.',
      '미야네': 'Miyane',
      '어우 춤추는 냄새 나네': 'Wow, it smells like dancing',
    };

    // 영어 -> 한국어 시뮬레이션
    const englishToKorean: { [key: string]: string } = {
      'Hello': '안녕하세요',
      'Nice to meet you': '반갑습니다',
      'The weather is really nice today': '오늘 날씨가 정말 좋네요',
      'This video is very interesting': '이 영상이 매우 흥미롭습니다',
      'Subtitle service is working properly': '자막 서비스가 정상적으로 작동하고 있습니다',
      'Testing real-time speech recognition': '실시간 음성 인식 테스트 중입니다',
      'Check subtitles on your mobile app': '모바일 앱에서 자막을 확인해 보세요',
      'Thank you for using AllSub service': 'AllSub 서비스를 이용해 주셔서 감사합니다',
      'Speech recognition is activated': '음성 인식 기능이 활성화되었습니다',
      'The weather is nice today': '오늘 날씨가 좋네요',
      'Testing subtitles': '자막 테스트 중입니다',
      'Real-time recognition is working': '실시간 인식이 작동합니다',
      'Converting speech to text': '음성을 텍스트로 변환합니다',
      'This video contains paid advertisements': '이 영상은 유료광고를 포함하고 있습니다',
      'This is MBC News, Lee Deok-young': 'MBC 뉴스 이덕영입니다',
      'Beep-': '삐-',
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

