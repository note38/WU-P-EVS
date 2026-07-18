import fs from "fs";
import path from "path";
import os from "os";

// Use os.tmpdir() so it works in both local dev (Windows) and production (Vercel serverless)
const filePath = path.join(os.tmpdir(), "show-results.json");

export function getShowResultsUntil(electionId: number): Date | null {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (data[electionId]) {
        return new Date(data[electionId]);
      }
    }
  } catch (error) {
    console.error("Error reading show-results.json:", error);
  }
  return null;
}

export function setShowResultsUntil(electionId: number, date: Date | null) {
  try {
    let data: Record<string, string> = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    if (date === null) {
      delete data[electionId];
    } else {
      data[electionId] = date.toISOString();
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing show-results.json:", error);
  }
}
