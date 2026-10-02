import {apiRequest} from "../lib/api";
import type {Property} from "../types/rentals";
export const favoriteService = {
  list: async () => (await apiRequest<{items: Property[]}>("/favorites")).items,
  add: (id: number) => apiRequest(`/favorites/${id}`, {method: "POST", csrf: true}),
  remove: (id: number) => apiRequest(`/favorites/${id}`, {method: "DELETE", csrf: true}),
};
