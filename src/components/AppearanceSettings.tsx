"use client";

import { useEffect, useState } from "react";

export function AppearanceSettings() {
  const [accent, setAccent] = useState("red");
  useEffect(() => {
    const saved = localStorage.getItem("share-link-accent") || "red";
    setAccent(saved);
    document.documentElement.dataset.accent = saved;
  }, []);
  function choose(value: string) {
    setAccent(value);
    localStorage.setItem("share-link-accent", value);
    document.documentElement.dataset.accent = value;
  }
  return (
    <div className="accent-picker">
      <button className={`accent-option red ${accent === "red" ? "selected" : ""}`} onClick={() => choose("red")} type="button">Đỏ</button>
      <button className={`accent-option blue ${accent === "blue" ? "selected" : ""}`} onClick={() => choose("blue")} type="button">Xanh</button>
    </div>
  );
}
