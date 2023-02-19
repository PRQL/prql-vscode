import {
  commands,
  env,
  window,
  workspace,
  Disposable,
  ExtensionContext,
  Uri,
} from 'vscode';

import * as path from 'path';
import * as constants from './constants';

import { compile } from './compiler';
import { TextEncoder } from 'util';
import { SqlPreview } from './views/sqlPreview';

/**
 * Registers PRQL extension commands.
 *
 * @param context Extension context.
 */
export function registerCommands(context: ExtensionContext) {
  registerCommand(context, constants.GenerateSqlFile, generateSqlFile);
  registerCommand(context, constants.ViewSettings, viewPrqlSettings);

  registerCommand(context, constants.OpenSqlPreview, (documentUri: Uri) => {
    if (!documentUri && window.activeTextEditor) {
      // use active text editor document Uri
      documentUri = window.activeTextEditor.document.uri;
    }

    // render Sql Preview for the requested PRQL document
    SqlPreview.render(context, documentUri);
  });

  registerCommand(context, constants.CopySqlToClipboard, () => {

    // get last generated prql sql content from workspace state
    let sql: string | undefined = context.workspaceState.get('prql.sql');

    let sqlFileName = 'SQL';
    if (SqlPreview.currentView) {
      // get sql filename and content fromn sql preview
      sqlFileName = `prql://${path.basename(SqlPreview.currentView.documentUri.path, '.prql')}.sql`;
      sql = SqlPreview.currentView.lastCompilationResult?.sql;
    }

    if (sql !== undefined) {
      // write the last active sql preview sql code to vscode clipboard
      env.clipboard.writeText(sql);
      window.showInformationMessage(`Copied ${sqlFileName} to Clipboard.`);
    }
  });
}

/**
 * Registers vscode extension command.
 *
 * @param context Extension context.
 * @param commandId Command identifier.
 * @param callback Command handler.
 * @param thisArg The `this` context used when invoking command handler.
 */
function registerCommand(
  context: ExtensionContext,
  commandId: string,
  callback: (...args: any[]) => any,
  thisArg?: any): void {

  const command: Disposable = commands.registerCommand(
    commandId,
    async (...args) => {
      try {
        await callback(...args);
      }
      catch (e: unknown) {
        window.showErrorMessage(String(e));
        console.error(e);
      }
    },
    thisArg
  );
  context.subscriptions.push(command);
}

/**
 * Opens vscode Settings panel with PRQL settings.
 */
async function viewPrqlSettings() {
  await commands.executeCommand(constants.WorkbenchActionOpenSettings, constants.ExtensionId);
}

/**
 * Compiles PRQL text from the active text editor,
 * and creates or updates the corresponding SQL file
 * with PRQL compiler output.
 *
 * Opens generated SQL file in text editor for code formatting,
 * or running generated SQL statements with available
 * vscode database extensions and sql tools.
 */
async function generateSqlFile() {
  const editor = window.activeTextEditor;

  if (editor && editor.document.languageId === 'prql') {
    // compile PRQL
    const prql = editor.document.getText();
    const result = compile(prql);

    if (Array.isArray(result)) {
      window.showErrorMessage(`PRQL Compile \
        ${result[0].display ?? result[0].reason}`);
    }
    else {
      const prqlDocumentUri: Uri = editor.document.uri;
      const prqlFilePath = path.parse(prqlDocumentUri.fsPath);
      const prqlSettings = workspace.getConfiguration('prql');
      const target = <string>prqlSettings.get('target');
      const addTargetDialectToSqlFilenames =
        <boolean>prqlSettings.get(constants.AddTargetDialectToSqlFilenames);

      let sqlFilenameSuffix = '';
      if (addTargetDialectToSqlFilenames && target !== 'Generic' && target !== 'None') {
        sqlFilenameSuffix = `.${target.toLowerCase()}`;
      }

      // create sql filename based on prql file path, name, and current settings
      const sqlFilePath = path.join(prqlFilePath.dir, `${prqlFilePath.name}${sqlFilenameSuffix}.sql`);

      // create sql file
      const sqlFileUri: Uri = Uri.file(sqlFilePath);
      const textEncoder: TextEncoder = new TextEncoder();
      const sqlContent: Uint8Array = textEncoder.encode(result);
      await workspace.fs.writeFile(sqlFileUri, sqlContent);

      // show generated sql file
      await window.showTextDocument(sqlFileUri);
    }
  }
}
