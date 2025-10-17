declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  const pdfParse: (data: ArrayBuffer | Buffer | Uint8Array) => Promise<PDFParseResult>;
  export = pdfParse;
}
