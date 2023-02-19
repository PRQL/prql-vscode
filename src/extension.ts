import {
  window,
  ExtensionContext
} from 'vscode';

import { SqlPreviewSerializer } from './views/sqlPreviewSerializer';
import { activateDiagnostics } from './diagnostics';
import { registerCommands } from './commands';
import { SqlPreview } from './views/sqlPreview';

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
  registerCommands(context);

  // register sql preview serializer for restore on vscode reload
  context.subscriptions.push(SqlPreviewSerializer.register(context));

  // add active text editor change handler
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.fsPath.endsWith('.prql')) {
        // reveal teh corresponding sql preview, if already open
        SqlPreview.reveal(context, editor.document.uri);
      }
    })
  );
}
