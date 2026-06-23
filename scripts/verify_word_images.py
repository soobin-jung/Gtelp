import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
READING_A_PATH = ROOT / "data" / "reading" / "reading_a.json"
IMAGE_DIR = ROOT / "public" / "word-images"
REPORT_PATH = ROOT / "data" / "reading" / "word_image_status_a.json"


def slugify(word: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(word).lower()).strip("_")


def main() -> None:
    items = json.loads(READING_A_PATH.read_text(encoding="utf-8"))
    report = []

    for item in items:
        filename = f"img_{slugify(item['word'])}.png"
        image_path = IMAGE_DIR / filename
        report.append(
            {
                "seq": item["seq"],
                "word": item["word"],
                "meaning": item["meaning"],
                "filename": filename,
                "exists": image_path.exists(),
                "size": image_path.stat().st_size if image_path.exists() else 0,
            }
        )

    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    existing = sum(1 for row in report if row["exists"])
    print(f"verified {existing}/{len(report)} images")
    print(f"saved report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
