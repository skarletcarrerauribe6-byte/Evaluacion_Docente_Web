// frontend/src/api.js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getEvaluationPeriod = async () => {
  const response = await fetch(`${API_BASE_URL}/api/period`);
  if (!response.ok) {
    throw new Error('No se pudo obtener el periodo de evaluación');
  }
  return response.json();
};

export const updateEvaluationPeriod = async ({ startDate, endDate, isActive, role }) => {
  const response = await fetch(`${API_BASE_URL}/api/period`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, isActive, role })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo actualizar el periodo');
  }

  return response.json();
};

const apiClient = {
  async get(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    const data = await response.json();
    if (!response.ok) {
      throw { response: { data } };
    }
    return { data };
  },
  async post(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      throw { response: { data } };
    }
    return { data };
  }
};

export default apiClient;
