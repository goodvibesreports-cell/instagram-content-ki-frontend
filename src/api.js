// src/api.js - Instagram Content KI API v2.0
import axios from "axios";

export const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

// Helper: Add auth header
function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// Helper: Handle errors
function handleError(err) {
  if (err.response?.data) {
    return err.response.data;
  }
  if (err.code === "ERR_NETWORK") {
    return { success: false, error: { message: "Server nicht erreichbar" } };
  }
  return { success: false, error: { message: err.message } };
}

// ==============================
// Auth
// ==============================
export async function registerUser(email, password) {
  try {
    const res = await api.post("/auth/register", { email, password });
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function loginUser(email, password) {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchMe(token) {
  try {
    const res = await api.get("/auth/me", authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// Profile & Settings
// ==============================
export async function getProfile(token) {
  try {
    const res = await api.get("/profile", authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function updateSettings(token, settings) {
  try {
    const res = await api.put("/profile/settings", settings, authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// Upload
// ==============================
export async function uploadPosts(file, token = null) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    
    const res = await api.post("/upload", formData, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getPosts(token = null, options = {}) {
  try {
    const { category, limit = 50, page = 1 } = options;
    const params = new URLSearchParams({ limit, page });
    if (category) params.append("category", category);
    
    const config = token ? authHeader(token) : {};
    const res = await api.get(`/posts?${params}`, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// AI Generation - Core
// ==============================
export async function generatePrompts(token = null, options = {}) {
  try {
    const config = token ? authHeader(token) : {};
    const res = await api.post("/generate-prompts", options, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function generateVideoIdeas(prompts, token = null, detailed = true) {
  try {
    const config = token ? authHeader(token) : {};
    const res = await api.post("/generate-video-ideas", { prompts, detailed }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// AI Generation - New Features
// ==============================
export async function generateHooks(topic, token = null, options = {}) {
  try {
    const { count = 10, style = "mixed" } = options;
    const config = token ? authHeader(token) : {};
    const res = await api.post("/ai/hooks", { topic, count, style }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function generateCaptions(topic, token = null, options = {}) {
  try {
    const { tone = "casual", includeEmojis = true, includeHashtags = true, count = 3 } = options;
    const config = token ? authHeader(token) : {};
    const res = await api.post("/ai/captions", { topic, tone, includeEmojis, includeHashtags, count }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function generateTitles(topic, token = null, options = {}) {
  try {
    const { style = "clickbait", count = 5 } = options;
    const config = token ? authHeader(token) : {};
    const res = await api.post("/ai/titles", { topic, style, count }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function analyzeTrends(niche, token = null, options = {}) {
  try {
    const { platform = "instagram", timeframe = "week" } = options;
    const config = token ? authHeader(token) : {};
    const res = await api.post("/ai/trends", { niche, platform, timeframe }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function analyzeVirality(content, token = null, type = "full") {
  try {
    const config = token ? authHeader(token) : {};
    const res = await api.post("/ai/virality", { content, type }, config);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getCreditCosts() {
  try {
    const res = await api.get("/ai/costs");
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// History
// ==============================
export async function getHistory(token, options = {}) {
  try {
    const { type, limit = 20, page = 1 } = options;
    const params = new URLSearchParams({ limit, page });
    if (type) params.append("type", type);
    
    const res = await api.get(`/history?${params}`, authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ==============================
// Admin
// ==============================
export async function getAdminStats(token) {
  try {
    const res = await api.get("/admin/stats", authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function getAdminUsers(token, options = {}) {
  try {
    const { page = 1, limit = 50, tier, search } = options;
    const params = new URLSearchParams({ page, limit });
    if (tier) params.append("tier", tier);
    if (search) params.append("search", search);
    
    const res = await api.get(`/admin/users?${params}`, authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function updateUser(token, userId, data) {
  try {
    const res = await api.put(`/admin/users/${userId}`, data, authHeader(token));
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}
