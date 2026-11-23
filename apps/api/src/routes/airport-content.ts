import { Router } from "express";
import { z } from "zod";
import { AirportContent } from "../models";
import { asyncHandler, AppError } from "../utils/http";
import { AuthRequest, optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { uploadMedia } from "../middleware/upload";
import { saveFile } from "../services/storage";
import { audit } from "../services/audit";

const router = Router();

const writeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000).optional().default(""),
  active: z.boolean().optional(),
});

function isStaff(role?: string) {
  return ["ADMIN", "SUPER_ADMIN", "ENGINEER", "SALES", "SUPPORT"].includes(role || "");
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const showAll = req.query.all === "1" && isStaff(req.user?.role);
    const items = await AirportContent.find(showAll ? {} : { active: true }).sort({ createdAt: 1 });
    res.json({ items });
  })
);

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError(400, "Гарчиг болон агуулгыг зөв оруулна уу");
  return result.data;
}

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const body = parseBody(writeSchema, req.body);
    const item = await AirportContent.create(body);
    await audit({
      userId: String(req.user!._id),
      action: "AIRPORT_CONTENT_CREATE",
      entity: "AirportContent",
      entityId: String(item._id),
    });
    res.status(201).json(item);
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const body = parseBody(
      writeSchema.partial().extend({
        images: z.array(z.string()).optional(),
        videos: z.array(z.string()).optional(),
      }),
      req.body
    );
    const item = await AirportContent.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!item) throw new AppError(404, "Контент олдсонгүй");
    await audit({
      userId: String(req.user!._id),
      action: "AIRPORT_CONTENT_UPDATE",
      entity: "AirportContent",
      entityId: String(item._id),
    });
    res.json(item);
  })
);

router.post(
  "/:id/media",
  requireAuth,
  requireAdmin,
  uploadMedia.fields([
    { name: "images", maxCount: 12 },
    { name: "videos", maxCount: 4 },
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const item = await AirportContent.findById(req.params.id);
    if (!item) throw new AppError(404, "Контент олдсонгүй");
    const grouped = (req.files as { images?: Express.Multer.File[]; videos?: Express.Multer.File[] }) || {};
    const images = grouped.images || [];
    const videos = grouped.videos || [];
    if (!images.length && !videos.length) throw new AppError(400, "Файл сонгоно уу");
    if (images.length) {
      const saved = await Promise.all(images.map((file) => saveFile(file, "products")));
      item.images.push(...saved.map((file) => file.url));
    }
    if (videos.length) {
      const saved = await Promise.all(videos.map((file) => saveFile(file, "products")));
      item.videos.push(...saved.map((file) => file.url));
    }
    await item.save();
    res.json(item);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const item = await AirportContent.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError(404, "Контент олдсонгүй");
    await audit({
      userId: String(req.user!._id),
      action: "AIRPORT_CONTENT_DELETE",
      entity: "AirportContent",
      entityId: String(item._id),
    });
    res.json({ ok: true });
  })
);

export default router;
