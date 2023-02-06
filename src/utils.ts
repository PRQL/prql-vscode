import { TextEditor } from "vscode";

export function isPrqlDocument(editor: TextEditor): boolean {
  return editor.document.languageId === "prql";
}
