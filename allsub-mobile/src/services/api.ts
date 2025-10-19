// Android 에뮬레이터: 10.0.2.2 = 호스트 PC의 localhost
// 실제 디바이스: PC의 실제 IP 주소 사용
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000'  // 에뮬레이터용
  : 'http://210.115.229.181:3000'; // 실제 디바이스용

export interface UserSettings {
  id: string;
  userId: string;
  isCaptionEnabled: boolean;
  captionText: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  static async getUserSettings(userId: string): Promise<UserSettings> {
    return this.request<UserSettings>(`/settings/${userId}`);
  }

  static async toggleCaption(userId: string): Promise<UserSettings> {
    return this.request<UserSettings>(`/settings/${userId}/toggle`, {
      method: 'POST',
    });
  }

  static async updateSettings(
    userId: string,
    isCaptionEnabled: boolean,
    captionText?: string
  ): Promise<UserSettings> {
    return this.request<UserSettings>(`/settings/${userId}/update`, {
      method: 'POST',
      body: JSON.stringify({
        isCaptionEnabled,
        captionText,
      }),
    });
  }
}
