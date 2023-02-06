window.addEventListener("message", (event) => {
  const { status } = event.data;
  const template = document
    .getElementById(`status-${status}`)
    .content.cloneNode(true);

  const el = (name) => template.getElementById(name);

  switch (status) {
    case "ok":
      template.lastElementChild.innerHTML = event.data.html;
      break;
    case "error":
      const {
        error: { message },
        last_html: lastHtml,
      } = event.data;

      if (lastHtml) {
        el("last-html").innerHTML = lastHtml;
        el("error-container").classList.add("error-container-fixed");
      }

      if (message.length > 0) {
        el("error-message").innerHTML = message;
        el("error-container").style.display = "block";
      }
      break;
    case "theme-changed":
      // Content already in the template
      break;
    default:
      throw new Error("unknown message");
  }

  document.getElementById("result").replaceChildren(template);
});
