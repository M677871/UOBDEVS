import { request } from './apiClient';

export const login = (payload) => request({ path: '/api/auth/login', method: 'POST', body: payload });
export const me = (token) => request({ path: '/api/auth/me', token });
