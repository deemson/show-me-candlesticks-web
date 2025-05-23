import ReactDOM from "react-dom/client";
import { App } from "@/react/App";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("null root container");
}
ReactDOM.createRoot(container).render(<App />);
