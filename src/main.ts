import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createMechaUI, defineMechaPreset } from "./lib";

const combatPreset = defineMechaPreset({
  tokens: {
    "mecha-accent": "#ff8a2a",
    "mecha-accent-cool": "#29f0dd",
    "mecha-grid-line": "rgb(41 240 221 / 0.11)"
  }
});

const app = createApp(App);
app.use(createMechaUI(combatPreset));
app.mount("#app");
