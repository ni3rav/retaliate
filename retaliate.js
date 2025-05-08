//! things  to do
// * 1. implement createElement function that transpiles JSX to plain JS object
//* 2. implement render function that takes the transpiled objects and creates a DOM node out of it

const root = document.getElementById("root");

//* this function will take type, props, children as arguments and return them in an object form which can be later used to create an element
function createElement(type, props, children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ), //! this can be an array with multiple entries
    }, //! it is and object
  };
}

//* this function handles the creation of primitive node which in our case is a string
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//* this function utilises the elemnt returned by the createElement function to render an actual node in the DOM
function render(element, dom) {
  if (element.type === "TEXT_ELEMENT") {
    const node = document.createTextNode("");
    node.nodeValue = element.props.nodeValue;
    dom.appendChild(node);
    return;
  }
  const node = document.createElement(element.type);

  //* filtering out all none children props and then applying them one by one with forEach loop
  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      node[name] = element.props[name];
    });

  //* recursively calling the render function for each chld and since the child is inside of the element so we are changing the dom argument and passing our parent node here
  element.props.children.forEach((child) => render(child, node));

  //* now appending the child to parent and parent to the document
  dom.appendChild(node);
}

const Retaliate = {
  createElement,
  render,
};

const element = Retaliate.createElement("h1", { className: "skibidi" }, [
  "hello",
]);
console.log(element);
Retaliate.render(element, root);
