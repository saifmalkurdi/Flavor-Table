import { authHeaders } from "../auth.js";

export async function apiListFavorites() {
  const { data } = await axios.get("/api/recipes", { headers: authHeaders() });
  return data;
}
export async function apiCreateFavorite(recipe) {
  const { data } = await axios.post("/api/recipes", recipe, {
    headers: authHeaders(),
  });
  return data;
}
export async function apiUpdateFavorite(id, payload) {
  const { data } = await axios.put(`/api/recipes/${id}`, payload, {
    headers: authHeaders(),
  });
  return data;
}
export async function apiDeleteFavorite(id) {
  const { data } = await axios.delete(`/api/recipes/${id}`, {
    headers: authHeaders(),
  });
  return data;
}
