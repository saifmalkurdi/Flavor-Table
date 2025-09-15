import { apiCreateFavorite } from "../DB/api.js";
import { ensureLoggedIn } from "../auth.js";

function ensureModal() {
  let backdrop = document.getElementById("modal-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "modal-backdrop";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h3 id="modal-title">Recipe</h3>
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

export function openModal() {
  const { backdrop } = ensureModal();
  backdrop.style.display = "flex";
  document.body.style.overflow = "hidden";
}

export function closeModal() {
  const { backdrop } = ensureModal();
  if (backdrop) backdrop.style.display = "none";
  document.body.style.overflow = "";
}

export function showDetailsModal({
  id,
  title,
  image,
  summary,
  readyInMinutes,
}) {
  const { body, titleEl } = ensureModal();
  titleEl.textContent = title || "Recipe Details";
  body.innerHTML = "";

  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = title || "Recipe";
    img.className = "modal-image";
    body.appendChild(img);
  }

  const meta = document.createElement("p");
  meta.className = "modal-meta";
  meta.textContent = `Ready in ${readyInMinutes ?? "?"} min`;
  body.appendChild(meta);

  const sum = document.createElement("p");
  sum.className = "modal-summary";
  sum.textContent = summary || "No summary available.";
  body.appendChild(sum);

  // --- Save to Favorites button ---
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.marginTop = "8px";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Save to Favorites";
  saveBtn.addEventListener("click", async () => {
    if (!ensureLoggedIn()) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    try {
      await apiCreateFavorite({
        title: title || "Recipe",
        image: image || null,
        instructions: "",
        ingredients: [],
        readyIn: readyInMinutes ?? null,
      });
      saveBtn.textContent = "Saved ✓";
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        window.alert("This recipe is already in your favorites.");
        saveBtn.textContent = "Already saved ✓";
      } else {
        saveBtn.textContent = "Try Again";
        saveBtn.disabled = false;
      }
    }
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", closeModal);

  actions.append(saveBtn, closeBtn);
  body.appendChild(actions);

  openModal();
}

export function showEditForm(item, onSubmit) {
  const { body, titleEl } = ensureModal();
  titleEl.textContent = `Edit: ${item.title || "Recipe"}`;

  body.innerHTML = `
    <form id="updateForm" autocomplete="off">
      <label>Title
        <input name="title" type="text" required value="${item.title || ""}">
      </label>
      <label>Image URL
        <input name="image" type="url" value="${item.image || ""}">
      </label>
      <label>Ready in (minutes)
        <input name="readyIn" type="number" min="0" value="${
          item.readyIn ?? ""
        }">
      </label>
      <label>Instructions
        <textarea name="instructions" rows="5">${
          item.instructions || ""
        }</textarea>
      </label>
      <label>Ingredients (comma-separated)
        <input name="ingredients" type="text"
               value="${
                 Array.isArray(item.ingredients)
                   ? item.ingredients.join(", ")
                   : ""
               }">
      </label>
      <div class="form-actions">
        <button type="submit">Save</button>
        <button type="button" class="modal-close">Cancel</button>
      </div>
    </form>
  `;

  body.querySelector(".modal-close").addEventListener("click", closeModal);
  body.querySelector("#updateForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: (fd.get("title") || "").toString().trim(),
      image: (fd.get("image") || "").toString().trim(),
      readyIn: fd.get("readyIn") ? Number(fd.get("readyIn")) : null,
      instructions: (fd.get("instructions") || "").toString(),
      ingredients: (fd.get("ingredients") || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await onSubmit(payload);
    closeModal();
  });

  openModal();
}
