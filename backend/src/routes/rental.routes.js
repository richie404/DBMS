import {Router} from "express";
import {requireAuth} from "../middleware/auth.js";
import requireRole from "../middleware/require-role.js";
import requireCsrf from "../middleware/csrf.js";
import * as properties from "../controllers/property.controller.js";
import * as favorites from "../controllers/favorite.controller.js";
import * as bookings from "../controllers/booking.controller.js";

const router = Router();
router.get("/properties", properties.list("public"));
router.get("/properties/:id", properties.details("public"));
router.get("/amenities", properties.amenities);

router.use("/favorites", requireAuth, requireRole("renter"));
router.get("/favorites", favorites.list);
router.post("/favorites/:propertyId", requireCsrf, favorites.create);
router.delete("/favorites/:propertyId", requireCsrf, favorites.remove);

router.use("/bookings", requireAuth, requireRole("renter"));
router.get("/bookings", bookings.list("renter"));
router.get("/bookings/:id", bookings.details("renter"));
router.post("/bookings", requireCsrf, bookings.create);
router.post("/bookings/:id/cancel", requireCsrf, bookings.transition("cancel"));

router.use("/owner", requireAuth, requireRole("owner"));
router.get("/owner/properties", properties.list("owner"));
router.get("/owner/properties/:id", properties.details("owner"));
router.post("/owner/properties", requireCsrf, properties.create);
router.patch("/owner/properties/:id", requireCsrf, properties.update);
router.delete("/owner/properties/:id", requireCsrf, properties.archive);
router.get("/owner/bookings", bookings.list("owner"));
router.get("/owner/bookings/:id", bookings.details("owner"));
for (const action of ["approve", "reject", "cancel"]) router.post(`/owner/bookings/:id/${action}`, requireCsrf, bookings.transition(action));

router.use("/admin", requireAuth, requireRole("admin"));
router.get("/admin/properties", properties.list("admin"));
router.get("/admin/properties/:id", properties.details("admin"));
router.patch("/admin/properties/:id/moderation", requireCsrf, properties.moderate);
router.get("/admin/bookings", bookings.list("admin"));
router.get("/admin/bookings/:id", bookings.details("admin"));

export default router;
