window.addEventListener("message", event => {
  const { status, content, last_html } = event.data;
  const template = document.getElementById(`status-${status}`).content.cloneNode(true);

  switch (status) {
    case "ok":
      template.lastElementChild.innerHTML = content;
      break;
    case "error":
      if (last_html) {
        template.getElementById("last_html").innerHTML = last_html;
        template.getElementById("separator").style.display = "block";
      }
      template.getElementById("error_message").innerHTML = content;
      break;
    case "theme-changed":
      // Content already in the template
      break;
    default:
      throw new Error("unknown message");
  }

  document.getElementById("result").replaceChildren(template);
});
