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

## Problems with current implementation

- Lacks efficient diffing i.e. re-rendering whole dom in case of changes which is not ideal, it should update only the updated part
- Lack of state (will start with implementing `useState` and then maybe `useEffect`)
