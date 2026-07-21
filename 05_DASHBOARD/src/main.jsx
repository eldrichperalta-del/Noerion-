import "@fontsource/dseg7-classic";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

import { AssessmentProvider } from "./context/AssessmentContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AssessmentProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AssessmentProvider>
);