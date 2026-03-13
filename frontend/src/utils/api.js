import axios from 'axios';

// Use relative URLs – Vite proxy forwards /api/* to FastAPI on port 8000
const api = axios.create({ baseURL: '' });

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('massenger_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Admin ─────────────────────────────────────────────────────
export const adminLogin = (username, password) =>
  api.post('/api/admin/login', { username, password });


export const getFriends = () => api.get('/api/admin/friends');
export const createFriend = (name) => api.post('/api/admin/friends', { name });
export const deleteFriend = (id) => api.delete(`/api/admin/friends/${id}`);
export const getAdminChat = (friendId) => api.get(`/api/admin/chat/${friendId}`);
export const adminReply = (friendId, payload) =>
  api.post(`/api/admin/chat/${friendId}/reply`, payload);
export const deleteMessage = (msgId) => api.delete(`/api/admin/messages/${msgId}`);

// ── Friend (public) ───────────────────────────────────────────
export const getFriendInfo = (token) => api.get(`/api/friend/${token}`);
export const getFriendMessages = (token) => api.get(`/api/friend/${token}/messages`);
export const friendSendMessage = (token, payload) =>
  api.post(`/api/friend/${token}/send`, payload);
