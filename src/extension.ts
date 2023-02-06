import { ExtensionContext } from 'vscode';
import { activateSqlPreviewPanel } from './sql_output';
import { activateDiagnostics } from './diagnostics';

/**
 * Activates PRQL extension,
 * enables PRQL text document diagnostics,
 * and registers Open SQL Preview command.
 *
 * @param context Extension context.
 */
export function activate(context: ExtensionContext) {
  activateDiagnostics(context);
  activateSqlPreviewPanel(context);
}
