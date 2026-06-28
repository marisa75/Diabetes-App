export async function getRecipes() {
  const response = await fetch("http://localhost:3001/api/recipes");

  if (!response.ok) {
    throw new Error("Rezepte konnten nicht geladen werden");
  }

  return response.json();
}