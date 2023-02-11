# PRQL extension for Visual Studio Code

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
