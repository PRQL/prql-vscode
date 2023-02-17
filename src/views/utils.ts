import {
  ExtensionContext,
  Uri
} from 'vscode';

export interface CompilationResult {
  status: 'ok' | 'error';
  html?: string;
  sql?: string;
  error?: {
    message: string;
  };
  lastHtml?: string | undefined;
}

export function getResourceUri(context: ExtensionContext, filename: string) {
  return Uri.joinPath(context.extensionUri, 'resources', filename);
}

export function normalizeThemeName(currentTheme: string): string {
  return currentTheme.toLowerCase().replace('theme', '').replace(/\s+/g, '-');
}

export function debounce(fn: () => any, timeout: number) {
  let timer: NodeJS.Timeout | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, timeout);
  };
}
