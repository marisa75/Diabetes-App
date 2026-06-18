import React from "react";
import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");

    console.log("Dexcom Code:", code);

    if (code) {
      fetch("http://localhost:3001/auth/dexcom/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then(() => {
          window.location.href = "/";
        })
        .catch(console.error);
    }
  }, []);

  return <div>Dexcom Anmeldung wird verarbeitet...</div>;
}