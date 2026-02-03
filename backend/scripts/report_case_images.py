#!/usr/bin/env python3
"""
Generate a report of case image enrichment status from the manifest.

Usage:
    python scripts/report_case_images.py [--verbose]
"""

import argparse
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
MANIFEST_FILE = DATA_DIR / "case_image_manifest.json"
REPORT_FILE = DATA_DIR / "case_image_report.txt"


def load_manifest():
    """Load the image manifest."""
    if not MANIFEST_FILE.exists():
        return None
    with open(MANIFEST_FILE, "r") as f:
        return json.load(f)


def generate_report(manifest, verbose=False):
    """Generate a detailed report."""
    if not manifest:
        return "No manifest found. Run enrich_case_images.py first."
    
    cases = manifest.get("cases", {})
    errors = manifest.get("errors", [])
    stats = manifest.get("stats", {})
    
    total = len(cases)
    with_images = sum(1 for c in cases.values() if c.get("image_url"))
    without_images = total - with_images
    
    report = []
    report.append("=" * 70)
    report.append("Case Image Enrichment Report")
    report.append("=" * 70)
    report.append("")
    report.append(f"Total cases in manifest: {total}")
    report.append(f"Cases with images: {with_images} ({100*with_images/total:.1f}%)" if total > 0 else "")
    report.append(f"Cases without images: {without_images} ({100*without_images/total:.1f}%)" if total > 0 else "")
    report.append("")
    
    sources = {}
    for case in cases.values():
        source = case.get("source", "unknown")
        sources[source] = sources.get(source, 0) + 1
    
    report.append("Cases by source:")
    for source, count in sorted(sources.items()):
        report.append(f"  - {source}: {count}")
    report.append("")
    
    if verbose:
        report.append("-" * 70)
        report.append("Cases WITH images:")
        report.append("-" * 70)
        for obj_id, case in sorted(cases.items()):
            if case.get("image_url"):
                report.append(f"  {obj_id}: {case.get('name', 'Unknown')}")
                report.append(f"    Image: {case['image_url']}")
                if case.get("source_url"):
                    report.append(f"    Source: {case['source_url'][:80]}...")
        report.append("")
    
    report.append("-" * 70)
    report.append("Cases WITHOUT images (need manual review):")
    report.append("-" * 70)
    
    missing = [(obj_id, case) for obj_id, case in cases.items() if not case.get("image_url")]
    
    if missing:
        for obj_id, case in sorted(missing):
            report.append(f"  - {case.get('name', obj_id)} ({obj_id})")
        report.append("")
        report.append(f"Total missing: {len(missing)}")
    else:
        report.append("  (none - all cases have images)")
    
    report.append("")
    report.append("-" * 70)
    report.append("File locations:")
    report.append("-" * 70)
    report.append(f"  Manifest: {MANIFEST_FILE}")
    report.append(f"  Images: frontend/public/component-images/cases/")
    report.append("")
    
    if errors:
        report.append("-" * 70)
        report.append("Enrichment errors:")
        report.append("-" * 70)
        for err in errors[:20]:
            report.append(f"  - {err.get('name', err.get('objectID', 'Unknown'))}: {err.get('error', 'Unknown error')}")
        if len(errors) > 20:
            report.append(f"  ... and {len(errors) - 20} more errors")
    
    return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description="Generate case image status report")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show details for cases with images too")
    parser.add_argument("--output", "-o", help="Output file path (default: stdout)")
    args = parser.parse_args()
    
    manifest = load_manifest()
    report = generate_report(manifest, args.verbose)
    
    if args.output:
        with open(args.output, "w") as f:
            f.write(report)
        print(f"Report saved to {args.output}")
    else:
        print(report)
    
    with open(REPORT_FILE, "w") as f:
        f.write(report)
    print(f"\nReport also saved to: {REPORT_FILE}")


if __name__ == "__main__":
    main()
