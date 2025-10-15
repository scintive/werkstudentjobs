declare module 'pdf-parse/lib/pdf-parse.js' {
  const pdfParse: (data: ArrayBuffer | Buffer | Uint8Array) => Promise<any>;
  export = pdfParse;
}
