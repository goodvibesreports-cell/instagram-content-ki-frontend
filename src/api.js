// src/api.js - Instagram Content KI API v3.0
import axios from "axios";

export const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function handleError(err) {
  if (err.response?.data) return err.response.data;
  if (err.code === "ERR_NETWORK") return { success: false, error: { message: "Server nicht erreichbar" } };
  return { success: false, error: { message: err.message } };
}

// ==============================
// Auth
// ==============================
export async function registerUser(email, password) {
  try { return (await api.post("/auth/register", { email, password })).data; }
  catch (err) { return handleError(err); }
}

export async function loginUser(email, password) {
  try { return (await api.post("/auth/login", { email, password })).data; }
  catch (err) { return handleError(err); }
}

export async function fetchMe(token) {
  try { return (await api.get("/auth/me", authHeader(token))).data; }
  catch (err) { return handleError(err); }
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
// API Keys
// ==============================
export async function getApiKeyStatus(token) {
  try { return (await api.get("/settings/api-keys", authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function setApiKey(token, provider, apiKey) {
  try { return (await api.post("/settings/api-keys", { provider, apiKey }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function removeApiKey(token, provider) {
  try { return (await api.delete(`/settings/api-keys/${provider}`, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

export async function toggleUseOwnApiKeys(token, useOwnApiKeys) {
  try { return (await api.put("/settings/api-keys/toggle", { useOwnApiKeys }, authHeader(token))).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// Upload
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
// AI Generation - Core
// ==============================
export async function generatePrompts(token = null, options = {}) {
  try { return (await api.post("/generate-prompts", options, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

export async function generateVideoIdeas(prompts, token = null, detailed = true) {
  try { return (await api.post("/generate-video-ideas", { prompts, detailed }, token ? authHeader(token) : {})).data; }
  catch (err) { return handleError(err); }
}

// ==============================
// AI Generation - Advanced
// ==============================
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
// History
// ==============================
export async function getHistory(token, options = {}) {
  try {
    const { type, limit = 20, page = 1 } = options;
    const params = new URLSearchParams({ limit, page });
    if (type) params.append("type", type);
    return (await api.get(`/history?${params}`, authHeader(token))).data;
  } catch (err) { return handleError(err); }
}

// ==============================
// Admin
// ==============================
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
  ko: "한국어",
  zh: "中文"
};
