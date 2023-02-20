# PRQL extension for Visual Studio Code

[![Apache-2.0 License](https://img.shields.io/badge/license-Apache2-brightgreen.svg)](http://opensource.org/licenses/Apache-2.0)
[![Version](https://vsmarketplacebadges.dev/version-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Installs](https://vsmarketplacebadges.dev/installs-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Rating](https://vsmarketplacebadges.dev/rating-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)

PRQL is a modern language for transforming data — a simple, powerful, pipelined
SQL replacement.

This extension adds [PRQL](https://prql-lang.org/) support to VSCode IDE.

![PRQL Editor and SQL Preview](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-vscode.png?raw=true)

## Features

- [PRQL](https://prql-lang.org/) language support and syntax highlighting
- SQL Preview with diagnostics updated on every keystroke as you type PRQL
- Copy SQL from Preview to clipboard and use it in new SQL documents
- Generate SQL file shortcut menu
- PRQL compile target setting for the generated SQL dialect

![PRQL Features](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-vscode.gif?raw=true)

## Configuration

Modify
[User or Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings#_creating-user-and-workspace-settings)
in vscode to change the default PRQL compiler target setting.

![PRQL Extension Settings](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-settings.png?raw=true)

Use new PRQL Settings menu in PRQL Editor to access compiler settings:

![View PRQL Settings](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-settings.gif?raw=true)

### PRQL Settings

All PRQL extension settings start with `prql.` They allow you to customize PRQL [compiler options](https://github.com/PRQL/prql/tree/main/prql-js#usage) and filenames of the generated SQL files.

| Setting | Descriptoin |
| --- | --- |
| `target` | PRQL compiler target dialect to use when generating SQL from pipeline definition files (`.prql`). Currently supported PRQL target dialect options are: `Ansi`, `BigQuery`, `ClickHouse`, `DuckDb`, `Generic`, `Hive`, `MsSql`, `MySql`, `Postgres`, `SQLite`, `Snowflake`, and `None`. The `prql.target` default is `Generic`, which will produce SQL that should work with most database management systems. It's recommended you set it to the target DB you are working with in your project [workspace settings](https://code.visualstudio.com/docs/getstarted/settings#_creating-user-and-workspace-settings). You can also disable this option by setting `prql.target` to `None` for this vscode extension. When `prql.target` is set to `None`, PRQL compiler will read the target SQL dialect from `.prql` file header as described in [PRQL Language Book](https://prql-lang.org/book/language-features/target.html). For example, setting `prql.target` to `None` and adding `prql target:sql.postgres` on the first line of your `.prql` query file will produce SQL for `PostgreSQL` database. |

## Developing

- Clone the repository and install dependencies:

  ```sh
  git clone git@github.com:prql/prql-vscode.git
  cd prql-vscode && npm install
  ```

- Open the project in VSCode and start the TypeScript compilation task via
  `Command Palette` -> `Tasks: Run build task` -> `npm: watch`. Alternatively,
  you can run the compilation in your terminal directly:

  ```sh
  npm run watch
  ```

- Launch the extension in the Run and Debug panel. If you need to develop
  against a local version of `prql-js`, use `npm link` and restart the
  compilation task:

  ```sh
  npm link ../prql/prql-js
  ```
