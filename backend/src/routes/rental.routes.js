import { recordActivity } from "../services/activity.service.js"
﻿import { ensureFree } from "../services/availability.service.js"
import { Router } from "express"
import { bookingFilter } from "../services/booking-filters.js"
import { today } from "../services/rental.service.js"
import { visibleProperties } from "./property.routes.js"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireRole from "../middleware/require-role.js"
import requireCsrf from "../middleware/csrf.js"
import {
  transaction,
  RentalError,
  fail,
  id,
  quote,
  propertyForRenter,
  notify,
} from "../services/rental.service.js"

const router = Router()
router.use(
  ["/dashboard/summary", "/bookings", "/conversations", "/notifications"],
  requireAuth,
)
const renter = requireRole("renter")
const participants = requireRole("renter", "owner")
const handle = (callback) => async (request, response, next) => {
  try {
    response
      .set("Cache-Control", "no-store")
      .json({ success: true, data: await callback(request) })
  } catch (error) {
    if (error instanceof RentalError)
      response
        .status(error.status)
        .json({ success: false, message: error.message })
    else next(error)
  }
}
router.get(
  "/dashboard/summary",
  renter,
  handle(async (request) => {
    const userId = request.user.id
    const active = bookingFilter("active", today()),
      pending = bookingFilter("pending", today())
    const [[summary]] = await pool.execute(
      `SELECT
    (SELECT COUNT(*) FROM favorites f JOIN properties p ON p.id=f.property_id WHERE f.user_id=? AND ${visibleProperties}) AS savedProperties,
    (SELECT COUNT(*) FROM bookings b WHERE b.renter_id=? AND b.deleted_at IS NULL AND ${active.sql}) AS activeBookings,
    (SELECT COUNT(*) FROM bookings b WHERE b.renter_id=? AND b.deleted_at IS NULL AND ${pending.sql}) AS pendingRequests,
    (SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.renter_id=? AND m.sender_id<>? AND m.read_at IS NULL) AS unreadMessages,
    (SELECT COUNT(DISTINCT c.id) FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.renter_id=? AND m.sender_id<>? AND m.read_at IS NULL) AS unreadConversations,
    (SELECT c.id FROM conversations c WHERE c.renter_id=? AND EXISTS(SELECT 1 FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.read_at IS NULL) ORDER BY c.updated_at DESC,c.id DESC LIMIT 1) AS latestUnreadConversationId`,
      [
        userId,
        userId,
        ...active.values,
        userId,
        ...pending.values,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
      ],
    )
    return { summary }
  }),
)
const bookingColumns = `(SELECT c.id FROM conversations c WHERE c.property_id=b.property_id AND c.renter_id=b.renter_id AND c.owner_id=p.owner_id LIMIT 1) AS conversationId,b.id,b.booking_code AS bookingCode,b.property_id AS propertyId,p.title,p.location,p.owner_id AS ownerId,u.name AS renterName,o.name AS ownerName,
 DATE_FORMAT(b.start_date,'%Y-%m-%d') AS startDate,DATE_FORMAT(b.end_date,'%Y-%m-%d') AS endDate,b.monthly_rent_snapshot AS monthlyRent,b.deposit_snapshot AS depositAmount,b.total_amount AS totalRent,b.currency,b.status,b.decision_reason AS decisionReason`
router.get(
  "/bookings",
  requireRole("renter", "owner", "admin"),
  handle(async (request) => {
    const where =
      request.user.role === "admin"
        ? "1=1"
        : request.user.role === "owner"
          ? "p.owner_id=?"
          : "b.renter_id=?"
    const filter = bookingFilter(String(request.query.filter ?? ""), today())
    if (!filter) fail(400, "Invalid booking filter")
    const [bookings] = await pool.execute(
      `SELECT ${bookingColumns} FROM bookings b JOIN properties p ON p.id=b.property_id JOIN users u ON u.id=b.renter_id JOIN users o ON o.id=p.owner_id WHERE ${where} AND b.deleted_at IS NULL AND ${filter.sql} ORDER BY b.created_at DESC,b.id DESC`,
      [
        ...(request.user.role === "admin" ? [] : [request.user.id]),
        ...filter.values,
      ],
    )
    return { bookings, total: bookings.length }
  }),
)
router.get(
  "/bookings/quote",
  renter,
  handle(async (request) => {
    const property = await propertyForRenter(
      pool,
      request.query.propertyId,
      request.user.id,
    )
    const calculated = quote(
      property,
      request.query.startDate,
      request.query.endDate,
      request.query.months,
    )
    await ensureFree(
      pool,
      property.id,
      calculated.startDate,
      calculated.endDate,
    )
    return {
      quote: {
        ...calculated,
        owner: {
          id: property.ownerId,
          name: property.ownerName,
          avatarUrl: property.ownerAvatarUrl,
        },
      },
    }
  }),
)
router.post(
  "/bookings",
  renter,
  requireCsrf,
  handle((request) =>
    transaction(async (connection) => {
      const input = request.body ?? {}
      const property = await propertyForRenter(
        connection,
        input.propertyId,
        request.user.id,
        true,
      )
      const calculated = quote(
        property,
        input.startDate,
        input.endDate,
        input.months,
      )
      if (
        input.quotedOwnerId != null &&
        input.quotedOwnerId !== property.ownerId
      )
        fail(
          409,
          "The listing owner changed. Review the current owner before requesting.",
        )
      if (
        input.quotedMonthlyRent !== calculated.monthlyRent ||
        input.quotedDeposit !== calculated.depositAmount
      )
        fail(
          409,
          "The rental price changed. Review a fresh quote before submitting",
        )
      const [[existing]] = await connection.execute(
        "SELECT id FROM bookings WHERE property_id=? AND renter_id=? AND status IN ('pending','approved','confirmed') AND deleted_at IS NULL AND start_date=? AND end_date=? LIMIT 1",
        [
          property.id,
          request.user.id,
          calculated.startDate,
          calculated.endDate,
        ],
      )
      if (existing)
        fail(
          409,
          "You already have a request for this property and period. Review it in My Bookings",
        )
      await ensureFree(
        connection,
        property.id,
        calculated.startDate,
        calculated.endDate,
      )
      const [result] = await connection.execute(
        "INSERT INTO bookings (property_id,renter_id,start_date,end_date,monthly_rent_snapshot,deposit_snapshot,total_amount,currency,status) VALUES (?,?,?,?,?,?,?,?,'pending')",
        [
          property.id,
          request.user.id,
          calculated.startDate,
          calculated.endDate,
          calculated.monthlyRent,
          calculated.depositAmount,
          calculated.totalRent,
          calculated.currency,
        ],
      )
      const bookingCode = `RN-${result.insertId}`
      await connection.execute(
        "UPDATE bookings SET booking_code=? WHERE id=?",
        [bookingCode, result.insertId],
      )
      await connection.execute(
        "INSERT INTO booking_events (booking_id,actor_id,previous_status,new_status) VALUES (?,?,NULL,'pending')",
        [result.insertId, request.user.id],
      )
      await notify(connection, {
        userId: property.ownerId,
        category: "booking",
        title: "New booking request",
        body: `${request.user.name} requested ${property.title || "your property"} (${calculated.startDate} â€“ ${calculated.endDate}).`,
        propertyId: property.id,
        bookingId: result.insertId,
      })
      return {
        booking: {
          id: result.insertId,
          bookingCode,
          propertyId: property.id,
          status: "pending",
          ...calculated,
        },
      }
    }),
  ),
)
router.patch(
  "/bookings/:id/decision",
  requireRole("owner"),
  requireCsrf,
  handle((request) =>
    transaction(async (connection) => {
      const bookingId = id(request.params.id)
      const status = request.body?.status
      if (!["approved", "rejected", "confirmed"].includes(status))
        fail(400, "Choose approve, reject, or confirm")
      const reason =
        typeof request.body?.reason === "string"
          ? request.body.reason.trim()
          : null
      if (reason?.length > 1000)
        fail(400, "Reason must be at most 1000 characters")
      const [[owned]] = await connection.execute(
        "SELECT b.property_id AS propertyId FROM bookings b JOIN properties p ON p.id=b.property_id WHERE b.id=? AND p.owner_id=? AND b.deleted_at IS NULL",
        [bookingId, request.user.id],
      )
      if (!owned) fail(404, "Booking not found")
      const [[property]] = await connection.execute(
        "SELECT id,owner_id AS currentOwnerId,is_available AS available,moderation_status AS moderation,deleted_at AS deletedAt,DATE_FORMAT(available_from,'%Y-%m-%d') AS availableFrom FROM properties WHERE id=? FOR UPDATE",
        [owned.propertyId],
      )
      if (property.currentOwnerId !== request.user.id)
        fail(404, "Booking not found")
      const [[booking]] = await connection.execute(
        "SELECT *,DATE_FORMAT(start_date,'%Y-%m-%d') AS startISO,DATE_FORMAT(end_date,'%Y-%m-%d') AS endISO FROM bookings WHERE id=? FOR UPDATE",
        [bookingId],
      )
      if (booking.status !== (status === "confirmed" ? "approved" : "pending"))
        fail(409, "This request has already been reviewed")
      if (["approved", "confirmed"].includes(status)) {
        if (
          !property.available ||
          property.moderation !== "approved" ||
          property.deletedAt
        )
          fail(409, "Property is no longer available")
        if (booking.endISO <= today())
          fail(
            409,
            "This rental period has already ended. Ask the renter for a new request.",
          )
        if (
          (status === "approved" && booking.startISO < today()) ||
          (property.availableFrom && booking.startISO < property.availableFrom)
        )
          fail(
            409,
            "This request starts before the current earliest move-in date. Ask the renter for a new request.",
          )
        await ensureFree(
          connection,
          property.id,
          booking.startISO,
          booking.endISO,
          bookingId,
        )
      }
      await connection.execute(
        "UPDATE bookings SET status=?,decision_by=?,decision_at=NOW(),decision_reason=? WHERE id=?",
        [status, request.user.id, reason, bookingId],
      )
      await connection.execute(
        "INSERT INTO booking_events (booking_id,actor_id,previous_status,new_status,reason) VALUES (?,?,?,?,?)",
        [bookingId, request.user.id, booking.status, status, reason],
      )
      await notify(connection, {
        userId: booking.renter_id,
        category: "booking",
        title: `Booking ${status}`,
        body: `Your request ${booking.booking_code} was ${status}.${
          reason ? ` ${reason}` : ""
        }`,
        propertyId: property.id,
        bookingId,
      })
      await recordActivity(connection,request.user.id,"booking."+status,"booking",bookingId,`Booking ${booking.booking_code} ${status}`)
      return { status }
    }),
  ),
)
router.patch(
  "/bookings/:id/cancel",
  renter,
  requireCsrf,
  handle((request) =>
    transaction(async (connection) => {
      const bookingId = id(request.params.id)
      const [[owned]] = await connection.execute(
        "SELECT property_id AS propertyId FROM bookings WHERE id=? AND renter_id=? AND deleted_at IS NULL",
        [bookingId, request.user.id],
      )
      if (!owned) fail(404, "Booking not found")
      const [[property]] = await connection.execute(
        "SELECT owner_id AS ownerId FROM properties WHERE id=? FOR UPDATE",
        [owned.propertyId],
      )
      const [[booking]] = await connection.execute(
        "SELECT *,DATE_FORMAT(start_date,'%Y-%m-%d') AS startISO FROM bookings WHERE id=? AND renter_id=? AND deleted_at IS NULL FOR UPDATE",
        [bookingId, request.user.id],
      )
      if (!booking) fail(404, "Booking not found")
      if (!["pending", "approved", "confirmed"].includes(booking.status))
        fail(409, "This booking cannot be cancelled here")
      if (booking.startISO < today())
        fail(409, "A rental that has started cannot be cancelled here")
      await connection.execute(
        "UPDATE bookings SET status='cancelled',cancelled_by=?,cancelled_at=NOW() WHERE id=?",
        [request.user.id, booking.id],
      )
      await connection.execute(
        "INSERT INTO booking_events (booking_id,actor_id,previous_status,new_status) VALUES (?,?,?,'cancelled')",
        [booking.id, request.user.id, booking.status],
      )
      await notify(connection, {
        userId: property.ownerId,
        category: "booking",
        title: "Booking cancelled",
        body: `${request.user.name} cancelled request ${booking.booking_code}.`,
        propertyId: booking.property_id,
        bookingId: booking.id,
      })
      await recordActivity(connection,request.user.id,"booking.cancelled","booking",booking.id,`Booking ${booking.booking_code} cancelled`)
      return { status: "cancelled" }
    }),
  ),
)


router.post('/bookings/:id/conversation',requireRole('owner'),requireCsrf,handle(request=>transaction(async connection=>{
 const bookingId=id(request.params.id);const [[ref]]=await connection.execute('SELECT property_id FROM bookings WHERE id=? AND deleted_at IS NULL',[bookingId]);if(!ref)fail(404,'Booking not found');
 const [[property]]=await connection.execute('SELECT id,owner_id FROM properties WHERE id=? FOR UPDATE',[ref.property_id]);if(!property||property.owner_id!==request.user.id)fail(404,'Booking not found');
 const [[booking]]=await connection.execute('SELECT renter_id FROM bookings WHERE id=? AND deleted_at IS NULL FOR UPDATE',[bookingId]);if(!booking)fail(404,'Booking not found');
 const [[renter]]=await connection.execute("SELECT id FROM users WHERE id=? AND status='active' AND deleted_at IS NULL",[booking.renter_id]);if(!renter)fail(409,'This renter is no longer available for messages');
 await connection.execute('INSERT INTO conversations (property_id,renter_id,owner_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',[property.id,booking.renter_id,request.user.id]);
 const [[record]]=await connection.execute('SELECT id,disabled_at FROM conversations WHERE property_id=? AND renter_id=? AND owner_id=?',[property.id,booking.renter_id,request.user.id]);if(record.disabled_at)fail(409,'This conversation is disabled');return {conversationId:record.id};
})));

async function conversation(connection, conversationId, userId, lock = false) {
  const [[record]] = await connection.execute(
    `SELECT * FROM conversations WHERE id=? AND (renter_id=? OR owner_id=?) ${
      lock ? "FOR UPDATE" : ""
    }`,
    [id(conversationId), userId, userId],
  )
  if (!record) fail(404, "Conversation not found")
  return record
}
router.get(
  "/conversations",
  participants,
  handle(async (request) => {
    const [conversations] = await pool.execute(
      `SELECT c.id,(c.owner_id<>p.owner_id) AS listingOwnerChanged,c.property_id AS propertyId,p.title AS propertyTitle,c.disabled_at AS disabledAt,c.disabled_reason AS disabledReason,
    CASE WHEN c.renter_id=? THEN o.name ELSE r.name END AS participantName,CASE WHEN c.renter_id=? THEN o.avatar_url ELSE r.avatar_url END AS participantAvatar,
    (SELECT message_text FROM messages WHERE conversation_id=c.id ORDER BY id DESC LIMIT 1) AS lastMessage,
    (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id<>? AND read_at IS NULL) AS unread
    FROM conversations c JOIN properties p ON p.id=c.property_id JOIN users r ON r.id=c.renter_id JOIN users o ON o.id=c.owner_id WHERE c.renter_id=? OR c.owner_id=? ORDER BY c.updated_at DESC,c.id DESC`,
      [
        request.user.id,
        request.user.id,
        request.user.id,
        request.user.id,
        request.user.id,
      ],
    )
    return { conversations }
  }),
)
router.post(
  "/conversations",
  renter,
  requireCsrf,
  handle((request) =>
    transaction(async (connection) => {
      const property = await propertyForRenter(
        connection,
        request.body?.propertyId,
        request.user.id,
        true,
      )
      await connection.execute(
        "INSERT INTO conversations (property_id,renter_id,owner_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [property.id, request.user.id, property.ownerId],
      )
      const [[record]] = await connection.execute(
        "SELECT id,disabled_at AS disabledAt,disabled_reason AS disabledReason FROM conversations WHERE property_id=? AND renter_id=? AND owner_id=?",
        [property.id, request.user.id, property.ownerId],
      )
      if (record.disabledAt)
        fail(
          409,
          record.disabledReason
            ? `This conversation is disabled: ${record.disabledReason}`
            : "This conversation is disabled",
        )
      return { conversationId: record.id }
    }),
  ),
)
router.get(
  "/conversations/:id/messages",
  participants,
  handle(async (request) => {
    const record = await conversation(pool, request.params.id, request.user.id)
    const after = request.query.after == null ? null : id(request.query.after)
    const before =
      request.query.before == null ? null : id(request.query.before)
    if (after && before) fail(400, "Use only one message cursor")
    const values = [record.id]
    let clause = ""
    if (after) {
      clause = " AND id > ?"
      values.push(after)
    } else if (before) {
      clause = " AND id < ?"
      values.push(before)
    }
    const [rows] = await pool.execute(
      `SELECT id,sender_id AS senderId,message_text AS text,sent_at AS sentAt,delivered_at AS deliveredAt,read_at AS readAt FROM messages WHERE conversation_id=?${clause} ORDER BY id ${
        after ? "ASC" : "DESC"
      } LIMIT 51`,
      values,
    )
    const hasMore = rows.length > 50
    const messages = rows.slice(0, 50)
    if (!after) messages.reverse()
    return {
      messages,
      hasMore,
      disabledAt: record.disabled_at,
      disabledReason: record.disabled_reason,
    }
  }),
)
router.patch(
  "/conversations/:id/read",
  participants,
  requireCsrf,
  handle(async (request) => {
    const record = await conversation(pool, request.params.id, request.user.id)
    if (request.body?.messageIds) {
      if (
        !Array.isArray(request.body.messageIds) ||
        request.body.messageIds.length > 1000
      )
        fail(400, "Invalid displayed messages")
      const ids = [...new Set(request.body.messageIds.map(id))]
      if (ids.length)
        await pool.execute(
          `UPDATE messages SET delivered_at=COALESCE(delivered_at,NOW()),read_at=COALESCE(read_at,NOW()) WHERE conversation_id=? AND sender_id<>? AND id IN (${ids.map(() => "?").join(",")})`,
          [record.id, request.user.id, ...ids],
        )
      return {}
    }
    const lastId = id(request.body?.lastId)
    await pool.execute(
      "UPDATE messages SET delivered_at=COALESCE(delivered_at,NOW()),read_at=COALESCE(read_at,NOW()) WHERE conversation_id=? AND sender_id<>? AND id<=?",
      [record.id, request.user.id, lastId],
    )
    return {}
  }),
)
router.post(
  "/conversations/:id/messages",
  participants,
  requireCsrf,
  handle((request) =>
    transaction(async (connection) => {
      const record = await conversation(
        connection,
        request.params.id,
        request.user.id,
        true,
      )
      if (record.disabled_at)
        fail(
          409,
          record.disabled_reason
            ? `This conversation is disabled: ${record.disabled_reason}`
            : "This conversation is disabled",
        )
      const text =
        typeof request.body?.text === "string" ? request.body.text.trim() : ""
      if (!text || text.length > 5000)
        fail(400, "Enter a message of 1â€“5000 characters")
      const recipient =
        record.renter_id === request.user.id
          ? record.owner_id
          : record.renter_id
      const [[active]] = await connection.execute(
        "SELECT id FROM users WHERE id=? AND status='active' AND deleted_at IS NULL",
        [recipient],
      )
      if (!active)
        fail(409, "This participant is no longer available for messages")
      const [result] = await connection.execute(
        "INSERT INTO messages (conversation_id,sender_id,message_text) VALUES (?,?,?)",
        [record.id, request.user.id, text],
      )
      await connection.execute(
        "UPDATE conversations SET updated_at=NOW() WHERE id=?",
        [record.id],
      )
      await notify(connection, {
        userId: recipient,
        category: "message",
        title: `Message from ${request.user.name}`,
        body: text,
        propertyId: record.property_id,
        conversationId: record.id,
      })
      const [[message]] = await connection.execute(
        "SELECT id,sender_id AS senderId,message_text AS text,sent_at AS sentAt,delivered_at AS deliveredAt,read_at AS readAt FROM messages WHERE id=?",
        [result.insertId],
      )
      await recordActivity(connection,request.user.id,"message.sent","conversation",record.id,"Message sent")
      return { message }
    }),
  ),
)
router.get(
  "/notifications",
  handle(async (request) => {
    const [notifications] = await pool.execute(
      `SELECT id,category,title,body,property_id AS propertyId,booking_id AS bookingId,conversation_id AS conversationId,read_at AS readAt,created_at AS createdAt FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC `,
      [request.user.id],
    )
    const [[{ unread }]] = await pool.execute(
      "SELECT COUNT(*) AS unread FROM notifications WHERE user_id=? AND read_at IS NULL",
      [request.user.id],
    )
    return { notifications, unread }
  }),
)
router.patch(
  "/notifications/read-all",
  requireCsrf,
  handle(async (request) => {
    await pool.execute(
      "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE user_id=?",
      [request.user.id],
    )
    return {}
  }),
)
router.patch(
  "/notifications/:id/read",
  requireCsrf,
  handle(async (request) => {
    await pool.execute(
      "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND user_id=?",
      [id(request.params.id), request.user.id],
    )
    return {}
  }),
)
export default router
