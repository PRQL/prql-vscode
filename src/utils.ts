import * as vscode from "vscode";

export function isPrqlDocument(editor: vscode.TextEditor): boolean {
  return editor.document.fileName.endsWith(".prql");
}
