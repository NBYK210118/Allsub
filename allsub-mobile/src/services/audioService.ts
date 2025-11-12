import { Audio } from 'expo-av';

export interface AudioServiceState {
  isRecording: boolean;
  hasPermission: boolean;
  recording: Audio.Recording | null;
}

class AudioService {
  private currentRecording: Audio.Recording | null = null;
  private isRecording = false;
  private hasPermission = false;
  private recordingTimer: NodeJS.Timeout | null = null;
  private onAudioChunkCallback?: (audioData: string) => void;
  private isProcessingChunk = false; // 청크 처리 중 플래그

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('');
      console.log('------------------------------');
      console.log('마이크 권한 요청');
      console.log('------------------------------');
      
      const { status } = await Audio.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (this.hasPermission) {
        console.log('마이크 권한 허용됨!');
      } else {
        console.log('마이크 권한 거부됨!');
        console.log('설정 > AllSub > 마이크 권한 확인 필요');
      }
      console.log('------------------------------');
      console.log('');
      
      return this.hasPermission;
    } catch (error) {
      console.error('');
      console.error('------------------------------');
      console.error('마이크 권한 요청 실패');
      console.error('------------------------------');
      console.error('Error:', error);
      console.error('------------------------------');
      console.error('');
      return false;
    }
  }

  /**
   * 실시간 오디오 스트리밍 시작
   * 일정 간격으로 오디오 청크를 캡처하여 콜백으로 전달
   */
  async startStreamingRecording(
    onAudioChunk: (audioData: string) => void,
    chunkDuration: number = 2000, // 2초마다 청크 전송
  ): Promise<boolean> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('마이크 권한이 없어 녹음을 시작할 수 없습니다');
        return false;
      }
    }

    try {
      console.log('');
      console.log('------------------------------');
      console.log('오디오 녹음 시작');
      console.log('------------------------------');
      console.log('청크 간격:', chunkDuration, 'ms');
      console.log('샘플레이트: 16000 Hz');
      console.log('채널: 모노 (1)');
      console.log('------------------------------');
      console.log('');
      
      this.onAudioChunkCallback = onAudioChunk;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 주기적으로 녹음을 시작하고 중지하여 청크 생성
      this.startChunkedRecording(chunkDuration);
      
      console.log('오디오 녹음 시작 성공!');
      console.log('');
      
      return true;
    } catch (error) {
      console.error('');
      console.error('------------------------------');
      console.error('오디오 녹음 시작 실패');
      console.error('------------------------------');
      console.error('Error:', error);
      console.error('------------------------------');
      console.error('');
      return false;
    }
  }

  /**
   * ArrayBuffer를 Base64로 변환
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 청크 단위로 녹음 수행
   * 완전히 재설계: 순차적 녹음 보장
   */
  private async startChunkedRecording(chunkDuration: number) {
    this.isRecording = true;

    const processOneChunk = async () => {
      // 처리 중이면 대기
      if (this.isProcessingChunk) {
        console.log('이전 청크 처리 중... 대기');
        return;
      }

      // 중지되었으면 종료
      if (!this.isRecording) {
        return;
      }

      this.isProcessingChunk = true;

      try {
        // 1. 이전 Recording 객체 완전히 정리
        if (this.currentRecording) {
          try {
            await this.currentRecording.stopAndUnloadAsync();
          } catch (e) {
            // 무시
          }
          this.currentRecording = null;
        }

        // 2. 새 Recording 객체 생성
        this.currentRecording = new Audio.Recording();
        
        // 3. 녹음 준비
        await this.currentRecording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        // 4. 녹음 시작
        await this.currentRecording.startAsync();

        // 5. chunkDuration 동안 대기
        await new Promise(resolve => setTimeout(resolve, chunkDuration));

        // 6. 녹음 중지 (null 체크)
        if (!this.currentRecording) {
          console.warn('Recording object is null - 녹음 중 객체가 정리되었습니다');
          return; // 다음 청크로 계속
        }
        
        const recordingToStop = this.currentRecording;
        await recordingToStop.stopAndUnloadAsync();
        const uri = recordingToStop.getURI();

        // 7. 오디오 파일 처리
        if (uri && this.onAudioChunkCallback) {
          try {
            // React Native fetch는 file:// URI를 base64로 직접 읽을 수 있음
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Blob을 ArrayBuffer로 변환 후 base64 인코딩
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const fileReaderInstance = new FileReader();
              fileReaderInstance.onload = () => {
                resolve(fileReaderInstance.result as ArrayBuffer);
              };
              fileReaderInstance.onerror = reject;
              fileReaderInstance.readAsArrayBuffer(blob);
            });

            // ArrayBuffer를 base64로 변환
            const base64Audio = this.arrayBufferToBase64(arrayBuffer);

            console.log('오디오 청크 전송 (크기:', Math.round(base64Audio.length / 1024), 'KB)');
            this.onAudioChunkCallback(base64Audio);

            // Note: React Native의 file:// URI는 자동으로 정리됨
          } catch (fileError) {
            console.error('파일 처리 에러:', fileError);
          }
        }

        // 8. Recording 객체 정리
        this.currentRecording = null;
        
      } catch (error: any) {
        console.error('녹음 에러:', error?.message || error);
        
        // Recording 객체 정리
        if (this.currentRecording) {
          try {
            await this.currentRecording.stopAndUnloadAsync();
          } catch (e) {
            // 무시
          }
          this.currentRecording = null;
        }
      } finally {
        this.isProcessingChunk = false;
      }
    };

    // setInterval로 주기적으로 청크 처리
    // 재귀 호출 대신 interval 사용하여 안정성 확보
    this.recordingTimer = setInterval(() => {
      processOneChunk();
    }, chunkDuration + 300); // 청크 길이 + 300ms 여유

    // 즉시 첫 번째 청크 시작
    processOneChunk();
  }

  async stopRecording(): Promise<void> {
    console.log('오디오 녹음 중지 중...');
    
    this.isRecording = false;
    this.isProcessingChunk = false;
    
    // Timer 정리
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    // 현재 Recording 객체 정리
    if (this.currentRecording) {
      try {
        await this.currentRecording.stopAndUnloadAsync();
      } catch (error) {
        // 이미 중지된 경우 무시
      }
      this.currentRecording = null;
    }

    this.onAudioChunkCallback = undefined;
    
    console.log('오디오 녹음 중지 완료');
  }

  getState(): AudioServiceState {
    return {
      isRecording: this.isRecording,
      hasPermission: this.hasPermission,
      recording: this.currentRecording,
    };
  }

  async cleanup() {
    await this.stopRecording();
  }
}

export default new AudioService();
