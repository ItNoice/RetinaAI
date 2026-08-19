import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Analysis from "./pages/Analysis.tsx";
import Research from "./pages/Research.tsx";
import About from "./pages/About.tsx";
import Settings from "./pages/Settings.tsx";
import History from "./pages/History.tsx";
import Compare from "./pages/Compare.tsx";
import Experiments from "./pages/Experiments.tsx";
import Methods from "./pages/Methods.tsx";
import Ethics from "./pages/Ethics.tsx";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import { PreferencesProvider } from "./hooks/usePreferences.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<App />}>
              <Route index element={<Dashboard />} />
              <Route path="analysis/:id" element={<Analysis />} />
              <Route path="research" element={<Research />} />
              <Route path="about" element={<About />} />
              <Route path="settings" element={<Settings />} />
              <Route path="history" element={<History />} />
              <Route path="compare" element={<Compare />} />
              <Route path="experiments" element={<Experiments />} />
              <Route path="methods" element={<Methods />} />
              <Route path="ethics" element={<Ethics />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
);
