#!/usr/bin/env python3
"""
Import PCPartPicker data for motherboards, PSUs, cases, and coolers.
"""

import csv
import json
import os
import sys
import re
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from algoliasearch.search.client import SearchClientSync

# Configuration
ALGOLIA_APP_ID = os.getenv("ALGOLIA_APP_ID")
ALGOLIA_ADMIN_KEY = os.getenv("ALGOLIA_ADMIN_KEY")
INDEX_NAME = "prod_components"
DATA_DIR = Path(__file__).parent.parent / "data" / "pcpartpicker"
MANIFEST_FILE = Path(__file__).parent.parent / "data" / "case_image_manifest.json"


def load_image_manifest():
    """Load case image manifest if available."""
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, "r") as f:
            manifest = json.load(f)
            return manifest.get("cases", {})
    return {}

def parse_price(price_str):
    """Parse price string to float."""
    if not price_str or price_str == "":
        return None
    try:
        return float(str(price_str).replace("$", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return None

def parse_int(value):
    """Parse integer value."""
    if not value or value == "":
        return None
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return None

def parse_float(value):
    """Parse float value."""
    if not value or value == "":
        return None
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return None

def extract_brand(name):
    """Extract brand from product name."""
    if not name:
        return "Unknown"
    # Common brands
    brands = [
        "ASUS", "Asus", "MSI", "Gigabyte", "GIGABYTE", "ASRock", "EVGA", 
        "Corsair", "NZXT", "Cooler Master", "be quiet!", "Fractal Design",
        "Lian Li", "Phanteks", "Thermaltake", "Seasonic", "Super Flower",
        "Noctua", "Arctic", "Deepcool", "DEEPCOOL", "Thermalright", "Scythe",
        "ID-COOLING", "ARCTIC", "Antec", "BitFenix", "Silverstone", "SilverStone",
        "Razer", "Intel", "AMD", "NVIDIA", "Sapphire", "XFX", "PowerColor",
        "Zotac", "ZOTAC", "PNY", "Palit", "Gainward", "Inno3D", "Colorful",
        "FSP", "Montech", "Rosewill", "Cougar", "GameMax", "Aerocool",
        "Biostar", "BIOSTAR", "ECS", "AORUS", "ROG", "TUF", "PRIME", "MAG",
        "ADATA", "Kingston", "G.Skill", "Crucial", "Samsung", "Western Digital",
        "Seagate", "Toshiba", "Patriot", "Team", "OLOy", "TEAMGROUP",
    ]
    
    name_upper = name.upper()
    for brand in brands:
        if name_upper.startswith(brand.upper()):
            return brand
        if brand.upper() in name_upper:
            return brand
    
    # Fallback: first word
    return name.split()[0] if name else "Unknown"

def get_socket_family(socket):
    """Determine socket family for compatibility."""
    if not socket:
        return None
    socket_upper = str(socket).upper()
    
    if "AM5" in socket_upper:
        return "AM5"
    elif "AM4" in socket_upper:
        return "AM4"
    elif "LGA1700" in socket_upper or "1700" in socket_upper:
        return "LGA1700"
    elif "LGA1200" in socket_upper or "1200" in socket_upper:
        return "LGA1200"
    elif "LGA1151" in socket_upper or "1151" in socket_upper:
        return "LGA1151"
    elif "LGA1851" in socket_upper or "1851" in socket_upper:
        return "LGA1851"
    elif "TR" in socket_upper or "THREADRIPPER" in socket_upper:
        return "sTRX4"
    elif "2066" in socket_upper:
        return "LGA2066"
    
    return socket

def get_memory_type(max_memory, name):
    """Infer memory type from motherboard details."""
    name_upper = str(name).upper() if name else ""
    
    if "DDR5" in name_upper:
        return "DDR5"
    elif "DDR4" in name_upper:
        return "DDR4"
    
    # Infer from socket (newer sockets tend to be DDR5)
    if "AM5" in name_upper or "LGA1700" in name_upper or "Z790" in name_upper or "B650" in name_upper:
        return "DDR5"
    
    return "DDR4"  # Default

def process_motherboards(file_path):
    """Process motherboard CSV file."""
    records = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 records for now
                break
                
            name = row.get('name', '').strip()
            if not name:
                continue
                
            price = parse_price(row.get('price'))
            if not price or price <= 0:
                continue
            
            socket = row.get('socket', '').strip()
            form_factor = row.get('form_factor', '').strip()
            max_memory = parse_int(row.get('max_memory'))
            memory_slots = parse_int(row.get('memory_slots'))
            
            brand = extract_brand(name)
            model = name.replace(brand, '').strip()
            
            record = {
                "objectID": f"mb_{i}",
                "component_type": "Motherboard",
                "brand": brand,
                "model": model,
                "name": name,
                "price_usd": price,
                "socket": get_socket_family(socket),
                "form_factor": form_factor or "ATX",
                "max_memory_gb": max_memory,
                "memory_slots": memory_slots or 4,
                "memory_type": get_memory_type(max_memory, name),
                "color": row.get('color', '').strip() or None,
                # Compatibility tags
                "compatibility_tags": [
                    get_socket_family(socket) or "unknown",
                    form_factor.lower() if form_factor else "atx",
                    get_memory_type(max_memory, name).lower(),
                ],
            }
            records.append(record)
    
    return records

def process_psus(file_path):
    """Process power supply CSV file."""
    records = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 records
                break
                
            name = row.get('name', '').strip()
            if not name:
                continue
                
            price = parse_price(row.get('price'))
            if not price or price <= 0:
                continue
            
            wattage = parse_int(row.get('wattage'))
            if not wattage:
                continue
            
            efficiency = row.get('efficiency', '').strip()
            modular = row.get('modular', '').strip()
            psu_type = row.get('type', '').strip()
            
            brand = extract_brand(name)
            model = name.replace(brand, '').strip()
            
            # Map efficiency rating
            efficiency_rating = "80+"
            if efficiency:
                eff_lower = efficiency.lower()
                if "titanium" in eff_lower:
                    efficiency_rating = "80+ Titanium"
                elif "platinum" in eff_lower:
                    efficiency_rating = "80+ Platinum"
                elif "gold" in eff_lower:
                    efficiency_rating = "80+ Gold"
                elif "silver" in eff_lower:
                    efficiency_rating = "80+ Silver"
                elif "bronze" in eff_lower:
                    efficiency_rating = "80+ Bronze"
            
            record = {
                "objectID": f"psu_{i}",
                "component_type": "PSU",
                "brand": brand,
                "model": model,
                "name": name,
                "price_usd": price,
                "wattage": wattage,
                "efficiency_rating": efficiency_rating,
                "modular": modular or "Non-Modular",
                "form_factor": psu_type or "ATX",
                "color": row.get('color', '').strip() or None,
                # Compatibility tags
                "compatibility_tags": [
                    f"{wattage}w",
                    efficiency_rating.lower().replace(" ", "-"),
                    (psu_type or "atx").lower(),
                ],
            }
            records.append(record)
    
    return records

def process_cases(file_path, image_manifest=None):
    """Process case CSV file."""
    records = []
    image_manifest = image_manifest or {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 records
                break
                
            name = row.get('name', '').strip()
            if not name:
                continue
                
            price = parse_price(row.get('price'))
            if not price or price <= 0:
                continue
            
            case_type = row.get('type', '').strip()
            side_panel = row.get('side_panel', '').strip()
            color = row.get('color', '').strip()
            
            brand = extract_brand(name)
            model = name.replace(brand, '').strip()
            
            # Determine form factor support based on case type
            form_factor_support = ["ATX", "Micro-ATX", "Mini-ITX"]
            if case_type:
                type_lower = case_type.lower()
                if "full" in type_lower:
                    form_factor_support = ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"]
                elif "mid" in type_lower:
                    form_factor_support = ["ATX", "Micro-ATX", "Mini-ITX"]
                elif "microatx" in type_lower or "micro atx" in type_lower or "micro-atx" in type_lower:
                    form_factor_support = ["Micro-ATX", "Mini-ITX"]
                elif "mini" in type_lower or "itx" in type_lower:
                    form_factor_support = ["Mini-ITX"]
                elif "micro" in type_lower:
                    form_factor_support = ["Micro-ATX", "Mini-ITX"]
            
            # Estimate GPU clearance based on case type
            max_gpu_length_mm = 350  # Default
            if case_type:
                type_lower = case_type.lower()
                if "full" in type_lower:
                    max_gpu_length_mm = 400
                elif "mid" in type_lower:
                    max_gpu_length_mm = 350
                elif "mini" in type_lower or "itx" in type_lower:
                    max_gpu_length_mm = 280
                elif "micro" in type_lower:
                    max_gpu_length_mm = 320
            
            object_id = f"case_{i}"
            
            image_data = image_manifest.get(object_id, {})
            image_url = image_data.get("image_url")
            
            record = {
                "objectID": object_id,
                "component_type": "Case",
                "brand": brand,
                "model": model,
                "name": name,
                "price_usd": price,
                "case_type": case_type or "ATX Mid Tower",
                "form_factor_support": form_factor_support,
                "max_gpu_length_mm": max_gpu_length_mm,
                "max_cooler_height_mm": 165,  # Common default
                "side_panel": side_panel or "Tempered Glass",
                "color": color or None,
                "compatibility_tags": [
                    (case_type or "mid-tower").lower().replace(" ", "-"),
                    *[ff.lower() for ff in form_factor_support],
                ],
            }
            
            if image_url:
                record["image_url"] = image_url
            
            records.append(record)
    
    return records

def process_coolers(file_path):
    """Process CPU cooler CSV file."""
    records = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 records
                break
                
            name = row.get('name', '').strip()
            if not name:
                continue
                
            price = parse_price(row.get('price'))
            if not price or price <= 0:
                continue
            
            rpm = row.get('rpm', '').strip()
            noise_level = row.get('noise_level', '').strip()
            size = row.get('size', '').strip()
            color = row.get('color', '').strip()
            
            brand = extract_brand(name)
            model = name.replace(brand, '').strip()
            
            # Parse RPM
            max_rpm = parse_int(rpm.split('-')[-1] if rpm and '-' in rpm else rpm)
            
            # Parse noise level
            noise_db = parse_float(noise_level.replace('dB', '').strip() if noise_level else None)
            
            # Determine cooler type
            cooler_type = "Air"
            name_lower = name.lower()
            if "aio" in name_lower or "liquid" in name_lower or "water" in name_lower:
                cooler_type = "AIO"
            elif any(size_str in name_lower for size_str in ["240mm", "280mm", "360mm", "420mm"]):
                cooler_type = "AIO"
            
            # Estimate height based on type
            height_mm = 160  # Default for tower coolers
            if cooler_type == "AIO":
                height_mm = 55  # Radiator+pump height
            elif "low profile" in name_lower or "lp" in name_lower:
                height_mm = 45
            
            # Default socket support (most modern coolers support these)
            socket_support = ["AM4", "AM5", "LGA1700", "LGA1200", "LGA1151"]
            
            record = {
                "objectID": f"cooler_{i}",
                "component_type": "Cooler",
                "brand": brand,
                "model": model,
                "name": name,
                "price_usd": price,
                "cooler_type": cooler_type,
                "height_mm": height_mm,
                "max_rpm": max_rpm,
                "noise_db": noise_db,
                "socket_support": socket_support,
                "color": color or None,
                # Compatibility tags
                "compatibility_tags": [
                    cooler_type.lower(),
                    *[s.lower() for s in socket_support],
                ],
            }
            records.append(record)
    
    return records


def process_storage(file_path):
    """Process storage (SSD/HDD) CSV file."""
    records = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 500:  # Limit to 500 records
                break
                
            name = row.get('name', '').strip()
            if not name:
                continue
                
            price = parse_price(row.get('price'))
            if not price or price <= 0:
                continue
            
            storage_type = row.get('type', '').strip()
            capacity = parse_int(row.get('capacity'))
            interface = row.get('interface', '').strip()
            form_factor = row.get('form_factor', '').strip()
            cache_mb = parse_int(row.get('cache_mb'))
            rpm = parse_int(row.get('rpm'))
            read_speed = parse_int(row.get('read_speed'))
            write_speed = parse_int(row.get('write_speed'))
            
            brand = extract_brand(name)
            model = name.replace(brand, '').strip()
            
            # Determine performance tier
            performance_tier = "budget"
            if storage_type == "SSD":
                if "PCIe 5.0" in interface:
                    performance_tier = "enthusiast"
                elif "PCIe 4.0" in interface and read_speed and read_speed >= 7000:
                    performance_tier = "high-end"
                elif "PCIe 4.0" in interface:
                    performance_tier = "mid-range"
                elif "PCIe 3.0" in interface:
                    performance_tier = "mid-range"
                else:
                    performance_tier = "budget"
            else:  # HDD
                if capacity and capacity >= 10000:
                    performance_tier = "high-capacity"
                elif rpm and rpm >= 7200:
                    performance_tier = "performance"
                else:
                    performance_tier = "budget"
            
            # Format capacity for display
            capacity_display = ""
            if capacity:
                if capacity >= 1000:
                    capacity_display = f"{capacity // 1000}TB"
                else:
                    capacity_display = f"{capacity}GB"
            
            record = {
                "objectID": f"storage_{i}",
                "component_type": "Storage",
                "brand": brand,
                "model": model,
                "name": name,
                "price_usd": price,
                "storage_type": storage_type,
                "capacity_gb": capacity,
                "capacity_display": capacity_display,
                "interface": interface,
                "form_factor": form_factor,
                "cache_mb": cache_mb,
                "rpm": rpm,
                "read_speed_mbps": read_speed,
                "write_speed_mbps": write_speed,
                "performance_tier": performance_tier,
                # Compatibility tags
                "compatibility_tags": [
                    storage_type.lower() if storage_type else "ssd",
                    interface.lower().replace(" ", "-") if interface else "sata",
                    form_factor.lower() if form_factor else "2.5",
                    performance_tier,
                ],
            }
            records.append(record)
    
    return records

def main():
    print("=" * 60)
    print("PCPartPicker Data Import")
    print("=" * 60)
    
    if not ALGOLIA_APP_ID or not ALGOLIA_ADMIN_KEY:
        print("Error: ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY environment variables are required.")
        sys.exit(1)

    # Initialize Algolia client
    client = SearchClientSync(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY)
    
    image_manifest = load_image_manifest()
    if image_manifest:
        print(f"\nLoaded image manifest with {len(image_manifest)} entries")
    
    all_records = []
    
    # Process motherboards
    mb_file = DATA_DIR / "motherboard.csv"
    if mb_file.exists():
        print(f"\nProcessing motherboards from {mb_file}...")
        motherboards = process_motherboards(mb_file)
        print(f"  Processed {len(motherboards)} motherboards")
        all_records.extend(motherboards)
    
    # Process PSUs
    psu_file = DATA_DIR / "power-supply.csv"
    if psu_file.exists():
        print(f"\nProcessing PSUs from {psu_file}...")
        psus = process_psus(psu_file)
        print(f"  Processed {len(psus)} PSUs")
        all_records.extend(psus)
    
    # Process cases
    case_file = DATA_DIR / "case.csv"
    if case_file.exists():
        print(f"\nProcessing cases from {case_file}...")
        cases = process_cases(case_file, image_manifest)
        cases_with_images = sum(1 for c in cases if c.get("image_url"))
        print(f"  Processed {len(cases)} cases ({cases_with_images} with images)")
        all_records.extend(cases)
    
    # Process coolers
    cooler_file = DATA_DIR / "cpu-cooler.csv"
    if cooler_file.exists():
        print(f"\nProcessing coolers from {cooler_file}...")
        coolers = process_coolers(cooler_file)
        print(f"  Processed {len(coolers)} coolers")
        all_records.extend(coolers)
    
    # Process storage (SSDs and HDDs)
    storage_file = DATA_DIR / "storage.csv"
    if storage_file.exists():
        print(f"\nProcessing storage from {storage_file}...")
        storage = process_storage(storage_file)
        print(f"  Processed {len(storage)} storage devices")
        all_records.extend(storage)
    
    print(f"\n{'=' * 60}")
    print(f"Total records to index: {len(all_records)}")
    print(f"{'=' * 60}")
    
    if not all_records:
        print("No records to index!")
        return
    
    # Upload to Algolia in batches
    print("\nUploading to Algolia...")
    batch_size = 1000
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i + batch_size]
        client.save_objects(
            index_name=INDEX_NAME,
            objects=batch,
        )
        print(f"  Uploaded batch {i // batch_size + 1} ({len(batch)} records)")
    
    print("\n✅ Import complete!")
    
    # Verify
    print("\nVerifying index contents...")
    results = client.search_single_index(
        index_name=INDEX_NAME,
        search_params={
            "query": "",
            "facets": ["component_type"],
            "hitsPerPage": 0
        }
    )
    
    print("\nComponent types in index:")
    facets = results.facets.get("component_type", {}) if results.facets else {}
    for component_type, count in sorted(facets.items()):
        print(f"  {component_type}: {count}")
    print(f"\nTotal records: {results.nb_hits}")

if __name__ == "__main__":
    main()
