export const getCleanAvatarUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") || 
    trimmed.startsWith("https://") || 
    trimmed.startsWith("/") || 
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  // If it is a domain / external URL without protocol, prepend https://
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

export const isAvatarUrl = (url: string | undefined | null): boolean => {
  const clean = getCleanAvatarUrl(url);
  return !!clean && (
    clean.startsWith("http://") || 
    clean.startsWith("https://") || 
    clean.startsWith("/") || 
    clean.startsWith("data:")
  );
};
