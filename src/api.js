import axios from "axios";

export const BACKEND_URL = import.meta.env.VITE_API_URL || "https://instagram-content-ki-backend.onrender.com";

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
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
export async function uploadPosts(file, token = null) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const config = { headers: { "Content-Type": "multipart/form-data", ...(token && { Authorization: `Bearer ${token}` }) } };
    return (await api.post("/upload", formData, config)).data;
  } catch (err) { return handleError(err); }
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
