import pool from "../config/database.js";
import {listProperties} from "../models/property.model.js";
import {archiveProperty, moderateProperty, propertyDetails, saveProperty} from "../services/property.service.js";
import {filters, id, propertyInput} from "../validators/rental.validator.js";

export const list = scope => async (req, res) => res.json({success: true, data: await listProperties(scope, req.user?.id, filters(req.query))});
export const details = scope => async (req, res) => res.json({success: true, data: {property: await propertyDetails(id(req.params.id), scope, req.user?.id)}});
export async function create(req, res) {res.status(201).json({success: true, data: {property: await saveProperty(req.user.id, null, propertyInput(req.body, true))}});}
export async function update(req, res) {res.json({success: true, data: {property: await saveProperty(req.user.id, id(req.params.id), propertyInput(req.body))}});}
export async function archive(req, res) {await archiveProperty(req.user.id, id(req.params.id)); res.json({success: true, data: {archived: true}});}
export async function moderate(req, res) {res.json({success: true, data: {property: await moderateProperty(req.user.id, id(req.params.id), req.body)}});}
export async function amenities(req, res) {const [items] = await pool.query("SELECT id, code, display_name AS name FROM amenities ORDER BY display_name"); res.json({success: true, data: {items}});}
