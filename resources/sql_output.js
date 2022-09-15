window.addEventListener("message", event => {
  const { status, content, last_html } = event.data;
  const template = document.getElementById(`status-${status}`).content.cloneNode(true);

  if (status === "ok") {
    template.lastElementChild.innerHTML = content;
  } else {
    if (last_html) {
      template.getElementById("last_html").innerHTML = last_html;
      template.getElementById("separator").style.display = "block";
    }
    template.getElementById("error_message").innerHTML = content;
  }

  document.getElementById("result").replaceChildren(template);
});
