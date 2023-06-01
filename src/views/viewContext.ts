/* eslint-disable @typescript-eslint/naming-convention */
/**
 * PRQL view context keys enum for when clauses and PRQL view menu commands.
 *
 * @see https://code.visualstudio.com/api/references/when-clause-contexts#add-a-custom-when-clause-context
 * @see https://code.visualstudio.com/api/references/when-clause-contexts#inspect-context-keys-utility
 */
export const enum ViewContext {
  SqlPreviewActive = 'prql.sqlPreviewActive',
  LastActivePrqlDocumentUri = 'prql.lastActivePrqlDocumentUri',
}
