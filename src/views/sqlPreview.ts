import {
  commands,
  window,
  workspace,
  Disposable,
  Event,
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  ViewColumn,
  Webview,
  WebviewPanel,
  WebviewPanelOnDidChangeViewStateEvent,
  Uri
} from 'vscode';

import * as shiki from 'shiki';

import { readFileSync } from 'node:fs';
import * as path from 'path';

import { ViewContext } from './viewContext';
import { CompilationResult } from './compilationResult';

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

  private _highlighter: shiki.Highlighter | undefined;
  private _lastEditor: TextEditor | undefined = undefined;
  private _lastSqlHtml: string | undefined;

  /**
   * Reveals current Sql Preview webview
   * or creates new Sql Preview webview panel
   * for the given PRQL document Uri
   * from an open and active PRQL document editor.
   *
   * @param context Extension context.
   * @param documentUri PRQL document Uri.
   * @param webviewPanel Optional webview panel instance.
   * @param viewConfig View config to restore.
   */
  public static render(context: ExtensionContext, documentUri: Uri,
    webviewPanel?: WebviewPanel, viewConfig?: any) {

    // create view Uri
    const viewUri: Uri = documentUri.with({scheme: 'prql'});

    // check for an open sql preview
    const sqlPreview: SqlPreview | undefined = SqlPreview._views.get(viewUri.toString(true)); // skip encoding
    if (sqlPreview) {
      // show loaded webview panel
      sqlPreview.reveal();
      SqlPreview.currentView = sqlPreview;
    }
    else {
      if (!webviewPanel) {
        // create new webview panel for the prql document sql preview
        webviewPanel = SqlPreview.createWebviewPanel(context, documentUri);
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
          path.join(context.extensionUri.fsPath, 'resources', 'favicon.ico'));
      }

      // set as current sql preview
      SqlPreview.currentView = new SqlPreview(context, webviewPanel, documentUri, viewConfig);
    }

    // update sql preview context values
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, documentUri);
  }

  /**
   * Creates new webview panel for the given prql source document Uri.
   *
   * @param context Extension context.
   * @param documentUri PRQL source document Uri.
   * @returns New webview panel instance.
   */
  private static createWebviewPanel(context: ExtensionContext, documentUri: Uri): WebviewPanel {
    // create new webview panel for sql preview
    const fileName = path.basename(documentUri.path, '.prql'); // strip out prql file ext.

    return window.createWebviewPanel(
      constants.SqlPreviewPanel, // webview panel view type
      `${constants.SqlPreviewTitle}: ${fileName}.sql`, // webview panel title
      {
        viewColumn: ViewColumn.Beside, // display it on the side
        preserveFocus: true
      },
      { // webview panel options
        enableScripts: true, // enable JavaScript in webview
        enableCommandUris: true,
        enableFindWidget: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.joinPath(context.extensionUri, 'resources')],
      }
    );
  }

  /**
   * Creates new SqlPreview webview panel instance.
   *
   * @param context Extension context.
   * @param webviewPanel Reference to the webview panel.
   * @param documentUri PRQL document Uri.
   * @param viewConfig Optional view config to restore.
   */
  private constructor(context: ExtensionContext,
    webviewPanel: WebviewPanel,
    documentUri: Uri, viewConfig?: any) {

    // save view context info
    this._webviewPanel = webviewPanel;
    this._extensionUri = context.extensionUri;
    this._documentUri = documentUri;
    this._viewUri = documentUri.with({scheme: 'prql'});

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
          commands.executeCommand('setContext', ViewContext.SqlPreviewActive, false);
          SqlPreview.currentView = undefined;
        }
      });

    // add prql text document change handler
    [workspace.onDidOpenTextDocument, workspace.onDidChangeTextDocument].forEach(
      (event: Event<TextDocument> | Event<TextDocumentChangeEvent>)  => {
        this._disposables.push(
          event(
            this.debounce(() => {
              this.update(context);
            }, 10)
          )
        );
      }
    );

    // add active text editor change handler
    this._disposables.push(
      window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.uri.fsPath === this.documentUri.fsPath) {
          // reset PRQL editor reference and sql html output
          this._lastEditor = editor;
          this._lastSqlHtml = undefined;

          // clear sql preview context and recompile prql
          // from the linked and active PRQL editor
          // for the webview's PRQL source document
          this.clearSqlPreviewContext(context);
          this.update(context);
        }
      })
    );

    // add color theme change handler
    this._disposables.push(
      window.onDidChangeActiveColorTheme(() => {
        this._highlighter = undefined;
        this._lastSqlHtml = undefined;
        webviewPanel.webview.postMessage({status: 'themeChanged'});
      })
    );

    // add dispose resources handler
    this._webviewPanel.onDidDispose(() => this.dispose(context));
  }

  /**
   * Debounce for sql preview updates on prql text changes.
   *
   * @param fn
   * @param timeout
   * @returns
   */
  private debounce(fn: () => any, timeout: number) {
    let timer: NodeJS.Timeout | undefined;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn();
      }, timeout);
    };
  }

  /**
    * Disposes Sql Preview webview resources when webview panel is closed.
    */
  public dispose(context: ExtensionContext) {
    SqlPreview.currentView = undefined;
    SqlPreview._views.delete(this._viewUri.toString(true)); // skip encoding
    this._disposables.forEach((d) => d.dispose());
    this.clearSqlPreviewContext(context);
  }

  /**
    * Reveals loaded Sql Preview and sets it as active in vscode editor panel.
    */
  public reveal() {
    const viewColumn: ViewColumn = ViewColumn.Active ? ViewColumn.Active : ViewColumn.One;
    this.webviewPanel.reveal(viewColumn);

    // update sql preview view context values
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, this.documentUri);
  }

  /**
     * Configures webview html for Sql Preview display,
     * and registers webview message request handlers for updates.
     *
     * @param context Extension context.
     * @param viewConfig Sql Preview config.
     */
  private configure(context: ExtensionContext): void {
    // set view html content for the webview panel
    this.webviewPanel.webview.html = this.getHtmlTemplate(context, this.webviewPanel.webview);
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

    // send initial prql compile result to webview
    this.update(context);
  }

  /**
    * Reloads Sql Preivew for the active PRQL document Uri or on vscode IDE realod.
    */
  public async refresh(): Promise<void> {
    // update view state
    this.webviewPanel.webview.postMessage({
      command: 'refresh',
      documentUrl: this.documentUri.fsPath
    });
  }

  /**
   * Updates Sql Preview with new PRQL compilation results
   * from the active PRQL text editor.
   *
   * @param context Extension context.
   */
  private update(context: ExtensionContext) {
    // check active text editor
    const editor = window.activeTextEditor;
    if (this.webviewPanel.visible && editor &&
        editor.document.languageId === 'prql' &&
        editor.document.uri.fsPath === this.documentUri.fsPath) {

      // get updated prql code
      const prqlCode = editor.document.getText();
      this.compilePrql(prqlCode, this._lastSqlHtml).then((compilationResult) => {
        if (compilationResult.status === 'ok') {
          // save last valid sql html output to show when errors occur later
          this._lastSqlHtml = compilationResult.html;
        }
        this.webviewPanel.webview.postMessage(compilationResult);

        // set sql preview flag and update sql output
        this.resetSqlPreviewContext();
        context.workspaceState.update('prql.sql', compilationResult.sql);
      });
    }

    if (!this.webviewPanel.visible || !this.webviewPanel.active) {
      this.clearSqlPreviewContext(context);
    }
  }

  /**
   * Resets current/active SQL Preview context and view state.
   *
   * @param context Extension context.
   */
  private async resetSqlPreviewContext() {
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext',
      ViewContext.LastActivePrqlDocumentUri, this.documentUri);
  }

  /**
   * Clears SQL Preview context and view state.
   *
   * @param context Extension context.
   */
  private async clearSqlPreviewContext(context: ExtensionContext) {
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, false);
    context.workspaceState.update('prql.sql', undefined);
  }

  /**
   * Compiles prql code and returns generated sql,
   * and formatted html sql compilation result.
   *
   * @param prqlCode PRQL code to compile.
   * @param lastSqlHtml Last valid sql html output.
   * @returns Compilation result in sql and html formats.
   */
  private async compilePrql(prqlCode: string,
    lastSqlHtml: string | undefined): Promise<CompilationResult> {
    const result = compile(prqlCode);

    if (Array.isArray(result)) {
      return {
        status: 'error',
        error: {
          message: result[0].display ?? result[0].reason,
        },
        lastHtml: lastSqlHtml,
      };
    }

    // create html to display for the generated sql
    const highlighter = await this.getHighlighter();
    const sqlHtml = highlighter.codeToHtml(result, {lang: 'sql'});

    return {
      status: 'ok',
      html: sqlHtml,
      sql: result,
    };
  }

  /**
   * Gets shiki code highlighter instance to create html formatted sql output.
   *
   * @returns Shiki highlighter instance with UI theme matching vscode color theme.
   */
  private async getHighlighter(): Promise<shiki.Highlighter> {
    if (this._highlighter) {
      return Promise.resolve(this._highlighter);
    }
    return (this._highlighter = await shiki.getHighlighter({theme: this.themeName}));
  }

  /**
   * Gets shiki highlighter theme name that matches current vscode color theme
   * to use it as the UI theme for this Sql Preview webview.
   */
  get themeName(): string {
    // get current vscode color UI theme name
    let colorTheme = workspace.getConfiguration('workbench')
      .get<string>('colorTheme', 'dark-plus'); // default to dark plus

    if (shiki.BUNDLED_THEMES.includes(colorTheme as shiki.Theme)) {
      return colorTheme;
    }

    // try normalized color theme name
    colorTheme = colorTheme.toLowerCase().replace('theme', '').replace(/\s+/g, '-');
    if (shiki.BUNDLED_THEMES.includes(colorTheme as shiki.Theme)) {
      return colorTheme;
    }

    // ??? not sure what this means, or does.
    // Does it use the loaded vscode CSS vars
    // when no color theme is set?
    return 'css-variables';
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
   * Gets the source document uri for this view.
   */
  get documentUri(): Uri {
    return this._documentUri;
  }

  /**
   * Gets the view uri to load on sql preview command triggers or vscode IDE reload.
   */
  get viewUri(): Uri {
    return this._viewUri;
  }

  /**
   * Loads and creates html template for Sql Preview webview.
   *
   * @param context Extension context.
   * @param webview Sql Preview webview.
   * @returns Html template to use for Sql Preview webview.
   */
  private getHtmlTemplate(context: ExtensionContext, webview: Webview): string {
    // load webview html template, sql preview script and stylesheet
    const htmlTemplate = readFileSync(
      this.getResourceUri(context, 'sql-preview.html').fsPath, 'utf-8');
    const sqlPreviewScriptUri: Uri = this.getResourceUri(context, 'sqlPreview.js');
    const sqlPreviewStylesheetUri: Uri = this.getResourceUri(context, 'sql-preview.css');

    // inject webview resource urls into the loaded webview html template
    return htmlTemplate.replace(/##CSP_SOURCE##/g, webview.cspSource)
      .replace('##JS_URI##', webview.asWebviewUri(sqlPreviewScriptUri).toString())
      .replace('##CSS_URI##', webview.asWebviewUri(sqlPreviewStylesheetUri).toString());
  }

  /**
   * Gets webview resource Uri from extension directory.
   *
   * @param context Extension context.
   * @param filename Resource filename to create resource Uri.
   * @returns Webview resource Uri.
   */
  private getResourceUri(context: ExtensionContext, fileName: string) {
    return Uri.joinPath(context.extensionUri, 'resources', fileName);
  }
}
