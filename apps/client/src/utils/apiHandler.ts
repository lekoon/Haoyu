export interface ApiFallbackOptions<T> {
    fallbackValue?: T;
    isDemoMode?: boolean;
    silent?: boolean;
}

/**
 * Unified API Error Handler
 * Handles API errors consistently, logs them, and determines whether to use fallback data.
 */
export const handleApiOperation = async <T>(
    operation: () => Promise<T>,
    context: string,
    options: ApiFallbackOptions<T> = {}
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        const isNetworkError = !error.response && error.code === 'ERR_NETWORK';
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;

        console.group(`API Error: ${context}`);
        console.error('Error Details:', error);

        if (isAuthError) {
            console.warn('Authentication failed. Please check your login status.');
        }

        if (error.response?.data) {
            console.error('Server Response:', error.response.data);
        }
        console.groupEnd();

        // If we have a fallback value (Demo Mode enabled or Network Error)
        if (options.fallbackValue !== undefined) {
            // Only fallback on Network Error or explicitly requested Demo Mode
            // We do NOT fallback on 400 (Bad Request) or 401 (Auth) usually, 
            // but for this specific "local debugging" request, we might want to be permissive 
            // OR strict to help troubleshooting.

            // Current User Request: "Backend no reaction, please troubleshoot".
            // Strict behavior is better for troubleshooting.

            if (isNetworkError || options.isDemoMode) {
                if (!options.silent) {
                    console.warn(`Falling back to local/demo data for ${context} due to network issue.`);
                }
                return options.fallbackValue;
            }
        }

        // Re-throw if we didn't fallback
        throw error;
    }
};
