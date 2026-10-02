import assert from "node:assert/strict"
import test from "node:test"
import app from "../src/app.js"
import pool from "../src/config/database.js"
import { quote } from "../src/services/rental.service.js"

test("whole calendar months clamp month ends and deposits remain separate", () => {
  const property = {
    monthlyRent: "12000.25",
    depositAmount: "5000.50",
    currency: "BDT",
    availableFrom: null,
  }
  assert.deepEqual(quote(property, "2092-01-31", "2092-02-29"), {
    startDate: "2092-01-31",
    endDate: "2092-02-29",
    months: 1,
    monthlyRent: 12000.25,
    depositAmount: 5000.5,
    totalRent: 12000.25,
    currency: "BDT",
  })
  assert.equal(quote(property, "2091-01-31", "2091-02-28").totalRent, 12000.25)
  assert.equal(quote(property, "2092-01-31", "2092-03-31").totalRent, 24000.5)
  assert.throws(() => quote(property, "2092-01-31", "2092-03-01"))
  assert.throws(() => quote(property, "2092-02-30", "2092-03-30"))
  assert.throws(() => quote(property, "2000-01-01", "2000-02-01"))
})

test("two owners receive only their bookings and conversations; concurrent requests, memberships, roles and notifications are enforced", async () => {
  const server = app.listen(0, "127.0.0.1")
  await new Promise((resolve) => server.once("listening", resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const suffix = Date.now()
  const users = []
  const properties = []
  const request = async (path, { method = "GET", body, cookie, csrf } = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return {
      status: response.status,
      payload: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    }
  }
  const account = async (name, role) => {
    const password = "Rental actions test 2026"
    const email = `rental_${name}_${suffix}@example.test`
    const response = await request("/auth/register", {
      method: "POST",
      body: {
        name: `Rental ${name}`,
        username: `rental_${name}_${suffix}`,
        email,
        password,
        confirmPassword: password,
        role: role === "admin" ? "owner" : role,
      },
    })
    assert.equal(response.status, 201)
    const userId = response.payload.data.user.id
    users.push(userId)
    if (role === "admin")
      await pool.execute("UPDATE users SET role='admin' WHERE id=?", [userId])
    const login = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    const csrf = (await request("/auth/csrf", { cookie: login.cookie })).payload
      .data.csrfToken
    return { id: userId, cookie: login.cookie, csrf }
  }
  const authenticated = (account, body, method = "POST") => ({
    method,
    body,
    cookie: account.cookie,
    csrf: account.csrf,
  })
  try {
    const ownerA = await account("ownerA", "owner"),
      ownerB = await account("ownerB", "owner"),
      renter = await account("renter", "renter"),
      outsider = await account("outsider", "renter"),
      admin = await account("admin", "admin")
    for (const owner of [ownerA, ownerB]) {
      const [result] = await pool.execute(
        "INSERT INTO properties (owner_id,title,description,location,property_type,monthly_rent,deposit_amount,moderation_status,is_available) VALUES (?,?,'Real description','Dhaka','apartment',?,5000,'approved',1)",
        [
          owner.id,
          `Rental property ${owner.id}`,
          owner.id === ownerA.id ? 10000 : 20000,
        ],
      )
      properties.push(result.insertId)
    }
    const [a, b] = properties
    const dates = { startDate: "2092-01-31", endDate: "2092-03-31" }
    for (let index = 0; index < 2; index++) {
      const detail = await request(`/properties/${properties[index]}`)
      const owner = detail.payload.data.property.owner
      assert.equal(owner.id, index ? ownerB.id : ownerA.id)
      assert.deepEqual(Object.keys(owner).sort(), ["avatarUrl", "id", "name"])
    }
    const calculated = await request(
      `/bookings/quote?propertyId=${a}&startDate=${dates.startDate}&endDate=${dates.endDate}`,
      { cookie: renter.cookie },
    )
    assert.equal(calculated.status, 200)
    assert.equal(calculated.payload.data.quote.totalRent, 20000)
    assert.equal(calculated.payload.data.quote.depositAmount, 5000)
    const bookingInput = {
      propertyId: a,
      ...dates,
      quotedMonthlyRent: 10000,
      quotedDeposit: 5000,
      renterId: outsider.id,
      ownerId: ownerB.id,
      totalAmount: 1,
    }
    assert.equal(
      (await request("/bookings", { method: "POST", body: bookingInput }))
        .status,
      401,
    )
    assert.equal(
      (
        await request("/bookings", {
          method: "POST",
          body: bookingInput,
          cookie: renter.cookie,
        })
      ).status,
      403,
    )
    for (const account of [ownerA, ownerB, admin]) {
      assert.equal(
        (await request("/bookings", authenticated(account, bookingInput)))
          .status,
        403,
      )
      assert.equal(
        (
          await request(
            "/conversations",
            authenticated(account, { propertyId: a }),
          )
        ).status,
        403,
      )
      assert.equal(
        (
          await request(
            `/favorites/${a}`,
            authenticated(account, undefined, "PUT"),
          )
        ).status,
        403,
      )
    }
    const attempts = await Promise.all([
      request("/bookings", authenticated(renter, bookingInput)),
      request("/bookings", authenticated(renter, bookingInput)),
    ])
    assert.deepEqual(attempts.map((result) => result.status).sort(), [200, 409])
    const booking = attempts.find((result) => result.status === 200).payload
      .data.booking
    assert.equal(booking.status, "pending")
    const [[stored]] = await pool.execute(
      "SELECT renter_id,monthly_rent_snapshot,deposit_snapshot,total_amount,status FROM bookings WHERE id=?",
      [booking.id],
    )
    assert.equal(stored.renter_id, renter.id)
    assert.equal(Number(stored.total_amount), 20000)
    assert.equal(Number(stored.deposit_snapshot), 5000)
    assert.equal(stored.status, "pending")
    assert.equal(
      (await request("/bookings", { cookie: ownerA.cookie })).payload.data
        .bookings.length,
      1,
    )
    assert.equal(
      (await request("/bookings", { cookie: ownerB.cookie })).payload.data
        .bookings.length,
      0,
    )
    assert.equal(
      (await request("/bookings", { cookie: outsider.cookie })).payload.data
        .bookings.length,
      0,
    )
    const notices = (await request("/notifications", { cookie: ownerA.cookie }))
      .payload.data.notifications
    assert.equal(notices.length, 1)
    assert.equal(notices[0].bookingId, booking.id)
    assert.equal(
      (await request("/notifications", { cookie: ownerB.cookie })).payload.data
        .notifications.length,
      0,
    )
    assert.equal(
      (
        await request(
          `/bookings/${booking.id}/decision`,
          authenticated(ownerB, { status: "approved" }, "PATCH"),
        )
      ).status,
      404,
    )
    assert.equal(
      (
        await request(
          `/bookings/${booking.id}/decision`,
          authenticated(ownerA, { status: "approved" }, "PATCH"),
        )
      ).status,
      200,
    )
    const outsiderQuote = { ...bookingInput, quotedMonthlyRent: 10000 }
    assert.equal(
      (await request("/bookings", authenticated(outsider, outsiderQuote)))
        .status,
      409,
    )
    assert.equal(
      (
        await request(
          `/bookings/${booking.id}/decision`,
          authenticated(ownerA, { status: "approved" }, "PATCH"),
        )
      ).status,
      409,
    )
    assert.equal(
      (
        await request(
          `/bookings/${booking.id}/cancel`,
          authenticated(renter, undefined, "PATCH"),
        )
      ).status,
      200,
    )
    const [[{ events }]] = await pool.execute(
      "SELECT COUNT(*) AS events FROM booking_events WHERE booking_id=?",
      [booking.id],
    )
    assert.equal(events, 3)
    const second = await request(
      "/bookings",
      authenticated(renter, {
        propertyId: b,
        ...dates,
        quotedMonthlyRent: 20000,
        quotedDeposit: 5000,
      }),
    )
    assert.equal(second.status, 200)
    assert.equal(
      (await request("/bookings", { cookie: ownerB.cookie })).payload.data
        .bookings.length,
      1,
    )
    const conversations = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(
          "/conversations",
          authenticated(renter, { propertyId: a, ownerId: ownerB.id }),
        ),
      ),
    )
    assert.ok(conversations.every((result) => result.status === 200))
    const conversationId = conversations[0].payload.data.conversationId
    assert.equal(
      new Set(conversations.map((result) => result.payload.data.conversationId))
        .size,
      1,
    )
    const otherChat = await request(
      "/conversations",
      authenticated(renter, { propertyId: b }),
    )
    assert.equal(otherChat.status, 200)
    assert.notEqual(otherChat.payload.data.conversationId, conversationId)
    const inboxA = (await request("/conversations", { cookie: ownerA.cookie }))
      .payload.data.conversations
    assert.equal(inboxA.length, 1)
    assert.equal(inboxA[0].propertyId, a)
    assert.equal(inboxA[0].participantName, "Rental renter")
    const inboxB = (await request("/conversations", { cookie: ownerB.cookie }))
      .payload.data.conversations
    assert.equal(inboxB.length, 1)
    assert.equal(inboxB[0].propertyId, b)
    for (const account of [outsider, ownerB]) {
      assert.equal(
        (
          await request(`/conversations/${conversationId}/messages`, {
            cookie: account.cookie,
          })
        ).status,
        404,
      )
      assert.equal(
        (
          await request(
            `/conversations/${conversationId}/messages`,
            authenticated(account, { text: "Not allowed" }),
          )
        ).status,
        404,
      )
    }
    const sent = await request(
      `/conversations/${conversationId}/messages`,
      authenticated(renter, {
        text: "Hello actual owner",
        senderId: outsider.id,
      }),
    )
    assert.equal(sent.status, 200)
    assert.equal(sent.payload.data.message.senderId, renter.id)
    assert.equal(sent.payload.data.message.readAt, null)
    const received = await request(
      `/conversations/${conversationId}/messages`,
      { cookie: ownerA.cookie },
    )
    assert.equal(received.payload.data.messages[0].text, "Hello actual owner")
    assert.equal(
      (
        await request(
          `/conversations/${conversationId}/read`,
          authenticated(
            ownerA,
            { lastId: sent.payload.data.message.id },
            "PATCH",
          ),
        )
      ).status,
      200,
    )
    const reply = await request(
      `/conversations/${conversationId}/messages`,
      authenticated(ownerA, { text: "Hello renter" }),
    )
    assert.equal(reply.status, 200)
    const thread = (
      await request(`/conversations/${conversationId}/messages`, {
        cookie: renter.cookie,
      })
    ).payload.data.messages
    assert.equal(thread.length, 2)
    assert.ok(thread[0].readAt)
    assert.equal(thread[1].senderId, ownerA.id)
    await pool.execute(
      "UPDATE conversations SET disabled_at=NOW(),disabled_reason='Moderation review' WHERE id=?",
      [conversationId],
    )
    assert.equal(
      (
        await request(
          "/conversations",
          authenticated(renter, { propertyId: a }),
        )
      ).status,
      409,
    )
    assert.equal(
      (
        await request(
          `/conversations/${conversationId}/messages`,
          authenticated(renter, { text: "Blocked" }),
        )
      ).status,
      409,
    )
    const disabled = (
      await request(`/conversations/${conversationId}/messages`, {
        cookie: ownerA.cookie,
      })
    ).payload.data
    assert.equal(disabled.disabledReason, "Moderation review")
    // Dashboard totals share the exact active/pending predicates with destinations.
    await pool.execute(
      "INSERT INTO favorites (user_id,property_id) VALUES (?,?)",
      [renter.id, a],
    )
    for (const [status, start, end, deleted] of [
      ["approved", "2092-01-01", "2092-02-01", null],
      ["confirmed", "2092-01-01", "2092-02-01", null],
      ["approved", "2000-01-01", "2000-02-01", null],
      ["pending", "2000-01-01", "2000-02-01", null],
      ["pending", "2092-01-01", "2092-02-01", "2000-01-01"],
    ]) {
      await pool.execute(
        "INSERT INTO bookings (property_id,renter_id,start_date,end_date,monthly_rent_snapshot,deposit_snapshot,total_amount,status,deleted_at) VALUES (?,?,?, ?,10000,5000,10000,?,?)",
        [a, renter.id, start, end, status, deleted],
      )
    }
    const summary = () =>
      request("/dashboard/summary?userId=" + outsider.id, {
        cookie: renter.cookie,
      })
    assert.equal((await request("/dashboard/summary")).status, 401)
    assert.equal(
      (await request("/dashboard/summary", { cookie: ownerA.cookie })).status,
      403,
    )
    let counters = (await summary()).payload.data.summary
    assert.equal(counters.savedProperties, 1)
    assert.equal(counters.activeBookings, 2)
    assert.equal(counters.pendingRequests, 1)
    assert.equal(counters.unreadMessages, 1)
    assert.equal(counters.unreadConversations, 1)
    assert.equal(counters.latestUnreadConversationId, conversationId)
    for (const [filter, count] of [
      ["active", 2],
      ["pending", 1],
    ]) {
      const result = (
        await request("/bookings?filter=" + filter, { cookie: renter.cookie })
      ).payload.data
      assert.equal(result.total, count)
      assert.equal(result.bookings.length, count)
    }
    assert.equal(
      (await request("/bookings?filter=invalid", { cookie: renter.cookie }))
        .status,
      400,
    )
    const empty = (
      await request("/dashboard/summary?userId=" + renter.id, {
        cookie: outsider.cookie,
      })
    ).payload.data.summary
    assert.deepEqual(empty, {
      savedProperties: 0,
      activeBookings: 0,
      pendingRequests: 0,
      unreadMessages: 0,
      unreadConversations: 0,
      latestUnreadConversationId: null,
    })
    const replyId = reply.payload.data.message.id
    assert.equal(
      (
        await request(
          "/conversations/" + conversationId + "/read",
          authenticated(outsider, { messageIds: [replyId] }, "PATCH"),
        )
      ).status,
      404,
    )
    assert.equal(
      (
        await request(
          "/conversations/" + conversationId + "/read",
          authenticated(
            renter,
            { messageIds: [sent.payload.data.message.id] },
            "PATCH",
          ),
        )
      ).status,
      200,
    )
    assert.equal((await summary()).payload.data.summary.unreadMessages, 1)
    await request(
      "/conversations/" + conversationId + "/read",
      authenticated(renter, { messageIds: [replyId] }, "PATCH"),
    )
    counters = (await summary()).payload.data.summary
    assert.equal(counters.unreadMessages, 0)
    assert.equal(counters.unreadConversations, 0)
    await pool.execute("DELETE FROM favorites WHERE user_id=?", [renter.id])
    assert.equal((await summary()).payload.data.summary.savedProperties, 0)
    await request(
      "/bookings/" + second.payload.data.booking.id + "/cancel",
      authenticated(renter, undefined, "PATCH"),
    )
    assert.equal((await summary()).payload.data.summary.pendingRequests, 0)
    await pool.execute("UPDATE properties SET is_available=0 WHERE id=?", [b])
    assert.equal(
      (
        await request(
          "/conversations",
          authenticated(outsider, { propertyId: b }),
        )
      ).status,
      404,
    )
    assert.equal(
      (
        await request(
          "/bookings",
          authenticated(outsider, {
            propertyId: b,
            ...dates,
            quotedMonthlyRent: 20000,
            quotedDeposit: 5000,
          }),
        )
      ).status,
      404,
    )
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
