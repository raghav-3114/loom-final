/**
 * @file apiClient.js
 * @description HTTP client utility for handling API requests to the Loom backend endpoints (/api).
 */

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Executes a JSON fetch request against the backend server API.
 * @param {string} endpoint - Relative API endpoint path.
 * @param {object} [options] - Fetch configuration options.
 * @returns {Promise<object>} Parsed JSON response.
 */
export async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : DEFAULT_HEADERS),
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Uploads a set of project files or a FormData ZIP to the backend for auto-stack detection and import.
 * @param {Object|FormData} payload - Key-value map of path -> content OR FormData containing ZIP file
 */
export async function uploadProject(payload) {
  const isFormData = payload instanceof FormData;
  
  return apiFetch('/api/upload', {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify({ files: payload.files || payload }),
  });
}

/**
 * Triggers a download of the project ZIP archive.
 * @param {string} projectId 
 */
export function triggerProjectDownload(projectId) {
  window.open(`/api/download/${projectId}`, '_blank');
}

/**
 * Fetches the current AI provider/model configuration from the backend.
 * @returns {Promise<object>} Settings config with router, builder, reviewer agent configurations.
 */
export async function getSettings() {
  return apiFetch('/api/settings');
}

export default {
  apiFetch,
  uploadProject,
  triggerProjectDownload,
  getSettings,
};
