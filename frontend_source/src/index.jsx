import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
// Temporarily disabled i18n initialization to fix loading issues
// import "./i18n";
import "./styles/tailwind.css";
import "./styles/index.css";
import "./styles/music.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
