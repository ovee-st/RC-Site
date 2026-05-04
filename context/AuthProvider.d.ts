import type { ReactNode } from "react";

export type AuthRole = "candidate" | "employer" | null;

export type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    picture?: string;
    role?: string;
  };
  name: string;
  username?: string | null;
  avatar?: string | null;
};

export const AuthContext: import("react").Context<{
  user: AuthUser | null;
  loading: boolean;
  role: AuthRole;
}>;

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element;

export function useAuth(): {
  user: AuthUser | null;
  loading: boolean;
  role: AuthRole;
};
