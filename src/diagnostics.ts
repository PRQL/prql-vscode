import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  ExtensionContext,
  Position,
  Range,
  TextDocument,
  languages,
  window,
  workspace,
} from 'vscode';

import { SourceLocation, compile } from './compiler';

function getRange(location: SourceLocation | null): Range {
  if (location) {
    return new Range(
      location.start[0],
      location.start[1],
      location.end[0],
      location.end[1]
    );
  }
  return new Range(new Position(0, 0), new Position(0, 0));
}

function updateLineDiagnostics(diagnosticCollection: DiagnosticCollection) {
  const editor = window.activeTextEditor;

  if (editor && editor.document.languageId === 'prql') {
    const text = editor.document.getText();
    const result = compile(text);

    if (!Array.isArray(result)) {
      // success, clear the errors
      diagnosticCollection.set(editor.document.uri, []);
    } else {
      const diagnostics = result
        // don't report errors for missing main pipeline
        .filter((e) => e.code !== 'E0001')
        .map((e) => {
          return new Diagnostic(
            getRange(e.location),
            e.reason,
            DiagnosticSeverity.Error
          );
        });

      diagnosticCollection.set(editor.document.uri, diagnostics);
    }
  }
}

export function activateDiagnostics(context: ExtensionContext) {
  const diagnosticCollection = languages.createDiagnosticCollection('prql');
  context.subscriptions.push(diagnosticCollection);

  workspace.onDidCloseTextDocument((document: TextDocument) =>
    diagnosticCollection.set(document.uri, [])
  );

  [
    workspace.onDidOpenTextDocument,
    workspace.onDidChangeTextDocument,
    window.onDidChangeActiveTextEditor,
  ].forEach((event) => {
    context.subscriptions.push(
      event(() => updateLineDiagnostics(diagnosticCollection))
    );
  });

  updateLineDiagnostics(diagnosticCollection);
}
