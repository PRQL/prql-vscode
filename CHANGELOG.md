# Changelog

## 0.5.0

- Use PRQL logo icon for `.prql` file extensions and display in file explorer
  and editor title bar ([#39](https://github.com/PRQL/prql-vscode/issues/39))
- Add PRQL to SQL context menus to PRQL editor title
  ([#41](https://github.com/PRQL/prql-vscode/issues/41))
- Add Generate SQL File command
  ([#42](https://github.com/PRQL/prql-vscode/issues/42))
- Rename PRQL - SQL Output panel to SQL Preview
  ([#46](https://github.com/PRQL/prql-vscode/issues/46))
- Add prql.target setting and use it to compile PRQL to SQL
  ([#48](https://github.com/PRQL/prql-vscode/issues/48))
- Provide Copy to Clipboard feature in Sql Preview
  ([#55](https://github.com/PRQL/prql-vscode/issues/55))
- Update prql-js to v0.5.0 and use new CompileOptions for the target
  ([#65](https://github.com/PRQL/prql-vscode/issues/65))
- Add PRQL extension to Data Science and Fromatters categories
  ([#70](https://github.com/PRQL/prql-vscode/issues/70))

## 0.4.2

- Update [`prql-js`](https://github.com/PRQL/prql/tree/main/prql-js) compiler to
  version [0.4.2](https://github.com/PRQL/prql/releases/tag/0.4.2)

## 0.4.0

- Upgrade the underlying compiler to
  [PRQL 0.4.0](https://github.com/PRQL/prql/releases/tag/0.4.0)
- Detect PRQL based on language ID rather than file extension by
  [@jiripospisil](https://github.com/jiripospisil)
  ([#25](https://github.com/PRQL/prql-vscode/pull/25))
- Upgrade prql-js to 0.4.0 by [@aljazerzen](https://github.com/aljazerzen)
  ([#29](https://github.com/PRQL/prql-vscode/pull/29))
- Release on releases rather than tags by
  [@max-sixty](https://github.com/max-sixty)
  ([#23](https://github.com/PRQL/prql-vscode/pull/23))

## 0.3.4

- Bump `prql-js` to 0.3.0

## 0.3.3

- Bump `prql-js` to 0.2.11

## 0.3.2

- Provide PRQL diagnostics
- Rename repo to `prql-vscode`, from `prql-code`
- Add GitHub Action to test on each PR
- Add GitHub Action to release on each tag

## 0.3.0

- Live transpiling from PRQL to SQL in a side panel

## 0.2.0

- Update grammar to PRQL version 0.2

## 0.1.0

- Initial release
- Add syntax highlighting for PRQL
