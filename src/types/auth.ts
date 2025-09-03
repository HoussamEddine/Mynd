export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    [key: string]: any;
  };
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
} 