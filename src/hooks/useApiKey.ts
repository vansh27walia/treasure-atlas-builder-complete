
import { useState, useEffect } from 'react';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock API key loading
    setApiKey('mock-api-key');
  }, []);

  return {
    apiKey,
    isLoading,
    error
  };
};
