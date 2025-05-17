interface SpeechActivityData {
    user_id: number;
    story_id: string;
    original_text: string;
    recognized_text: string;
    accuracy: number;
    audio_data?: string; // Base64 encoded audio data
}

interface SpeechActivityResponse {
    success: boolean;
    data?: {
        activity_id: number;
        accuracy: number;
        created_at: string;
    };
    error?: string;
}

interface SpeechStats {
    total_activities: number;
    average_accuracy: number;
    highest_accuracy: number;
    improvement_trend: number;
    most_recent_accuracy: number;
}

export class SpeechService {
    private apiBaseUrl: string;

    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api/speech';
    }

    /**
     * Save a speech recognition activity
     * @param data Speech activity data
     * @returns Promise with response data
     */
    async saveSpeechActivity(data: SpeechActivityData): Promise<SpeechActivityResponse> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save speech activity');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving speech activity:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Get speech recognition history for a user
     * @param userId User ID
     * @param storyId Optional story ID filter
     * @returns Promise with history data
     */
    async getSpeechHistory(userId: number, storyId?: string): Promise<any[]> {
        try {
            const url = new URL(`${this.apiBaseUrl}/history/${userId}`);
            if (storyId) {
                url.searchParams.append('story_id', storyId);
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get speech history');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting speech history:', error);
            return [];
        }
    }

    /**
     * Get speech recognition statistics for a user
     * @param userId User ID
     * @param storyId Optional story ID filter
     * @returns Promise with stats data
     */
    async getSpeechStats(userId: number, storyId?: string): Promise<SpeechStats> {
        try {
            const url = new URL(`${this.apiBaseUrl}/stats/${userId}`);
            if (storyId) {
                url.searchParams.append('story_id', storyId);
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get speech stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting speech stats:', error);
            return {
                total_activities: 0,
                average_accuracy: 0,
                highest_accuracy: 0,
                improvement_trend: 0,
                most_recent_accuracy: 0
            };
        }
    }

    /**
     * Convert Blob to base64 string
     * @param blob Audio blob
     * @returns Promise with base64 string
     */
    async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
} 