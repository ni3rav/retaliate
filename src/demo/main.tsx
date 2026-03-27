/** @jsx Retaliate.createElement */
import { Retaliate } from "../core/retaliate";
import { App } from "./App";

// mountinng the app to the dom
const container = document.getElementById("root") as HTMLElement;
Retaliate.render(<App />, container);
