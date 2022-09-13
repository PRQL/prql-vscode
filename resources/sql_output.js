window.addEventListener("message", event => {
  const { status, content } = event.data;

  const template = document.getElementById(`status-${status}`).content.cloneNode(true);
  template.lastElementChild.innerHTML = content;

  document.getElementById("result").replaceChildren(template);
});
