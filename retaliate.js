//* creates a virtual dom element
function createElement(type, props = {}, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map((child) =>
          typeof child === "object" ? child : createTextElement(child)
        ),
    },
  };
}

//* handles text nodes separately
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//* holds the next unit of work for the fiber tree
let nextUnitOfWork = null;

//* represents the root fiber we’re currently working on
let wipRoot = null;

//* creates fiber children from given virtual dom elements
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    //* new fiber for each child element
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: wipFiber,
      dom: null,
    };

    //* if it's the first child, attach to fiber.child
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      //* else attach to previous sibling
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

//* creates the real dom node from a fiber
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("") //* text node
      : document.createElement(fiber.type); //* regular element

  //* set properties except children
  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

//* commits the whole fiber tree to the real dom
function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

//* recursively appends fiber dom nodes to parent
function commitWork(fiber) {
  if (!fiber) return;

  const parentDom = getParentDom(fiber);
  if (fiber.dom) {
    parentDom.appendChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

//* finds the nearest ancestor fiber that has a dom node
function getParentDom(fiber) {
  let parentFiber = fiber.parent;
  while (!parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }
  return parentFiber.dom;
}

//* processes one fiber (a unit of work)
function perfromUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    //* call function component and reconcile returned elements
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  } else {
    //* create dom if not already created
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    //* reconcile its children
    reconcileChildren(fiber, fiber.props.children);
  }

  //* return next unit of work in depth-first order
  if (fiber.child) return fiber.child;

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }

  return null;
}

//* main loop to do rendering work when the browser is idle
function workLoop(deadline) {
  //* keep working if we have work and there's time left
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = perfromUnitOfWork(nextUnitOfWork);
  }

  //* if done building, commit the whole fiber tree
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  } else {
    //* else keep requesting idle time to continue
    requestIdleCallback(workLoop);
  }
}

//* entry point to start rendering and sets up the root fiber
function render(element, container) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: null,
  };
  nextUnitOfWork = wipRoot;
  requestIdleCallback(workLoop);
}

export const Retaliate = {
  createElement,
  render,
};
