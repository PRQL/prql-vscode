import * as prqlJs from 'prql-js';

export function compile(prqlString: string): string | ErrorMessage[] {
  try {
    return prqlJs.compile(prqlString) as string;
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
