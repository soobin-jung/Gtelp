import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROMPTS_PATH = ROOT / "data" / "reading" / "word_image_prompts_a_01_20.json"
QUEUE_PATH = ROOT / "data" / "reading" / "word_image_queue_a_01_20.json"


def slugify(word: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(word).lower()).strip("_")


def main() -> None:
    prompts = json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))
    queue = []

    for row in prompts:
        queue.append(
            {
                "seq": row["seq"],
                "word": row["word"],
                "meaning": row["meaning"],
                "filename": f"img_{slugify(row['word'])}.png",
                "relativePath": f"/word-images/img_{slugify(row['word'])}.png",
                "style": row["style"],
                "prompt": row["prompt"],
                "status": "saved" if (ROOT / "public" / "word-images" / f"img_{slugify(row['word'])}.png").exists() else "missing",
            }
        )

    QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved queue to {QUEUE_PATH}")


if __name__ == "__main__":
    main()
