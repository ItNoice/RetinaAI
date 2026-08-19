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
import { ThemeProvider } from "./hooks/useTheme.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="analysis/:id" element={<Analysis />} />
            <Route path="research" element={<Research />} />
            <Route path="about" element={<About />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
