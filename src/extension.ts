import { ExtensionContext } from "vscode";
import { activateSqlPreviewPanel } from "./sql_output";
import { activateDiagnostics } from "./diagnostics";
import { registerCommands } from "./commands";

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
}
