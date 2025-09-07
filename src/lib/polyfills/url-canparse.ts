// Polyfill for URL.canParse which is missing in Node.js < 19.9.0
// This fixes Next.js 15.5.0 compatibility with Node.js 20.x

if (typeof URL !== 'undefined' && !('canParse' in URL)) {
  (URL as any).canParse = function(url: string, base?: string): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

export {};