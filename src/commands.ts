import {
  commands,
  env,
  window,
  workspace,
  Disposable,
  ExtensionContext,
  Uri,
} from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

import { SqlPreview } from './views/sqlPreview';
import { TextEncoder } from 'util';
import { compile } from './compiler';
import * as constants from './constants';

/**
 * Registers PRQL extension commands.
 *
 * @param context Extension context.
 */
export function registerCommands(context: ExtensionContext) {

  registerCommand(context, constants.ViewSettings, viewPrqlSettings);

  registerCommand(context, constants.GenerateSqlFile, (documentUri: Uri) => {

    const editor = window.activeTextEditor;
    if (!documentUri && editor && editor.document.languageId === 'prql') {
      // use prql from the active prql text editor
      generateSqlFile(editor.document.uri, editor.document.getText());
    }
    else if (documentUri &&
      fs.existsSync(documentUri.fsPath) &&
      documentUri.fsPath.endsWith('.prql')) {
      // load prql code from the local prql file
      const prqlCode: string = fs.readFileSync(documentUri.fsPath, 'utf8');
      generateSqlFile(documentUri, prqlCode);
    }
  });

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
 * Compiles PRQL text for the given PRQL document uri, and creates
 * or updates the corresponding SQL file with PRQL compiler output.
 *
 * Opens generated SQL file in text editor for code formatting,
 * or running generated SQL statements with available
 * vscode database extensions and sql tools.
 *
 * @param prqlDocumentUri PRQL source document Uri.
 * @param prqlCode PRQL source code.
 */
async function generateSqlFile(prqlDocumentUri: Uri, prqlCode: string) {

  // compile given prql source code
  const sqlCode = compile(prqlCode);

  if (Array.isArray(sqlCode)) {
    // display prql compilation errors
    window.showErrorMessage(`PRQL Compile \
      ${sqlCode[0].display ?? sqlCode[0].reason}`);
  }
  else {
    // get sql file generation prql settings
    const prqlSettings = workspace.getConfiguration('prql');
    const target = <string>prqlSettings.get('target');
    const addTargetDialectToSqlFilenames =
      <boolean>prqlSettings.get(constants.AddTargetDialectToSqlFilenames);

    // create sql filename based on prql file path, name, and current settings
    const prqlFilePath = path.parse(prqlDocumentUri.fsPath);
    let sqlFilenameSuffix = '';
    if (addTargetDialectToSqlFilenames && target !== 'Generic' && target !== 'None') {
      sqlFilenameSuffix = `.${target.toLowerCase()}`;
    }
    const sqlFilePath = path.join(prqlFilePath.dir, `${prqlFilePath.name}${sqlFilenameSuffix}.sql`);

    // create sql file
    const sqlFileUri: Uri = Uri.file(sqlFilePath);
    const textEncoder: TextEncoder = new TextEncoder();
    const sqlContent: Uint8Array = textEncoder.encode(sqlCode);
    await workspace.fs.writeFile(sqlFileUri, sqlContent);

    // show generated sql file
    await window.showTextDocument(sqlFileUri);
  }
}
