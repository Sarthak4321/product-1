import fs from "fs";
import path from "path";

export interface ShowcaseSlide {
  id: string;
  imageUrl: string;
  title?: string;
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "showcase-config.json");

export function getShowcaseConfig(): ShowcaseSlide[] {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    
    // Support new array of slides
    if (Array.isArray(parsed)) {
      // If legacy format with 'id' and 'imageUrl', filter out items that have valid imageUrl
      const validSlides = parsed
        .filter((item: any) => Boolean(item.imageUrl))
        .map((item: any, idx: number) => ({
          id: item.id || `slide-${Date.now()}-${idx}`,
          imageUrl: item.imageUrl,
          title: item.title || item.label || `Showcase Slide ${idx + 1}`,
          createdAt: item.createdAt || new Date().toISOString(),
        }));
      return validSlides;
    }
    return [];
  } catch (err) {
    console.error("Error reading showcase config:", err);
    return [];
  }
}

export function saveShowcaseConfig(items: ShowcaseSlide[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(items, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving showcase config:", err);
    return false;
  }
}
