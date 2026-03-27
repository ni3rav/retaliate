// ? |---------------------TYPES------------------------------|

//* Element can be a host tag name ("div") or a function component.
export type ElementType = string | FunctionComponent;

//* Function component takes props and returns one virtual element root.
export type FunctionComponent = (props: Props) => VirtualElement;

//* Valid child value accepted by JSX in this runtime.
export type Child =
  | VirtualElement
  | string
  | number
  | boolean
  | null
  | undefined;

//* Generic props bag carried by each virtual element/fiber.
export type Props = {
  children: Child[];
  [key: string]: unknown;
};

//* Virtual DOM node shape produced by createElement/createTextElement.
export type VirtualElement = {
  type: ElementType | "TEXT_ELEMENT";
  props: Props;
};

//* Side effect assigned during reconciliation for commit phase.
type EffectTag = "PLACEMENT" | "UPDATE" | "DELETION";

//* Internal fiber node used during scheduling, reconciliation, and commit.
type Fiber = {
  type?: ElementType | "TEXT_ELEMENT";
  props: Props;
  dom: Node | null;
  parent?: Fiber;
  child?: Fiber | null;
  sibling?: Fiber | null;
  alternate?: Fiber | null;
  effectTag?: EffectTag;
};

//* creates a virtual dom element
function createElement(
  type: ElementType,
  props: Record<string, unknown> = {},
  ...children: Child[]
): VirtualElement {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map((child) =>
          typeof child === "object"
            ? (child as VirtualElement)
            : createTextElement(child),
        ),
    },
  };
}

// ? |-------------- GLOBAL VARIABLE ----------------|
//* global variables to manage fiber architecture
let nextUnitOfWork: Fiber | null = null; //* the next unit of work
let wipRoot: Fiber | null = null; //* work in progress root
let currentRoot: Fiber | null = null; //* last committed root
let deletions: Fiber[] = []; //* tracks fibers to delete

// ? |------------------- FUNCTIONS ------------------------|

//* handles text nodes separately
function createTextElement(text: Child): VirtualElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//* creates fiber children from given virtual dom elements
function reconcileChildren(
  wipFiber: Fiber,
  elements: Array<VirtualElement | undefined>,
) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child ?? null;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    //! if type is same -> update
    if (sameType && oldFiber && element) {
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
      oldFiber = oldFiber.sibling ?? null;
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
function createDom(fiber: Fiber): Node {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);
  return dom;
}

//* updates dom node with new props and removes old ones
function updateDom(
  dom: Node,
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
) {
  const domElement = dom as HTMLElement & Text;
  const dynamicDom = domElement as any;

  //! remove old or changed event listeners
  Object.keys(prevProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      domElement.removeEventListener(
        eventType,
        prevProps[name] as EventListener,
      );
    });

  //! remove old properties
  Object.keys(prevProps)
    .filter((key) => key !== "children" && !key.startsWith("on"))
    .filter((key) => !(key in nextProps))
    .forEach((name) => {
      dynamicDom[name] = "";
    });

  //! set new or changed properties
  Object.keys(nextProps)
    .filter((key) => key !== "children" && !key.startsWith("on"))
    .forEach((name) => {
      dynamicDom[name] = nextProps[name];
    });

  //! add event listeners
  Object.keys(nextProps)
    .filter((key) => key.startsWith("on"))
    .filter((key) => !(key in prevProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      domElement.addEventListener(eventType, nextProps[name] as EventListener);
    });
}

//* commits the fiber tree to the dom
function commitRoot() {
  if (!wipRoot) return;

  deletions.forEach(commitWork); //! handle deletions first
  commitWork(wipRoot.child ?? null);
  currentRoot = wipRoot;
  wipRoot = null;
}

//* recursively adds dom nodes or applies updates
function commitWork(fiber: Fiber | null) {
  if (!fiber) return;

  const parentDom = getParentDom(fiber);

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    parentDom.appendChild(fiber.dom);
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null &&
    fiber.alternate
  ) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, parentDom);
    return;
  }

  commitWork(fiber.child ?? null);
  commitWork(fiber.sibling ?? null);
}

//* removes a fiber's dom node
function commitDeletion(fiber: Fiber, parentDom: Node) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else if (fiber.child) {
    commitDeletion(fiber.child, parentDom);
  }
}

//* finds closest dom parent of a fiber
function getParentDom(fiber: Fiber): Node {
  let parentFiber = fiber.parent;
  while (parentFiber && !parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }

  if (!parentFiber?.dom) {
    throw new Error("Unable to find parent DOM node.");
  }

  return parentFiber.dom;
}

//* processes one fiber unit
function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    const component = fiber.type as FunctionComponent;
    const children = [component(fiber.props)];
    reconcileChildren(fiber, children);
  } else {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }

    reconcileChildren(fiber, fiber.props.children as VirtualElement[]);
  }

  if (fiber.child) return fiber.child;

  let nextFiber: Fiber | undefined = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }

  return null;
}

//* idle-time rendering loop
function workLoop(deadline: IdleDeadline) {
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
function render(element: VirtualElement, container: HTMLElement) {
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
