import { showDetailsModal } from "../modal_UI/modal.js";

export async function showRecipeDetails(id) {
  try {
    const res = await fetch(`/recipes/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with ${res.status}`);
    }
    const d = await res.json();
    showDetailsModal({
      title: d.title,
      image: d.image,
      summary: d.summary,
      readyInMinutes: d.readyInMinutes,
    });
  } catch (e) {
    alert(e.message || "Failed to load recipe.");
  }
}
