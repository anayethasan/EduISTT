import express from "express";
import { createClass, deleteClass, updateClass } from "../controllers/class";
import { authorize, protect } from "../middleware/auth";
import { getAllActivities } from "../controllers/activitieslog";

const classRouter = express.Router();

classRouter.post("/create", protect, authorize(["admin"]), createClass);
classRouter.get("/", protect, authorize(["admin"]), getAllActivities);
classRouter.patch("/update/:id", protect, authorize(["admin"]), updateClass);
classRouter.delete  ("/delete/:id", protect, authorize(["admin"]), deleteClass);

export default classRouter;