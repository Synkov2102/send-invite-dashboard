import { useCallback, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "../lib/api";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    setTokenState(result.token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  return { isAuthenticated: Boolean(token), login, logout };
}
