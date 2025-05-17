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

interface SpeechError {
    original_word: string;
    spoken_word: string;
    error_type: 'minor' | 'severe';
    error_category?: string;
}

interface SpeechErrorsData {
    user_id: number;
    activity_id: number;
    errors: SpeechError[];
}

interface PersonalizedExercise {
    word: string;
    category: string;
    frequency: number;
    practice_sentence: string;
}

interface SpeechAnalytics {
    accuracy_trend: Array<{
        date: string;
        accuracy: number;
        story_id: string;
    }>;
    challenging_words: Array<{
        word: string;
        count: number;
    }>;
    improvement: number;
    total_activities: number;
    average_accuracy: number;
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
     * Save speech errors from a recognition activity
     * @param data Speech errors data
     * @returns Promise with response data
     */
    async saveSpeechErrors(data: SpeechErrorsData): Promise<any> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/errors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save speech errors');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving speech errors:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
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
     * Get a user's common pronunciation errors
     * @param userId User ID
     * @param errorType Optional error type filter ('minor' or 'severe')
     * @param limit Maximum number of results to return
     * @returns Promise with errors data
     */
    async getUserErrors(userId: number, errorType?: 'minor' | 'severe', limit?: number): Promise<SpeechError[]> {
        try {
            const url = new URL(`${this.apiBaseUrl}/errors/user/${userId}`);
            if (errorType) {
                url.searchParams.append('error_type', errorType);
            }
            if (limit) {
                url.searchParams.append('limit', limit.toString());
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get user errors');
            }

            const result = await response.json();
            return result.errors || [];
        } catch (error) {
            console.error('Error getting user errors:', error);
            return [];
        }
    }

    /**
     * Get personalized exercises based on user's pronunciation errors
     * @param userId User ID
     * @returns Promise with exercises data
     */
    async getPersonalizedExercises(userId: number): Promise<PersonalizedExercise[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/exercises/personalized/${userId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get personalized exercises');
            }

            const result = await response.json();
            return result.exercises || [];
        } catch (error) {
            console.error('Error getting personalized exercises:', error);
            return [];
        }
    }

    /**
     * Get comprehensive analytics on a user's pronunciation progress
     * @param userId User ID
     * @param fromDate Optional start date filter (ISO format)
     * @param toDate Optional end date filter (ISO format)
     * @returns Promise with analytics data
     */
    async getSpeechAnalytics(userId: number, fromDate?: string, toDate?: string): Promise<SpeechAnalytics> {
        try {
            const url = new URL(`${this.apiBaseUrl}/analytics/user/${userId}`);
            if (fromDate) {
                url.searchParams.append('from_date', fromDate);
            }
            if (toDate) {
                url.searchParams.append('to_date', toDate);
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get speech analytics');
            }

            const result = await response.json();
            return result.analytics || {
                accuracy_trend: [],
                challenging_words: [],
                improvement: 0,
                total_activities: 0,
                average_accuracy: 0
            };
        } catch (error) {
            console.error('Error getting speech analytics:', error);
            return {
                accuracy_trend: [],
                challenging_words: [],
                improvement: 0,
                total_activities: 0,
                average_accuracy: 0
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

    /**
     * Classify Arabic pronunciation errors
     * @param original Original word
     * @param spoken Spoken word
     * @returns Error category
     */
    classifyArabicError(original: string, spoken: string): string {
        // This implementation mirrors the backend classification logic

        // Check for length differences
        if (original.length !== spoken.length) {
            return 'length_mismatch';
        }

        // Check for common substitution patterns
        const commonSubstitutions: Record<string, string[]> = {
            'ث': ['س', 'ت'],
            'ذ': ['د', 'ز'],
            'ظ': ['ض', 'ز'],
            'ط': ['ت'],
            'ض': ['د'],
            'ص': ['س'],
            'ق': ['ك', 'ء']
        };

        for (const [correct, substitutes] of Object.entries(commonSubstitutions)) {
            if (original.includes(correct) && !spoken.includes(correct)) {
                for (const sub of substitutes) {
                    if (spoken.includes(sub)) {
                        return `substitution_${correct}_${sub}`;
                    }
                }
            }
        }

        return 'general_pronunciation';
    }
} 