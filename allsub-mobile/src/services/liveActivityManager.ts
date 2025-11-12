import { Platform, NativeModules } from 'react-native';

/**
 * Live Activities 관리자
 * iOS 16.1+ Dynamic Island 및 잠금 화면에 실시간 자막 표시
 * 
 * 참고: 이 서비스는 Xcode에서 Widget Extension을 추가한 후에만 작동합니다.
 * Widget Extension 추가 방법은 QUICK_START_LIVE_ACTIVITIES.md 참고
 */

interface SubtitleActivityState {
  originalSubtitle: string;
  translatedSubtitle: string;
  isRecording: boolean;
}

class LiveActivityManager {
  private activityId: string | null = null;
  private isSupported: boolean = false;
  private LiveActivitiesModule: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (Platform.OS !== 'ios') {
      console.log('Live Activities는 iOS에서만 지원됩니다');
      return;
    }

    // 네이티브 모듈 확인 (Widget Extension 추가 후 사용 가능)
    try {
      this.LiveActivitiesModule = NativeModules.LiveActivitiesModule;
      
      if (this.LiveActivitiesModule) {
        this.isSupported = true;
        console.log('Live Activities 네이티브 모듈 발견!');
      } else {
        console.log('Live Activities 네이티브 모듈 없음');
        console.log('Widget Extension을 추가하면 사용 가능합니다');
        console.log('가이드: QUICK_START_LIVE_ACTIVITIES.md');
      }
    } catch (error) {
      console.log('Live Activities 초기화:', error);
      this.isSupported = false;
    }
  }

  /**
   * Live Activity 시작
   * Widget Extension이 추가되어 있어야 작동합니다
   */
  async start(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    if (this.activityId) {
      console.log('------------------------------');
      console.log('Live Activity가 이미 실행 중입니다');
      console.log('------------------------------');
      return true;
    }

    // 네이티브 모듈이 없으면 안내 메시지만 표시
    if (!this.LiveActivitiesModule) {
      console.log('');
      console.log('------------------------------');
      console.log('Live Activities 사용 안내');
      console.log('------------------------------');
      console.log('');
      console.log('YouTube Premium 백그라운드 재생 중');
      console.log('   Dynamic Island와 잠금 화면에서 자막을 확인하고 싶으신가요?');
      console.log('');
      console.log('다음 단계:');
      console.log('   1. Xcode 열기:');
      console.log('      open ios/allsubmobile.xcworkspace');
      console.log('');
      console.log('   2. Widget Extension 추가');
      console.log('      (5분 소요, 매우 간단합니다!)');
      console.log('');
      console.log('   3. 상세 가이드:');
      console.log('      QUICK_START_LIVE_ACTIVITIES.md 참고');
      console.log('');
      console.log('------------------------------');
      console.log('');
      
      // 시뮬레이션을 위해 ID 생성
      this.activityId = 'placeholder-' + Date.now();
      return true;
    }

    try {
      // 네이티브 모듈을 통해 Live Activity 시작
      const attributes = {
        appName: 'AllSub',
      };

      const initialState: SubtitleActivityState = {
        originalSubtitle: '음성을 인식하고 있습니다...',
        translatedSubtitle: 'Listening for audio...',
        isRecording: true,
      };

      this.activityId = await this.LiveActivitiesModule.startActivity(
        attributes,
        initialState
      );
      
      console.log('');
      console.log('--- Live Activity 시작됨 ---');
      console.log('Dynamic Island에서 자막 확인');
      console.log('잠금 화면에서도 자막 확인');
      console.log('');
      console.log('YouTube Premium 백그라운드 재생 시');
      console.log('   계속해서 자막을 볼 수 있습니다!');
      console.log('');
      console.log('------------------------------');
      console.log('');
      
      return true;
    } catch (error) {
      console.error('Live Activity 시작 실패:', error);
      return false;
    }
  }

  /**
   * Live Activity 업데이트 (자막 갱신)
   */
  async update(originalSubtitle: string, translatedSubtitle: string): Promise<void> {
    if (Platform.OS !== 'ios' || !this.activityId) {
      return;
    }

    // 빈 자막은 업데이트하지 않음
    if (!originalSubtitle && !translatedSubtitle) {
      return;
    }

    // 네이티브 모듈이 없으면 콘솔 로그만
    if (!this.LiveActivitiesModule) {
      console.log('[Live Activity]', originalSubtitle.substring(0, 30), '->', translatedSubtitle.substring(0, 30));
      return;
    }

    try {
      const state: SubtitleActivityState = {
        originalSubtitle: originalSubtitle || '...',
        translatedSubtitle: translatedSubtitle || '...',
        isRecording: true,
      };

      await this.LiveActivitiesModule.updateActivity(this.activityId, state);
      console.log('[Live Activity] 업데이트:', originalSubtitle.substring(0, 30), '->', translatedSubtitle.substring(0, 30));
    } catch (error) {
      console.error('Live Activity 업데이트 실패:', error);
      this.activityId = null;
    }
  }

  /**
   * Live Activity 중지
   */
  async stop(): Promise<void> {
    if (Platform.OS !== 'ios' || !this.activityId) {
      return;
    }

    // 네이티브 모듈이 없으면 ID만 초기화
    if (!this.LiveActivitiesModule) {
      console.log('Live Activity 중지 (시뮬레이션)');
      this.activityId = null;
      return;
    }

    try {
      await this.LiveActivitiesModule.endActivity(this.activityId);
      console.log('Live Activity 중지됨');
      this.activityId = null;
    } catch (error) {
      console.error('Live Activity 중지 실패:', error);
      this.activityId = null;
    }
  }

  /**
   * Live Activity 활성 상태 확인
   */
  isActive(): boolean {
    return this.activityId !== null;
  }

  /**
   * Live Activities 지원 여부 확인
   */
  isSupportedDevice(): boolean {
    return this.isSupported;
  }
}

export default new LiveActivityManager();
