/**
 * searchRoutes.js — Global Search Routes
 *
 * Base path: /api/search  (registered in server.js)
 *
 * Routes:
 *  GET /api/search?q=term&type=all → protect → globalSearch
 *
 * The `protect` middleware validates the JWT and attaches req.user before
 * the controller runs — search is a protected feature (students only).
 */

import express            from "express";
import { protect }        from "../middleware/authMiddleware.js";
import { globalSearch }   from "../controllers/searchController.js";

const router = express.Router();

// GET /api/search?q=<term>&type=<all|users|posts|anon>
router.get("/", protect, globalSearch);

export default router;
