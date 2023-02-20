# Changelog

## 0.6.0

- Refactor SQL Preview webview implementation
  ([#60](https://github.com/PRQL/prql-vscode/issues/60))
- Add VSCode marketplace badges to README.md
  ([#87](https://github.com/PRQL/prql-vscode/issues/87))
- Add PRQL Settings shortcut menu button to SQL Preview and PRQL Editor titlebar
  ([#90](https://github.com/PRQL/prql-vscode/issues/90))
- Remove prql-example.png from /resources
  ([#91](https://github.com/PRQL/prql-vscode/issues/91))
- Add PRQL compiler signature comment boolean setting to extension config
  ([#94](https://github.com/PRQL/prql-vscode/issues/94))
- Document new PRQL Settings under Configuration section in README.md
  ([#97](https://github.com/PRQL/prql-vscode/issues/97))
- Change prql.target extension setting default to Generic and add None option
  ([#98](https://github.com/PRQL/prql-vscode/issues/98))
- Set PRQL Settings order to show Target setting first
  ([#99](https://github.com/PRQL/prql-vscode/issues/99))
- Implement SQL Preview webview deserialize to show it after VSCode reload
  ([#102](https://github.com/PRQL/prql-vscode/issues/102))
- Add boolean prql.addTargetDialectToSqlFilenames setting for the generated SQL filenames
  ([#103](https://github.com/PRQL/prql-vscode/issues/103))
- Create and use separate SQL Preview webview for multiple open PRQL documents
  ([#108](https://github.com/PRQL/prql-vscode/issues/108))
- Display virtual sql filename in clipboard copy notification message
  ([#109](https://github.com/PRQL/prql-vscode/issues/109))
- Document new Sql Preview update release v0.6.0 features
  ([#111](https://github.com/PRQL/prql-vscode/issues/111))
- Allow to open Sql Preview for a .prql file from a menu in built-in vscode file explorer
  ([#113](https://github.com/PRQL/prql-vscode/issues/113))
- Allow to generate SQL file from a PRQL document in vscode file explorer
  ([#115](https://github.com/PRQL/prql-vscode/issues/115))
- Add Copy Sql to Clipboard menu option to PRQL editor and Sql Preview editor/title/context menus
  ([#116](https://github.com/PRQL/prql-vscode/issues/116))
- Add PRQL Settings menu to PRQL text editor/title/context menus
  ([#117](https://github.com/PRQL/prql-vscode/issues/117))
- Update CHANGELOG.md for the v0.6.0 release
  ([#120](https://github.com/PRQL/prql-vscode/issues/120))

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
- Update CHANGELOG.md for v0.5.0 release
  ([#68](https://github.com/PRQL/prql-vscode/issues/68))
- Add PRQL extension to Data Science and Fromatters categories
  ([#70](https://github.com/PRQL/prql-vscode/issues/70))
- Create and use new docs/images folder for extension features images in docs
  ([#72](https://github.com/PRQL/prql-vscode/issues/72))
- Update README.md with new features and settings in 0.5.0 version release
  ([#76](https://github.com/PRQL/prql-vscode/issues/76))

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
