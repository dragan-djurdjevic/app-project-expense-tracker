// Spec: AR-009, AR-010, UI-001
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./app/AppProvider";
import { createContainer } from "./app/composition";
import { StartupError } from "./app/Container";
import { AppRoutes } from "./ui/App";
import { UiRoot } from "./ui/Root";
import StartupErrorScreen from "./ui/screens/StartupError/StartupErrorScreen";

const root = createRoot(document.getElementById("root") as HTMLElement);

async function start() {
  try {
    const container = await createContainer();
    const settings = await container.useCases.getSettings();
    if (!settings.ok) {
      throw new StartupError(settings.error.messageKey, container.runtime.dbPath);
    }
    root.render(
      <StrictMode>
        <UiRoot>
          <AppProvider container={container} initialSettings={settings.value}>
            <AppRoutes />
          </AppProvider>
        </UiRoot>
      </StrictMode>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const dbPath = error instanceof StartupError ? error.dbPath : null;
    root.render(
      <UiRoot>
        <StartupErrorScreen message={message} dbPath={dbPath} />
      </UiRoot>,
    );
  }
}

void start();
