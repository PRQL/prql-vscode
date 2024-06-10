# Deploying and Development

The VSCode Extension for PRQL relies on the `prqlc` code from the
main PRQL repo. There are two Github Actions that wacth for updates
in this directory to build and release the extension to the
Microsoft Marketplace.

## Deploying/Updating the Extension

When there is a new version of PRQL (`prqlc` in particular):

- In _package.json_, update:

  - `version` to the proper version (from the main PRQL repo)
  - `dependencies.prqlc` to the same version
  - (optional) update other dependencies and devDependencies

- Check _.github/workflows/pull-request.yaml_ and _.github/workflows/release.yml_ to ensure that the `node-version` is correct.

- Run `npm install` to get/update dependencies

- Run `npm run compile`. to build the extensions files

- (I AM GUESSING HERE...) The `.github` workflows check the
  `main` branch on a daily basis to see whether there have been
  changes and push a new extension as needed.

## Developing

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
