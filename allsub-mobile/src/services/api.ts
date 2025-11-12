import { API_BASE_URL } from '../config/environment';

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
    
    console.log('');
    console.log('--- REST API 요청 전송 ---');
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('요청 시간:', new Date().toLocaleString('ko-KR'));
    console.log('------------------------------');
    console.log('');
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('응답 수신:');
      console.log('   Status:', response.status);
      console.log('   Status Text:', response.statusText);
      console.log('   OK:', response.ok);
      console.log('');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러:');
        console.error('   Status:', response.status);
        console.error('   Error Text:', errorText);
        console.error('');
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('응답 성공');
      console.log('   Data:', JSON.stringify(data, null, 2));
      console.log('------------------------------');
      console.log('');
      
      return data;
    } catch (error: any) {
      console.error('요청 실패:');
      console.error('   URL:', url);
      console.error('   Error:', error?.message || error);
      console.error('   Error Type:', error?.name);
      console.error('------------------------------');
      console.error('');
      throw error;
    }
  }

  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      return await this.request<UserSettings>(`/settings/${userId}`);
    } catch (error) {
      console.log('Failed to fetch user settings from server:', error);
      return null;
    }
  }

  static async toggleCaption(userId: string): Promise<UserSettings | null> {
    try {
      return await this.request<UserSettings>(`/settings/${userId}/toggle`, {
      method: 'POST',
    });
    } catch (error) {
      console.log('Failed to toggle caption on server:', error);
      return null;
    }
  }

  static async updateSettings(
    userId: string,
    isCaptionEnabled: boolean,
    captionText?: string
  ): Promise<UserSettings | null> {
    try {
      return await this.request<UserSettings>(`/settings/${userId}/update`, {
      method: 'POST',
      body: JSON.stringify({
        isCaptionEnabled,
        captionText,
      }),
    });
    } catch (error) {
      console.log('Failed to update settings on server:', error);
      return null;
    }
  }
}
