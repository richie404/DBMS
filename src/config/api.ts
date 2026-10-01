const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required.");
}

let parsedApiBaseUrl: URL;
try {
  parsedApiBaseUrl = new URL(configuredApiBaseUrl);
} catch {
  throw new Error("VITE_API_BASE_URL must be a valid HTTP or HTTPS URL.");
}

if (!['http:', 'https:'].includes(parsedApiBaseUrl.protocol)) {
  throw new Error("VITE_API_BASE_URL must use HTTP or HTTPS.");
}

export const apiBaseUrl = configuredApiBaseUrl.replace(/\/$/, "");
