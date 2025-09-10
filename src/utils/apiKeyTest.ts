import geminiService from '../services/geminiService';

// Utility function to test Gemini API key validation
export const testGeminiApiKey = async (apiKey: string): Promise<{ valid: boolean; message: string; models?: string[] }> => {
  if (!apiKey.trim()) {
    return { valid: false, message: 'API key is required' };
  }

  try {
    const result = await geminiService.testApiKey(apiKey);
    return result;
  } catch (error) {
    return { 
      valid: false, 
      message: `API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Utility function to get user's saved API key
export const getUserApiKey = (userEmail: string): string | null => {
  if (typeof window === 'undefined' || !userEmail) return null;
  return localStorage.getItem(`gemini_api_key_${userEmail}`);
};

// Utility function to save user's API key
export const saveUserApiKey = (userEmail: string, apiKey: string): void => {
  if (typeof window === 'undefined' || !userEmail) return;
  localStorage.setItem(`gemini_api_key_${userEmail}`, apiKey);
};

// Utility function to remove user's API key
export const removeUserApiKey = (userEmail: string): void => {
  if (typeof window === 'undefined' || !userEmail) return;
  localStorage.removeItem(`gemini_api_key_${userEmail}`);
};
