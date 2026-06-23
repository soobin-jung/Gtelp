import json
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "reading" / "reading_a.json"
OUT_DIR = ROOT / "public" / "word-images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

COUNT = 10
WIDTH = 1200
HEIGHT = 900

COLOR_THEMES = [
    {"name": "sun pop", "primary": "#facc15", "secondary": "#ef4444", "dark": "#111827"},
    {"name": "ocean punch", "primary": "#0ea5e9", "secondary": "#22c55e", "dark": "#082f49"},
    {"name": "retro candy", "primary": "#ec4899", "secondary": "#8b5cf6", "dark": "#3b0764"},
    {"name": "arcade lava", "primary": "#f97316", "secondary": "#e11d48", "dark": "#431407"},
    {"name": "mint game", "primary": "#10b981", "secondary": "#3b82f6", "dark": "#052e16"},
    {"name": "comic fire", "primary": "#f59e0b", "secondary": "#2563eb", "dark": "#1f2937"},
    {"name": "night neon", "primary": "#eab308", "secondary": "#f472b6", "dark": "#f8fafc"},
    {"name": "mono punch", "primary": "#111111", "secondary": "#ef4444", "dark": "#f9fafb"},
    {"name": "frog beam", "primary": "#84cc16", "secondary": "#06b6d4", "dark": "#1f2937"},
    {"name": "kitty soda", "primary": "#fb7185", "secondary": "#60a5fa", "dark": "#1f2937"},
    {"name": "pixel grape", "primary": "#7c3aed", "secondary": "#f43f5e", "dark": "#f5f3ff"},
    {"name": "space lime", "primary": "#a3e635", "secondary": "#38bdf8", "dark": "#111827"},
    {"name": "poster red", "primary": "#dc2626", "secondary": "#facc15", "dark": "#fef2f2"},
    {"name": "sky chalk", "primary": "#2563eb", "secondary": "#f8fafc", "dark": "#0f172a"},
    {"name": "retro forest", "primary": "#65a30d", "secondary": "#f59e0b", "dark": "#1c1917"},
]

CHARACTER_STYLES = [
    "stickman",
    "cat mascot",
    "frog cadet",
    "sleepy robot",
    "round ghost",
    "tiny hero",
    "grumpy potato",
    "bouncy bunny",
    "duck doodle",
    "bear blob",
    "alien bean",
    "shouty cloud",
    "paper doll",
    "comic kid",
    "box head",
]

FONT_STYLES = [
    "malgun gothic",
    "gungseo",
    "impact",
    "headline gothic",
    "soft rounded",
    "poster bold",
    "retro serif",
    "typewriter",
    "chalk board",
    "comic block",
    "pixel arcade",
    "sticker bubble",
    "label sans",
    "manual marker",
    "dramatic title",
]

BACKGROUND_STYLES = [
    "white",
    "black",
    "white grid",
    "black grid",
    "white dots",
    "black stars",
    "white confetti",
    "black neon wave",
    "white paper",
    "black retro sun",
    "white sticker mess",
    "black checker",
    "white halftone",
    "black poster",
    "white bubble",
]

VIBES = [
    "modern",
    "retro",
    "comic",
    "cute",
    "chaotic",
    "minimal",
    "poster",
    "meme",
    "toy-like",
    "arcade",
    "kitsch",
    "scribble",
    "sticker",
    "dramatic",
    "oddly serious",
    "animation cel",
]

LAYOUTS = [
    "badge",
    "center-stage",
    "split-left",
    "speech-bubble",
    "poster",
    "sticker-stack",
    "blueprint",
    "comic-strip",
    "totem",
    "giant-object",
]

TITLE_LAYOUTS = [
    "top-left-box",
    "top-right-box",
    "bottom-left-box",
    "bottom-right-box",
    "top-center-strip",
    "left-vertical",
    "right-vertical",
    "free-top",
    "free-bottom",
    "angled-tag",
]

SCENE_VARIANTS = [
    "left-heavy",
    "right-heavy",
    "center-heavy",
    "top-heavy",
    "bottom-heavy",
    "diagonal-up",
    "diagonal-down",
    "triple-spread",
    "single-big",
    "offset-cluster",
]

FONT_FILES_BOLD = ["malgunbd.ttf", "arialbd.ttf", "impact.ttf", "trebucbd.ttf", "calibrib.ttf", "seguisb.ttf"]
FONT_FILES_REG = ["malgun.ttf", "arial.ttf", "trebuc.ttf", "calibri.ttf", "segoeui.ttf", "georgia.ttf"]


def load_font(candidates, size):
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            continue
    return ImageFont.load_default()


def slugify(word):
    text = re.sub(r"[^a-z0-9]+", "_", word.lower()).strip("_")
    return text


def pick_diverse_trait(option_list, used_indices, randomizer):
    choices = [idx for idx in range(len(option_list)) if idx not in used_indices]
    if not choices:
        used_indices.clear()
        choices = list(range(len(option_list)))
    idx = randomizer.choice(choices)
    used_indices.add(idx)
    return option_list[idx]


def choose_combo(word, index, history):
    randomizer = random.Random(sum(ord(ch) for ch in word) * 131 + index * 997)
    used = {
        "color": set(),
        "character": set(),
        "font": set(),
        "background": set(),
        "vibe": set(),
        "layout": set(),
        "title_layout": set(),
        "scene_variant": set(),
    }

    while True:
        combo = {
            "color": pick_diverse_trait(COLOR_THEMES, used["color"], randomizer),
            "character": pick_diverse_trait(CHARACTER_STYLES, used["character"], randomizer),
            "font": pick_diverse_trait(FONT_STYLES, used["font"], randomizer),
            "background": pick_diverse_trait(BACKGROUND_STYLES, used["background"], randomizer),
            "vibe": pick_diverse_trait(VIBES, used["vibe"], randomizer),
            "layout": pick_diverse_trait(LAYOUTS, used["layout"], randomizer),
            "title_layout": pick_diverse_trait(TITLE_LAYOUTS, used["title_layout"], randomizer),
            "scene_variant": pick_diverse_trait(SCENE_VARIANTS, used["scene_variant"], randomizer),
        }

        if not history:
            return combo

        last = history[-1]
        diff = sum(
            1
            for key in ["character", "font", "background", "vibe", "layout", "color", "title_layout", "scene_variant"]
            if combo[key] != last[key]
        )
        if diff >= 7:
            return combo


def draw_background(draw, combo):
    bg_name = combo["background"]
    colors = combo["color"]
    dark = colors["dark"]
    primary = colors["primary"]
    secondary = colors["secondary"]

    if "black" in bg_name:
        draw.rectangle((0, 0, WIDTH, HEIGHT), fill="#050505")
    else:
        draw.rectangle((0, 0, WIDTH, HEIGHT), fill="#fffdf8")

    if bg_name.endswith("grid"):
        color = secondary if "black" not in bg_name else primary
        for x in range(0, WIDTH, 60):
            draw.line((x, 0, x, HEIGHT), fill=color, width=2)
        for y in range(0, HEIGHT, 60):
            draw.line((0, y, WIDTH, y), fill=color, width=2)
    elif "dots" in bg_name:
        for i in range(90):
            x = (i * 97) % WIDTH
            y = (i * 71) % HEIGHT
            draw.ellipse((x, y, x + 12, y + 12), fill=secondary)
    elif "stars" in bg_name:
        for i in range(36):
            x = 80 + (i * 89) % (WIDTH - 160)
            y = 60 + (i * 53) % (HEIGHT - 120)
            draw.line((x - 14, y, x + 14, y), fill=primary, width=3)
            draw.line((x, y - 14, x, y + 14), fill=primary, width=3)
    elif "confetti" in bg_name:
        for i in range(120):
            x = (i * 43) % WIDTH
            y = (i * 67) % HEIGHT
            color = primary if i % 2 == 0 else secondary
            draw.rectangle((x, y, x + 18, y + 8), fill=color)
    elif "wave" in bg_name:
        for row in range(8):
            points = []
            for x in range(0, WIDTH + 40, 40):
                y = 120 + row * 90 + int(16 * math.sin((x / 80) + row))
                points.append((x, y))
            draw.line(points, fill=primary, width=5)
    elif "paper" in bg_name:
        for y in range(0, HEIGHT, 36):
            draw.line((0, y, WIDTH, y), fill="#dbeafe", width=2)
        draw.line((130, 0, 130, HEIGHT), fill="#ef4444", width=4)
    elif "sun" in bg_name:
        cx, cy = 920, 190
        for radius in range(240, 30, -34):
            fill = primary if radius % 68 else secondary
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=fill, width=5)
    elif "sticker" in bg_name:
        for i in range(22):
            x = 80 + (i * 103) % (WIDTH - 160)
            y = 100 + (i * 59) % (HEIGHT - 180)
            r = 30 + (i % 4) * 12
            fill = primary if i % 2 == 0 else secondary
            draw.ellipse((x - r, y - r, x + r, y + r), outline=fill, width=4)
    elif "checker" in bg_name:
        size = 70
        for y in range(0, HEIGHT, size):
            for x in range(0, WIDTH, size):
                fill = "#111111" if ((x // size) + (y // size)) % 2 == 0 else "#1f1f1f"
                draw.rectangle((x, y, x + size, y + size), fill=fill)
    elif "halftone" in bg_name:
        for i in range(16):
            for j in range(12):
                radius = 6 + ((i + j) % 4) * 4
                x = 70 + i * 70
                y = 70 + j * 70
                draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=secondary)

    border = dark if "black" not in bg_name else primary
    draw.rounded_rectangle((36, 36, WIDTH - 36, HEIGHT - 36), radius=34, outline=border, width=4)


def draw_title(draw, word, meaning, combo):
    colors = combo["color"]
    bg_name = combo["background"]
    title_color = colors["primary"]
    outline = colors["dark"] if "black" not in bg_name else colors["primary"]
    text_color = colors["dark"] if "black" not in bg_name else "#f8fafc"
    panel_fill = "#ffffffee" if "black" not in bg_name else "#0b0b0be6"

    bold_size = 74 if combo["font"] in {"malgun gothic", "soft rounded", "label sans"} else 86
    word_font = load_font(FONT_FILES_BOLD, bold_size)
    mean_font = load_font(FONT_FILES_REG, 34)
    layout = combo["title_layout"]

    if layout == "top-left-box":
        box = (48, 48, 660, 226)
        text_pos = (78, 72)
        mean_pos = (84, 166)
        draw.rounded_rectangle(box, radius=28, fill=panel_fill, outline=outline, width=4)
        draw.text(text_pos, word, fill=title_color, font=word_font)
        draw.text(mean_pos, meaning, fill=text_color, font=mean_font)
    elif layout == "top-right-box":
        box = (540, 48, 1152, 226)
        draw.rounded_rectangle(box, radius=28, fill=panel_fill, outline=outline, width=4)
        draw.text((570, 72), word, fill=title_color, font=word_font)
        draw.text((576, 166), meaning, fill=text_color, font=mean_font)
    elif layout == "bottom-left-box":
        box = (48, 672, 660, 852)
        draw.rounded_rectangle(box, radius=28, fill=panel_fill, outline=outline, width=4)
        draw.text((78, 696), word, fill=title_color, font=word_font)
        draw.text((84, 790), meaning, fill=text_color, font=mean_font)
    elif layout == "bottom-right-box":
        box = (540, 672, 1152, 852)
        draw.rounded_rectangle(box, radius=28, fill=panel_fill, outline=outline, width=4)
        draw.text((570, 696), word, fill=title_color, font=word_font)
        draw.text((576, 790), meaning, fill=text_color, font=mean_font)
    elif layout == "top-center-strip":
        box = (170, 36, 1030, 178)
        draw.rounded_rectangle(box, radius=24, fill=panel_fill, outline=outline, width=4)
        draw.text((210, 56), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 78))
        draw.text((214, 126), meaning, fill=text_color, font=load_font(FONT_FILES_REG, 30))
    elif layout == "left-vertical":
        box = (36, 120, 210, 770)
        draw.rounded_rectangle(box, radius=24, fill=panel_fill, outline=outline, width=4)
        draw.text((62, 150), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 62))
        draw.text((62, 650), meaning, fill=text_color, font=load_font(FONT_FILES_REG, 28))
    elif layout == "right-vertical":
        box = (990, 120, 1164, 770)
        draw.rounded_rectangle(box, radius=24, fill=panel_fill, outline=outline, width=4)
        draw.text((1014, 150), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 58))
        draw.text((1014, 650), meaning, fill=text_color, font=load_font(FONT_FILES_REG, 28))
    elif layout == "free-top":
        draw.text((82, 56), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 92))
        draw.text((90, 146), meaning, fill=text_color, font=load_font(FONT_FILES_REG, 34))
    elif layout == "free-bottom":
        draw.text((82, 714), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 92))
        draw.text((90, 804), meaning, fill=text_color, font=load_font(FONT_FILES_REG, 34))
    else:
        polygon = [(62, 54), (610, 54), (664, 142), (610, 230), (62, 230)]
        draw.polygon(polygon, fill=panel_fill, outline=outline)
        draw.text((90, 74), word, fill=title_color, font=load_font(FONT_FILES_BOLD, 82))
        draw.text((98, 166), meaning, fill=text_color, font=mean_font)


def draw_character(draw, combo, center_x, center_y, scale):
    colors = combo["color"]
    dark = colors["dark"] if "black" not in combo["background"] else "#f8fafc"
    primary = colors["primary"]
    secondary = colors["secondary"]
    face_fill = "#ffffff" if "black" in combo["background"] else "#fffaf0"
    style = combo["character"]
    animation_mode = combo["vibe"] == "animation cel"

    if animation_mode:
        glow = secondary if "black" in combo["background"] else primary
        draw.ellipse(
            (center_x - scale * 1.55, center_y - scale * 1.55, center_x + scale * 1.55, center_y + scale * 1.55),
            outline=glow,
            width=8,
        )
        scale = int(scale * 1.08)

    if style == "stickman":
        draw.ellipse((center_x - scale, center_y - scale * 2.2, center_x + scale, center_y - scale * 0.2), fill=face_fill, outline=dark, width=6)
        draw.line((center_x, center_y - scale * 0.2, center_x, center_y + scale * 1.8), fill=dark, width=8)
        draw.line((center_x, center_y + scale * 0.1, center_x - scale * 1.2, center_y + scale), fill=dark, width=7)
        draw.line((center_x, center_y + scale * 0.1, center_x + scale * 1.2, center_y + scale), fill=dark, width=7)
        draw.line((center_x, center_y + scale * 1.8, center_x - scale, center_y + scale * 3.1), fill=dark, width=7)
        draw.line((center_x, center_y + scale * 1.8, center_x + scale, center_y + scale * 3.1), fill=dark, width=7)
        draw.rounded_rectangle((center_x - scale * 1.1, center_y + scale * 0.2, center_x + scale * 1.1, center_y + scale * 1.4), radius=20, outline=primary, width=10)
    elif style == "cat mascot":
        draw.rounded_rectangle((center_x - scale * 1.2, center_y - scale * 1.3, center_x + scale * 1.2, center_y + scale * 1.6), radius=26, fill=face_fill, outline=dark, width=7)
        draw.polygon([(center_x - scale, center_y - scale * 1.1), (center_x - scale * 0.35, center_y - scale * 2), (center_x, center_y - scale * 1.2)], fill=face_fill, outline=dark)
        draw.polygon([(center_x + scale, center_y - scale * 1.1), (center_x + scale * 0.35, center_y - scale * 2), (center_x, center_y - scale * 1.2)], fill=face_fill, outline=dark)
        draw.ellipse((center_x - scale * 0.65, center_y - scale * 0.35, center_x - scale * 0.35, center_y - scale * 0.05), fill=dark)
        draw.ellipse((center_x + scale * 0.35, center_y - scale * 0.35, center_x + scale * 0.65, center_y - scale * 0.05), fill=dark)
        draw.line((center_x - scale * 0.2, center_y + scale * 0.2, center_x + scale * 0.2, center_y + scale * 0.2), fill=secondary, width=4)
        for dy in [-12, 12]:
            draw.line((center_x - scale * 1.2, center_y + dy, center_x - scale * 0.4, center_y + dy), fill=dark, width=4)
            draw.line((center_x + scale * 0.4, center_y + dy, center_x + scale * 1.2, center_y + dy), fill=dark, width=4)
    elif style == "frog cadet":
        draw.ellipse((center_x - scale * 1.2, center_y - scale * 0.9, center_x + scale * 1.2, center_y + scale * 1.1), fill="#d9f99d", outline=dark, width=7)
        draw.ellipse((center_x - scale * 1.1, center_y - scale * 1.6, center_x - scale * 0.4, center_y - scale * 0.9), fill="#d9f99d", outline=dark, width=6)
        draw.ellipse((center_x + scale * 0.4, center_y - scale * 1.6, center_x + scale * 1.1, center_y - scale * 0.9), fill="#d9f99d", outline=dark, width=6)
        draw.ellipse((center_x - scale * 0.85, center_y - scale * 1.35, center_x - scale * 0.55, center_y - scale * 1.05), fill=dark)
        draw.ellipse((center_x + scale * 0.55, center_y - scale * 1.35, center_x + scale * 0.85, center_y - scale * 1.05), fill=dark)
        draw.arc((center_x - scale * 0.6, center_y - scale * 0.1, center_x + scale * 0.6, center_y + scale * 0.7), 0, 180, fill=dark, width=5)
        draw.rectangle((center_x - scale * 1.3, center_y - scale * 1.9, center_x + scale * 1.3, center_y - scale * 1.55), fill=secondary, outline=dark, width=4)
    elif style == "sleepy robot":
        draw.rectangle((center_x - scale, center_y - scale, center_x + scale, center_y + scale), fill=face_fill, outline=dark, width=7)
        draw.line((center_x, center_y - scale * 1.5, center_x, center_y - scale), fill=dark, width=6)
        draw.ellipse((center_x - 12, center_y - scale * 1.7, center_x + 12, center_y - scale * 1.45), fill=primary)
        draw.line((center_x - scale * 0.5, center_y - scale * 0.25, center_x - scale * 0.1, center_y - scale * 0.25), fill=dark, width=5)
        draw.line((center_x + scale * 0.1, center_y - scale * 0.25, center_x + scale * 0.5, center_y - scale * 0.25), fill=dark, width=5)
        draw.line((center_x - scale * 0.35, center_y + scale * 0.3, center_x + scale * 0.35, center_y + scale * 0.3), fill=secondary, width=5)
    elif style == "round ghost":
        draw.ellipse((center_x - scale, center_y - scale, center_x + scale, center_y + scale * 1.1), fill="#ffffff", outline=dark, width=6)
        for i in range(4):
            x = center_x - scale + i * scale * 0.6
            draw.arc((x, center_y + scale * 0.55, x + scale * 0.6, center_y + scale * 1.35), 180, 360, fill=dark, width=6)
        draw.ellipse((center_x - scale * 0.4, center_y - scale * 0.25, center_x - scale * 0.18, center_y - scale * 0.03), fill=dark)
        draw.ellipse((center_x + scale * 0.18, center_y - scale * 0.25, center_x + scale * 0.4, center_y - scale * 0.03), fill=dark)
    else:
        draw.ellipse((center_x - scale, center_y - scale, center_x + scale, center_y + scale), fill=face_fill, outline=dark, width=6)
        if animation_mode:
            draw.ellipse((center_x - scale * 0.46, center_y - scale * 0.28, center_x - scale * 0.1, center_y + scale * 0.12), fill=dark)
            draw.ellipse((center_x + scale * 0.1, center_y - scale * 0.28, center_x + scale * 0.46, center_y + scale * 0.12), fill=dark)
            draw.ellipse((center_x - scale * 0.34, center_y - scale * 0.2, center_x - scale * 0.22, center_y - scale * 0.08), fill="#ffffff")
            draw.ellipse((center_x + scale * 0.22, center_y - scale * 0.2, center_x + scale * 0.34, center_y - scale * 0.08), fill="#ffffff")
            draw.arc((center_x - scale * 0.46, center_y + scale * 0.02, center_x + scale * 0.46, center_y + scale * 0.68), 8, 172, fill=secondary, width=7)
            draw.ellipse((center_x - scale * 0.72, center_y + scale * 0.12, center_x - scale * 0.52, center_y + scale * 0.32), fill="#fda4af")
            draw.ellipse((center_x + scale * 0.52, center_y + scale * 0.12, center_x + scale * 0.72, center_y + scale * 0.32), fill="#fda4af")
        else:
            draw.ellipse((center_x - scale * 0.35, center_y - scale * 0.2, center_x - scale * 0.12, center_y + scale * 0.03), fill=dark)
            draw.ellipse((center_x + scale * 0.12, center_y - scale * 0.2, center_x + scale * 0.35, center_y + scale * 0.03), fill=dark)
            draw.arc((center_x - scale * 0.35, center_y + scale * 0.1, center_x + scale * 0.35, center_y + scale * 0.55), 0, 180, fill=secondary, width=5)


def draw_animation_overlay(draw, combo):
    if combo["vibe"] != "animation cel":
        return

    colors = combo["color"]
    primary = colors["primary"]
    secondary = colors["secondary"]
    dark = colors["dark"] if "black" not in combo["background"] else "#f8fafc"
    draw.rounded_rectangle((70, 110, WIDTH - 70, HEIGHT - 110), radius=44, outline=primary, width=6)
    draw.arc((120, 90, 420, 320), 210, 340, fill=secondary, width=10)
    draw.arc((WIDTH - 420, HEIGHT - 320, WIDTH - 120, HEIGHT - 90), 30, 160, fill=dark, width=8)


def draw_object_scene(draw, word, combo):
    colors = combo["color"]
    bg_black = "black" in combo["background"]
    dark = colors["dark"] if not bg_black else "#f8fafc"
    primary = colors["primary"]
    secondary = colors["secondary"]
    layout = combo["layout"]
    variant = combo["scene_variant"]

    center_x = 640
    center_y = 470
    if variant == "left-heavy":
        center_x, center_y = 430, 470
    elif variant == "right-heavy":
        center_x, center_y = 810, 470
    elif variant == "top-heavy":
        center_x, center_y = 620, 320
    elif variant == "bottom-heavy":
        center_x, center_y = 620, 620
    elif variant == "diagonal-up":
        center_x, center_y = 820, 320
    elif variant == "diagonal-down":
        center_x, center_y = 380, 620

    if layout == "badge":
        x1, y1 = center_x - 220, center_y - 170
        x2, y2 = center_x + 220, center_y + 170
        draw.rounded_rectangle((x1, y1, x2, y2), radius=36, fill="#ffffff" if not bg_black else "#111827", outline=dark, width=9)
        draw_character(draw, combo, center_x - 90, center_y, 68)
        draw.ellipse((center_x + 40, center_y - 110, center_x + 220, center_y + 70), outline=primary, width=12)
        draw.text((center_x + 75, center_y - 40), "GO", fill=secondary, font=load_font(FONT_FILES_BOLD, 60))
    elif layout == "center-stage":
        draw_character(draw, combo, center_x, center_y, 88)
        draw.text((center_x - 170, max(60, center_y - 240)), random.choice(["WOW", "ZAP", "BINGO", "LEVEL UP"]), fill=primary, font=load_font(FONT_FILES_BOLD, 62))
    elif layout == "split-left":
        left_x = 280 if variant != "right-heavy" else 180
        panel_x1 = 520 if variant != "left-heavy" else 620
        draw_character(draw, combo, left_x, center_y, 84)
        draw.rounded_rectangle((panel_x1, center_y - 220, panel_x1 + 420, center_y + 230), radius=32, fill="#ffffff" if not bg_black else "#111827", outline=dark, width=8)
        draw.text((panel_x1 + 80, center_y - 40), "IDEA", fill=primary, font=load_font(FONT_FILES_BOLD, 72))
    elif layout == "speech-bubble":
        char_x = 250 if variant != "right-heavy" else 880
        bubble = (360, 170, 1080, 730) if char_x < 500 else (120, 170, 840, 730)
        draw_character(draw, combo, char_x, center_y, 78)
        draw.ellipse(bubble, outline=dark, width=10)
        draw.text((bubble[0] + 180, bubble[1] + 210), "TOPIC", fill=primary, font=load_font(FONT_FILES_BOLD, 66))
    elif layout == "poster":
        poster_x = center_x - 180
        poster_y = center_y - 240
        draw.rectangle((poster_x, poster_y, poster_x + 360, poster_y + 480), fill="#ffffff" if not bg_black else "#111827", outline=dark, width=10)
        for row in range(6):
            y = poster_y + 100 + row * 56
            color = primary if row % 2 == 0 else dark
            draw.line((poster_x + 80, y, poster_x + 300, y), fill=color, width=6)
        draw_character(draw, combo, poster_x + 470, poster_y + 260, 72)
    elif layout == "sticker-stack":
        for offset, color in [(0, primary), (40, secondary), (80, dark)]:
            draw.rounded_rectangle((center_x - 180 + offset, center_y - 150 - offset, center_x + 120 + offset, center_y + 150 - offset), radius=28, fill="#ffffff", outline=color, width=8)
        draw_character(draw, combo, center_x - 10, center_y, 60)
    elif layout == "blueprint":
        x1, y1 = center_x - 150, center_y - 250
        x2, y2 = center_x + 150, center_y + 260
        draw.rounded_rectangle((x1, y1, x2, y2), radius=26, fill="#ffffff" if not bg_black else "#111827", outline=dark, width=10)
        draw.arc((x1 + 40, y1 - 50, x2 - 40, y1 + 130), 180, 360, fill=dark, width=10)
        draw.line((x2 - 60, center_y + 20, x2 + 150, center_y - 120), fill=primary, width=18)
        draw.polygon([(x2 + 150, center_y - 120), (x2 + 95, center_y - 138), (x2 + 110, center_y - 82)], fill=primary, outline=dark)
    elif layout == "comic-strip":
        panel_w = 300
        for i in range(3):
            if variant in {"diagonal-up", "diagonal-down"}:
                y1 = 220 + i * 90 if variant == "diagonal-down" else 400 - i * 90
            else:
                y1 = 270
            x = 90 + i * (panel_w + 30)
            draw.rounded_rectangle((x, y1, x + panel_w, y1 + 420), radius=20, fill="#ffffff" if not bg_black else "#111827", outline=dark, width=7)
            draw_character(draw, combo, x + panel_w // 2, y1 + 200, 54 + i * 8)
        draw.text((440, 160 if variant == "top-heavy" else 200), "HA!", fill=secondary, font=load_font(FONT_FILES_BOLD, 56))
    elif layout == "totem":
        base_x = 420 if variant == "left-heavy" else 780 if variant == "right-heavy" else 600
        draw_character(draw, combo, base_x, 250, 58)
        draw_character(draw, combo, base_x, 470, 74)
        draw_character(draw, combo, base_x, 700, 58)
    else:
        x1, y1 = center_x - 240, center_y - 170
        x2, y2 = center_x + 240, center_y + 170
        draw.ellipse((x1, y1, x2, y2), outline=dark, width=12)
        draw.line((x1, y2, x1 - 130, y2 + 120), fill=primary, width=12)
        draw.line((x2, y2, x2 + 130, y2 + 120), fill=primary, width=12)
        draw_character(draw, combo, x2 + 20, y1 + 30, 58)
        draw.text((center_x - 140, center_y - 20), "BIG", fill=secondary, font=load_font(FONT_FILES_BOLD, 72))


def draw_footer(draw, combo):
    colors = combo["color"]
    bg_black = "black" in combo["background"]
    dark = colors["dark"] if not bg_black else "#f8fafc"
    primary = colors["primary"]
    fill = "#ffffffd9" if not bg_black else "#111827e8"
    positions = [
        (78, 794, 792, 852),
        (360, 794, 1122, 852),
        (78, 38, 420, 92),
        (820, 38, 1122, 92),
    ]
    x1, y1, x2, y2 = positions[hash(combo["vibe"] + combo["layout"]) % len(positions)]
    draw.rounded_rectangle((x1, y1, x2, y2), radius=20, fill=fill, outline=dark, width=3)
    message = f"{combo['character']} / {combo['vibe']}"
    draw.text((x1 + 18, y1 + 14), message, fill=primary, font=load_font(FONT_FILES_BOLD, 28))


def render_image(item, combo):
    img = Image.new("RGB", (WIDTH, HEIGHT), "white")
    draw = ImageDraw.Draw(img)
    draw_background(draw, combo)
    draw_animation_overlay(draw, combo)
    draw_title(draw, item["word"], item["meaning"], combo)
    draw_object_scene(draw, item["word"], combo)
    draw_footer(draw, combo)
    return img


def main():
    items = json.loads(DATA_PATH.read_text(encoding="utf-8"))[:COUNT]
    history = []
    animation_slots = {2, 7}

    for index, item in enumerate(items):
        combo = choose_combo(item["word"], index, history)
        if index in animation_slots:
            combo["vibe"] = "animation cel"
            if combo["layout"] in {"badge", "totem"}:
                combo["layout"] = "speech-bubble" if index % 2 == 0 else "comic-strip"
            if combo["title_layout"] in {"free-top", "free-bottom"}:
                combo["title_layout"] = "angled-tag"
        history.append(combo)
        image = render_image(item, combo)
        output_path = OUT_DIR / f"img_{slugify(item['word'])}.png"
        image.save(output_path, format="PNG")
        print(f"{item['seq']:>3} | {item['word']:<16} | {combo['background']}, {combo['character']}, {combo['font']}, {combo['vibe']}, {combo['layout']}")


if __name__ == "__main__":
    main()
