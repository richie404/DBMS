import {listFavorites, removeFavorite, saveFavorite} from "../services/favorite.service.js";
import {id} from "../validators/rental.validator.js";

export async function list(req, res) {res.json({success: true, data: {items: await listFavorites(req.user.id)}});}
export async function create(req, res) {await saveFavorite(req.user.id, id(req.params.propertyId)); res.json({success: true, data: {saved: true}});}
export async function remove(req, res) {await removeFavorite(req.user.id, id(req.params.propertyId)); res.json({success: true, data: {saved: false}});}
