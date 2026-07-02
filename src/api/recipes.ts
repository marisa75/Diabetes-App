export async function getRecipes() {
  const response = await fetch("http://localhost:3001/api/recipes");

  if (!response.ok) {
    throw new Error("Rezepte konnten nicht geladen werden");
  }

  return response.json();
}

export async function createRecipe(recipe: {
  title: string;
  category: string;
  time: string;
  description: string;
  nutrition: {
    carbs: number;
    fiber?: number;
    sugar?: number;
    calories?: number;
    protein?: number;
  };
  filterTags: string[];
  ingredients: string[];
  steps: string[];
}) {
  const response = await fetch("http://localhost:3001/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Rezept konnte nicht gespeichert werden");
  }

  return response.json();
}