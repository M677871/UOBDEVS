import { request } from './apiClient';

export const uploadImagesToAlbum = ({ token, albumId, files }) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  return request({
    path: `/api/admin/albums/${albumId}/images`,
    method: 'POST',
    body: formData,
    token,
    isFormData: true
  });
};

export const deleteImage = ({ token, imageId }) =>
  request({ path: `/api/admin/images/${imageId}`, method: 'DELETE', token });
