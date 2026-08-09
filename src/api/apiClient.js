const API_URL = "http://127.0.0.1:8000";

export const getToken = () => {
  return localStorage.getItem("triphub_access_token");
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text || null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("triphub_access_token");
    }

    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

// ============================================================
// GET
// ============================================================

export const apiGet = (endpoint) => {
  return request(endpoint, {
    method: "GET",
  });
};

// ============================================================
// POST
// ============================================================

export const apiPost = (endpoint, body) => {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

// ============================================================
// PATCH
// ============================================================

export const apiPatch = (endpoint, body = undefined) => {
  return request(endpoint, {
    method: "PATCH",
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
        }
      : {}),
  });
};

// ============================================================
// DELETE
// ============================================================

export const apiDelete = (endpoint) => {
  return request(endpoint, {
    method: "DELETE",
  });
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

const apiClient = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
};

export default apiClient;