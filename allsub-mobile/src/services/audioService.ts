import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioServiceState {
  isRecording: boolean;
  hasPermission: boolean;
  recording: Audio.Recording | null;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private hasPermission = false;
  private recordingInterval: NodeJS.Timeout | null = null;
  private onAudioChunkCallback?: (audioData: string) => void;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
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
      if (!granted) return false;
    }

    try {
      this.onAudioChunkCallback = onAudioChunk;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 주기적으로 녹음을 시작하고 중지하여 청크 생성
      this.startChunkedRecording(chunkDuration);
      return true;
    } catch (error) {
      console.error('Failed to start streaming recording:', error);
      return false;
    }
  }

  /**
   * 청크 단위로 녹음 수행
   */
  private async startChunkedRecording(chunkDuration: number) {
    this.isRecording = true;

    const recordChunk = async () => {
      if (!this.isRecording) return;

      try {
        // 새로운 녹음 시작
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 16000, // Speech recognition에 최적화된 샘플레이트
            numberOfChannels: 1, // 모노
            bitRate: 64000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 64000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 64000,
          },
        });

        await recording.startAsync();

        // chunkDuration 후 녹음 중지 및 전송
        setTimeout(async () => {
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (uri && this.onAudioChunkCallback) {
              // 파일을 Base64로 읽어서 전송
              const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });

              this.onAudioChunkCallback(base64Audio);

              // 임시 파일 삭제
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }

            // 다음 청크 녹음
            if (this.isRecording) {
              recordChunk();
            }
          } catch (error) {
            console.error('Error processing audio chunk:', error);
            if (this.isRecording) {
              recordChunk();
            }
          }
        }, chunkDuration);
      } catch (error) {
        console.error('Error recording chunk:', error);
        if (this.isRecording) {
          // 에러 발생 시 재시도
          setTimeout(() => recordChunk(), 1000);
        }
      }
    };

    recordChunk();
  }

  async stopRecording(): Promise<void> {
    this.isRecording = false;
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      this.recording = null;
    }

    this.onAudioChunkCallback = undefined;
  }

  getState(): AudioServiceState {
    return {
      isRecording: this.isRecording,
      hasPermission: this.hasPermission,
      recording: this.recording,
    };
  }

  async cleanup() {
    await this.stopRecording();
  }
}

export default new AudioService();
