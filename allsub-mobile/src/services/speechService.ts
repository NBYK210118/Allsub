import * as Speech from 'expo-speech';

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

class SpeechService {
  private isListening = false;
  private currentText = '';
  private onResultCallback?: (result: SpeechRecognitionResult) => void;

  async initialize(): Promise<boolean> {
    try {
      // Speech recognition is available on device
      return true;
    } catch (error) {
      console.error('Failed to initialize speech service:', error);
      return false;
    }
  }

  async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    language: string = 'ko-KR'
  ): Promise<boolean> {
    try {
      this.onResultCallback = onResult;
      this.isListening = true;
      this.currentText = '';

      // For now, we'll simulate speech recognition
      // In a real implementation, you would use a speech recognition API
      this.simulateSpeechRecognition();
      
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    this.onResultCallback = undefined;
  }

  private simulateSpeechRecognition() {
    // Simulate real-time speech recognition
    const sampleTexts = [
      "안녕하세요",
      "오늘 날씨가 좋네요",
      "이 영상이 정말 재미있어요",
      "자막이 잘 나오고 있나요?",
      "테스트 중입니다",
      "음성 인식이 작동하고 있습니다",
      "실시간 자막 서비스입니다",
      "AllSub 앱을 사용하고 계십니다"
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (!this.isListening || !this.onResultCallback) {
        clearInterval(interval);
        return;
      }

      const text = sampleTexts[currentIndex % sampleTexts.length];
      this.currentText = text;

      this.onResultCallback({
        text: this.currentText,
        confidence: 0.9,
        isFinal: true
      });

      currentIndex++;
    }, 3000); // 3초마다 새로운 텍스트 생성
  }

  getState() {
    return {
      isListening: this.isListening,
      currentText: this.currentText
    };
  }
}

export default new SpeechService();
