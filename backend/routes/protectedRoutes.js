import express from "express";
import{ authenticateToken} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/protected", authenticateToken, (req, res) => {
    res.json({
        message: "Protected route accessed successfully",
        user: req.user
    });
});

export default router;
