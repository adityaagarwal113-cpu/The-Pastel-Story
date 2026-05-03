import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API Routes
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;

      if (!resend) {
        console.warn("[MAILER] RESEND_API_KEY is missing. Mocking email delivery.");
        return res.json({ success: true, mocked: true });
      }

      const { data, error } = await resend.emails.send({
        from: "Pastel Story <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
