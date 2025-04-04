# PRQL extension for Visual Studio Code

[![Apache-2.0 License](https://img.shields.io/badge/license-Apache2-brightgreen.svg)](http://opensource.org/licenses/Apache-2.0)
[![Version](https://vsmarketplacebadges.dev/version-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Installs](https://vsmarketplacebadges.dev/installs-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)
[![Rating](https://vsmarketplacebadges.dev/rating-short/PRQL-lang.prql-vscode.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=PRQL-lang.prql-vscode)

PRQL is a modern language for transforming data — a simple, powerful, pipelined
SQL replacement.

This extension adds [PRQL](https://prql-lang.org/) support to VS Code.

![PRQL Editor and SQL Preview](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-vscode.png?raw=true)

## Features

- [PRQL](https://prql-lang.org/) language support and syntax highlighting
- SQL Previews with Problems diagnostics and PRQL errors display updated on every keystroke as you type PRQL
- Dedicated SQL Previews linked to open PRQL documents in VS Code editor
- Restore open SQL Previews on VS Code reload
- Copy SQL from an open SQL Preview to VS Code Clipboard
- Generate SQL File PRQL editor context menu shortcut
- View PRQL Settings editor context menu shortcut
- PRQL compile target setting for the generated SQL dialect
- Multi-target SQL generation and file naming options
- Optional PRQL compiler signature comment append in generated SQL

![PRQL Features](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-vscode.gif?raw=true)

### Feature Contributions

PRQL extension contributes the following Settings, Commands, Languages and Activation Events to the VS Code:

![PRQL VS Code Feature Contributions](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-vscode-features.png?raw=true)

## Configuration

Modify
[User or Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings#_creating-user-and-workspace-settings)
in VS Code to change the default PRQL extension Settings globally or only for the open project workspace.

![PRQL Extension Settings](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-settings.png?raw=true)

You can use new `View PRQL Settings` PRQL editor context menu shortcut to access and modify PRQL extension Settings:

![View PRQL Settings](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-settings.gif?raw=true)

### PRQL Settings

PRQL extension Settings allow you to customize PRQL [compiler options](https://github.com/PRQL/prql/tree/main/prqlc/bindings/js#usage) and filenames of the generated SQL files. Use the ⚙️ PRQL Settings shortcut from the open PRQL document editor context menu to access and change these configuration options.

| Setting                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prql.target`                         | Specifies the default PRQL compiler target dialect to use when generating SQL from pipeline definition files (`.prql`) globally or in an open vscode project workspace. Defaults to `Generic`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `prql.addCompilerSignatureComment`    | Adds `Generated by PRQL compiler version ...` signature comment with SQL target dialect info used to create SQL from PRQL document. Defaults to `true`. Set this setting to `false` to stop PRQL compiler from adding `Generated by ...` line to the end of the created SQL.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `prql.addTargetDialectToSqlFilenames` | Adds target dialect suffix to the generated SQL filenames when `Generate Sql File` PRQL document command is used. Defaults to `false`. Set this setting to `true` when targeting multiple database systems with different SQL flavors. For example, projects using [`PostgreSQL`](https://www.postgresql.org/) transaction database and [`DuckDB`](https://duckdb.org/) OLAP database management system for analytics can use this option to generate different SQL from PRQL query documents. PRQL extension will save generated SQL documents as `*.postgre.sql` and `*.duckdb.sql` when using `Generate SQL File` command with the currently selected `prql.target` in PRQL Settings set to `Postgre` or `DuckDB`. |

### PRQL Target

PRQL extension and the underlying [`prqlc-js`](https://github.com/PRQL/prql/tree/main/prqlc/bindings/js#usage) compiler used by this extension supports the following PRQL target dialect options: `Ansi`, `BigQuery`, `ClickHouse`, `DuckDb`, `Generic`, `MsSql`, `MySql`, `Postgres`, `SQLite`, `Snowflake`, and `Any`.

The `prql.target` extension setting default option value is `Generic`, which will produce SQL that should work with most database management systems. We recommend you set it to the target DB you are working with in your project [workspace settings](https://code.visualstudio.com/docs/getstarted/settings#_creating-user-and-workspace-settings).

You can also disable this PRQL compiler option in vscode extension by setting `prql.target` to `Any`. When `prql.target` is set to `Any`, PRQL compiler will read the target SQL dialect from `.prql` file header as described in [PRQL Language Book](https://prql-lang.org/book/project/target.html). For example, setting `prql.target` to `Any` and adding `prql target:sql.postgres` on the first line of your `.prql` query file will produce SQL for `PostgreSQL` database. Otherwise, `Generic` SQL flavor will be used for the generated SQL.

## Deploying the Extension

This repo has the machinery to update the VSCode extension to the Microsoft Marketplace.

When there is a new version of `prqlc` in `npm`, dependabot will PR an update.
Once per day, the _.github/dependabot.yml_ file checks NPM and compares the `dependencies.prqlc` property in _package.json_ to the latest version in NPM. If they differ, dependabot creates a PR for _package.json_.

Once that has been merged, the following manual steps will publish an update for the extension:

- Update the [_CHANGELOG.md_](CHANGELOG.md) file, as needed

- In _package.json_, update the `version` to match. This sets the version number of the extension itself.

- Run `npm install` to update the `package-lock.json`

- Create a new release from Github. This will start a workflow to release the current version to the VS Code Marketplace.

- NB: From time to time, check the `node-version` in the files*.github/workflows/pull-request.yaml* and _.github/workflows/release.yml_. We track Node.js LTS - version 20 in June 2024.

## Developing the Extension

- Clone the repository and install dependencies:

  ```sh
  git clone git@github.com:prql/prql-vscode.git
  cd prql-vscode && npm install
  ```

- Open the project in VS Code and start the TypeScript compilation task via
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
