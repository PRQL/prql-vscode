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
  const { status } = event.data;
  const template = document.getElementById(`status-${status}`).content.cloneNode(true);

  switch (status) {
    case 'ok':
      // show updated sql html
      template.lastElementChild.innerHTML = event.data.html;
      break;
    case 'error':
      const {
        error: { message },
        last_html: lastHtml,
      } = event.data;

      if (lastHtml) {
        document.getElementById('last-html').innerHTML = lastHtml;
        document.getElementById('error-container').classList.add('error-container-fixed');
      }

      if (message.length > 0) {
        document.getElementById('error-message').innerHTML = message;
        document.getElementById('error-container').style.display = 'block';
      }
      break;
    case 'themeChanged':
      // content already in the template: do nothing ???
      break;
    case 'refresh':
      updateViewState(event.data);
      break;
    default:
      throw new Error('unknown message');
  }

  document.getElementById('result').replaceChildren(template);
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
