# PRQL extension for Visual Studio Code

PRQL is a modern language for transforming data — a simple, powerful, pipelined
SQL replacement.

The VSCode extension:

- Provides syntax highlighting and diagnostics for PRQL
- Offers generated SQL Preview Panel, which updates on every keypress. Activate
  via `Command Palette` -> `PRQL: Open SQL Preview`.

Here's an example:

![PRQL Syntax Highlighting](https://github.com/PRQL/prql-vscode/blob/main/docs/images/prql-example.png?raw=true)

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
