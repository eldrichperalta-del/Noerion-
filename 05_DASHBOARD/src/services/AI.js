// src/services/AI.js

/**
 * NOERION AI Service
 *
 * Centralized connection and configuration layer for the AI backend.
 *
 * Used by:
 * - Admin Dashboard
 * - Assessor Dashboard
 * - Trainee Dashboard
 *
 * The actual AI endpoints will be added once provided
 * by the backend team.
 */

/* =========================================================
   CONFIGURATION
   ========================================================= */

const AI_API_URL = import.meta.env.VITE_AI_API_URL || "";

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";


/* =========================================================
   AI CONFIGURATION
   ========================================================= */

export const aiConfig = {
    baseURL: AI_API_URL,

    // API key is optional and should only be used if
    // the backend specifically requires frontend authentication.
    apiKey: AI_API_KEY,

    endpoints: {
        // Add backend endpoints here when provided.
        //
        // analyzeAssessment: "/api/ai/analyze-assessment",
        // getInsights: "/api/ai/insights",
        // getRecommendations: "/api/ai/recommendations",
    },
};


/* =========================================================
   CONFIGURATION CHECK
   ========================================================= */

/**
 * Checks whether the AI backend URL has been configured.
 */
export const isAIConfigured = () => {
    return Boolean(AI_API_URL);
};


/* =========================================================
   REQUEST HELPER
   ========================================================= */

/**
 * Centralized request handler for the AI backend.
 *
 * Backend endpoints can use this function once they are available.
 *
 * Example:
 *
 * const result = await aiRequest("/api/ai/analyze", {
 *     method: "POST",
 *     body: JSON.stringify(data),
 * });
 */
export const aiRequest = async (endpoint, options = {}) => {
    if (!AI_API_URL) {
        throw new Error(
            "AI backend URL is not configured. " +
            "Please set VITE_AI_API_URL in the environment variables."
        );
    }

    if (!endpoint) {
        throw new Error("AI API endpoint is required.");
    }

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Only attach an API key when one has been configured.
    if (AI_API_KEY) {
        headers.Authorization = `Bearer ${AI_API_KEY}`;
    }

    const response = await fetch(`${AI_API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `AI request failed with status ${response.status}.`;

        try {
            const errorData = await response.json();

            if (errorData?.message) {
                errorMessage = errorData.message;
            }
        } catch {
            // Keep the default error message when the response
            // does not contain JSON.
        }

        throw new Error(errorMessage);
    }

    // Handle responses that do not contain JSON.
    if (response.status === 204) {
        return null;
    }

    return response.json();
};


/* =========================================================
   FUTURE AI SERVICES
   ========================================================= */

// AI-specific functions will be added here once the backend
// provides the actual endpoints and request/response format.
//
// Example:
//
// export const analyzeAssessment = async (assessmentData) => {
//     return aiRequest(aiConfig.endpoints.analyzeAssessment, {
//         method: "POST",
//         body: JSON.stringify(assessmentData),
//     });
// };


export default aiConfig;