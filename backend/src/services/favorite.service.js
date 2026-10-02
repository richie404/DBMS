import {assert} from "../utils/api-error.js";
import {addFavorite, listFavorites, removeFavorite} from "../models/favorite.model.js";

export {listFavorites, removeFavorite};
export async function saveFavorite(userId, propertyId) {
  assert(await addFavorite(userId, propertyId), 404, "Available property not found");
}
