import {listBookings} from "../models/booking.model.js";
import {bookingDetails, changeBooking, createBooking} from "../services/booking.service.js";
import {filters, id} from "../validators/rental.validator.js";

export const list = scope => async (req, res) => res.json({success: true, data: await listBookings(scope, req.user.id, filters(req.query, "booking"))});
export const details = scope => async (req, res) => res.json({success: true, data: {booking: await bookingDetails(id(req.params.id), scope, req.user.id)}});
export async function create(req, res) {res.status(201).json({success: true, data: {booking: await createBooking(req.user.id, req.body)}});}
export const transition = action => async (req, res) => res.json({success: true, data: {booking: await changeBooking(req.user, id(req.params.id), action, req.body)}});
