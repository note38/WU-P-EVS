import { mkdir } from "fs/promises";
import { join } from "path";

async function setupDirectories() {
  try {
    // Ensure public/avatars directory exists
    const avatarsDir = join(process.cwd(), "public", "avatars");
    await mkdir(avatarsDir, { recursive: true });
    console.log("✓ Created avatars directory");
  } catch (error) {
    console.error("Error creating directories:", error);
    process.exit(1);
  }
}

setupDirectories();
