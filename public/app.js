// ========================================================
// Helpers for favorites (localStorage)
// ========================================================
const LS_KEY = "flavor_table_favorites";

// function to load favorites from localStorage
function loadFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// function to save favorites to localStorage
function saveFavorites(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// A simple stable key to avoid duplicates: title + image
function makeKey(item) {
  const t = (item.title || "").toLowerCase().trim();
  const img = (item.image || "").trim();
  return `${t}||${img}`;
}

// function to save favorite , no duplicates
function saveToFavorites(item) {
  const list = loadFavorites();
  const key = makeKey(item);
  if (list.some((it) => it.key === key)) return false; // already saved
  list.push({ ...item, key, savedAt: Date.now() });
  saveFavorites(list);
  return true;
}

// function to remove favorite from localStorage
function removeFavorite(key) {
  const list = loadFavorites().filter((it) => it.key !== key);
  saveFavorites(list);
}

// ========================================================
// Modal Window
// ========================================================
function ensureModal() {
  let backdrop = document.getElementById("modal-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "modal-backdrop";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h3 id="modal-title">Recipe Details</h3>
          <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div id="modal-body" class="modal-body"></div>
      </div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
    backdrop
      .querySelector(".modal-close")
      .addEventListener("click", closeModal);
  }
  return {
    backdrop,
    body: document.getElementById("modal-body"),
    titleEl: document.getElementById("modal-title"),
  };
}
function openModal() {
  const { backdrop } = ensureModal();
  backdrop.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  if (backdrop) backdrop.style.display = "none";
  document.body.style.overflow = "";
}

// ========================================================
// show Recipe Details
// ========================================================
async function showRecipeDetails(id) {
  const { body, titleEl } = ensureModal();
  body.innerHTML = "Loading…";
  titleEl.textContent = "Recipe Details";
  openModal();

  try {
    const res = await fetch(`/recipes/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with ${res.status}`);
    }
    const d = await res.json(); // { id, title, image, summary, readyInMinutes }

    body.innerHTML = "";
    titleEl.textContent = d.title || "Recipe Details";

    if (d.image) {
      const img = document.createElement("img");
      img.src = d.image;
      img.alt = d.title || "Recipe";
      img.className = "modal-image";
      body.appendChild(img);
    }

    const meta = document.createElement("p");
    meta.className = "modal-meta";
    meta.textContent = `Ready in ${d.readyInMinutes || "?"} min`;
    body.appendChild(meta);

    const sum = document.createElement("p");
    sum.className = "modal-summary";
    sum.textContent = d.summary || "No summary available.";
    body.appendChild(sum);
  } catch (e) {
    body.textContent = e.message || "Failed to load recipe.";
  }
}

// =======================
// Search by Ingredients (index.html)
// =======================
const searchForm = document.getElementById("search-form");
const ingredientsInput = document.getElementById("ingredients-input");
const searchResultsEl = document.getElementById("results");
const searchStatusEl = document.getElementById("status");

// function to set status
function setSearchStatus(msg) {
  if (searchStatusEl) searchStatusEl.textContent = msg || "";
}

// function to sanitize ingredients
function sanitizeIngredients(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

// function to render recipe card
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

  // ---- Save button
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Save to Favorites";
  btn.addEventListener("click", () => {
    const saved = saveToFavorites({
      title: item.title,
      image: item.image,
      usedIngredients: item.usedIngredients || [],
      missedIngredients: item.missedIngredients || [],
      savedFrom: "search",
    });
    btn.textContent = saved ? "Saved ✓" : "Already in Favorites";
    btn.disabled = true;
  });
  card.appendChild(btn);

  // View Details button (only if id exists)
  if (item.id) {
    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.textContent = "View Details";
    detailsBtn.addEventListener("click", () => showRecipeDetails(item.id));
    card.appendChild(detailsBtn);
  }

  return card;
}

// function to fetch recipes
async function searchRecipes(ingredients, limit = 12) {
  const qs = new URLSearchParams({ ingredients, limit });
  const res = await fetch(`/recipes/search?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed with ${res.status}`);
  }
  return res.json();
}

// event listeners
if (searchForm && ingredientsInput && searchResultsEl) {
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

// =======================
// Random Recipe (randomRecipes.html)
// =======================
const randomBtn = document.getElementById("random-btn");
const randomStatusEl = document.getElementById("random-status");
const randomResultEl = document.getElementById("random-result");

// function to set Status
const setRandomStatus = (msg) => {
  if (randomStatusEl) randomStatusEl.innerHTML = msg || "";
};

// function to render random recipe card
function renderRandom(recipe) {
  if (!randomResultEl) return;

  randomResultEl.innerHTML = ""; //clear

  // create title
  const title = document.createElement("h3");
  title.className = "recipe-title";
  title.textContent = recipe.title || "";
  randomResultEl.appendChild(title);

  // create image
  if (recipe.image) {
    const img = document.createElement("img");
    img.className = "recipe-image";
    img.src = recipe.image;
    img.alt = recipe.title || "Recipe";
    randomResultEl.appendChild(img);
  }

  // create instructions
  const steps = String(recipe.instructions || "")
    .split(/(?:\r?\n)+|(?:\.\s+)/) // split by newlines or period+space usibg regex 'reguler expression'
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

  // create ingredients
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

  // ---- Save button
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Save to Favorites";
  btn.addEventListener("click", () => {
    const saved = saveToFavorites({
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions || "",
      ingredients: list,
      savedFrom: "random",
    });
    btn.textContent = saved ? "Saved ✓" : "Already in Favorites";
    btn.disabled = true;
  });
  randomResultEl.appendChild(btn);

  if (recipe.id) {
    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.textContent = "View Details";
    detailsBtn.addEventListener("click", () => showRecipeDetails(recipe.id));
    randomResultEl.appendChild(detailsBtn);
  }

  // show result
  randomResultEl.hidden = false;
}

// function to fetch random recipe
async function fetchRandomRecipe() {
  if (!randomBtn) return;
  setRandomStatus("Loading random recipe…");
  if (randomResultEl) randomResultEl.hidden = true;
  randomBtn.disabled = true;

  try {
    const res = await fetch("/recipes/random");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with ${res.status}`);
    }

    const data = await res.json(); // { title, image, instructions, ingredients }
    renderRandom(data);
    setRandomStatus("");
  } catch (e) {
    console.error(e);
    setRandomStatus(e.message || "Something went wrong.");
  } finally {
    randomBtn.disabled = false;
  }
}

// listeners to fetch random recipe
if (randomBtn) {
  randomBtn.addEventListener("click", fetchRandomRecipe);
  fetchRandomRecipe();
}

// ========================================================
// Favorites page rendering (favorites.html)
// ========================================================
const favListEl = document.getElementById("favorites-list");
const favStatusEl = document.getElementById("favorites-status");

// function to set status
const setFavStatus = (msg) => {
  if (favStatusEl) favStatusEl.textContent = msg || "";
};

// function to create favorite item
function renderFavoriteItem(item) {
  const card = document.createElement("article");
  card.className = "recipe-card";

  const h = document.createElement("h4");
  h.textContent = item.title || "";
  card.appendChild(h);

  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title || "Recipe";
    card.appendChild(img);
  }

  if (Array.isArray(item.ingredients) && item.ingredients.length) {
    const sec = document.createElement("section");
    const h4 = document.createElement("h4");
    h4.textContent = "Ingredients";
    sec.appendChild(h4);
    const ul = document.createElement("ul");
    item.ingredients.forEach((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    card.appendChild(sec);
  } else if (
    Array.isArray(item.usedIngredients) ||
    Array.isArray(item.missedIngredients)
  ) {
    const wrap = document.createElement("div");
    const p1 = document.createElement("p");
    p1.innerHTML = "<strong>Used:</strong> ";
    p1.append(
      document.createTextNode((item.usedIngredients || []).join(", ") || "—")
    );
    const p2 = document.createElement("p");
    p2.innerHTML = "<strong>Missing:</strong> ";
    p2.append(
      document.createTextNode((item.missedIngredients || []).join(", ") || "—")
    );
    wrap.append(p1, p2);
    card.appendChild(wrap);
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    removeFavorite(item.key);
    renderFavorites(); // re-render list
  });
  card.appendChild(removeBtn);

  return card;
}

// function to render favorites
function renderFavorites() {
  if (!favListEl) return;
  const list = loadFavorites();
  favListEl.innerHTML = "";

  if (!list.length) {
    setFavStatus("No favorites yet. Save some recipes from Search or Random.");
    return;
  }
  setFavStatus(`You have ${list.length} favorite(s).`);
  list.forEach((it) => favListEl.appendChild(renderFavoriteItem(it)));
}

if (favListEl) renderFavorites();
