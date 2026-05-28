import { supabase } from '../services/supabase';

export const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = await getAuthHeader();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    }
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return await response.json();
};
