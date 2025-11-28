import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  loginUser,
  fetchMe,
  logoutSession,
  getCreatorProfile,
  persistAuthSession,
  getStoredSession,
  updateStoredSession,
  clearStoredSession
} from "../api";

const AuthContext = createContext(null);

function extractUser(payload) {
  if (!payload) return null;
  if (payload.user) return payload.user;
  if (payload.data?.user) return payload.data.user;
  if (payload.data) return payload.data;
  return null;
}

function resolveCredits(user, creator) {
  if (typeof creator?.totalCredits === "number") {
    return creator.totalCredits;
  }
  if (typeof user?.totalCredits === "number") {
    return user.totalCredits;
  }
  const credits = Number(user?.credits ?? 0);
  const bonus = Number(user?.bonusCredits ?? 0);
  return credits + bonus;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(() => session?.user || null);
  const [creator, setCreator] = useState(null);
  const [credits, setCredits] = useState(() => resolveCredits(session?.user, null));
  const [bootstrapping, setBootstrapping] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = Boolean(session?.accessToken && user);

  const applySession = useCallback((nextSession) => {
    setSession(nextSession);
    setUser(nextSession?.user || null);
    if (!nextSession) {
      setCredits(0);
    }
    return nextSession;
  }, []);

  const persistSession = useCallback((payload) => {
    const next = persistAuthSession(payload);
    if (next) {
      applySession(next);
    }
    return next;
  }, [applySession]);

  const mergeSession = useCallback((patch) => {
    const updated = updateStoredSession(patch);
    if (updated) {
      applySession(updated);
    }
    return updated;
  }, [applySession]);

  const handleLogout = useCallback(async ({ remote = true } = {}) => {
    try {
      if (remote && session?.refreshToken) {
        await logoutSession(session.refreshToken);
      }
    } catch {
      // Remote logout darf die lokale Session nicht blockieren
    } finally {
      clearStoredSession();
      applySession(null);
      setCreator(null);
      setError(null);
    }
  }, [session?.refreshToken, applySession]);

  const hydrateUser = useCallback(async (accessToken) => {
    if (!accessToken) return;
    const me = await fetchMe(accessToken);
    const resolvedUser = extractUser(me);
    if (!resolvedUser) {
      const error = new Error("Nutzerinformationen fehlen");
      error.status = me?.status;
      throw error;
    }
    mergeSession({ user: resolvedUser });
    setError(null);
    return resolvedUser;
  }, [mergeSession]);

  const hydrateCreator = useCallback(async (accessToken, baseUser = null) => {
    if (!accessToken) return null;
    try {
      const profile = await getCreatorProfile(accessToken);
      if (profile && typeof profile === "object") {
        setCreator(profile);
        const referenceUser = baseUser || user;
        setCredits(resolveCredits(referenceUser, profile));
        const profileData = profile.profile || profile;
        if (profileData && typeof profileData === "object" && Object.keys(profileData).length) {
          setUser((prev) => (prev ? { ...prev, creatorProfile: profileData } : prev));
          mergeSession({ user: { creatorProfile: profileData } });
        }
      }
      return profile;
    } catch (err) {
      console.warn("Creator-Profil konnte nicht geladen werden", err);
      return null;
    }
  }, [user, mergeSession]);

  const bootstrap = useCallback(async () => {
    const stored = getStoredSession();
    applySession(stored);
    if (!stored?.accessToken) {
      setBootstrapping(false);
      setError(null);
      return;
    }

    try {
      const resolvedUser = await hydrateUser(stored.accessToken);
      const creatorProfile = await hydrateCreator(stored.accessToken, resolvedUser);
      setCredits(resolveCredits(resolvedUser, creatorProfile));
    } catch (err) {
      setError(err);
      if (err.status === 401 || /unauthorized/i.test(err.message || "")) {
        await handleLogout({ remote: false });
      }
    } finally {
      setBootstrapping(false);
    }
  }, [applySession, hydrateUser, hydrateCreator, handleLogout]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    setMutating(true);
    setError(null);
    try {
      const response = await loginUser(email, password);
      const sessionPayload = persistSession(response);
      if (!sessionPayload?.accessToken) {
        throw new Error("Login fehlgeschlagen – Tokens fehlen");
      }

      const sessionUser = sessionPayload.user || extractUser(response);
      const creatorProfile = await hydrateCreator(sessionPayload.accessToken, sessionUser);
      setCredits(resolveCredits(sessionUser, creatorProfile));

      return { user: sessionUser, creator: creatorProfile };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setMutating(false);
    }
  }, [persistSession, hydrateCreator]);

  const refreshAccount = useCallback(async () => {
    if (!session?.accessToken) return;
    setMutating(true);
    try {
      const resolvedUser = await hydrateUser(session.accessToken);
      const creatorProfile = await hydrateCreator(session.accessToken, resolvedUser);
      setCredits(resolveCredits(resolvedUser, creatorProfile));
    } finally {
      setMutating(false);
    }
  }, [session?.accessToken, hydrateUser, hydrateCreator]);

  const updateCreatorProfile = useCallback((profile) => {
    setCreator((prev) => ({ ...(prev || {}), profile }));
    setUser((prev) => (prev ? { ...prev, creatorProfile: profile } : prev));
    mergeSession({ user: { creatorProfile: profile } });
  }, [mergeSession]);

  const updateCredits = useCallback((value) => {
    const numeric = Number(value);
    const resolved = Number.isFinite(numeric) ? numeric : 0;
    setCredits(resolved);
    mergeSession({ user: { totalCredits: resolved } });
  }, [mergeSession]);

  const value = useMemo(() => ({
    session,
    user,
    creator,
    credits,
    loading: bootstrapping,
    mutating,
    error,
    isAuthenticated,
    login,
    logout: handleLogout,
    refreshAccount,
    updateCreatorProfile,
    updateCredits
  }), [
    session,
    user,
    creator,
    credits,
    bootstrapping,
    mutating,
    error,
    isAuthenticated,
    login,
    handleLogout,
    refreshAccount,
    updateCreatorProfile,
    updateCredits
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth muss innerhalb eines AuthProvider verwendet werden");
  }
  return context;
}

