import {
  apiListFavorites,
  apiUpdateFavorite,
  apiDeleteFavorite,
} from "../database_CRUD/api.js";
import { showEditForm } from "../modal_UI/modal.js";

export function bootFavorites() {
  const favListEl = document.getElementById("favorites-list");
  const favStatusEl = document.getElementById("favorites-status");

  if (!favListEl || !favStatusEl) return; // not on the Favorites page

  const setFavStatus = (msg) => {
    favStatusEl.textContent = msg || "";
  };

  function renderFavoriteItemDB(item) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    const h = document.createElement("h4");
    h.textContent = item.title || "";
    card.appendChild(h);

    if (item.image) {
      const img = document.createElement("img");
      img.className = "recipe-image";
      img.src = item.image;
      img.alt = item.title || "Recipe";
      card.appendChild(img);
    }

    if (Array.isArray(item.ingredients) && item.ingredients.length) {
      const sec = document.createElement("section");
      const hh = document.createElement("h4");
      hh.textContent = "Ingredients";
      sec.appendChild(hh);
      const ul = document.createElement("ul");
      item.ingredients.forEach((x) => {
        const li = document.createElement("li");
        li.textContent = x;
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      card.appendChild(sec);
    }

    // Edit
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () =>
      showEditForm(item, async (payload) => {
        await apiUpdateFavorite(item.id, payload);
        await renderFavorites(); // refresh
      })
    );
    card.appendChild(editBtn);

    // Delete
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Delete";
    removeBtn.addEventListener("click", async () => {
      removeBtn.disabled = true;
      try {
        await apiDeleteFavorite(item.id);
        renderFavorites();
      } catch (e) {
        console.error(e);
        removeBtn.disabled = false;
      }
    });
    card.appendChild(removeBtn);

    return card;
  }

  async function renderFavorites() {
    favListEl.innerHTML = "";
    setFavStatus("Loading…");

    try {
      const list = await apiListFavorites();

      if (!list.length) {
        setFavStatus(
          "No favorites yet. Save some recipes from Search or Random."
        );
        return;
      }

      setFavStatus(`You have ${list.length} favorite(s).`);
      list.forEach((it) => favListEl.appendChild(renderFavoriteItemDB(it)));
    } catch (e) {
      console.error(e);
      setFavStatus(e.message || "Failed to load favorites.");
    }
  }

  // initial load
  renderFavorites();
}
