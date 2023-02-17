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

import { isPrqlDocument } from './utils';
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

  if (editor && isPrqlDocument(editor)) {
    const text = editor.document.getText();
    const result = compile(text);

    if (!Array.isArray(result)) {
      diagnosticCollection.set(editor.document.uri, []);
    }
    else {
      const range = getRange(result[0].location);
      const diagnostic = new Diagnostic(
        range,
        result[0].reason ?? 'Syntax Error',
        DiagnosticSeverity.Error
      );

      diagnosticCollection.set(editor.document.uri, [diagnostic]);
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
