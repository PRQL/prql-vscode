/**
 * PRQL compilation resust for sql preview and display.
 */
export interface CompilationResult {
  status: 'ok' | 'error';
  sql?: string;
  sqlHtml?: string;
  error?: {
    message: string;
  };
  lastSqlHtml?: string | undefined;
}
