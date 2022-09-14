import * as vscode from "vscode";
import { activateSqlOutputPanel } from "./sql_output";

export function activate(context: vscode.ExtensionContext) {
  activateSqlOutputPanel(context);
}
