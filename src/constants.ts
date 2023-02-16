/* eslint-disable @typescript-eslint/naming-convention */

/**
 * PRQL extension constants.
 */

// Extension constants
export const PublisherId = 'PRQL-lang';
export const ExtensionName = 'prql-vscode';
export const ExtensionId = 'prql';
export const ExtensionDisplayName = 'PRQL';

// PRQL webview constants
export const SqlPreviewPanel = `${ExtensionId}.sqlPreviewPanel`;
export const SqlPreviewTitle = 'SQL Preview';

// PRQL extension command constants
export const OpenSqlPreview = `${ExtensionId}.openSqlPreview`;
export const GenerateSqlFile = `${ExtensionId}.generateSqlFile`;
export const CopySqlToClipboard = `${ExtensionId}.copySqlToClipboard`;
export const ViewSettings = `${ExtensionId}.viewSettings`;

// PRQL extension setting keys
export const AddCompilerSignatureComment = 'addCompilerSignatureComment';
export const AddTargetDialectToSqlFilenames = 'addTargetDialectToSqlFilenames';

// PRQL context keys
export const SqlPreviewActive = `${ExtensionId}.sqlPreviewActive`;

// VSCodes actions and commands
export const WorkbenchActionOpenSettings = 'workbench.action.openSettings';
