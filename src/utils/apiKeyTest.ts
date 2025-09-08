// Utility function to test Gemini API key validation
export const testGeminiApiKey = async (apiKey: string): Promise<{ valid: boolean; message: string }> => {
  if (!apiKey.trim()) {
    return { valid: false, message: 'API key is required' };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test message to validate the API key.'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    if (response.ok) {
      return { valid: true, message: 'API key is valid and working!' };
    } else {
      const errorData = await response.json();
      return { valid: false, message: errorData.error?.message || 'Invalid API key' };
    }
  } catch (error) {
    return { valid: false, message: 'Failed to validate API key. Please check your connection.' };
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
