import * as vscode from "vscode";
import { isPrqlDocument } from "./utils";
import { SourceLocation, compile } from "./compiler";

function getRange(location: SourceLocation | null): vscode.Range {
  if (location) {
    return new vscode.Range(location.start[0], location.start[1], location.end[0],
      location.end[1]);
  }

  return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
}

function updateLineDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
  const editor = vscode.window.activeTextEditor;

  if (editor && isPrqlDocument(editor)) {
    const text = editor.document.getText();
    const result = compile(text);

    if (!Array.isArray(result)) {
      diagnosticCollection.set(editor.document.uri, []);
    } else {
      const range = getRange(result[0].location);
      const diagnostic = new vscode.Diagnostic(range, result[0].reason ?? "Syntax Error",
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
