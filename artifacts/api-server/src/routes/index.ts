import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import examPapersRouter from "./exam_papers";
import uploadsRouter from "./uploads";
import statsRouter from "./stats";
import templatesRouter from "./templates";
import openaiRouter from "./openai/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(examPapersRouter);
router.use(uploadsRouter);
router.use(statsRouter);
router.use(templatesRouter);
router.use(openaiRouter);

export default router;
