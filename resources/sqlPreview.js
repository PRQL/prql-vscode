// initialize vscode api
const vscode = acquireVsCodeApi();

// prql document vars and view state
let documentUrl = '';
let viewState = {documentUrl: documentUrl};

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
  }
  else {
    // create new empty view config
    viewState = {};
    viewState.documentUrl = documentUrl;
    vscode.setState(viewState);
  }

  // request initial sql preview load
  vscode.postMessage({command: 'refresh'});
}

// add view update handler
window.addEventListener('message', (event) => {
  switch (event.data.command) {
    case 'update':
      // show updated sql preview content
      const result = event.data.result;
      if (result.status === 'ok') {
        document.getElementById('result').innerHTML = result.sqlHtml;
      }
      else if (result.lastSqlHtml) {
        document.getElementById('last-html').innerHTML = result.lastSqlHtml;
        document.getElementById('error-container').classList.add('error-container-fixed');
      }

      if (result.status === 'error' && result.error.message.length > 0) {
        // show errors
        document.getElementById('error-message').innerHTML = result.error.message;
        document.getElementById('error-container').style.display = 'block';
      }
      // document.getElementById('result').replaceChildren(template);
      break;
    case 'changeTheme':
      // content already in the template: do nothing ???
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
