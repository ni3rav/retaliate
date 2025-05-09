function createElement(type, props, children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
function render(element, dom) {
  if (element.type === "TEXT_ELEMENT") {
    const node = document.createTextNode("");
    node.nodeValue = element.props.nodeValue;
    dom.appendChild(node);
    return;
  }
  const node = document.createElement(element.type);

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      node[name] = element.props[name];
    });

  element.props.children.forEach((child) => render(child, node));

  dom.appendChild(node);
}

export const Retaliate = {
  createElement,
  render,
};
