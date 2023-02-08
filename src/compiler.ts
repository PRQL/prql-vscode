import { workspace } from 'vscode';
import * as prql from 'prql-js';

export function compile(prqlString: string): string | ErrorMessage[] {
  const target = <string>workspace.getConfiguration('prql').get('target');
  const options: CompileOptions = { target: target };
  try {
    // map new compile options to the old prql JS SQL options for now
    const compileOptions = new prql.SQLCompileOptions();
    compileOptions.dialect = targetToDialect(options.target);
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

export interface CompileOptions {
  target?: string;
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

/**
 * Temp. target to dialect conversion function till we update prql-js.
 * @param target Compilation target string.
 */
function targetToDialect(target: string | undefined) {
  switch (target) {
    case 'BigQuery':
      return prql.Dialect.BigQuery;
    case 'ClickHouse':
      return prql.Dialect.ClickHouse;
    case 'DuckDb':
      return prql.Dialect.DuckDb;
    case 'Generic':
      return prql.Dialect.Generic;
    case 'Hive':
      return prql.Dialect.Hive;
    case 'MsSql':
      return prql.Dialect.MsSql;
    case 'MySql':
      return prql.Dialect.MySql;
    case 'PostgreSql':
      return prql.Dialect.PostgreSql;
    case 'SQLite':
      return prql.Dialect.SQLite;
    case 'Snowflake':
      return prql.Dialect.Snowflake;
    default:
      return prql.Dialect.Ansi;
  }
}
