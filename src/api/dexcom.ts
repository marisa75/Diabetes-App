export async function getDexcomData() {
    const response = await fetch(
      "http://localhost:3001/api/glucose/latest"
    );
  
    if (!response.ok) {
      throw new Error("Dexcom Daten konnten nicht geladen werden");
    }
  
    return response.json();
  }