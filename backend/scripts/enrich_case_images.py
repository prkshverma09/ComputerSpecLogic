#!/usr/bin/env python3
"""
Case Image Enrichment Script for Spec-Logic

Searches for case images using web search APIs, downloads them,
and stores them locally for use in the build page UI.

Usage:
    python scripts/enrich_case_images.py [--limit N] [--resume] [--source pcpartpicker|etl|both]
"""

import argparse
import csv
import hashlib
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

sys.path.insert(0, str(Path(__file__).parent.parent))

ENV_FILE = Path(__file__).parent.parent / ".env"
load_dotenv(ENV_FILE)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

EXA_API_KEY = os.getenv("EXA_API_KEY", "")
EXA_API_URL = "https://api.exa.ai/search"

DATA_DIR = Path(__file__).parent.parent / "data"
PCPARTPICKER_CASE_CSV = DATA_DIR / "pcpartpicker" / "case.csv"
ETL_CASE_JSON = DATA_DIR / "processed" / "case_processed.json"
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"
IMAGES_DIR = FRONTEND_DIR / "public" / "component-images" / "cases"
MANIFEST_FILE = DATA_DIR / "case_image_manifest.json"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)

PREFERRED_DOMAINS = [
    "newegg.com",
    "amazon.com",
    "bhphotovideo.com",
    "pcpartpicker.com",
    "corsair.com",
    "nzxt.com",
    "fractal-design.com",
    "lian-li.com",
    "coolermaster.com",
    "phanteks.com",
    "thermaltake.com",
]

IMAGE_SIZE = (512, 512)
REQUEST_DELAY = 1.0
MAX_RETRIES = 3


def load_manifest() -> Dict[str, Any]:
    """Load existing manifest file if it exists."""
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, "r") as f:
            return json.load(f)
    return {"cases": {}, "errors": [], "stats": {"total": 0, "success": 0, "failed": 0}}


def save_manifest(manifest: Dict[str, Any]) -> None:
    """Save manifest file."""
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
    logger.info(f"Saved manifest to {MANIFEST_FILE}")


def load_pcpartpicker_cases(limit: int = 500) -> List[Dict[str, Any]]:
    """Load cases from PCPartPicker CSV."""
    cases = []
    if not PCPARTPICKER_CASE_CSV.exists():
        logger.warning(f"PCPartPicker case CSV not found: {PCPARTPICKER_CASE_CSV}")
        return cases

    with open(PCPARTPICKER_CASE_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= limit:
                break
            name = row.get("name", "").strip()
            if not name:
                continue
            price = row.get("price", "")
            try:
                price_val = float(str(price).replace("$", "").replace(",", "").strip())
                if price_val <= 0:
                    continue
            except (ValueError, TypeError):
                continue

            cases.append({
                "objectID": f"case_{i}",
                "name": name,
                "brand": extract_brand(name),
                "model": name,
                "source": "pcpartpicker"
            })
    
    logger.info(f"Loaded {len(cases)} cases from PCPartPicker CSV")
    return cases


def load_etl_cases() -> List[Dict[str, Any]]:
    """Load cases from ETL processed JSON."""
    cases = []
    if not ETL_CASE_JSON.exists():
        logger.warning(f"ETL case JSON not found: {ETL_CASE_JSON}")
        return cases

    with open(ETL_CASE_JSON, "r") as f:
        data = json.load(f)
        for case in data:
            cases.append({
                "objectID": case["objectID"],
                "name": f"{case.get('brand', '')} {case.get('model', '')}".strip(),
                "brand": case.get("brand", ""),
                "model": case.get("model", ""),
                "source": "etl"
            })
    
    logger.info(f"Loaded {len(cases)} cases from ETL JSON")
    return cases


def extract_brand(name: str) -> str:
    """Extract brand from product name."""
    if not name:
        return "Unknown"
    brands = [
        "ASUS", "Asus", "MSI", "Gigabyte", "GIGABYTE", "ASRock", "EVGA",
        "Corsair", "NZXT", "Cooler Master", "be quiet!", "Fractal Design",
        "Lian Li", "Phanteks", "Thermaltake", "Seasonic", "Super Flower",
        "Antec", "BitFenix", "Silverstone", "SilverStone", "Razer",
        "Montech", "Rosewill", "Cougar", "GameMax", "Aerocool",
        "HYTE", "InWin", "Zalman", "Jonsbo", "SSUPD", "LOUQE",
    ]
    name_upper = name.upper()
    for brand in brands:
        if name_upper.startswith(brand.upper()):
            return brand
        if brand.upper() in name_upper:
            return brand
    return name.split()[0] if name else "Unknown"


def search_image_exa(query: str) -> Optional[str]:
    """Search for image URL using Exa API."""
    if not EXA_API_KEY:
        logger.warning("EXA_API_KEY not set, skipping Exa search")
        return None

    headers = {
        "Authorization": f"Bearer {EXA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": f"{query} PC case product image",
        "numResults": 5,
        "type": "auto",
        "contents": {
            "text": False
        }
    }

    try:
        response = requests.post(EXA_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        for result in results:
            url = result.get("url", "")
            if any(domain in url.lower() for domain in PREFERRED_DOMAINS):
                return url
        
        if results:
            return results[0].get("url")
            
    except Exception as e:
        logger.error(f"Exa search failed for '{query}': {e}")
    
    return None


def search_image_google(query: str) -> Optional[str]:
    """Fallback: construct a likely image URL based on manufacturer patterns."""
    brand_lower = query.lower()
    
    manufacturer_patterns = {
        "corsair": "https://www.corsair.com/corsairlive/assets/images/",
        "nzxt": "https://nzxt.com/assets/",
        "fractal": "https://www.fractal-design.com/",
    }
    
    return None


def search_image_fallback(case_name: str, brand: str) -> Optional[str]:
    """Search for image using DuckDuckGo or direct URL construction."""
    search_query = f"{case_name} PC case"
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        search_url = f"https://www.google.com/search?q={requests.utils.quote(search_query)}&tbm=isch"
        
    except Exception as e:
        logger.debug(f"Fallback search failed: {e}")
    
    return None


def extract_image_from_page(page_url: str) -> Optional[str]:
    """Try to extract a product image URL from a webpage."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        response = requests.get(page_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        content = response.text
        
        og_image_match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', content, re.I)
        if og_image_match:
            return og_image_match.group(1)
        
        og_image_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', content, re.I)
        if og_image_match:
            return og_image_match.group(1)
        
        pcpp_match = re.search(r'https://cdna\.pcpartpicker\.com/static/forever/images/product/[a-f0-9]+\.256p\.jpg', content)
        if pcpp_match:
            return pcpp_match.group(0)
        
        newegg_match = re.search(r'https://[^"\']+neweggimages\.com/[^"\']+\.jpg', content, re.I)
        if newegg_match:
            return newegg_match.group(0)
        
        amazon_match = re.search(r'https://m\.media-amazon\.com/images/I/[^"\']+\.jpg', content)
        if amazon_match:
            return amazon_match.group(0)
            
    except Exception as e:
        logger.debug(f"Failed to extract image from {page_url}: {e}")
    
    return None


def download_image(image_url: str, object_id: str) -> Optional[str]:
    """Download and save an image, return local path."""
    if not image_url:
        return None
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        response = requests.get(image_url, headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type and not image_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            logger.warning(f"URL does not appear to be an image: {image_url}")
            return None
        
        img = Image.open(BytesIO(response.content))
        
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        img.thumbnail(IMAGE_SIZE, Image.Resampling.LANCZOS)
        
        safe_id = re.sub(r'[^a-zA-Z0-9_-]', '_', object_id)
        filename = f"{safe_id}.jpg"
        filepath = IMAGES_DIR / filename
        
        img.save(filepath, "JPEG", quality=85, optimize=True)
        
        logger.info(f"Saved image for {object_id}: {filepath}")
        return f"/component-images/cases/{filename}"
        
    except Exception as e:
        logger.error(f"Failed to download image from {image_url}: {e}")
        return None


def find_and_download_image(case: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    """Find and download image for a case, return (local_url, source_url)."""
    object_id = case["objectID"]
    case_name = case["name"]
    brand = case.get("brand", "")
    
    page_url = search_image_exa(case_name)
    
    if page_url:
        time.sleep(REQUEST_DELAY)
        image_url = extract_image_from_page(page_url)
        
        if image_url:
            local_url = download_image(image_url, object_id)
            if local_url:
                return local_url, image_url
    
    direct_searches = [
        f"{case_name} newegg",
        f"{case_name} amazon product",
        f"{brand} {case.get('model', '')} case",
    ]
    
    for search_term in direct_searches:
        page_url = search_image_exa(search_term)
        if page_url:
            time.sleep(REQUEST_DELAY)
            image_url = extract_image_from_page(page_url)
            if image_url:
                local_url = download_image(image_url, object_id)
                if local_url:
                    return local_url, image_url
    
    return None, None


def process_cases(cases: List[Dict[str, Any]], manifest: Dict[str, Any], resume: bool = True) -> Dict[str, Any]:
    """Process all cases and update manifest."""
    total = len(cases)
    processed = 0
    success = 0
    failed = 0
    
    for i, case in enumerate(cases):
        object_id = case["objectID"]
        
        if resume and object_id in manifest["cases"]:
            existing = manifest["cases"][object_id]
            if existing.get("image_url"):
                logger.info(f"[{i+1}/{total}] Skipping {object_id} (already has image)")
                success += 1
                processed += 1
                continue
        
        logger.info(f"[{i+1}/{total}] Processing {object_id}: {case['name']}")
        
        local_url, source_url = find_and_download_image(case)
        
        manifest["cases"][object_id] = {
            "name": case["name"],
            "brand": case.get("brand", ""),
            "image_url": local_url,
            "source_url": source_url,
            "source": case.get("source", "unknown"),
            "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        if local_url:
            success += 1
            logger.info(f"  ✓ Found image: {local_url}")
        else:
            failed += 1
            manifest["errors"].append({
                "objectID": object_id,
                "name": case["name"],
                "error": "No image found"
            })
            logger.warning(f"  ✗ No image found for {case['name']}")
        
        processed += 1
        
        if processed % 10 == 0:
            manifest["stats"] = {"total": total, "success": success, "failed": failed}
            save_manifest(manifest)
    
    manifest["stats"] = {"total": total, "success": success, "failed": failed}
    return manifest


def generate_report(manifest: Dict[str, Any]) -> str:
    """Generate a summary report."""
    stats = manifest.get("stats", {})
    total = stats.get("total", 0)
    success = stats.get("success", 0)
    failed = stats.get("failed", 0)
    
    report = []
    report.append("=" * 60)
    report.append("Case Image Enrichment Report")
    report.append("=" * 60)
    report.append(f"Total cases processed: {total}")
    report.append(f"Successfully found images: {success} ({100*success/total:.1f}%)" if total > 0 else "")
    report.append(f"Failed to find images: {failed} ({100*failed/total:.1f}%)" if total > 0 else "")
    report.append("")
    
    if manifest.get("errors"):
        report.append("Cases without images:")
        report.append("-" * 40)
        for err in manifest["errors"][:20]:
            report.append(f"  - {err['name']} ({err['objectID']})")
        if len(manifest["errors"]) > 20:
            report.append(f"  ... and {len(manifest['errors']) - 20} more")
    
    report.append("")
    report.append(f"Manifest saved to: {MANIFEST_FILE}")
    report.append(f"Images saved to: {IMAGES_DIR}")
    
    return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description="Enrich case data with images")
    parser.add_argument("--limit", type=int, default=500, help="Max cases to process from PCPartPicker")
    parser.add_argument("--resume", action="store_true", default=True, help="Resume from existing manifest")
    parser.add_argument("--no-resume", action="store_false", dest="resume", help="Start fresh")
    parser.add_argument("--source", choices=["pcpartpicker", "etl", "both"], default="both",
                       help="Which case source to process")
    args = parser.parse_args()
    
    if not EXA_API_KEY:
        logger.error("EXA_API_KEY environment variable is required")
        logger.error("Set it with: export EXA_API_KEY=your_api_key")
        sys.exit(1)
    
    manifest = load_manifest() if args.resume else {
        "cases": {}, "errors": [], "stats": {"total": 0, "success": 0, "failed": 0}
    }
    
    cases = []
    if args.source in ["pcpartpicker", "both"]:
        cases.extend(load_pcpartpicker_cases(args.limit))
    if args.source in ["etl", "both"]:
        cases.extend(load_etl_cases())
    
    if not cases:
        logger.error("No cases found to process")
        sys.exit(1)
    
    logger.info(f"Processing {len(cases)} cases...")
    manifest = process_cases(cases, manifest, args.resume)
    save_manifest(manifest)
    
    report = generate_report(manifest)
    print(report)
    
    report_file = DATA_DIR / "case_image_report.txt"
    with open(report_file, "w") as f:
        f.write(report)
    logger.info(f"Report saved to {report_file}")


if __name__ == "__main__":
    main()
