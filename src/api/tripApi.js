import api from './axios';

export const tripApi = {
  getTrips: (params) => api.get('/trips', { params }),
  createTrip: (data) => api.post('/trips', data),
  getTrip: (id) => api.get(`/trips/${id}`),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  cancelTrip: (id) => api.delete(`/trips/${id}`),
  reviewTrip: (id, data) => api.put(`/trips/${id}/review`, data),
  completeTrip: (id) => api.put(`/trips/${id}/complete`),
  getTripExpenses: (id) => api.get(`/trips/${id}/expenses`),
};
