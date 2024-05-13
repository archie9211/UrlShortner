// Ensure the provided URL starts with 'http://' or 'https://'
export function ensureProtocol(urlString: string): string {
    if (!/^https?:\/\//.test(urlString)) {
      return `https://${urlString}`;
    }
    return urlString;
  }
  
  // Generate a short URL
  export function generateShortUrl(): string {
    // Simple implementation using a random string
    return Math.random().toString(36).slice(2, 8);
  }
  
  // Check if the provided URL is valid
  export function isValidUrl(urlString: string): boolean {
    const urlPattern = new RegExp(
      '^(https?:\\/\\/)?'  // Protocol (optional)
      + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // Domain name with TLD
      + '((\\d{1,3}\\.){3}\\d{1,3}))'  // OR IP address
      + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'  // Port and path (optional)
      + '(\\?[;&a-z\\d%_.~+=-]*)?'  // Query string (optional)
      + '(\\#[-a-z\\d_]*)?$', // Fragment (optional)
      'i'
    );
    return !!urlPattern.test(urlString);
  }