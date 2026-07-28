import { createRoot } from "react-dom/client";
import { I18nProvider } from "@/components/I18nProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PreviewApp from "./PreviewApp";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <I18nProvider>
      <PreviewApp />
    </I18nProvider>
  </ErrorBoundary>
);
