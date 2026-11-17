#!/usr/bin/env python3.12
"""One-time import of the old WordPress site (othaimeengrp.com) into this repo.

The old site runs on Effentii's server, which goes away on 25 Nov 2026, so everything
worth keeping is copied here:

  src/data/services.json   the 10 service pages (cleaned into ordered blocks)
  src/data/posts.json      the 2 news articles (cleaned HTML)
  assets-src/              original images (made web-ready by scripts/optimise-images.sh)

The theme's demo pages (fake team, "Consulting WP" history and approach) are NOT imported.

Needs BeautifulSoup (python3.12 on this Mac has it). Run from the repo root:
    python3.12 -I scripts/import-wp.py
Safe to re-run: downloaded files are skipped. Raw HTML is cached in .import-cache/.
"""
import html
import json
import os
import re
import sys
import time
import urllib.request

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://othaimeengrp.com"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"
CACHE = os.path.join(ROOT, ".import-cache")


def get(url, binary=False, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            return data if binary else data.decode("utf-8", "replace")
        except Exception as e:  # the old server resets connections under load
            if i == tries - 1:
                raise
            print(f"  retry {i + 1} {url}: {e}", file=sys.stderr)
            time.sleep(2 + i * 3)


def cached(url):
    os.makedirs(CACHE, exist_ok=True)
    key = re.sub(r"[^a-z0-9]+", "_", url.lower()).strip("_")[-120:] + ".html"
    path = os.path.join(CACHE, key)
    if not os.path.exists(path):
        with open(path, "w") as f:
            f.write(get(url))
    with open(path) as f:
        return f.read()


def download(url, dest):
    dest = os.path.join(ROOT, dest)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        f.write(get(url, binary=True))
    print("  got", os.path.relpath(dest, ROOT))


def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()


# ---------------------------------------------------------------- services
# Order and grouping follow the old main menu.
SERVICES = [
    ("market-entry", "advisory"),
    ("sports-wellness", "advisory"),
    ("art-culture", "advisory"),
    ("hospitality-entertainment", "advisory"),
    ("food-beverage", "advisory"),
    ("digital-marketing", "marketing"),
    ("strategic-planning", "marketing"),
    ("brand-representation", "marketing"),
    ("seo", "marketing"),
    ("content-creation", "marketing"),
]
# Menu labels (some differ from the page titles)
MENU_LABEL = {
    "strategic-planning": "Business Strategy & Development",
    "brand-representation": "Brand & Company Representation",
    "seo": "Search Engine Optimization (SEO)",
    "content-creation": "Digital Content Creation",
}

# Sidebar widgets, calls to action and other theme furniture repeated on every page
BOILERPLATE = [
    r"^how can we help you\??$",
    r"^ready to elevate your business in the gcc",
    r"^company presentation$",
    r"^bin othaimeen group exemplifies excellence",
    r"^strategizing for success in saudi arabia",
    r"^navigating digital waters",
    r"^understand the essence of strategic planning",
    r"^exploring the pivotal role of digital marketing",
    r"^looking for (a|the) ",
    r"^your success partner!?$",
    r"^let'?s get started!?$",
    r"^get in touch$",
    r"^read more$",
    r"^september \d+, 2023",
    r"^abdulaziz bin othaimeen$",
    r"^ceo, bin othaimeen group$",
]
BOILER_RE = [re.compile(p, re.I) for p in BOILERPLATE]
SKIP_IMG = re.compile(r"(50x50|350x250|Sidebar|placeholder|logo-mar-2026|Mega-Menu|cropped-)", re.I)


def is_boiler(t):
    return any(r.search(t) for r in BOILER_RE)


def original(src):
    """WordPress size variants (-1110x550.jpg) -> the original upload."""
    return re.sub(r"-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)", "", src, flags=re.I)


def service_blocks(soup):
    main = (
        soup.find(attrs={"data-elementor-type": "wp-post"})
        or soup.find(attrs={"data-elementor-type": "single-post"})
        or soup.find("article")
        or soup.find("main")
    )
    for bad in main.find_all(["script", "style", "noscript", "form"]):
        bad.decompose()
    blocks, seen, image = [], set(), None
    for el in main.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "img"]):
        if el.name == "img":
            src = el.get("data-src") or el.get("src") or ""
            if src and not src.startswith("data:") and not SKIP_IMG.search(src) and not image:
                image = {"src": original(src), "alt": el.get("alt", "")}
            continue
        if el.name == "p" and el.find_parent("li"):
            continue
        if el.name == "li" and el.find(["p", "h4", "h5"]):
            continue
        t = text(el)
        if not t or is_boiler(t) or (el.name, t) in seen:
            continue
        seen.add((el.name, t))
        kind = {"h1": "h", "h2": "h", "h3": "h", "h4": "h", "h5": "item", "h6": "kicker", "p": "p", "li": "li"}[el.name]
        blocks.append({"k": kind, "t": t, "tag": el.name})
    # Drop the trailing CTA heading and anything after the last real paragraph
    while blocks and blocks[-1]["k"] in ("h", "kicker", "item"):
        blocks.pop()
    return blocks, image


def import_services():
    listing = BeautifulSoup(cached(f"{BASE}/services/"), "html.parser")
    summaries = {}
    for h in listing.find_all("h5"):
        a = h.find_next("a", href=re.compile(r"/service/"))
        p = h.find_next("p")
        if a and p:
            slug = a["href"].rstrip("/").split("/")[-1]
            summaries.setdefault(slug, {"card": text(h), "summary": text(p)})

    out = []
    for slug, group in SERVICES:
        url = f"{BASE}/service/{slug}/"
        raw = cached(url)
        soup = BeautifulSoup(raw, "html.parser")
        title = re.sub(r"\s*-\s*Othaimeen\s*$", "", soup.title.get_text(strip=True))
        desc = soup.find("meta", attrs={"name": "description"})
        blocks, image = service_blocks(soup)
        if not image:  # some pages set their photo as a CSS background instead of an <img>
            m = re.search(r"https://othaimeengrp\.com/wp-content/uploads/2016/01/[^\"')\s]+\.(?:jpe?g|png)", raw)
            if m and not SKIP_IMG.search(m.group(0)):
                image = {"src": original(m.group(0)), "alt": ""}
        img_local = None
        if image:
            ext = os.path.splitext(image["src"])[1].lower().replace(".jpeg", ".jpg")
            img_local = f"services/{slug}{ext}"
            download(image["src"], f"assets-src/{img_local}")
        s = summaries.get(slug, {})
        out.append({
            "slug": slug,
            "group": group,
            "title": title,
            "menu": MENU_LABEL.get(slug, title),
            "card": s.get("card", title),
            "summary": s.get("summary", ""),
            "seoDescription": desc["content"] if desc else "",
            "image": img_local,
            "imageAlt": (image or {}).get("alt", ""),
            "oldUrl": url,
            "blocks": blocks,
        })
        print(f"service {slug}: {len(blocks)} blocks, image={img_local}")

    # The old Food & Beverage page was pasted over with the Hospitality page's text plus a leftover
    # AI-tool instruction ("Simply copy and paste this into your website's HTML editor..."). Keep only
    # its own copy.
    by_slug = {s["slug"]: s for s in out}
    hosp = {b["t"] for b in by_slug["hospitality-entertainment"]["blocks"]}
    junk = re.compile(r"^(“`|```|simply copy and paste this)", re.I)
    for s in out:
        before = len(s["blocks"])
        s["blocks"] = [b for b in s["blocks"] if not junk.search(b["t"])
                       and not (s["slug"] == "food-beverage" and b["t"] in hosp)]
        if len(s["blocks"]) != before:
            print(f"  cleaned {s['slug']}: dropped {before - len(s['blocks'])} pasted/junk blocks")
    write_json("src/data/services.json", out)


# ---------------------------------------------------------------- posts
ALLOWED = {"p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "br"}


def clean_html(raw):
    soup = BeautifulSoup(raw, "html.parser")
    for bad in soup.find_all(["script", "style", "img", "figure", "iframe"]):
        bad.decompose()
    for el in soup.find_all(True):
        if el.name in ("h1", "h5", "h6"):
            el.name = "h3"
        if el.name not in ALLOWED:
            el.unwrap()
            continue
        href = el.get("href") if el.name == "a" else None
        el.attrs = {}
        if href:
            el["href"] = href.replace(BASE, "") or "/"
    s = str(soup)
    s = re.sub(r"<p>\s*(&nbsp;|\xa0)?\s*</p>", "", s)
    s = re.sub(r"\n{2,}", "\n", s)
    return s.strip()


def import_posts():
    posts = json.loads(get(f"{BASE}/wp-json/wp/v2/posts?per_page=100&_embed=1"))
    out = []
    for p in posts:
        media = (p.get("_embedded", {}).get("wp:featuredmedia") or [{}])[0]
        src = media.get("source_url")
        img_local = None
        if src:
            ext = os.path.splitext(src)[1].lower().replace(".jpeg", ".jpg")
            img_local = f"posts/{p['slug']}{ext}"
            download(src, f"assets-src/{img_local}")
        out.append({
            "slug": p["slug"],
            "title": html.unescape(p["title"]["rendered"]),
            "date": p["date"][:10],
            "modified": p["modified"][:10],
            "excerpt": text(BeautifulSoup(p["excerpt"]["rendered"], "html.parser")),
            "image": img_local,
            "imageAlt": media.get("alt_text", ""),
            "oldUrl": p["link"],
            "html": clean_html(p["content"]["rendered"]),
        })
        print(f"post {p['slug']}: {len(out[-1]['html'])} chars")
    out.sort(key=lambda x: x["date"], reverse=True)
    write_json("src/data/posts.json", out)


# ---------------------------------------------------------------- site images
UP = f"{BASE}/wp-content/uploads"
IMAGES = {
    # brand
    "brand/logo-white.png": f"{UP}/2026/03/BinOthaimeen-Group-logo-mar-2026-V2-White.png",
    "brand/logo-blue.png": f"{UP}/2026/03/BinOthaimeen-Group-logo-mar-2026-V2-Blue.png",
    "brand/icon.png": f"{UP}/2023/09/binothaimeengroup-icon.png",
    "brand/logo-square.png": f"{UP}/2023/09/bin-othaimeen-logo-square-1080x1080-1.png",
    "brand/favicon-src.png": f"{UP}/2023/09/cropped-binothaimeengroup-upscale-4000x4000-1.png",
    # photography
    "img/riyadh-mumlaka-blue.jpg": f"{UP}/2026/03/Othaimeen-Group-Riyadh-Mumlaka-Blue-c.jpg",
    "img/riyadh-mumlaka-blue-b.jpg": f"{UP}/2026/03/Othaimeen-Group-Riyadh-Mumlaka-Blue-b.jpg",
    "img/main-thumbnail.jpg": f"{UP}/2026/03/othaimee-grp-main-thumbnail-scaled.jpg",
    "img/mega-menu-1.jpg": f"{UP}/2026/03/Bin-Othaimeen-Mega-Menu-Image-2026-1.jpg",
    "img/mega-menu-2.jpg": f"{UP}/2026/03/Bin-Othaimeen-Mega-Menu-2026-2-2026.jpg",
    "img/services-title-bar.jpg": f"{UP}/2023/09/Othaimeen-Consulting-Services-Title-Bar.jpg",
    "img/riyadh-city-sky.jpg": f"{UP}/2023/09/othaimeen-riyadh-city-sky.jpg",
    "img/riyadh-city-sky-c.jpg": f"{UP}/2023/09/othaimeen-riyadh-city-sky-c.jpg",
    "img/riyadh-city-sky-light.jpg": f"{UP}/2023/09/othaimeen-riyadh-city-sky-c-light-jpg.jpeg",
    "img/mumlaka-night-portrait.jpg": f"{UP}/2023/10/mumlaka-night-portrait.jpg",
    "img/ithra-light.jpg": f"{UP}/2023/09/Othaimeen-Ithra-light.jpg",
    "img/vision-content-6.jpg": f"{UP}/2023/09/content-6.jpg",
    "img/hero-events-4.jpg": f"{UP}/2023/09/events-4.jpg",
    "img/leadcrystal-hero.jpg": f"{UP}/2026/05/Leadcrystal-Hero-Energy-Evolved-800-x-300.jpg",
    # partners
    "partners/leadcrystal-betta.png": f"{UP}/2026/05/Betta-batteries-lead-crystal.png",
    "partners/neil-patel-digital.jpg": f"{UP}/2023/09/neil-patel-digital-20764019.jpeg",
    "partners/vibe-squad.jpg": f"{UP}/2023/10/VibeQuad-Logo-inverted.jpg",
    "partners/ecore.jpg": f"{UP}/2023/09/Ecore-logo-3344305839.jpeg",
    "partners/servotel.png": f"{UP}/2023/09/logo-2022-servotel.png",
    "partners/1.jpg": f"{UP}/2023/09/1.jpg",
    "partners/2.jpg": f"{UP}/2023/09/2.jpg",
    "partners/3.jpg": f"{UP}/2023/09/3.jpg",
    "partners/4.jpg": f"{UP}/2023/09/4.jpg",
    "partners/5.jpg": f"{UP}/2023/09/5.jpg",
}


def import_images():
    for dest, url in IMAGES.items():
        try:
            download(url, f"assets-src/{dest}")
        except Exception as e:
            print(f"  FAILED {url}: {e}", file=sys.stderr)


# Logos stay reachable at their old WordPress URLs: email signatures and documents often load
# them straight from the website. Copied byte-for-byte into public/wp-content/uploads/.
LEGACY_LOGOS = [
    "2026/03/BinOthaimeen-Group-logo-mar-2026-V2-White.png",
    "2026/03/BinOthaimeen-Group-logo-mar-2026-V2-Blue.png",
    "2023/09/bin-othaimeen-logo-square-1080x1080-1.png",
    "2023/09/binothaimeengroup-icon.png",
    "2023/09/cropped-binothaimeengroup-upscale-4000x4000-1.png",
    "2023/09/othaimeen-logo-horizontal-trans-white.png",
    "2023/09/othaimeen-logo-vertical-trans-1.png",
    "2023/09/Othaimeen-Logo-2000x600-color-trans-b.png",
    "2023/09/Othaimeen-Logo-2000x600-color-trans-c.png",
    "2023/09/Othaimeen-Logo-2000x600-color-trans-d.png",
    "2023/09/Othaimeen-Logo-2000x600-color-trans-e.png",
    "2023/09/Othaimeen-Logo-2000x600-color-trans-f.png",
]


def import_legacy_logos():
    for rel in LEGACY_LOGOS:
        try:
            download(f"{UP}/{rel}", f"public/wp-content/uploads/{rel}")
        except Exception as e:
            print(f"  FAILED {rel}: {e}", file=sys.stderr)


def write_json(rel, data):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("wrote", rel)


if __name__ == "__main__":
    import_images()
    import_legacy_logos()
    import_services()
    import_posts()
