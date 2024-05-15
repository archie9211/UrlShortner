export function ensureProtocol(urlString: string): string {
  if (!/^https?:\/\//.test(urlString)) {
    return `https://${urlString}`;
  }
  return urlString;
}

export function generateShortUrl(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function isValidUrl(urlString: string): boolean {
  try { 
    return Boolean(new URL(urlString)); 
  }
  catch(e){ 
    return false; 
  }
}
