import { workspace } from 'vscode';
import * as prql from 'prql-js';
import * as constants from './constants';

export function compile(prqlString: string): string | ErrorMessage[] {
  // create compile options from prql workspace settings
  const compileOptions = new prql.CompileOptions();
  const target = <string>workspace.getConfiguration('prql').get('target');
  const addCompilerInfo = <boolean>(
    workspace
      .getConfiguration('prql')
      .get(constants.AddCompilerSignatureComment)
  );
  compileOptions.target = `sql.${target.toLowerCase()}`;
  compileOptions.signature_comment = addCompilerInfo;
  try {
    return prql.compile(prqlString, compileOptions) as string;
  } catch (error) {
    if ((error as any)?.message) {
      try {
        const errorMessages = JSON.parse((error as any).message);
        return errorMessages.inner as ErrorMessage[];
      } catch (ignored) {
        throw error;
      }
    }
    throw error;
  }
}

export interface ErrorMessage {
  /// Plain text of the error
  reason: string;
  /// A list of suggestions of how to fix the error
  hint: string | null;
  /// Character offset of error origin within a source file
  span: [number, number] | null;

  /// Annotated code, containing cause and hints.
  display: string | null;
  /// Line and column number of error origin within a source file
  location: SourceLocation | null;
}

/// Location within the source file.
/// Tuples contain:
/// - line number (0-based),
/// - column number within that line (0-based),
export interface SourceLocation {
  start: [number, number];
  end: [number, number];
}
