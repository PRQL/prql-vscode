import * as vscode from "vscode";

export interface CompilationResult {
  status: "ok" | "error";
  content: string;
  last_html?: string | undefined;
}

export function getResourceUri(context: vscode.ExtensionContext, filename: string) {
  return vscode.Uri.joinPath(context.extensionUri, "resources", filename);
}

export function isPrqlDocument(editor: vscode.TextEditor): boolean {
  return editor.document.fileName.endsWith(".prql");
}

export function normalizeThemeName(currentTheme: string): string {
  return currentTheme
    .toLowerCase()
    .replace("theme", "")
    .replace(/\s+/g, "-");
}
