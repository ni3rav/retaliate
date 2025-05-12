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

//* global variables to manage fiber architecture
let nextUnitOfWork = null; //* the next unit of work
let wipRoot = null; //* work in progress root
let currentRoot = null; //* last committed root
let deletions = []; //* tracks fibers to delete

//* creates fiber children from given virtual dom elements
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    //! if type is same -> update
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    //! if new node added -> placement
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    //! if old node removed -> mark for deletion
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (prevSibling && newFiber) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

//* creates a real dom node from a fiber
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);
  return dom;
}

//* updates dom node with new props and removes old ones
function updateDom(dom, prevProps, nextProps) {
  //! remove old or changed event listeners
  Object.keys(prevProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  //! remove old properties
  Object.keys(prevProps)
    .filter((key) => key !== "children" && !key.startsWith("on"))
    .filter((key) => !(key in nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  //! set new or changed properties
  Object.keys(nextProps)
    .filter((key) => key !== "children" && !key.startsWith("on"))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  //! add event listeners
  Object.keys(nextProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => !(key in prevProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

//* commits the fiber tree to the dom
function commitRoot() {
  deletions.forEach(commitWork); //! handle deletions first
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

//* recursively adds dom nodes or applies updates
function commitWork(fiber) {
  if (!fiber) return;

  let parentDom = getParentDom(fiber);

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, parentDom);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

//* removes a fiber’s dom node
function commitDeletion(fiber, parentDom) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentDom);
  }
}

//* finds closest dom parent of a fiber
function getParentDom(fiber) {
  let parentFiber = fiber.parent;
  while (!parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }
  return parentFiber.dom;
}

//* processes one fiber unit
function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  } else {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
  }

  if (fiber.child) return fiber.child;

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }

  return null;
}

//* idle-time rendering loop
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

//* main entry point
function render(element, container) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
  requestIdleCallback(workLoop);
}

export const Retaliate = {
  createElement,
  render,
};
