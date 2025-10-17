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
      set({ 
        isCaptionEnabled: settings.isCaptionEnabled,
        captionText: settings.captionText 
      });
    } catch (error) {
      console.log('API 호출 실패, 로컬 상태만 변경:', error.message);
      // 오프라인 모드에서는 로컬 상태만 변경
      set((state) => ({ isCaptionEnabled: !state.isCaptionEnabled }));
    }
  },

  setCaptionText: async (text: string) => {
    try {
      const { userId, isCaptionEnabled } = get();
      const settings = await ApiService.updateSettings(userId, isCaptionEnabled, text);
      set({ captionText: settings.captionText });
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
      if (settings) {
        set({ 
          isCaptionEnabled: settings.isCaptionEnabled,
          captionText: settings.captionText 
        });
      }
      // settings가 null이면 기본값 사용
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // 기본값 사용
    }
  },
}));
