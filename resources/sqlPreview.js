// initialize vscode api
const vscode = acquireVsCodeApi();

// prql document vars and view state
let documentUrl = '';
let viewState = { documentUrl: documentUrl };

// add page load handler
window.addEventListener('load', initializeView);

/**
 * Initializes sql preview webview.
 */
function initializeView() {
  // restore previous view state
  viewState = vscode.getState();
  if (viewState && viewState.documentUrl) {
    // get last previewed prql document url
    documentUrl = viewState.documentUrl;
  } else {
    // create new empty view config
    viewState = {};
    viewState.documentUrl = documentUrl;
    vscode.setState(viewState);
  }

  // request initial sql preview load
  vscode.postMessage({ command: 'refresh' });
}

// add view update handler
window.addEventListener('message', (event) => {
  switch (event.data.command) {
    case 'update':
      // show updated sql preview content
      update(event.data.result);
      break;
    case 'changeTheme':
      // do nothing: this webview html is UI theme neutral,
      // and will update sql html content on the next edit
      break;
    case 'refresh':
      updateViewState(event.data);
      break;
    default:
      throw new Error('unknown message');
  }
});

/**
 * Updates Sql Preview view state on initial view load and refresh.
 *
 * @param {*} prqlInfo Prql document info from webview.
 */
function updateViewState(prqlInfo) {
  // get and save prql document url in view state
  documentUrl = prqlInfo.documentUrl;
  viewState.documentUrl = documentUrl;
  vscode.setState(viewState);
}

/**
 * Displays updated sql html from compiled PRQL result.
 *
 * @param {*} compilationResult PRQL compilation result.
 */
function update(compilationResult) {
  // show updated sql preview content
  const result = compilationResult;
  const errorContainer = document.getElementById('error-container');
  if (result.status === 'ok') {
    document.getElementById('result').innerHTML = result.sqlHtml;
  } else if (result.lastSqlHtml) {
    document.getElementById('last-html').innerHTML = result.lastSqlHtml;
    document
      .getElementById('error-container')
      .classList.add('error-container-fixed');
  }

  if (result.status === 'error' && result.error.message.length > 0) {
    // show errors
    document.getElementById('error-message').innerHTML = result.error.message;
    errorContainer.style.display = 'block';
  } else {
    // hide error container
    errorContainer.style.display = 'none';
  }
}
