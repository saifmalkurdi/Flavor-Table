import { apiCreateFavorite } from "../DB/api.js";
import { showRecipeDetails } from "./showRecipeDetail.js";
import { ensureLoggedIn } from "../auth.js";

export function bootSearch() {
  const searchForm = document.getElementById("search-form");
  const ingredientsInput = document.getElementById("ingredients-input");
  const searchResultsEl = document.getElementById("results");
  const searchStatusEl = document.getElementById("status");

  // Not on the search page
  if (!searchForm || !ingredientsInput || !searchResultsEl) return;

  const setSearchStatus = (msg) => {
    if (searchStatusEl) searchStatusEl.textContent = msg || "";
  };

  const sanitizeIngredients = (raw) =>
    String(raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .join(",");

  async function searchRecipes(ingredients, limit = 12) {
    const qs = new URLSearchParams({ ingredients, limit });
    const res = await fetch(`/recipes/search?${qs.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with ${res.status}`);
    }
    return res.json();
  }

  function renderRecipeCard(item) {
    const used = (item.usedIngredients || []).join(", ") || "—";
    const missed = (item.missedIngredients || []).join(", ") || "—";

    const card = document.createElement("article");
    card.className = "recipe-card";

    const title = document.createElement("h4");
    title.className = "recipe-title";
    title.textContent = item.title || "";
    card.appendChild(title);

    if (item.image) {
      const img = document.createElement("img");
      img.className = "recipe-image";
      img.src = item.image;
      img.alt = item.title || "Recipe";
      card.appendChild(img);
    }

    const wrap = document.createElement("div");
    wrap.className = "recipe-ingredients";

    const pUsed = document.createElement("p");
    pUsed.innerHTML = "<strong>Used:</strong> ";
    pUsed.append(document.createTextNode(used));

    const pMiss = document.createElement("p");
    pMiss.innerHTML = "<strong>Missing:</strong> ";
    pMiss.append(document.createTextNode(missed));

    wrap.append(pUsed, pMiss);
    card.appendChild(wrap);

    // Save to favorites
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Save to Favorites";
    btn.addEventListener("click", async () => {
      if (!ensureLoggedIn()) return;
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await apiCreateFavorite({
          title: item.title,
          image: item.image,
          instructions: "",
          ingredients: (item.usedIngredients || []).concat(
            item.missedIngredients || []
          ),
          readyIn: null,
        });
        btn.textContent = "Saved ✓";
      } catch (e) {
        console.error(e);
        if (e?.response?.status === 409) {
          window.alert("This recipe is already in your favorites.");
          btn.textContent = "Already saved ✓";
        } else {
          btn.textContent = "Try Again";
          btn.disabled = false;
        }
      }
    });
    card.appendChild(btn);

    // View details
    if (item.id) {
      const detailsBtn = document.createElement("button");
      detailsBtn.type = "button";
      detailsBtn.textContent = "View Details";
      detailsBtn.addEventListener("click", () => showRecipeDetails(item.id));
      card.appendChild(detailsBtn);
    }

    return card;
  }

  // Submit handler
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    searchResultsEl.innerHTML = "";

    const ingredients = sanitizeIngredients(ingredientsInput.value);
    if (!ingredients) {
      setSearchStatus("Please enter at least one ingredient.");
      return;
    }

    setSearchStatus("Loading recipes…");

    try {
      const data = await searchRecipes(ingredients, 12);
      if (!data || data.length === 0) {
        setSearchStatus("No recipes found. Try different ingredients.");
        return;
      }

      setSearchStatus(`Found ${data.length} recipe(s).`);
      data.forEach((item) =>
        searchResultsEl.appendChild(renderRecipeCard(item))
      );
    } catch (err) {
      console.error(err);
      setSearchStatus(err.message || "Something went wrong.");
    }
  });
}
