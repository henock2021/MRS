import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Allowed MIME types for uploaded profile photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Please upload a JPG, PNG, or WebP photo." },
        { status: 400 }
      );
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Photo must be under 2MB." },
        { status: 400 }
      );
    }

    // 3. Ensure uploads folder exists in /public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // 4. Generate a safe, sanitized unique filename
    const ext = file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : ".webp";
    const randomHash = crypto.randomBytes(8).toString("hex");
    const sanitizedFilename = `member-${Date.now()}-${randomHash}${ext}`;
    const destinationPath = path.join(uploadDir, sanitizedFilename);

    // 5. Write file bytes to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    // Return public URL path for client display
    return NextResponse.json({
      success: true,
      url: `/uploads/${sanitizedFilename}`,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo. Please try again." },
      { status: 500 }
    );
  }
}
