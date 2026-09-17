import { createRoot } from "react-dom/client";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { captureAttribution } from "./lib/leads";
import "./index.css";

initAnalytics();
captureAttribution();

createRoot(document.getElementById("root")!).render(<App />);
