import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL = "http://127.0.0.1:8000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(false);

  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("triphub_access_token");
  };

  const saveToken = (token) => {
    localStorage.setItem("triphub_access_token", token);
  };

  const removeToken = () => {
    localStorage.removeItem("triphub_access_token");
  };

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  const checkUserAuth = async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);

      return null;
    }

    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        removeToken();

        setUser(null);
        setIsAuthenticated(false);

        setAuthError({
          type: "auth_required",
          message:
            data?.detail ||
            "Authentication required",
        });

        setIsLoadingAuth(false);
        setAuthChecked(true);

        return null;
      }

      setUser(data);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);

      return data;
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      removeToken();

      setUser(null);
      setIsAuthenticated(false);

      setAuthError({
        type: "unknown",
        message:
          error?.message ||
          "Authentication failed",
      });

      setIsLoadingAuth(false);
      setAuthChecked(true);

      return null;
    }
  };

  // ============================================================
  // INITIAL AUTH CHECK
  // ============================================================

  useEffect(() => {
    checkUserAuth();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (email, password) => {
    setAuthError(null);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Invalid email or password"
        );
      }

      if (!data.access_token) {
        throw new Error(
          "Server access token qaytarmadi"
        );
      }

      // JWT saqlaymiz
      saveToken(data.access_token);

      // Token bilan current userni olamiz
      const currentUser = await checkUserAuth();

      if (!currentUser) {
        throw new Error(
          "Login qilindi, lekin user ma'lumotini olishda xatolik"
        );
      }

      return currentUser;
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setUser(null);
      setIsAuthenticated(false);

      setAuthError({
        type: "login_failed",
        message:
          error?.message ||
          "Login failed",
      });

      throw error;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = (shouldRedirect = true) => {
    removeToken();

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(true);

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async ({
    email,
    password,
    full_name,
    role = "TRAVELER",
  }) => {
    setAuthError(null);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Registration failed"
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      setAuthError({
        type: "register_failed",
        message:
          error?.message ||
          "Registration failed",
      });

      throw error;
    }
  };

  // ============================================================
  // NAVIGATE TO LOGIN
  // ============================================================

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  // ============================================================
  // CHECK APP STATE
  // ============================================================

  const checkAppState = async () => {
    return checkUserAuth();
  };

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,

        isLoadingAuth,
        isLoadingPublicSettings,

        authError,
        appPublicSettings,
        authChecked,

        login,
        register,
        logout,

        getToken,
        saveToken,
        removeToken,

        checkUserAuth,
        checkAppState,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};