export function getImageUrl(path) {
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  if (apiBase?.startsWith("http")) {
    return apiBase.replace("/api", "") + path;
  }

  return path;
}