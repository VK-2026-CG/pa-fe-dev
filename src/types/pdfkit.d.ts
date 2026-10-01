/**
 * Minimal ambient types for the parts of `pdfkit` 0.20.2 the Historical Data
 * download uses (the package ships no typings and we add no @types package).
 * Extend here only as the PDF module needs more.
 */
declare module 'pdfkit' {
  export interface PDFPermissions {
    printing?: 'lowResolution' | 'highResolution';
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
    contentAccessibility?: boolean;
    documentAssembly?: boolean;
  }
  export interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    bufferPages?: boolean;
    compress?: boolean;
    info?: Record<string, string>;
    userPassword?: string;
    ownerPassword?: string;
    permissions?: PDFPermissions;
    pdfVersion?: '1.3' | '1.4' | '1.5' | '1.6' | '1.7' | '1.7ext3';
  }
  export class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    page: { width: number; height: number; margins: { top: number; bottom: number; left: number; right: number } };
    x: number;
    y: number;
    on(event: 'data', listener: (chunk: Uint8Array) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: unknown) => void): this;
    font(name: string): this;
    fontSize(size: number): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    text(text: string, x?: number, y?: number, options?: { width?: number; align?: 'left' | 'center' | 'right'; lineBreak?: boolean; height?: number; ellipsis?: boolean }): this;
    widthOfString(text: string): number;
    rect(x: number, y: number, width: number, height: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    fill(): this;
    stroke(): this;
    addPage(options?: PDFDocumentOptions): this;
    bufferedPageRange(): { start: number; count: number };
    switchToPage(index: number): this;
    end(): void;
  }
  export function registerStdFonts(...fonts: unknown[]): void;
  export default PDFDocument;
}
declare module 'pdfkit/standard-fonts/Helvetica' {
  const font: unknown;
  export default font;
}
declare module 'pdfkit/standard-fonts/HelveticaBold' {
  const font: unknown;
  export default font;
}
