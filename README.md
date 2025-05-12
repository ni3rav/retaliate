# RetaliateJS

- My custom implementation of ReactJS
- Implementation is done from this [awesome blog](https://pomb.us/build-your-own-react/) from [Rodrigo Pombo](https://twitter.com/pomber)

## Progress

- [x] Implemented createElement function
- [x] Implemented render function
- [x] Implement JSX transpilation using esbuild to make it really React like
- [x] Developement server with edit support along with build and dev command
- [x] Incremental asynchronous rendering using `requestIdleCallback`,

- The flow of the rendering can be visualised as follows

![rendering flow](./rendering.png)

- Here each node can have a parent, children, siblings which looks like this

```
        parent
        |
sibling-node-sibling
        |
        children
```

- [x] Diffing algorithm for efficiently updating dom without having to re-render whole thing,

- The flow of diffing can be visualised as follows

![diffing flow](./diffing.png)

- Effect tages are assigned as follows,

        - If types match → "UPDATE"

        - If types don’t match:

                - If element exists → "PLACEMENT"

                - If old fiber exists → "DELETION"

## Problems with current implementation
- Lack of state
- Lack of side-effects
