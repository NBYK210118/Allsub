import { create } from 'zustand';
import { ApiService } from '../services/api';

export type TranslationDirection = 'ko-to-en' | 'en-to-ko';
export type MicrophoneMode = 'auto' | 'push-to-talk';

interface AppState {
  isCaptionEnabled: boolean;
  captionText: string;
  isLoading: boolean;
  userId: string;
  translationDirection: TranslationDirection;
  microphoneMode: MicrophoneMode;
  isPushToTalkActive: boolean; // Push-to-Talk 버튼이 눌려있는지 여부
  toggleCaption: () => Promise<void>;
  setCaptionText: (text: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setTranslationDirection: (direction: TranslationDirection) => void;
  setMicrophoneMode: (mode: MicrophoneMode) => void;
  setIsPushToTalkActive: (active: boolean) => void;
  loadUserSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isCaptionEnabled: false,
  captionText: '', // 샘플 자막 제거
  isLoading: true,
  userId: 'demo-user-1', // 실제 앱에서는 로그인한 사용자 ID 사용
  translationDirection: 'ko-to-en', // 기본값: 한글 → 영문
  microphoneMode: 'push-to-talk', // 기본값: 눌러서 말하기
  isPushToTalkActive: false, // 기본값: 버튼 눌리지 않음

  toggleCaption: async () => {
    console.log('');
    console.log('------------------------------');
    console.log('toggleCaption() 호출됨 (프론트엔드)');
    console.log('------------------------------');
    
    // 즉시 로컬 상태 변경 (빠른 UI 반응)
    const currentState = get().isCaptionEnabled;
    const newState = !currentState;
    const { userId } = get();
    
    console.log('현재 상태:', currentState ? 'ON' : 'OFF');
    console.log('새 상태:', newState ? 'ON' : 'OFF');
    console.log('User ID:', userId);
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('');
    
    set({ isCaptionEnabled: newState });
    console.log('로컬 상태 즉시 변경 완료:', newState ? 'ON' : 'OFF');
    console.log('');
    
    // 백엔드 동기화 (백그라운드)
    console.log('백엔드로 API 요청 전송 시작...');
    console.log('   API 호출: ApiService.toggleCaption()');
    console.log('');
    
    try {
      const settings = await ApiService.toggleCaption(userId);
      
      if (settings) {
        console.log('백엔드 응답 수신 성공');
        console.log('서버 상태:', settings.isCaptionEnabled ? 'ON' : 'OFF');
        console.log('로컬 상태:', newState ? 'ON' : 'OFF');
        
        // 서버 응답이 로컬 상태와 다르면 서버 상태로 업데이트
        if (settings.isCaptionEnabled !== newState) {
          console.log('서버 상태와 로컬 상태가 달라 서버 상태로 동기화');
          set({ 
            isCaptionEnabled: settings.isCaptionEnabled,
            captionText: settings.captionText 
          });
          console.log('최종 상태:', settings.isCaptionEnabled ? 'ON' : 'OFF');
        } else {
          console.log('서버 상태와 로컬 상태 일치');
        }
      } else {
        console.log('백엔드 응답이 null입니다');
      }
      
      console.log('------------------------------');
      console.log('');
    } catch (error: any) {
      console.error('API 호출 실패:');
      console.error('   Error:', error?.message || error);
      console.error('   Error Type:', error?.name);
      console.error('   Error Stack:', error?.stack);
      console.error('로컬 상태 유지:', newState ? 'ON' : 'OFF');
      console.error('------------------------------');
      console.error('');
      // 로컬 상태는 이미 변경되었으므로 그대로 유지
    }
  },

  setCaptionText: async (text: string) => {
    try {
      const { userId, isCaptionEnabled } = get();
      const settings = await ApiService.updateSettings(userId, isCaptionEnabled, text);
      if (settings) {
        set({ captionText: settings.captionText });
      } else {
        // 오프라인 모드: 로컬 상태만 변경
        console.log('오프라인 모드: 로컬 상태만 변경');
        set({ captionText: text });
      }
    } catch (error) {
      console.error('Failed to update caption text:', error);
      // 오프라인 모드에서는 로컬 상태만 변경
      set({ captionText: text });
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setTranslationDirection: (direction: TranslationDirection) => {
    set({ translationDirection: direction });
    console.log('Translation direction changed to:', direction);
  },

  setMicrophoneMode: (mode: MicrophoneMode) => {
    set({ microphoneMode: mode });
    console.log('Microphone mode changed to:', mode);
  },

  setIsPushToTalkActive: (active: boolean) => {
    set({ isPushToTalkActive: active });
    console.log('Push-to-Talk active:', active);
  },

  loadUserSettings: async () => {
    try {
      const { userId } = get();
      const settings = await ApiService.getUserSettings(userId);
      if (settings && settings.captionText) {
        // 항상 OFF로 시작하도록 강제
        set({ 
          isCaptionEnabled: false, // 항상 OFF로 시작
          captionText: settings.captionText 
        });
        console.log('User settings loaded from server');
      } else {
        // settings가 null이면 기본값 사용
        console.log('Using default settings (server not available)');
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // 기본값 사용 (이미 false로 설정됨)
    }
  },
}));
