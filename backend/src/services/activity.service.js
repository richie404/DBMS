// These records are created in the same transaction as the operation they describe.
export async function recordActivity(db,actorId,action,targetType,targetId,description) {
  await db.execute('INSERT INTO activity_logs (actor_id,action,target_type,target_id,description) VALUES (?,?,?,?,?)',[actorId,action,targetType,targetId,description]);
}
export async function bookingNotification(db,booking,property,status) {
  for(const userId of [booking.renter_id,property.owner_id]) await db.execute('INSERT INTO notifications (user_id,category,title,body,property_id,booking_id) VALUES (?,\'booking\',?,?,?,?)',[userId,`Booking ${status}`,`${property.title||'Property'}: booking ${booking.booking_code} is ${status}.`,property.id,booking.id]);
}
export async function listingNotification(db,ownerId,propertyId,title,status) {
  await db.execute('INSERT INTO notifications (user_id,category,title,body,property_id) VALUES (?,\'listing\',?,?,?)',[ownerId,`Listing ${status}`,`${title||'Your listing'} is ${status}.`,propertyId]);
}
