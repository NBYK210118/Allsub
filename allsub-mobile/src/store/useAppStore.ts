import { create } from 'zustand';
import { ApiService } from '../services/api';

interface AppState {
  isCaptionEnabled: boolean;
  captionText: string;
  isLoading: boolean;
  userId: string;
  toggleCaption: () => Promise<void>;
  setCaptionText: (text: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadUserSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isCaptionEnabled: false,
  captionText: '가나다라마바사아자카타파하',
  isLoading: true,
  userId: 'demo-user-1', // 실제 앱에서는 로그인한 사용자 ID 사용

  toggleCaption: async () => {
    try {
      const { userId } = get();
      const settings = await ApiService.toggleCaption(userId);
      if (settings) {
        set({ 
          isCaptionEnabled: settings.isCaptionEnabled,
          captionText: settings.captionText 
        });
      } else {
        // 오프라인 모드: 로컬 상태만 변경
        console.log('오프라인 모드: 로컬 상태만 변경');
        set((state) => ({ isCaptionEnabled: !state.isCaptionEnabled }));
      }
    } catch (error: any) {
      console.log('API 호출 실패, 로컬 상태만 변경:', error?.message);
      // 오프라인 모드에서는 로컬 상태만 변경
      set((state) => ({ isCaptionEnabled: !state.isCaptionEnabled }));
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
