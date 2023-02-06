import {
  commands,
  window,
  workspace,
  Disposable,
  ExtensionContext,
  Uri,
} from "vscode";

import * as path from "path";
import * as constants from "./constants";

import { compile } from "./compiler";
import { TextEncoder } from "util";

/**
 * Registers PRQL extension commands.
 *
 * @param context Extension context.
 */
export function registerCommands(context: ExtensionContext) {
  registerCommand(context, constants.GenerateSqlFile, generateSqlFile);
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
  thisArg?: any
): void {
  const command: Disposable = commands.registerCommand(
    commandId,
    async (...args) => {
      try {
        await callback(...args);
      } catch (e: unknown) {
        window.showErrorMessage(String(e));
        console.error(e);
      }
    },
    thisArg
  );

  context.subscriptions.push(command);
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

  if (editor && editor.document.languageId === "prql") {
    // compile PRQL
    const prql = editor.document.getText();
    const result = compile(prql);

    if (Array.isArray(result)) {
      window.showErrorMessage(`PRQL Compile \
        ${result[0].display ?? result[0].reason}`);
    } else {
      // create sql file
      const prqlDocumentUri: Uri = editor.document.uri;
      const prqlFilePath = path.parse(prqlDocumentUri.fsPath);
      const sqlFilePath = path.join(
        prqlFilePath.dir,
        `${prqlFilePath.name}.sql`
      );
      const sqlFileUri: Uri = Uri.file(sqlFilePath);
      const textEncoder: TextEncoder = new TextEncoder();
      const sqlContent: Uint8Array = textEncoder.encode(result);
      await workspace.fs.writeFile(sqlFileUri, sqlContent);

      // show generated sql file
      await window.showTextDocument(sqlFileUri);
    }
  }
}
