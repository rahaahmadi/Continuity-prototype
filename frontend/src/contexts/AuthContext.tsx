import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserResponse } from "@/lib/api";
import { deleteAccount as apiDeleteAccount, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "@/lib/api";

const TOKEN_KEY = "continuity_access_token";
const USER_KEY = "continuity_user";

function loadStored(): { token: string | null; user: UserResponse | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as UserResponse) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

type AuthState = {
  token: string | null;
  user: UserResponse | null;
  isInitialized: boolean;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    ...loadStored(),
    isInitialized: false,
  }));

  useEffect(() => {
    const { token, user } = loadStored();
    if (!token) {
      setState(s => ({ ...s, token: null, user: null, isInitialized: true }));
      return;
    }
    getMe(token)
      .then(me => {
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        setState({ token, user: me, isInitialized: true });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ token: null, user: null, isInitialized: true });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ token: data.access_token, user: data.user, isInitialized: true });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await apiRegister(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ token: data.access_token, user: data.user, isInitialized: true });
  }, []);

  const logout = useCallback(async () => {
    const token = state.token;
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Ignore; clear local state anyway
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState(s => ({ ...s, token: null, user: null }));
  }, [state.token]);

  const deleteAccount = useCallback(async () => {
    const token = state.token;
    if (!token) return;
    await apiDeleteAccount(token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState(s => ({ ...s, token: null, user: null }));
  }, [state.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token && !!state.user,
      login,
      register,
      logout,
      deleteAccount,
    }),
    [state, login, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
