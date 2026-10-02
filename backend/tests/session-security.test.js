import test from "node:test"
import assert from "node:assert/strict"
import app from "../src/app.js"
import pool from "../src/config/database.js"
test("real session records are scoped, CSRF protected, revocable, and expiry enforced", async () => {
  const server = app.listen(0, "127.0.0.1")
  await new Promise((r) => server.once("listening", r))
  const base = "http://127.0.0.1:" + server.address().port + "/api",
    users = []
  const password = "Sessions verification password"
  const request = async (path, auth, body, method = "GET") => {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(auth
          ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf || "" }
          : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return {
      status: r.status,
      data: (await r.json()).data,
      cookie: r.headers.get("set-cookie"),
    }
  }
  const make = async (role) => {
    const suffix = role + Date.now()
    const email = "security_" + suffix + "@example.test"
    const r = await request(
      "/auth/register",
      null,
      {
        name: "Security " + role,
        username: "sec_" + suffix,
        email,
        password,
        confirmPassword: password,
        role: role === "admin" ? "owner" : role,
      },
      "POST",
    )
    assert.equal(r.status, 201)
    users.push(r.data.user.id)
    if (role === "admin")
      await pool.execute("UPDATE users SET role='admin' WHERE id=?", [
        r.data.user.id,
      ])
    return { email, id: r.data.user.id }
  }
  const login = async (user) => {
    const r = await request(
      "/auth/login",
      null,
      { email: user.email, password },
      "POST",
    )
    assert.equal(r.status, 200)
    const auth = { cookie: r.cookie.split(";")[0] }
    auth.csrf = (await request("/auth/csrf", auth)).data.csrfToken
    return auth
  }
  try {
    assert.equal((await request("/auth/sessions")).status, 401)
    const renter = await make("renter"),
      owner = await make("owner"),
      admin = await make("admin")
    const a = await login(renter),
      b = await login(renter),
      o = await login(owner),
      ad = await login(admin)
    for (const auth of [a, o, ad]) {
      const result = await request("/auth/sessions", auth)
      assert.equal(result.status, 200)
      assert.ok(result.data.items.some((s) => s.current))
      assert.ok(!JSON.stringify(result).includes("token_hash"))
    }
    const items = (await request("/auth/sessions", a)).data.items
    assert.equal(items.length, 2)
    const current = items.find((s) => s.current),
      other = items.find((s) => !s.current)
    assert.equal(
      (await request("/auth/sessions/" + current.id, o, null, "DELETE")).status,
      404,
    )
    assert.equal(
      (
        await request(
          "/auth/sessions/" + other.id,
          { cookie: a.cookie },
          null,
          "DELETE",
        )
      ).status,
      403,
    )
    assert.equal(
      (await request("/auth/sessions/revoke-others", a, null, "POST")).status,
      200,
    )
    assert.equal((await request("/auth/me", b)).status, 401)
    assert.equal((await request("/auth/me", a)).status, 200)
    const revoked = await request(
      "/auth/sessions/" + current.id,
      a,
      null,
      "DELETE",
    )
    assert.equal(revoked.status, 200)
    assert.equal(revoked.data.current, true)
    assert.ok(revoked.cookie.includes("Expires="))
    assert.equal((await request("/auth/me", a)).status, 401)
    const fresh = await login(renter)
    await pool.execute(
      "UPDATE sessions SET expires_at=DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 MINUTE) WHERE user_id=?",
      [renter.id],
    )
    assert.equal((await request("/auth/sessions", fresh)).status, 401)
  } finally {
    for (const id of users) {
      await pool.execute("DELETE FROM sessions WHERE user_id=?", [id])
      await pool.execute("DELETE FROM user_preferences WHERE user_id=?", [id])
      await pool.execute("DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id=?)", [id]);
await pool.execute("DELETE FROM users WHERE id=?", [id])
    }
    await pool.end()
    server.closeAllConnections()
    await new Promise((r) => server.close(r))
  }
})
