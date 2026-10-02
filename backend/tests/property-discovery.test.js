import assert from "node:assert/strict"
import test from "node:test"
import app from "../src/app.js"
import pool from "../src/config/database.js"

test("public discovery filters, sorts, paginates and enforces visibility; favorites are session-scoped", async () => {
  const server = app.listen(0, "127.0.0.1")
  await new Promise((resolve) => server.once("listening", resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const suffix = String(Date.now())
  const keyword = `DiscoveryCheck${suffix}`
  const users = []
  const properties = []
  const password = "Discovery verification 2026!"
  async function request(path, { method = "GET", body, cookie, csrf } = {}) {
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
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    }
  }
  async function account(role) {
    const input = {
      name: `Discovery ${role}`,
      username: `discover_${role}_${suffix}`,
      email: `discover_${role}_${suffix}@example.test`,
      role,
      password,
      confirmPassword: password,
    }
    const registered = await request("/auth/register", {
      method: "POST",
      body: input,
    })
    assert.equal(registered.status, 201)
    users.push(registered.data.data.user.id)
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: input.email, password },
    })
    assert.equal(login.status, 200)
    const token = await request("/auth/csrf", { cookie: login.cookie })
    return {
      id: registered.data.data.user.id,
      cookie: login.cookie,
      csrf: token.data.data.csrfToken,
    }
  }
  try {
    const owner = await account("owner")
    const renter = await account("renter")
    const [[before]] = await pool.query(
      "SELECT COUNT(*) AS total FROM properties WHERE moderation_status='approved' AND is_available=1 AND deleted_at IS NULL",
    )
    const types = ["apartment", "flat", "room", "studio", "office", "parking"]
    for (let index = 0; index < 21; index++) {
      const [row] = await pool.execute(
        `INSERT INTO properties (owner_id,title,description,location,property_type,monthly_rent,size_sqft,bedrooms,bathrooms,furnished,bachelor_allowed,family_allowed,moderation_status,is_available,deleted_at,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          owner.id,
          `${keyword} ${index}`,
          "Real description",
          index % 2 ? "Verification East" : "Verification West",
          types[index % 6],
          10000 + Math.floor(index / 2) * 1000,
          500 + index * 20,
          (index % 5) + 1,
          2,
          index % 2,
          index % 2,
          1,
          index === 18 ? "pending" : "approved",
          index === 19 ? 0 : 1,
          index === 20 ? "2026-01-01 00:00:00" : null,
          `2026-01-${String(index + 1).padStart(2, "0")} 12:00:00`,
        ],
      )
      properties.push(row.insertId)
    }
    const [primary] = await pool.execute(
      "INSERT INTO property_images (property_id,image_path,is_primary,sort_order) VALUES (?, ?, 1, 10)",
      [properties[0], "https://example.test/actual-primary.jpg"],
    )
    await pool.execute(
      "INSERT INTO property_images (property_id,image_path,is_primary,sort_order) VALUES (?, ?, 0, 0)",
      [properties[0], "https://example.test/secondary.jpg"],
    )
    const global = await request("/properties")
    assert.equal(global.status, 200)
    assert.equal(global.data.data.total, Number(before.total) + 18)
    assert.equal(global.data.data.properties.length, 12)
    assert.equal(global.data.data.hasMore, true)
    const list = async (parameters = "") => {
      const result = await request(
        `/properties?search=${keyword}&${parameters}`,
      )
      assert.equal(result.status, 200)
      return result.data.data
    }
    const first = await list("limit=5")
    assert.deepEqual(
      first.properties.map((p) => p.id),
      properties.slice(13, 18).reverse(),
    )
    assert.equal(first.total, 18)
    const all = []
    for (let page = 1; page <= 4; page++) {
      const response = await list(`limit=5&page=${page}`)
      all.push(...response.properties)
      assert.equal(response.hasMore, page < 4)
    }
    assert.equal(all.length, 18)
    assert.equal(new Set(all.map((p) => p.id)).size, 18)
    assert.deepEqual(
      all.map((p) => p.id),
      properties.slice(0, 18).reverse(),
    )
    assert.deepEqual(
      (await list("sort=oldest&limit=48")).properties.map((p) => p.id),
      properties.slice(0, 18),
    )
    assert.deepEqual(
      (await list("sort=rent_asc&limit=48")).properties.map((p) => p.id),
      properties.slice(0, 18),
    )
    assert.deepEqual(
      (await list("sort=rent_desc&limit=48")).properties.map((p) => p.id),
      properties.slice(0, 18).reverse(),
    )
    assert.deepEqual(
      (await list("sort=size_desc&limit=48")).properties.map((p) => p.id),
      properties.slice(0, 18).reverse(),
    )
    assert.equal((await list("minRent=12000&maxRent=15000")).total, 8)
    assert.equal((await list("minRent=0&maxRent=0")).total, 0)
    for (const type of types)
      assert.equal((await list(`type=${type}`)).total, 3)
    for (const bedrooms of [1, 2, 3])
      assert.ok(
        (await list(`bedrooms=${bedrooms}`)).properties.every(
          (p) => p.bedrooms === bedrooms,
        ),
      )
    assert.ok(
      (await list("bedrooms=4%2B")).properties.every((p) => p.bedrooms >= 4),
    )
    assert.equal((await list("furnishing=furnished")).total, 9)
    assert.equal((await list("furnishing=unfurnished")).total, 9)
    assert.equal((await list("eligibility=bachelor")).total, 9)
    assert.equal((await list("eligibility=family")).total, 18)
    const combined = await list(
      "location=Verification%20East&minRent=12000&maxRent=18000&type=flat&bedrooms=3&furnishing=furnished&eligibility=bachelor",
    )
    assert.equal(combined.total, 1)
    assert.equal(combined.properties[0].id, properties[7])
    assert.equal((await request("/properties?search=%25")).data.data.total, 0)
    for (const parameters of [
      "minRent=100&maxRent=20",
      "minRent=-1",
      "maxRent=nope",
      "sort=title%20DESC",
      "sort=constructor",
      "type=castle",
      "bedrooms=6",
      "furnishing=true",
      "eligibility=everyone",
      "limit=99",
      "page=0",
    ])
      assert.equal((await request(`/properties?${parameters}`)).status, 400)
    const detail = await request(`/properties/${properties[0]}`)
    assert.equal(detail.status, 200)
    assert.equal(
      detail.data.data.property.primaryImage,
      "https://example.test/actual-primary.jpg",
    )
    assert.equal(detail.data.data.property.images.length, 2)
    assert.equal("owner_id" in detail.data.data.property, false)
    assert.equal(
      (await request(`/properties/${properties[1]}`)).data.data.property
        .primaryImage,
      null,
    )
    for (const id of properties.slice(18))
      assert.equal((await request(`/properties/${id}`)).status, 404)
    const locations = await request("/properties/locations")
    assert.equal(locations.status, 200)
    assert.ok(
      locations.data.data.locations.every((location) => location.count > 0),
    )
    assert.equal((await request("/favorites")).status, 401)
    assert.equal(
      (
        await request(`/favorites/${properties[0]}`, {
          method: "PUT",
          cookie: renter.cookie,
        })
      ).status,
      403,
    )
    for (const id of properties.slice(18))
      assert.equal(
        (
          await request(`/favorites/${id}`, {
            method: "PUT",
            cookie: renter.cookie,
            csrf: renter.csrf,
          })
        ).status,
        404,
      )
    for (let repeat = 0; repeat < 2; repeat++)
      assert.equal(
        (
          await request(`/favorites/${properties[0]}`, {
            method: "PUT",
            cookie: renter.cookie,
            csrf: renter.csrf,
          })
        ).status,
        200,
      )
    const favorites = await request("/favorites", { cookie: renter.cookie })
    assert.deepEqual(
      favorites.data.data.properties.map((p) => p.id),
      [properties[0]],
    )
    assert.equal(
      (await request("/favorites", { cookie: owner.cookie })).data.data
        .properties.length,
      0,
    )
    assert.equal(
      (
        await request(`/favorites/${properties[0]}`, {
          method: "DELETE",
          cookie: renter.cookie,
          csrf: renter.csrf,
        })
      ).status,
      200,
    )
    assert.equal(
      (await request("/favorites", { cookie: renter.cookie })).data.data
        .properties.length,
      0,
    )
  } finally {
    for (const id of properties) {
      await pool.execute("DELETE FROM favorites WHERE property_id=?", [id])
      await pool.execute("DELETE FROM property_images WHERE property_id=?", [
        id,
      ])
      await pool.execute("DELETE FROM properties WHERE id=?", [id])
    }
    for (const id of users) {
      await pool.execute("DELETE FROM sessions WHERE user_id=?", [id])
      await pool.execute("DELETE FROM user_preferences WHERE user_id=?", [id])
      await pool.execute("DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id=?)", [id]);
await pool.execute("DELETE FROM users WHERE id=?", [id])
    }
    await pool.end()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
