// public/recipes/showRandomRecipe.js
import { apiCreateFavorite } from "../database_CRUD/api.js";
import { showRecipeDetails } from "./showRecipeDetail.js";

export function showRandomRecipe() {
  const randomBtn = document.getElementById("random-btn");
  const randomStatusEl = document.getElementById("random-status");
  const randomResultEl = document.getElementById("random-result");

  // not on random page
  if (!randomBtn || !randomStatusEl || !randomResultEl) return;

  const setRandomStatus = (msg) => {
    randomStatusEl.innerHTML = msg || "";
  };

  function renderRandom(recipe) {
    randomResultEl.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "recipe-title";
    title.textContent = recipe.title || "";
    randomResultEl.appendChild(title);

    if (recipe.image) {
      const img = document.createElement("img");
      img.className = "recipe-image";
      img.src = recipe.image;
      img.alt = recipe.title || "Recipe";
      randomResultEl.appendChild(img);
    }

    // Instructions
    const steps = String(recipe.instructions || "")
      .split(/(?:\r?\n)+|(?:\.\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);

    const secInst = document.createElement("section");
    secInst.className = "recipe-instructions";
    const h4Inst = document.createElement("h4");
    h4Inst.textContent = "Instructions";
    secInst.appendChild(h4Inst);

    if (steps.length) {
      const ol = document.createElement("ol");
      steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        ol.appendChild(li);
      });
      secInst.appendChild(ol);
    } else {
      const p = document.createElement("p");
      p.textContent = "—";
      secInst.appendChild(p);
    }
    randomResultEl.appendChild(secInst);

    // Ingredients
    const secIng = document.createElement("section");
    secIng.className = "recipe-ingredients";
    const h4Ing = document.createElement("h4");
    h4Ing.textContent = "Ingredients";
    secIng.appendChild(h4Ing);

    const list = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    if (list.length) {
      const ul = document.createElement("ul");
      list.forEach((i) => {
        const li = document.createElement("li");
        li.textContent = i;
        ul.appendChild(li);
      });
      secIng.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.textContent = "—";
      secIng.appendChild(p);
    }
    randomResultEl.appendChild(secIng);

    // Save
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Save to Favorites";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await apiCreateFavorite({
          title: recipe.title,
          image: recipe.image,
          instructions: recipe.instructions || "",
          ingredients: list,
          readyIn: recipe.readyInMinutes || null,
        });
        btn.textContent = "Saved ✓";
      } catch (e) {
        console.error(e);
        btn.textContent = "Try Again";
        btn.disabled = false;
      }
    });
    randomResultEl.appendChild(btn);

    // Details
    if (recipe.id) {
      const detailsBtn = document.createElement("button");
      detailsBtn.type = "button";
      detailsBtn.textContent = "View Details";
      detailsBtn.addEventListener("click", () => showRecipeDetails(recipe.id));
      randomResultEl.appendChild(detailsBtn);
    }

    randomResultEl.hidden = false;
  }

  async function fetchRandomRecipe() {
    setRandomStatus("Loading random recipe…");
    randomResultEl.hidden = true;
    randomBtn.disabled = true;

    try {
      const res = await fetch("/recipes/random");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed with ${res.status}`);
      }
      const data = await res.json();
      renderRandom(data);
      setRandomStatus("");
    } catch (e) {
      console.error(e);
      setRandomStatus(e.message || "Something went wrong.");
    } finally {
      randomBtn.disabled = false;
    }
  }

  randomBtn.addEventListener("click", fetchRandomRecipe);
  fetchRandomRecipe(); // auto-load first
}
