import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("bizny_token"));

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ["auth", "me", token],
    },
  });

  const login = (newToken: string) => {
    localStorage.setItem("bizny_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("bizny_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isLoading: !!token && isUserLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
