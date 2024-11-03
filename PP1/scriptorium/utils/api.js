import { getAccessToken } from './token';

export async function apiRequest(endpoint, options = {}) {
  const token = await getAccessToken();
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(endpoint, options);

  if (response.status === 401) {
    console.error('Unauthorized, please log in again.');
    return null;
  }

  return response.json();
}
