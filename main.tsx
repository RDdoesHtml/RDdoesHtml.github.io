import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Firebase early
import "./lib/firebase";

createRoot(document.getElementById("root")!).render(<App />);
