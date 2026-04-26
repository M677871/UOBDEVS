import { request } from './apiClient';

export const getAlbums = ({ page = 1, limit = 20 } = {}) =>
  request({ path: '/api/albums', query: { page, limit } });

export const getAlbumById = (albumId) => request({ path: `/api/albums/${albumId}` });

export const getAlbumImages = ({ albumId, page = 1, limit = 24 }) =>
  request({ path: `/api/albums/${albumId}/images`, query: { page, limit } });

export const createAlbum = ({ token, payload }) =>
  request({ path: '/api/admin/albums', method: 'POST', body: payload, token });

export const updateAlbum = ({ token, albumId, payload }) =>
  request({ path: `/api/admin/albums/${albumId}`, method: 'PUT', body: payload, token });

export const deleteAlbum = ({ token, albumId }) =>
  request({ path: `/api/admin/albums/${albumId}`, method: 'DELETE', token });
