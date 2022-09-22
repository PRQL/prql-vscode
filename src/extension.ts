import * as vscode from "vscode";
import { activateSqlOutputPanel } from "./sql_output";
import { activateDiagnostics } from "./diagnostics";

export function activate(context: vscode.ExtensionContext) {
  activateDiagnostics(context);
  activateSqlOutputPanel(context);
}
