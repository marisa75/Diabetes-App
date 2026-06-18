import Callback from "./components/Callback";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Forum } from "./components/Forum";
import { Recipes } from "./components/Recipes";
import { Events } from "./components/Events";
import { NutritionScan } from "./components/NutritionScan";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "forum", Component: Forum },
      { path: "rezepte", Component: Recipes },
      { path: "events", Component: Events },
      { path: "naehrwert-scan", Component: NutritionScan },
      { path: "callback", Component: Callback },
    ],
  },
]);
