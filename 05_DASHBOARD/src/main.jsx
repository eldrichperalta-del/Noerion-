import "@fontsource/dseg7-classic";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

import "./i18n_language/i18n";

import { AssessmentProvider } from "./context/AssessmentContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <AssessmentProvider>
        <App />
      </AssessmentProvider>
    </ThemeProvider>
  </BrowserRouter>
);