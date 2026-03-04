import express from "express"
import { authorize, protect } from "../middleware/auth";
import { getAllActivities } from "../controllers/activitieslog";

const LogsRouter = express.Router();

LogsRouter.get("/", protect, authorize(["admin", "teacher"]), getAllActivities)

export default LogsRouter;