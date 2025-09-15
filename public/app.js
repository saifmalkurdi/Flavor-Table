import { showRandomRecipe } from "./recipes/showRandomRecipe.js";
import { bootFavorites } from "./recipes/showFavorites.js";
import { bootSearch } from "./recipes/searchRandomRecipe.js";

// only pages that have the elements will run their features
bootSearch();
showRandomRecipe();
bootFavorites();
