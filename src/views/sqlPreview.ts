import {
  Disposable,
  ExtensionContext,
  TextEditor,
  ViewColumn,
  Webview,
  WebviewPanel,
  WebviewPanelOnDidChangeViewStateEvent,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';

import * as shiki from 'shiki';
import { readFileSync } from 'node:fs';
import * as path from 'path';

import {
  CompilationResult,
  debounce,
  getResourceUri,
  normalizeThemeName,
} from './utils';

import { ViewContext } from './viewContext';
import { isPrqlDocument } from '../utils';
import { compile } from '../compiler';
import * as constants from '../constants';

/**
 * Defines Sql Preview class for managing state and behaviour of Sql Preview webview panel(s).
 */
export class SqlPreview {

  // view tracking vars
  public static currentView: SqlPreview | undefined;
  private static _views: Map<string, SqlPreview> = new Map<string, SqlPreview>();

  // view instance vars
  private readonly _webviewPanel: WebviewPanel;
  private readonly _extensionUri: Uri;
  private readonly _documentUri: Uri;
  private readonly _viewUri: Uri;
  private _viewConfig: any = {};
  private _disposables: Disposable[] = [];

  /**
     * Reveals current sql preview webview
     * or creates new sql preview webview panel
     * for the given PRQL document Uri from and active editor.
     *
     * @param context Extension context.
     * @param documentUri PRQL document Uri.
     * @param webviewPanel Optional webview panel instance.
     * @param viewConfig View config to restore.
     */
  public static render(context: ExtensionContext, documentUri: Uri,
    webviewPanel?: WebviewPanel, viewConfig?: any) {

    // create view Uri
    const viewUri: Uri = documentUri.with({ scheme: 'prql' });

    // check for open sql preview
    const sqlPreview: SqlPreview | undefined = SqlPreview._views.get(viewUri.toString(true)); // skip encoding
    if (sqlPreview) {
      // show loaded webview panel in the active editor view column
      sqlPreview.reveal();
      SqlPreview.currentView = sqlPreview;
    }
    else {
      if (!webviewPanel) {
        // create new webview panel for the prql document sql preview
        webviewPanel = SqlPreview.createWebviewPanel(documentUri);
      }
      else {
        // enable scripts for existing webview panel
        webviewPanel.webview.options = {
          enableScripts: true,
          enableCommandUris: true
        };
      }

      if (webviewPanel) {
        // set custom sql preview panel icon
        webviewPanel.iconPath = Uri.file(
          path.join(context.extensionUri.fsPath, './resources/icons/prql-logo.png'));
      }

      // set as current sql preview
      SqlPreview.currentView = new SqlPreview(context, webviewPanel, documentUri, viewConfig);
    }

    // update table view context values
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, documentUri);
  }

  /**
   * Creates new webview panel for the given prql source document Uri.
   *
   * @param documentUri PRQL source document Uri.
   * @returns New webview panel instance.
   */
  private static createWebviewPanel(documentUri: Uri): WebviewPanel {
    // create new webview panel for sql preview
    const fileName = path.basename(documentUri.path, '.prql');
    return window.createWebviewPanel(
      constants.SqlPreviewPanel, // webview panel view type
      `${constants.SqlPreviewTitle}: ${fileName}`, // webview panel title
      {
        viewColumn: ViewColumn.Beside, // use active view column for display
        preserveFocus: true
      },
      { // webview panel options
        enableScripts: true, // enable JavaScript in webview
        enableCommandUris: true,
        enableFindWidget: true,
        retainContextWhenHidden: true
      }
    );
  }

  /**
   * Creates new SqlPreivew webview panel instance.
   *
   * @param context Extension context.
   * @param webviewPanel Reference to the webview panel.
   * @param documentUri PRQL document Uri.
   * @param tableConfig Optional view config to restore.
   */
  private constructor(context: ExtensionContext,
    webviewPanel: WebviewPanel,
    documentUri: Uri, viewConfig?: any) {

    // save webview panel and extension uri
    this._webviewPanel = webviewPanel;
    this._extensionUri = context.extensionUri;
    this._documentUri = documentUri;
    this._viewUri = documentUri.with({ scheme: 'prql' });

    if (viewConfig) {
      // save view config to restore
      this._viewConfig = viewConfig;
    }

    // configure webview panel
    this.configure(context);

    // add it to the tracked sql preview webviews
    SqlPreview._views.set(this._viewUri.toString(true), this);

    // update view context values on webview state change
    this._webviewPanel.onDidChangeViewState(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (viewChangeEvent: WebviewPanelOnDidChangeViewStateEvent) => {
        if (this._webviewPanel.active) {
          // update view context values
          commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
          commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, documentUri);
          SqlPreview.currentView = this;
        }
        else {
          // clear sql preview context
          commands.executeCommand('etContext', ViewContext.SqlPreviewActive, false);
          SqlPreview.currentView = undefined;
        }
      });

    // dispose view resources when thi webview panel is closed by the user or via vscode apis
    this._webviewPanel.onDidDispose(this.dispose, this, this._disposables);
  }

  /**
    * Disposes Sql Preview webview resources when webview panel is closed.
    */
  public dispose() {
    SqlPreview.currentView = undefined;
    SqlPreview._views.delete(this._viewUri.toString(true)); // skip encoding
    while (this._disposables.length) {
      const disposable: Disposable | undefined = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

    // clear active view context value
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, false);
  }

  /**
    * Reveals loaded Sql Preview and sets it as active in vscode editor panel.
    */
  public reveal() {
    const viewColumn: ViewColumn = ViewColumn.Active ? ViewColumn.Active : ViewColumn.One;
    this.webviewPanel.reveal(viewColumn);

    // update table view context values
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, this.documentUri);
  }

  /**
     * Configures webview html for the Sql Preview display,
     * and registers webview message request handlers for updates.
     *
     * @param context Extension context.
     * @param viewConfig Sql Preview config.
     */
  private configure(context: ExtensionContext): void {
    // set view html content for the webview panel
    this.webviewPanel.webview.html = getCompiledTemplate(context, this.webviewPanel.webview);
    // this.getWebviewContent(this.webviewPanel.webview, this._extensionUri, viewConfig);

    // process webview messages
    this.webviewPanel.webview.onDidReceiveMessage((message: any) => {
      const command: string = message.command;
      switch (command) {
        case 'refresh':
          // reload data view and config
          this.refresh();
          break;
      }
    }, undefined, this._disposables);
  }

  /**
    * Reloads table view on data save changes or vscode IDE realod.
    */
  public async refresh(): Promise<void> {
    // update view state
    this.webviewPanel.webview.postMessage({
      command: 'refresh',
      documentUrl: this.documentUri.fsPath
    });
  }

  /**
   * Gets the underlying webview panel instance for this view.
   */
  get webviewPanel(): WebviewPanel {
    return this._webviewPanel;
  }

  /**
   * Gets view panel visibility status.
   */
  get visible(): boolean {
    return this._webviewPanel.visible;
  }


  /**
   * Gets the source data uri for this view.
   */
  get documentUri(): Uri {
    return this._documentUri;
  }

  /**
   * Gets the view uri to load on tabular data view command triggers or vscode IDE reload.
   */
  get viewUri(): Uri {
    return this._viewUri;
  }
}

function getCompiledTemplate(context: ExtensionContext, webview: Webview): string {
  // load webview html template, sql preview script and stylesheet
  const htmlTemplate = readFileSync(
    getResourceUri(context, 'sql-preview.html').fsPath, 'utf-8');
  const sqlPreviewScriptUri: Uri = getResourceUri(context, 'sqlPreview.js');
  const sqlPreviewStylesheetUri: Uri = getResourceUri(context, 'sql-preview.css');

  // inject web resource urls into the loaded webview html template
  return htmlTemplate.replace(/##CSP_SOURCE##/g, webview.cspSource)
    .replace('##JS_URI##', webview.asWebviewUri(sqlPreviewScriptUri).toString())
    .replace('##CSS_URI##', webview.asWebviewUri(sqlPreviewStylesheetUri).toString());
}

function getThemeName(): string {
  const currentThemeName = workspace.getConfiguration('workbench')
    .get<string>('colorTheme', 'dark-plus');

  for (const themeName of [currentThemeName, normalizeThemeName(currentThemeName)]) {
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

async function compilePrql(text: string,
  lastOkHtml: string | undefined): Promise<CompilationResult> {
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

export function createWebviewPanel(context: ExtensionContext,
  onDidDispose?: () => any): WebviewPanel {

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

  panel.onDidDispose(() => {
      clearSqlContext(context);
      disposables.forEach((d) => d.dispose());
      if (onDidDispose !== undefined) {
        onDidDispose();
      }
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
    }
    else {
      panel = createWebviewPanel(context, () => (panel = undefined));
      panelViewColumn = panel?.viewColumn;
    }
  });
  context.subscriptions.push(command);
}
