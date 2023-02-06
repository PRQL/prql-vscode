import {
  ExtensionContext,
  commands,
} from 'vscode';

import * as constants from './constants';

/**
 * Registers PRQL extension commands.
 *
 * @param context Extension context.
 */
export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(constants.GenerateSqlFile, () => {
      // TODO: add Generate Sql File command implementation
    })
  );
}
