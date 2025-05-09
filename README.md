# RetaliateJS

- My custom implementation of ReactJS
- Implementation is done from this [awesome blog](https://pomb.us/build-your-own-react/) from [Rodrigo Pombo](https://twitter.com/pomber)

## Progress
- [x] Implemented createElement function
- [x] Implemented render function
- [x] Implement JSX transpilation using esbuild to make it really React like
- [x] Developement server with edit support along with build and dev command

## Problems with current implementation
- Currently the entire rendering is done by synchronous recursive calls to render function which might be an issue for a bigger UI tree so I have to figure out a way to smartly delegate these calls such that UI can be rendered as quick as possible
- Current state of this repo is no different than raw DOM manipulation, need to figure out some way to update the DOM smartly i.e. reconcilation (blog is getting a little bit tough too grasp from the fiber section onwards and I don't want to do just `copy-pasta`)
- Implementing hook like behaviour for Components (`useState` as of now)