import {
  commands,
  window,
  workspace,
  Disposable,
  Event,
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
  ViewColumn,
  Webview,
  WebviewPanel,
  WebviewPanelOnDidChangeViewStateEvent,
  Uri
} from 'vscode';

import * as shiki from 'shiki';

import { readFileSync } from 'node:fs';
import * as fs from 'fs';
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
  private readonly _documentUri: Uri;
  private readonly _viewUri: Uri;

  private _disposables: Disposable[] = [];
  private _highlighter: shiki.Highlighter | undefined;
  private _lastCompilationResult: CompilationResult | undefined;

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
  public static render(context: ExtensionContext, documentUri: Uri, webviewPanel?: WebviewPanel) {

    // attempt to reveal an open sql preview
    const sqlPreview: SqlPreview | undefined = SqlPreview.reveal(context, documentUri);

    if (sqlPreview === undefined) {
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

      // create new sql peview and set it as current view
      SqlPreview.currentView = new SqlPreview(context, webviewPanel, documentUri);
    }

    sqlPreview?.updateActiveSqlPreviewContext(context);
  }

  /**
   * Reveals an open Sql Preview for a given PRQL document URI.
   *
   * @param context Extension context.
   * @param documentUri PRQL document Uri.
   * @returns The corresponding open Sql Preview for a PRQL document URI, or undefined.
   */
  public static reveal(context: ExtensionContext, documentUri: Uri): SqlPreview | undefined {
    // create view Uri
    const viewUri: Uri = documentUri.with({scheme: 'prql'});

    // get an open sql preview
    const sqlPreview: SqlPreview | undefined = SqlPreview._views.get(viewUri.toString(true)); // skip encoding

    if (sqlPreview !== undefined) {
      // show loaded webview panel
      sqlPreview.reveal(context);
      SqlPreview.currentView = sqlPreview;
      return sqlPreview;
    }
    else {
      // clear active sql preview, context values and prql.sql in workspace state
      SqlPreview.currentView = undefined;
      commands.executeCommand('setContext', ViewContext.SqlPreviewActive, false);
      commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, undefined);
      context.workspaceState.update('prql.sql', undefined);
    }

    return undefined;
  }

  /**
   * Creates new webview panel for the given prql source document Uri.
   *
   * @param context Extension context.
   * @param documentUri PRQL source document Uri.
   * @returns New webview panel instance.
   */
  private static createWebviewPanel(context: ExtensionContext, documentUri: Uri): WebviewPanel {
    // create sql preview filename for the webview panel title display
    const fileName = path.basename(documentUri.path, '.prql'); // strip out prql file ext.

    // create new sql preview webview panel
    const webviewPanel = window.createWebviewPanel(
      constants.SqlPreviewPanel, // webview panel view type
      `${fileName}.sql`, // webview panel title
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

    // set custom sql preview panel icon
    webviewPanel.iconPath = Uri.file(
      path.join(context.extensionUri.fsPath, 'resources', 'prql-logo.png'));

    return webviewPanel;
  }

  /**
   * Creates new SqlPreview webview panel instance.
   *
   * @param context Extension context.
   * @param webviewPanel Reference to the webview panel.
   * @param documentUri PRQL document Uri.
   */
  private constructor(context: ExtensionContext, webviewPanel: WebviewPanel, documentUri: Uri) {
    // save view context info
    this._webviewPanel = webviewPanel;
    this._documentUri = documentUri;
    this._viewUri = documentUri.with({scheme: 'prql'});

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
        // reset highlighter
        this._highlighter = undefined;

        // notify webview
        webviewPanel.webview.postMessage({command: 'changeTheme'});
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
    *
    * @param context Extension context.
    */
  public reveal(context: ExtensionContext) {
    const viewColumn: ViewColumn = ViewColumn.Active ? ViewColumn.Active : ViewColumn.One;
    this.webviewPanel.reveal(viewColumn, true); // preserve current active editor focus
    this.updateActiveSqlPreviewContext(context);
  }

  /**
     * Configures webview html for Sql Preview display,
     * and registers webview message request handlers for updates.
     *
     * @param context Extension context.
     * @param viewConfig Sql Preview config.
     */
  private async configure(context: ExtensionContext) {
    // set view html content for the webview panel
    this.webviewPanel.webview.html = this.getHtmlTemplate(context, this.webviewPanel.webview);

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

    let prqlCode = undefined;
    if (fs.existsSync(this.documentUri.fsPath) &&
        this.documentUri.fsPath.endsWith('.prql')) {

      // load initial prql code from file
      const prqlContent: Uint8Array = await workspace.fs.readFile(
        Uri.file(this.documentUri.fsPath));

      const textDecoder = new TextDecoder('utf8');
      prqlCode = textDecoder.decode(prqlContent);
    }

    // update webview
    this.refresh();
    this.update(context, prqlCode);
  }


  /**
   * Loads and creates html template for Sql Preview webview.
   *
   * @param context Extension context.
   * @param webview Sql Preview webview.
   * @returns Html template to use for Sql Preview webview.
   */
  private getHtmlTemplate(context: ExtensionContext, webview: Webview): string {
    // load webview html template, stylesheet and sql preview script
    const htmlTemplate = readFileSync(
      this.getResourceUri(context, 'sql-preview.html').fsPath, 'utf-8');
    const stylesheetUri: Uri = this.getResourceUri(context, 'sql-preview.css');
    const scriptUri: Uri = this.getResourceUri(context, 'sqlPreview.js');

    // inject webview resource urls into the loaded webview html template,
    // add webview CSP source, and convert css and js Uris to webview resource Uris
    return htmlTemplate.replace(/##CSP_SOURCE##/g, webview.cspSource)
      .replace('##CSS_URI##', webview.asWebviewUri(stylesheetUri).toString())
      .replace('##JS_URI##', webview.asWebviewUri(scriptUri).toString());
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
   * @param prqlCode Optional prql code overwrite to use
   * instead of text from the active vscode PRQL editor.
   */
  private update(context: ExtensionContext, prqlCode?: string) {
    // check active text editor
    const editor = window.activeTextEditor;
    if (this.webviewPanel.visible && editor &&
        editor.document.languageId === 'prql' &&
        editor.document.uri.fsPath === this.documentUri.fsPath) {

      // get updated prql code from the active PRQL text editor
      const prqlCode = editor.document.getText();
      this.processPrql(context, prqlCode);
    }
    else if (prqlCode) {
      this.processPrql(context, prqlCode);
    }
  }

  /**
   * Updates current/active SQL Preview context and view state.
   *
   * @param context Extension context.
   */
  private async updateActiveSqlPreviewContext(context: ExtensionContext) {
    commands.executeCommand('setContext', ViewContext.SqlPreviewActive, true);
    commands.executeCommand('setContext', ViewContext.LastActivePrqlDocumentUri, this.documentUri);
    // update active sql preview sql text in workspace state
    context.workspaceState.update('prql.sql', this._lastCompilationResult?.sql);
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
   * Processes given prql code.
   *
   * @param context Extension context.
   * @param prqlCode PRQL code to process.
   */
  private async processPrql(context: ExtensionContext, prqlCode: string) {
    this.compilePrql(prqlCode, this._lastCompilationResult?.lastSqlHtml).then((compilationResult) => {
      if (compilationResult.status === 'ok') {
        // save the last valid compilation result
        // to show it when errors occur later,
        // or on sql preview panel reveal
        this._lastCompilationResult = compilationResult;
      }

      // update webview
      this.webviewPanel.webview.postMessage({
        command: 'update',
        result: compilationResult
      });

      this.updateActiveSqlPreviewContext(context);
    });
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

    // compile given prql code
    const sqlCode = compile(prqlCode);
    if (Array.isArray(sqlCode)) {
      // return last valid sql html ouput with new error info
      return {
        status: 'error',
        error: {
          message: sqlCode[0].display ?? sqlCode[0].reason,
        },
        lastSqlHtml: lastSqlHtml,
      };
    }

    // create html to display for the generated sql
    const highlighter = await this.getHighlighter();
    const sqlHtml = highlighter.codeToHtml(sqlCode, {lang: 'sql'});

    return {status: 'ok', sqlHtml: sqlHtml, sql: sqlCode};
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
   * Gets the last valid compilation result for this sql preview.
   */
  get lastCompilationResult(): CompilationResult | undefined {
    return this._lastCompilationResult;
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
}
