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
