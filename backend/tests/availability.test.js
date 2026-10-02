import assert from "node:assert/strict"
import test from "node:test"
import app from "../src/app.js"
import pool from "../src/config/database.js"
import { today } from "../src/services/rental.service.js"
import { addMonths, addDays, formatDate } from "../../shared/rental-dates.js"

test("shared date-only arithmetic clamps month ends and preserves the original anniversary", () => {
  assert.equal(addMonths("2092-01-31", 1), "2092-02-29")
  assert.equal(addMonths("2091-01-31", 1), "2091-02-28")
  assert.equal(addMonths("2092-01-31", 2), "2092-03-31")
  assert.equal(addMonths("2026-10-10", 1), "2026-11-10")
  assert.equal(addMonths("2026-10-10", 2), "2026-12-10")
  assert.equal(formatDate("2026-10-10"), "10 Oct 2026")
  assert.throws(() => addMonths("2092-02-30", 1))
  assert.throws(() => addMonths("2092-01-01", 1.5))
  assert.throws(() => addMonths("9999-12-01", 1))
  assert.throws(() => addMonths("0092-01-01", 1))
})

test("availability, competing reservations, safe ownership and immutable private conversations", async () => {
  const server = app.listen(0, "127.0.0.1")
  await new Promise((resolve) => server.once("listening", resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`,
    users = [],
    properties = []
  const request = async (path, account, body, method = "GET") => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(account
          ? { Cookie: account.cookie, "X-CSRF-Token": account.csrf }
          : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return {
      status: response.status,
      data: (await response.json()).data,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    }
  }
  const suffix = Date.now(),
    password = "Availability test password 2026"
  const account = async (name, role) => {
    const email = `availability_${name}_${suffix}@example.test`
    const register = await request(
      "/auth/register",
      null,
      {
        name: `Availability ${name}`,
        username: `av_${name}_${suffix}`,
        email,
        password,
        confirmPassword: password,
        role,
      },
      "POST",
    )
    assert.equal(register.status, 201)
    users.push(register.data.user.id)
    const login = await request(
      "/auth/login",
      null,
      { email, password },
      "POST",
    )
    const auth = { id: register.data.user.id, cookie: login.cookie }
    auth.csrf = (await request("/auth/csrf", auth)).data.csrfToken
    return auth
  }
  try {
    const ownerA = await account("ownerA", "owner"),
      ownerB = await account("ownerB", "owner"),
      renterA = await account("renterA", "renter"),
      renterB = await account("renterB", "renter")
    for (const owner of [ownerA, ownerB]) {
      const [result] = await pool.execute(
        "INSERT INTO properties (owner_id,title,location,property_type,monthly_rent,deposit_amount,moderation_status,is_available,available_from) VALUES (?,?,'Dhaka','apartment',10000,5000,'approved',1,?)",
        [owner.id, `Availability property ${owner.id}`, today()],
      )
      properties.push(result.insertId)
    }
    const [a, b] = properties
    const insert = async (
      propertyId,
      renterId,
      start,
      end,
      status,
      deleted = null,
    ) => {
      const [result] = await pool.execute(
        "INSERT INTO bookings (property_id,renter_id,start_date,end_date,monthly_rent_snapshot,deposit_snapshot,total_amount,status,deleted_at) VALUES (?,?,?,?,10000,5000,10000,?,?)",
        [propertyId, renterId, start, end, status, deleted],
      )
      return result.insertId
    }
    const now = today(),
      currentEnd = addMonths(now, 1)
    await insert(a, renterA.id, now, currentEnd, "confirmed")
    await insert(a, renterA.id, "2092-01-01", "2092-02-01", "pending")
    for (const status of ["rejected", "cancelled"])
      await insert(a, renterA.id, "2092-03-01", "2092-04-01", status)
    await insert(a, renterA.id, "2092-03-01", "2092-04-01", "confirmed", now)
    await insert(a, renterA.id, "2000-01-01", "2000-02-01", "confirmed")
    const calendar = async (id = a, from = now, months = 1) =>
      (
        await request(
          `/properties/${id}/availability?from=${from}&months=${months}`,
        )
      ).data.availability
    let available = await calendar()
    assert.equal(available.occupiedToday, true)
    assert.equal(available.nextMoveIn, currentEnd)
    assert.deepEqual(available.reserved, [
      { startDate: now, endDate: currentEnd },
    ])
    assert.ok(!JSON.stringify(available).includes("renter"))
    const publicListings = (await request("/properties?limit=48")).data
      .properties
    assert.ok(publicListings.some((p) => p.id === a))
    assert.equal(
      (await request(`/properties/${a}/availability?months=0`)).status,
      400,
    )
    assert.equal(
      (await request(`/properties/${a}/availability?from=2092-02-30`)).status,
      400,
    )
    const calculate = async (id, start, months, auth = renterA) =>
      request(
        `/bookings/quote?propertyId=${id}&startDate=${start}&months=${months}`,
        auth,
      )
    assert.equal(
      (
        await request(
          `/bookings/quote?propertyId=${a}&startDate=2092-10-10&endDate=2092-11-30`,
          renterA,
        )
      ).status,
      400,
    )
    assert.equal((await calculate(a, now, 1)).status, 409)
    assert.equal((await calculate(a, addDays(currentEnd, -1), 1)).status, 409)
    const one = (await calculate(a, currentEnd, 1)).data.quote
    assert.equal(one.endDate, addMonths(currentEnd, 1))
    assert.equal(one.totalRent, 10000)
    assert.equal(one.depositAmount, 5000)
    const multi = (await calculate(a, "2092-01-31", 2)).data.quote
    assert.equal(multi.endDate, "2092-03-31")
    assert.equal(multi.totalRent, 20000)
    assert.equal(multi.owner.name, "Availability ownerA")
    const book = (auth, id, q) =>
      request(
        "/bookings",
        auth,
        {
          propertyId: id,
          startDate: q.startDate,
          endDate: q.endDate,
          months: q.months,
          quotedMonthlyRent: q.monthlyRent,
          quotedDeposit: q.depositAmount,
          quotedOwnerId: q.owner.id,
        },
        "POST",
      )
    const adjacent = await book(renterA, a, one)
    assert.equal(adjacent.status, 200)
    const competingQuote = (await calculate(a, "2092-01-31", 1)).data.quote
    const first = await book(renterA, a, competingQuote),
      second = await book(renterB, a, competingQuote)
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.equal((await book(renterA, a, competingQuote)).status, 409)
    const otherPeriod = (await calculate(a, "2092-05-31", 1)).data.quote
    assert.equal((await book(renterA, a, otherPeriod)).status, 200)
    const decide = (bookingId, status) =>
      request(`/bookings/${bookingId}/decision`, ownerA, { status }, "PATCH")
    const approvals = await Promise.all([
      decide(first.data.booking.id, "approved"),
      decide(second.data.booking.id, "approved"),
    ])
    assert.deepEqual(approvals.map((r) => r.status).sort(), [200, 409])
    const winner = approvals[0].status === 200 ? first : second,
      loser = approvals[0].status === 200 ? second : first,
      winnerRenter = winner === first ? renterA : renterB
    available = await calendar(a, "2092-01-31", 1)
    assert.equal(available.nextMoveIn, "2092-02-29")
    assert.equal(available.reserved.length, 2)
    assert.equal((await calculate(a, "2092-01-01", 2)).status, 409) // contains a complete reservation
    assert.equal((await calculate(a, "2092-02-15", 1)).status, 409) // partial overlap
    assert.equal((await calculate(a, "2092-02-29", 1)).status, 200) // adjacent checkout
    assert.equal(
      (
        await request(
          `/bookings/${winner.data.booking.id}/cancel`,
          winnerRenter,
          {},
          "PATCH",
        )
      ).status,
      200,
    )
    assert.equal((await calendar(a, "2092-01-31", 1)).nextMoveIn, "2092-01-31")
    assert.equal((await decide(loser.data.booking.id, "approved")).status, 200)
    await pool.execute("UPDATE properties SET available_from='2092-02-01' WHERE id=?", [a])
    assert.equal((await decide(loser.data.booking.id, "confirmed")).status, 409)
    await pool.execute("UPDATE properties SET available_from=? WHERE id=?", [now, a])
    const confirmations = await Promise.all([
      decide(loser.data.booking.id, "confirmed"),
      decide(loser.data.booking.id, "confirmed"),
    ])
    assert.deepEqual(confirmations.map((r) => r.status).sort(), [200, 409])
    const confirmedRenter = loser === first ? renterA : renterB
    assert.equal((await request(`/bookings/${loser.data.booking.id}/cancel`, confirmedRenter, {}, "PATCH")).status, 200)
    assert.equal((await calendar(a, "2092-01-31", 1)).nextMoveIn, "2092-01-31")
    // Availability may change after review. Submission must recheck the whole period.
    const stale = (await calculate(b, "2092-07-01", 1)).data.quote
    await insert(b, renterB.id, "2092-07-15", "2092-08-15", "approved")
    assert.equal((await book(renterA, b, stale)).status, 409)
    await pool.execute(
      "UPDATE properties SET available_from='2092-01-01' WHERE id=?",
      [b],
    )
    assert.equal((await calculate(b, now, 1)).status, 400)
    // Renter-controlled and owner-controlled payloads cannot change ownership.
    assert.equal(
      (
        await request(
          `/owner/properties/${a}`,
          renterA,
          { owner_id: ownerB.id },
          "PATCH",
        )
      ).status,
      403,
    )
    assert.equal(
      (
        await request(
          `/owner/properties/${a}`,
          ownerA,
          { owner_id: ownerB.id },
          "PATCH",
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await request(
          `/owner/properties/${a}`,
          ownerB,
          { title: "Not mine" },
          "PATCH",
        )
      ).status,
      404,
    )
    const detail = (await request(`/properties/${a}`)).data.property
    assert.equal(detail.owner.name, detail.ownerName)
    assert.equal(detail.availableFrom, now)
    await request(`/favorites/${a}`, renterA, {}, "PUT")
    assert.equal(
      (await request("/favorites", renterA)).data.properties[0].owner.id,
      ownerA.id,
    )
    const own = (await request("/owner/properties", ownerA)).data.properties
    assert.equal(own.length, 1)
    assert.equal(own[0].owner.name, detail.owner.name)
    const oldChat = (
      await request("/conversations", renterA, { propertyId: a }, "POST")
    ).data.conversationId
    await request(
      `/conversations/${oldChat}/messages`,
      renterA,
      { text: "Private message to original owner" },
      "POST",
    )
    // This administrative test change is not an owner-edit API operation.
    await pool.execute("UPDATE properties SET owner_id=? WHERE id=?", [
      ownerB.id,
      a,
    ])
    const newDetail = (await request(`/properties/${a}`)).data.property
    assert.equal(newDetail.owner.id, ownerB.id)
    const newChat = (
      await request("/conversations", renterA, { propertyId: a }, "POST")
    ).data.conversationId
    assert.notEqual(newChat, oldChat)
    assert.equal(
      (await request(`/conversations/${oldChat}/messages`, ownerB)).status,
      404,
    )
    assert.equal(
      (await request(`/conversations/${oldChat}/messages`, ownerA)).data
        .messages[0].text,
      "Private message to original owner",
    )
    const inbox = (await request("/conversations", renterA)).data.conversations
    assert.equal(
      Boolean(inbox.find((c) => c.id === oldChat).listingOwnerChanged),
      true,
    )
    assert.equal(
      inbox.find((c) => c.id === newChat).participantName,
      "Availability ownerB",
    )
    assert.ok(
      (await request("/bookings", renterA)).data.bookings
        .filter((record) => record.propertyId === a)
        .every((record) => record.ownerName === "Availability ownerB"),
    )
    await pool.execute("UPDATE properties SET is_available=0 WHERE id=?", [a])
    assert.equal((await request(`/properties/${a}/availability`)).status, 404)
    await pool.execute("UPDATE users SET status='suspended' WHERE id=?", [ownerB.id])
    assert.equal((await request(`/properties/${b}`)).status, 404)
    assert.equal((await request(`/properties/${b}/availability`)).status, 404)
  } finally {
    for (const userId of users)
      await pool.execute("DELETE FROM notifications WHERE user_id=?", [userId])
    for (const propertyId of properties) {
      await pool.execute("DELETE FROM favorites WHERE property_id=?", [
        propertyId,
      ])
      await pool.execute(
        "DELETE e FROM booking_events e JOIN bookings b ON b.id=e.booking_id WHERE b.property_id=?",
        [propertyId],
      )
      await pool.execute("DELETE FROM bookings WHERE property_id=?", [
        propertyId,
      ])
      await pool.execute(
        "DELETE m FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.property_id=?",
        [propertyId],
      )
      await pool.execute("DELETE FROM conversations WHERE property_id=?", [
        propertyId,
      ])
      await pool.execute("DELETE FROM properties WHERE id=?", [propertyId])
    }
    for (const userId of users) {
      await pool.execute("DELETE FROM sessions WHERE user_id=?", [userId])
      await pool.execute("DELETE FROM user_preferences WHERE user_id=?", [
        userId,
      ])
      await pool.execute("DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id=?)", [userId]);
await pool.execute("DELETE FROM users WHERE id=?", [userId])
    }
    await pool.end()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
