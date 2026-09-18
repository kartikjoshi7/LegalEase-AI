/**
 * API Client
 * 
 * Configures the base fetch client pointing to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  simplifyJargon: async (documentId: string, text: string) => {
    const response = await fetch(`${API_BASE_URL}/analyze/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, target_text: text }),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },

  askQuestion: async (documentId: string, documentText: string, question: string) => {
    const response = await fetch(`${API_BASE_URL}/analyze/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, document_text: documentText, question }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.detail?.message || errorData?.message || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return response.json();
  },

  async post(endpoint: string, body: Record<string, unknown>) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.detail?.message || errorData?.message || (Array.isArray(errorData?.detail) ? errorData.detail[0]?.msg : null) || `API Error: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    return response.json();
  },

  async postFormData(endpoint: string, formData: FormData) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.detail?.message || errorData?.message || (Array.isArray(errorData?.detail) ? errorData.detail[0]?.msg : null) || `API Error: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    return response.json();
  }
};
