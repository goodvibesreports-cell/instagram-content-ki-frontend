import axios from "axios";

export const BACKEND_URL = import.meta.env.VITE_API_URL || "https://instagram-content-ki-backend.onrender.com";

const SESSION_STORAGE_KEY = "ic-ki-auth-session";
const storage = typeof window !== "undefined" ? window.localStorage : null;

function loadStoredSession() {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
  }

  const legacy = storage.getItem("authToken");
  if (legacy) {
    const fallback = { accessToken: legacy, refreshToken: null };
    storage.removeItem("authToken");
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
  return null;
}

let cachedSession = loadStoredSession();

function persistRawSession(session) {
  cachedSession = session;
  if (!storage) {
    return session;
  }
  if (session) {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    storage.removeItem(SESSION_STORAGE_KEY);
  }
  return session;
}

function normalizeAuthPayload(payload, fallbackUser = null) {
  if (!payload) return null;
  const tokens = payload.tokens || {};
  const accessToken = tokens.accessToken || payload.accessToken || cachedSession?.accessToken || null;
  if (!accessToken) {
    return null;
  }
  const refreshToken = tokens.refreshToken || payload.refreshToken || cachedSession?.refreshToken || null;
  return {
    accessToken,
    refreshToken,
    expiresIn: tokens.expiresIn ?? payload.expiresIn ?? cachedSession?.expiresIn ?? null,
    refreshExpiresAt: tokens.refreshExpiresAt || payload.refreshExpiresAt || cachedSession?.refreshExpiresAt || null,
    issuedAt: new Date().toISOString(),
    user: payload.user || fallbackUser || cachedSession?.user || null,
    session: payload.session || cachedSession?.session || null
  };
}

export function persistAuthSession(payload) {
  const normalized = normalizeAuthPayload(payload, payload?.user || payload?.data?.user);
  if (!normalized) return null;
  return persistRawSession(normalized);
}

export function updateStoredSession(patch) {
  if (!cachedSession) return null;
  const next = {
    ...cachedSession,
    ...patch,
    ...(patch.user
      ? { user: { ...(cachedSession.user || {}), ...patch.user } }
      : {}),
    ...(patch.session
      ? { session: { ...(cachedSession.session || {}), ...patch.session } }
      : {})
  };
  return persistRawSession(next);
}

export function clearStoredSession() {
  persistRawSession(null);
}

export function getStoredSession() {
  return cachedSession;
}

function getEffectiveToken(explicitToken) {
  return explicitToken || cachedSession?.accessToken || null;
}

function getEffectiveRefreshToken(explicitToken) {
  return explicitToken || cachedSession?.refreshToken || null;
}

export const api = axios.create({
  baseURL: BACKEND_URL
});

api.interceptors.request.use((config) => {
  const token = getEffectiveToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

function enqueueRefreshRequest() {
  return new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}

function resolveRefreshQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  refreshQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = getEffectiveRefreshToken();
  if (!refreshToken) {
    throw new Error("Kein Refresh Token vorhanden");
  }
  const response = await axios.post(`${BACKEND_URL}/auth/refresh`, { refreshToken });
  const payload = response.data?.data;
  const session = persistAuthSession(payload);
  if (!session?.accessToken) {
    throw new Error("Session konnte nicht erneuert werden");
  }
  return session.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (
      status !== 401 ||
      originalRequest?.__isRetry ||
      !getEffectiveRefreshToken()
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      try {
        const token = await enqueueRefreshRequest();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest.__isRetry = true;
        return api(originalRequest);
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }

    isRefreshing = true;
    originalRequest.__isRetry = true;

    try {
      const newToken = await refreshAccessToken();
      resolveRefreshQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveRefreshQueue(refreshError);
      clearStoredSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function authHeader(token) {
  const effectiveToken = getEffectiveToken(token);
  return effectiveToken ? { headers: { Authorization: `Bearer ${effectiveToken}` } } : {};
}

function normalizeError(err) {
  if (err.response?.data?.error) {
    const { code, message, details } = err.response.data.error;
    const error = new Error(message || "Unbekannter Fehler");
    error.code = code;
    error.details = details;
    error.status = err.response.status;
    return error;
  }

  if (err.code === "ERR_NETWORK") {
    const error = new Error("Server nicht erreichbar. Bitte später erneut versuchen.");
    error.code = "ERR_NETWORK";
    return error;
  }

  return new Error(err.message || "Unbekannter Fehler");
}

async function request(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

function handleError(err) {
  const error = normalizeError(err);
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  };
}

// ==============================
// Auth
// ==============================
export async function registerUser(email, password) {
  return request(api.post("/auth/register", { email, password }));
}

export async function verifyEmail(token) {
  return request(api.post("/auth/verify", { token }));
}

export async function loginUser(email, password) {
  return request(api.post("/auth/login", { email, password }));
}

export async function fetchMe(token) {
  return request(api.get("/auth/me", authHeader(token)));
}

export async function updatePlatformMode(token, platform) {
  return request(api.put("/auth/platform-mode", { platform }, authHeader(token)));
}

export async function logoutSession(refreshToken, fromAllDevices = false) {
  const effectiveRefresh = getEffectiveRefreshToken(refreshToken);
  return request(api.post("/auth/logout", {
    refreshToken: effectiveRefresh,
    fromAllDevices: fromAllDevices || !effectiveRefresh
  }));
}

// ==============================
// Creator DNA
// ==============================
export async function getCreatorProfile(token) {
  const response = await request(api.get("/creator", authHeader(token)));
  return response.data;
}

export async function saveCreatorProfile(token, payload) {
  const response = await request(api.post("/creator", payload, authHeader(token)));
  return response.data;
}

// ==============================
// Profile & Settings
// ==============================
export async function getProfile(token) {
  try { return (await api.get("/settings/profile", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function updateContentStyle(token, style) {
  try { return (await api.put("/settings/style", style, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function updateLanguageSettings(token, settings) {
  try { return (await api.put("/settings/language", settings, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function updateGeneralSettings(token, settings) {
  try { return (await api.put("/settings/general", settings, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// Upload & Posts
// ==============================
export async function uploadPosts(file, platform = "tiktok", token = null) {
  try {
    if (!file) {
      throw new Error("Keine Datei ausgewählt");
    }
    if (!file.size) {
      throw new Error("Die ausgewählte Datei ist leer (0 Bytes)");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    const authToken = getEffectiveToken(token);
    const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
    return (await api.post("/upload", formData, config)).data;
  } catch (err) { return handleError(err); }
}

export async function uploadFolder(files, platform = "tiktok", token = null) {
  try {
    const fileEntries = Array.from(files || []);
    const validFiles = fileEntries.filter((file) => file && file.size);
    if (!validFiles.length) {
      throw new Error("Keine gültigen Dateien im Ordner (alle leer?)");
    }
    const formData = new FormData();
    validFiles.forEach((file) => formData.append("files", file));
    formData.append("platform", platform);
    const authToken = getEffectiveToken(token);
    const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
    return (await api.post("/upload/folder", formData, config)).data;
  } catch (err) { return handleError(err); }
}

async function fetchPlatformAnalysis(platform, datasetId, token = null) {
  try {
    if (!platform || !datasetId) {
      throw new Error("Platform und datasetId werden benötigt");
    }
    return (await api.get(`/upload/analysis/${platform.toLowerCase()}?datasetId=${datasetId}`, authHeader(token))).data;
  } catch (err) {
    return handleError(err);
  }
}

export function fetchTikTokAnalysis(datasetId, token = null) {
  return fetchPlatformAnalysis("tiktok", datasetId, token);
}

export function fetchInstagramAnalysis(datasetId, token = null) {
  return fetchPlatformAnalysis("instagram", datasetId, token);
}

export function fetchFacebookAnalysis(datasetId, token = null) {
  return fetchPlatformAnalysis("facebook", datasetId, token);
}

export async function getUploadDatasets(token) {
  try { return (await api.get("/upload/datasets", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function getUploadDataset(token, id) {
  try { return (await api.get(`/upload/datasets/${id}`, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function exportInsightsPdf(payload, token = null) {
  try {
    const authToken = getEffectiveToken(token);
    const config = {
      responseType: "blob",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };
    return (await api.post("/export/pdf", payload, config)).data;
  } catch (err) {
    return handleError(err);
  }
}

export async function exportInsightsCsv(posts, token = null) {
  try {
    const authToken = getEffectiveToken(token);
    const config = {
      responseType: "blob",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };
    return (await api.post("/export/csv", { posts }, config)).data;
  } catch (err) {
    return handleError(err);
  }
}

export async function generateShareLink(payload, token = null) {
  try {
    return (await api.post("/share/generate", { payload }, authHeader(token))).data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchSharedInsights(token) {
  try {
    return (await api.get(`/share/${token}`)).data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getPosts(token = null, options = {}) {
  try {
    const { category, limit = 50, page = 1 } = options;
    const params = new URLSearchParams({ limit, page });
    if (category) params.append("category", category);
    return (await api.get(`/posts?${params}`, token ? authHeader(token) : {})).data;
  } catch (err) { return handleError(err); }
}

// ==============================
// AI Generation
// ==============================
export async function generatePrompts(token = null, options = {}) {
  try { return (await api.post("/generate-prompts", options, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function generateVideoIdeas(prompts, token = null, detailed = true) {
  try { return (await api.post("/generate-video-ideas", { prompts, detailed }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function generateHooks(topic, token = null, options = {}) {
  try { return (await api.post("/ai/hooks", { topic, ...options }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function generateCaptions(topic, token = null, options = {}) {
  try { return (await api.post("/ai/captions", { topic, ...options }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function generateTitles(topic, token = null, options = {}) {
  try { return (await api.post("/ai/titles", { topic, ...options }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function analyzeTrends(niche, token = null, options = {}) {
  try { return (await api.post("/ai/trends", { niche, ...options }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function analyzeVirality(content, token = null, type = "full") {
  try { return (await api.post("/ai/virality", { content, type }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function getAISummary(analysis, token = null) {
  try {
    if (!analysis) {
      throw new Error("Analyse-Daten fehlen");
    }
    return (await api.post("/ai/summary", { analysis }, token ? authHeader(token) : {})).data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getCreditCosts() {
  try { return (await api.get("/ai/costs")).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// Batch Generator
// ==============================
export async function generateBatch(token, options) {
  try { return (await api.post("/batch/generate", options, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function getBatchHistory(token, options = {}) {
  try {
    const { limit = 10, page = 1 } = options;
    return (await api.get(`/batch/history?limit=${limit}&page=${page}`, authHeader(token))).data;
  } catch (err) { return handleError(err); }
}

// ==============================
// Calendar
// ==============================
export async function getCalendarEntries(token, startDate, endDate) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return (await api.get(`/calendar?${params}`, authHeader(token))).data;
  } catch (err) { return handleError(err); }
}

export async function createCalendarEntry(token, entry) {
  try { return (await api.post("/calendar", entry, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function updateCalendarEntry(token, id, updates) {
  try { return (await api.put(`/calendar/${id}`, updates, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function deleteCalendarEntry(token, id) {
  try { return (await api.delete(`/calendar/${id}`, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function getUpcomingPosts(token, limit = 10) {
  try { return (await api.get(`/calendar/upcoming/list?limit=${limit}`, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function bulkCreateCalendarEntries(token, items) {
  try { return (await api.post("/calendar/bulk", { items }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// Team
// ==============================
export async function getOrganization(token) {
  try { return (await api.get("/team", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function createOrganization(token, name) {
  try { return (await api.post("/team", { name }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function updateOrganization(token, data) {
  try { return (await api.put("/team", data, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function inviteTeamMember(token, email, role = "member") {
  try { return (await api.post("/team/invite", { email, role }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function joinTeam(token, inviteToken) {
  try { return (await api.post("/team/join", { token: inviteToken }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function removeTeamMember(token, userId) {
  try { return (await api.delete(`/team/members/${userId}`, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function leaveTeam(token) {
  try { return (await api.post("/team/leave", {}, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function deleteOrganization(token) {
  try { return (await api.delete("/team", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// History & Admin
// ==============================
export async function getHistory(token, options = {}) {
  try {
    const { type, limit = 20, page = 1 } = options;
    const params = new URLSearchParams({ limit, page });
    if (type) params.append("type", type);
    return (await api.get(`/history?${params}`, authHeader(token))).data;
  } catch (err) { return handleError(err); }
}

export async function getAdminStats(token) {
  try { return (await api.get("/admin/stats", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function getAdminUsers(token, options = {}) {
  try {
    const { page = 1, limit = 50, tier, search } = options;
    const params = new URLSearchParams({ page, limit });
    if (tier) params.append("tier", tier);
    if (search) params.append("search", search);
    return (await api.get(`/admin/users?${params}`, authHeader(token))).data;
  } catch (err) { return handleError(err); }
}

export async function updateUser(token, userId, data) {
  try { return (await api.put(`/admin/users/${userId}`, data, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// Supported Languages
// ==============================
export const LANGUAGES = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  tr: "Türkçe",
  pl: "Polski",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어"
};
