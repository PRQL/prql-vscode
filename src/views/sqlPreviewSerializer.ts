import {
  Disposable,
  ExtensionContext,
  WebviewPanel,
  WebviewPanelSerializer,
  Uri,
  window,
} from 'vscode';

import { SqlPreview } from './sqlPreview';
import * as constants from '../constants';

/**
 * Sql Preview webview panel serializer for restoring open Sql Previews on vscode reload.
 */
export class SqlPreviewSerializer implements WebviewPanelSerializer {
  /**
   * Registers Sql Preview serializer.
   *
   * @param context Extension context.
   * @returns Disposable object for this webview panel serializer.
   */
  public static register(context: ExtensionContext): Disposable {
    return window.registerWebviewPanelSerializer(
      constants.SqlPreviewPanel,
      new SqlPreviewSerializer(context),
    );
  }

  /**
   * Creates new Sql Preview webview serializer.
   *
   * @param extensionUri Extension context.
   */
  constructor(private readonly context: ExtensionContext) {}

  /**
   * Restores open Sql Preview webview panel on vscode reload.
   *
   * @param webviewPanel Webview panel to restore.
   * @param state Saved web view panel state with preview PRQL document Url.
   */
  async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    const documentUri: Uri = Uri.file(state.documentUrl);
    SqlPreview.render(this.context, documentUri, webviewPanel);
  }
}
