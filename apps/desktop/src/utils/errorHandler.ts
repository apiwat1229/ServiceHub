import { toast } from 'vue-sonner';

export interface ApiError {
    response?: {
        status: number;
        data?: {
            message?: string;
        };
    };
    request?: any;
    message?: string;
}

export const handleApiError = (error: ApiError, customMessage?: string): string => {
    let errorMessage = customMessage || 'An error occurred. Please try again';

    if (error.response) {
        // Server responded with error
        switch (error.response.status) {
            case 400:
                errorMessage = 'Invalid data. Please check again';
                break;
            case 401:
                errorMessage = 'Please log in again';
                break;
            case 403:
                errorMessage = 'You do not have permission for this action';
                break;
            case 404:
                errorMessage = 'Data not found';
                break;
            case 500:
                errorMessage = 'Server error occurred';
                break;
        }

        // Use server error message if available
        if (error.response.data?.message) {
            errorMessage = error.response.data.message;
        }
    } else if (error.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to server';
    }

    toast.error(errorMessage, {
        description: 'Please try again',
    });

    console.error('API Error:', error);
    return errorMessage;
};
