/**
 * API utilities for handling calls to the backend
 */

// Get the appropriate API URL based on environment
export const getApiUrl = () => {
    // In browser context, use the browser-specific URL
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_BROWSER_API_URL || 'http://localhost:5000';
    }

    // In server context (SSR), use the Docker network URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000';
};

/**
 * Make a fetch request to the API with proper error handling
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                // Special handling for authentication errors
                if (response.status === 401 && endpoint.includes('login')) {
                    return {
                        success: false,
                        status: response.status,
                        data,
                        error: data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة',
                    };
                }

                return {
                    success: false,
                    status: response.status,
                    data,
                    error: data.error || data.errors || 'Unknown error',
                };
            }

            return {
                success: true,
                status: response.status,
                data,
            };
        }

        // Handle non-JSON responses
        const text = await response.text();
        if (!response.ok) {
            return {
                success: false,
                status: response.status,
                error: text || 'Unknown error',
            };
        }

        return {
            success: true,
            status: response.status,
            data: text,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}; 