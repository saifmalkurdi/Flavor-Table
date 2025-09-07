export async function apiListFavorites() {
  const { data } = await axios.get("/api/recipes");
  return data;
}
export async function apiCreateFavorite(recipe) {
  const { data } = await axios.post("/api/recipes", recipe);
  return data;
}
export async function apiUpdateFavorite(id, payload) {
  const { data } = await axios.put(`/api/recipes/${id}`, payload);
  return data;
}
export async function apiDeleteFavorite(id) {
  const { data } = await axios.delete(`/api/recipes/${id}`);
  return data;
}
