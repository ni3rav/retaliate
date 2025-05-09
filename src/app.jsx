/** @jsx Retaliate.createElement */
import { Retaliate } from "../retaliate.js";

const App = () => {
  return (
    <div className="app">
      <h1>Hello from RetaliateJS</h1>
    </div>
  );
};

// mountinng the app to the dom
const container = document.getElementById("root");
Retaliate.render(<App />, container);
