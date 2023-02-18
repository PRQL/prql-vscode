/**
 * PRQL compilation resust for sql preview and display.
 */
export interface CompilationResult {
  status: 'ok' | 'error';
  html?: string;
  sql?: string;
  error?: {
    message: string;
  };
  lastHtml?: string | undefined;
}
