window.addEventListener("message", event => {
  const { status, content, last_html } = event.data;
  const template = document.getElementById(`status-${status}`).content.cloneNode(true);

  if (status === "ok") {
    template.lastElementChild.innerHTML = content;
  } else {
    if (last_html) {
      template.getElementById("last_html").innerHTML = last_html;
    }
    const el = template.getElementById("error_message");
    message = content.length > 0 ? content : "<h2>Syntax error!</h2>";
    el.innerHTML = message;
  }

  document.getElementById("result").replaceChildren(template);
});
