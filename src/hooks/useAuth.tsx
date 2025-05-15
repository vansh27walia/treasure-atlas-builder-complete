
// Just re-export the auth context from the contexts folder
// This allows any component importing from hooks/useAuth to work correctly

import { useAuth } from '@/contexts/AuthContext';

export { useAuth };
export { AuthProvider } from '@/contexts/AuthContext';
