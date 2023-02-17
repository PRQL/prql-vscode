import {
  Disposable,
  ExtensionContext,
  TextEditor,
  ViewColumn,
  Webview,
  WebviewPanel,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import * as shiki from 'shiki';
import { readFileSync } from 'node:fs';

import {
  CompilationResult,
  debounce,
  getResourceUri,
  normalizeThemeName,
} from './utils';

import { ViewContext } from '../views/viewContext';
import { isPrqlDocument } from '../utils';
import { compile } from '../compiler';
import * as constants from '../constants';

function getCompiledTemplate(
  context: ExtensionContext,
  webview: Webview
): string {
  const template = readFileSync(
    getResourceUri(context, 'sql_output.html').fsPath,
    'utf-8'
  );
  const templateJS = getResourceUri(context, 'sql_output.js');
  const templateCss = getResourceUri(context, 'sql_output.css');

  return (template as string)
    .replace(/##CSP_SOURCE##/g, webview.cspSource)
    .replace('##JS_URI##', webview.asWebviewUri(templateJS).toString())
    .replace('##CSS_URI##', webview.asWebviewUri(templateCss).toString());
}

function getThemeName(): string {
  const currentThemeName = workspace
    .getConfiguration('workbench')
    .get<string>('colorTheme', 'dark-plus');

  for (const themeName of [
    currentThemeName,
    normalizeThemeName(currentThemeName),
  ]) {
    if (shiki.BUNDLED_THEMES.includes(themeName as shiki.Theme)) {
      return themeName;
    }
  }

  return 'css-variables';
}

let highlighter: shiki.Highlighter | undefined;

async function getHighlighter(): Promise<shiki.Highlighter> {
  if (highlighter) {
    return Promise.resolve(highlighter);
  }

  return (highlighter = await shiki.getHighlighter({ theme: getThemeName() }));
}

async function compilePrql(
  text: string,
  lastOkHtml: string | undefined
): Promise<CompilationResult> {
  const result = compile(text);

  if (Array.isArray(result)) {
    return {
      status: 'error',
      error: {
        message: result[0].display ?? result[0].reason,
      },
      lastHtml: lastOkHtml,
    };
  }

  const highlighter = await getHighlighter();
  const highlighted = highlighter.codeToHtml(result, { lang: 'sql' });

  return {
    status: 'ok',
    html: highlighted,
    sql: result,
  };
}

/**
 * Clears active SQL Preview context and view state.
 *
 * @param context Extension context.
 */
function clearSqlContext(context: ExtensionContext) {
  commands.executeCommand('setContext', ViewContext.SqlPreviewActive, false);
  context.workspaceState.update('prql.sql', undefined);
}

let lastOkHtml: string | undefined;

function sendText(context: ExtensionContext, panel: WebviewPanel) {
  const editor = window.activeTextEditor;

  if (panel.visible && editor && isPrqlDocument(editor)) {
    const text = editor.document.getText();
    compilePrql(text, lastOkHtml).then((result) => {
      if (result.status === 'ok') {
        lastOkHtml = result.html;
      }
      panel.webview.postMessage(result);

      // set sql preview flag and update sql output
      commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
      commands.executeCommand('setContext',
        ViewContext.LastActivePrqlDocumentUri, editor.document.uri);
      context.workspaceState.update('prql.sql', result.sql);
    });
  }

  if (!panel.visible || !panel.active) {
    clearSqlContext(context);
  }
}

function sendThemeChanged(panel: WebviewPanel) {
  panel.webview.postMessage({ status: 'theme-changed' });
}

function createWebviewPanel(
  context: ExtensionContext,
  onDidDispose: () => any
): WebviewPanel {
  const panel = window.createWebviewPanel(
    constants.SqlPreviewPanel,
    constants.SqlPreviewTitle,
    {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true,
    },
    {
      enableFindWidget: false,
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(context.extensionUri, 'resources')],
    }
  );
  panel.webview.html = getCompiledTemplate(context, panel.webview);
  panel.iconPath = getResourceUri(context, 'favicon.ico');

  const disposables: Disposable[] = [];

  [workspace.onDidOpenTextDocument, workspace.onDidChangeTextDocument].forEach(
    (event) => {
      disposables.push(
        event(
          debounce(() => {
            sendText(context, panel);
          }, 10)
        )
      );
    }
  );

  let lastEditor: TextEditor | undefined = undefined;
  disposables.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor !== lastEditor) {
        lastEditor = editor;
        lastOkHtml = undefined;
        clearSqlContext(context);
        sendText(context, panel);
      }
    })
  );

  disposables.push(
    window.onDidChangeActiveColorTheme(() => {
      highlighter = undefined;
      lastOkHtml = undefined;
      sendThemeChanged(panel);
    })
  );

  panel.onDidDispose(
    () => {
      clearSqlContext(context);
      disposables.forEach((d) => d.dispose());
      onDidDispose();
    },
    undefined,
    context.subscriptions
  );

  sendText(context, panel);

  return panel;
}

export function activateSqlPreviewPanel(context: ExtensionContext) {
  let panel: WebviewPanel | undefined = undefined;
  let panelViewColumn: ViewColumn | undefined = undefined;

  const command = commands.registerCommand(constants.OpenSqlPreview, () => {
    if (panel) {
      panel.reveal(panelViewColumn, true);
    } else {
      panel = createWebviewPanel(context, () => (panel = undefined));
      panelViewColumn = panel?.viewColumn;
    }
  });
  context.subscriptions.push(command);
}
