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
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!urlPattern.test(urlString);
}
