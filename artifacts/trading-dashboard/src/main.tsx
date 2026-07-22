import { createRoot } from "react-dom/client";
import { I18nProvider } from "./components/I18nProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ErrorBoundary>
);

