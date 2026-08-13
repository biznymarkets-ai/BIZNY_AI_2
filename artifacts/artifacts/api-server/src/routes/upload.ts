import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

export const uploadsDir = (() => {
  try {
    const dir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    const tmpDir = path.join("/tmp", "uploads");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
})();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "audio/mpeg", "audio/wav", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post("/upload", upload.single("file"), async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, urls: [url] });
});

export default router;
