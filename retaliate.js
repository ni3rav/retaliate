//! things  to do 
// * 1. implement createElement function that transpiles JSX to plain JS object
//* 2. implement render function that takes the transpiled objects and creates a DOM node out of it

const root = document.getElementById("root");

//* this function will take type, props, children as arguments and return them in an object form which can be later used to create an element
function createElement(type, prop, children) {
  return {
    type,
    prop, //! it is and object
    children, //! this can be an array with multiple entries
  };
}

//* this function utilises the elemnt returned by the createElement function to render an actual node in the DOM

function render(element) {
  const node = document.createElement(element.type);
  node["class"] = element.prop.class;

  //* rendering the child, here it is only a string so we are creating a textNode
  const text = document.createTextNode("");
  text["nodeValue"] = element.children;

  //* now appending the child to parent and parent to the document
  node.appendChild(text);
  root.appendChild(node);
}

const element = createElement("h1", { class: "skibidi" }, "hello");
console.log(element);
render(element);
