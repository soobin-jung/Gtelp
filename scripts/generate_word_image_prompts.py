import json
import random
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "reading" / "reading_a.json"
OUT_PATH = ROOT / "data" / "reading" / "word_image_prompts_a_all.json"


STYLE_TEMPLATES = [
    {
        "style": "child crayon drawing",
        "prompt": (
            "An incredibly charming child's crayon drawing on rough paper. "
            "The word \"{word}\" appears in big wobbly colorful letters. "
            "{scene} Thick crayon texture, uneven lines, playful composition, raw innocence, very memorable."
        ),
    },
    {
        "style": "enchanted fairy-tale animation",
        "prompt": (
            "A magical fairy-tale animation still with warm golden light. "
            "The word \"{word}\" appears as a glowing emblem made of sparkling light and curling vines. "
            "{scene} Storybook forest atmosphere, soft magic trails, expressive animal companions, joyful wonder."
        ),
    },
    {
        "style": "classic oil painting",
        "prompt": (
            "A dramatic classical oil painting with rich textures and painterly light. "
            "The concept of \"{word}\" is shown through a realistic symbolic scene. "
            "{scene} Deep colors, timeless mood, visible brushwork, elegant composition."
        ),
    },
    {
        "style": "neon night sign",
        "prompt": (
            "A vibrant neon sign scene on a rainy city street at night. "
            "The word \"{word}\" glows in stylized neon letters. "
            "{scene} Wet reflections, steam, urban energy, cinematic lighting."
        ),
    },
    {
        "style": "vintage comic cover",
        "prompt": (
            "A bold vintage comic-book cover with dramatic perspective and halftone dots. "
            "The word \"{word}\" dominates the title area in huge action lettering. "
            "{scene} Punchy colors, exaggerated motion, nostalgic pop-art energy."
        ),
    },
    {
        "style": "cyberpunk pixel art",
        "prompt": (
            "A detailed cyberpunk pixel-art illustration. "
            "The word \"{word}\" appears on a holographic sign above a futuristic street. "
            "{scene} Dense pixel detail, neon contrast, retro-futuristic atmosphere."
        ),
    },
    {
        "style": "watercolor illustration",
        "prompt": (
            "A delicate watercolor illustration on textured paper. "
            "The word \"{word}\" is softly integrated into the composition. "
            "{scene} Gentle color bleed, airy layout, emotional clarity, poetic mood."
        ),
    },
    {
        "style": "steampunk machine",
        "prompt": (
            "An intricate steampunk device with brass, gauges, pipes, and engraved plates. "
            "The word \"{word}\" is engraved prominently on the central plaque. "
            "{scene} Warm workshop light, tactile detail, imaginative mechanical storytelling."
        ),
    },
    {
        "style": "surreal photography",
        "prompt": (
            "A surreal conceptual photograph with realistic textures but dreamlike impossible logic. "
            "The meaning of \"{word}\" is shown through a striking visual metaphor. "
            "{scene} Unusual scale, unexpected object placement, memorable symbolism."
        ),
    },
    {
        "style": "street graffiti mural",
        "prompt": (
            "A large energetic graffiti mural on a textured wall. "
            "The word \"{word}\" appears in wildstyle lettering at the center. "
            "{scene} Spray-paint texture, layered tags, urban rhythm, bold visual punch."
        ),
    },
]


SCENE_HINTS = {
    "a day": "Show a bright sun traveling across the sky from morning to night with breakfast, lunch, and moon icons lined up beneath the letters.",
    "a few years ago": "Show a nostalgic timeline with calendar pages flipping backward, an old photograph, and a younger version of a character waving from the past.",
    "a lot of": "Show an overflowing pile of colorful objects such as books, apples, and coins spilling everywhere to make abundance instantly obvious.",
    "abdomen": "Show a cute character pointing dramatically to the stomach area with a glowing outline highlighting the abdomen.",
    "ability": "Show a cheerful character unlocking multiple talents at once, like lifting a weight, painting, and solving a puzzle.",
    "about": "Show a central topic bubble with smaller icons orbiting around it to clearly suggest 'about this topic'.",
    "abundant": "Show fields, baskets, and trees overflowing with fruit and flowers so the viewer instantly feels richness and plenty.",
    "academic": "Show a studious scene with books, graduation cap, notes, charts, and a serious campus atmosphere.",
    "accept": "Show two characters smiling as one receives a gift or invitation with open hands and warm agreement.",
    "access": "Show a glowing door, keycard, keypad, or portal opening to a special place after permission is granted.",
    "accident": "Show a comic but clear mishap such as spilled paint, a slipped banana peel, or a bumped bicycle with shocked expressions.",
    "accomplish": "Show a determined character planting a flag at the top of a checklist mountain after finishing tasks.",
    "account": "Show both meanings cleverly: a bank account card and a speech bubble giving an explanation side by side.",
    "accounting": "Show calculators, ledgers, receipts, graphs, and a tidy desk with someone balancing numbers.",
    "accurately": "Show a target hit exactly in the center, a ruler aligned perfectly, and a laser-straight check mark.",
    "achieve": "Show a character reaching a shining trophy or star after effort, stairs, and progress markers.",
    "achievement": "Show medals, certificates, confetti, and a proud display shelf celebrating a completed goal.",
    "acquire": "Show a character successfully obtaining a glowing object, key skill book, or treasure chest they worked for.",
    "across": "Show a bridge or road stretching from one side to the other with motion clearly crossing over.",
    "actual": "Show illusion versus reality, with a fake stage set pulled aside to reveal the true object behind it.",
}


def fallback_scene_hint(item):
    word = item["word"]
    meaning = str(item.get("meaning", "")).strip()
    synonym = ", ".join(item.get("synonym", [])[:2])
    if synonym:
        return (
            f"Show a clear memorable scene that instantly explains the meaning of \"{word}\". "
            f"Use visual clues for {meaning} and include small symbolic hints related to {synonym}."
        )
    return (
        f"Show a simple memorable scene that makes the meaning of \"{word}\" instantly obvious. "
        f"Use direct visual storytelling for {meaning}, expressive characters, and one strong central metaphor."
    )


def main():
    items = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rng = random.Random(20260620)
    styles = STYLE_TEMPLATES[:]
    rng.shuffle(styles)

    rows = []
    for index, item in enumerate(items):
        style = styles[index % len(styles)]
        scene = SCENE_HINTS.get(item["word"], fallback_scene_hint(item))
        prompt = style["prompt"].format(word=item["word"], scene=scene)
        rows.append(
            {
                "seq": item["seq"],
                "word": item["word"],
                "meaning": item["meaning"],
                "style": style["style"],
                "prompt": prompt,
            }
        )

    OUT_PATH.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {len(rows)} prompts to {OUT_PATH}")


if __name__ == "__main__":
    main()
