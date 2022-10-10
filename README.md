# PRQL extension for Visual Studio Code

PRQL is a modern language for transforming data — a simple, powerful, pipelined SQL replacement.

The VSCode extension:

- Provides syntax highlighting and diagnostics for PRQL
- Offers a SQL Output Panel, which updates on every keypress. Activate via `Command Palette` -> `PRQL`.

Here's an example:

![syntax_highlighting](/resources/prql-example.png)

### Extension development

- Clone the repository and install dependencies:

  ```
  git clone git@github.com:prql/prql-code.git 
  cd prql-code && npm install
  ```

- Open the project in VSCode and start the TypeScript compilation task via `Command Palette` -> `Tasks: Run build task` -> `npm: watch`. Alternativaly, you can run the compilation in your terminal directly:

  ```
  npm run watch
  ```

- Launch the extension in the Run and Debug panel. If you need to develop against a local version of `prql-js`, use `npm link` and restart the compilation task:

  ```
  npm link ../prql/prql-js
  ```
