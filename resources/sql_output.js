window.addEventListener("message", event => {
  const { status, content, last_html } = event.data;
  const template = document.getElementById(`status-${status}`).content.cloneNode(true);

  const el = name => template.getElementById(name);

  switch (status) {
    case "ok":
      template.lastElementChild.innerHTML = content;
      break;
    case "error":
      if (last_html) {
        el("last-html").innerHTML = last_html;
        el("error-container").classList.add("error-container-fixed");
      }

      if (content.length > 0) {
        el("error-message").innerHTML = content;
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
