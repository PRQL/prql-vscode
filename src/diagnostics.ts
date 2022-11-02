import * as vscode from "vscode";
import { compile, SourceLocation } from "prql-js";
import { isPrqlDocument } from "./utils";

function getRange(location: SourceLocation | undefined): vscode.Range {
  if (location) {
    return new vscode.Range(location.start_line, location.start_column, location.end_line,
      location.end_column);
  }

  return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
}

function updateLineDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
  const editor = vscode.window.activeTextEditor;

  if (editor && isPrqlDocument(editor)) {
    const text = editor.document.getText();
    const result = compile(text);

    if (result.sql) {
      diagnosticCollection.set(editor.document.uri, []);
    } else {
      const range = getRange(result.error?.location);
      const diagnostic = new vscode.Diagnostic(range, result.error?.line ?? "Syntax Error",
        vscode.DiagnosticSeverity.Error);
      diagnosticCollection.set(editor.document.uri, [diagnostic]);
    }
  }
}

export function activateDiagnostics(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection("prql");
  context.subscriptions.push(diagnosticCollection);

  [
    vscode.workspace.onDidChangeTextDocument,
    vscode.window.onDidChangeActiveTextEditor
  ].forEach(event => {
    context.subscriptions.push(event(() => updateLineDiagnostics(diagnosticCollection)));
  });

  updateLineDiagnostics(diagnosticCollection);
}
