// src/api.js
import axios from "axios";

export const BACKEND_URL =
  "https://instagram-content-ki-backend.onrender.com";

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function registerUser(email, password) {
  try {
    const res = await api.post("/auth/register", { email, password });
    return res.data;
  } catch (err) {
    // Axios wirft bei HTTP-Fehlern (400, 500, etc.) eine Exception
    if (err.response && err.response.data) {
      return err.response.data; // { error: "..." }
    }
    throw err;
  }
}

export async function loginUser(email, password) {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // { token }
  } catch (err) {
    // Axios wirft bei HTTP-Fehlern (400, 500, etc.) eine Exception
    if (err.response && err.response.data) {
      return err.response.data; // { error: "..." }
    }
    throw err;
  }
}

export async function fetchMe(token) {
  const res = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}
