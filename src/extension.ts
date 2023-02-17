import { ExtensionContext } from 'vscode';
import { SqlPreviewSerializer } from './views/sqlPreviewSerializer';
import { activateSqlPreviewPanel } from './views/sqlPreview';
import { activateDiagnostics } from './diagnostics';
import { registerCommands } from './commands';

/**
 * Activates PRQL extension,
 * enables PRQL text document diagnostics,
 * registers Open SQL Preview and other
 * PRQL extension commands.
 *
 * @param context Extension context.
 */
export function activate(context: ExtensionContext) {
  activateDiagnostics(context);
  activateSqlPreviewPanel(context);
  registerCommands(context);

  // register sql preview serializer for restore on vscode reload
  context.subscriptions.push(SqlPreviewSerializer.register(context));
}
