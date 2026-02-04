#!/usr/bin/env python3
"""
Import Kaggle datasets into Algolia for Spec-Logic.

Processes GPU specs, AMD/Intel CPU specs, and RAM benchmarks from Kaggle.
Filters to recent/relevant components for optimal search experience.
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl.loaders.algolia_loader import AlgoliaLoader
from etl.transformers.normalizer import DataNormalizer
from etl.transformers.compatibility_tagger import CompatibilityTagger

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

KAGGLE_DATA_DIR = Path(__file__).parent.parent / "data" / "kaggle"


def process_gpus(filepath: Path, limit: int = 200) -> list:
    """
    Process GPU specs from Kaggle dataset.
    
    Filters to recent GPUs (2020+) and major brands.
    """
    logger.info(f"Processing GPUs from {filepath}")
    
    df = pd.read_csv(filepath)
    
    # Filter to recent GPUs (2020+) and valid data
    df = df[df['releaseYear'] >= 2020].copy()
    df = df[df['manufacturer'].isin(['NVIDIA', 'AMD', 'Intel'])].copy()
    df = df[df['memSize'].notna()].copy()
    
    # Sort by release year (newest first) and take top entries
    df = df.sort_values('releaseYear', ascending=False).head(limit)
    
    records = []
    for _, row in df.iterrows():
        # Parse TDP from various possible sources or estimate
        tdp = None
        if 'tdp' in row and pd.notna(row.get('tdp')):
            tdp = int(row['tdp'])
        else:
            # Estimate based on memory size and clock
            mem_size = row.get('memSize', 0) or 0
            if mem_size >= 24:
                tdp = 350
            elif mem_size >= 16:
                tdp = 250
            elif mem_size >= 12:
                tdp = 200
            elif mem_size >= 8:
                tdp = 150
            else:
                tdp = 100
        
        # Parse GPU length (estimate if not available)
        length_mm = 300  # Default
        if mem_size >= 24:
            length_mm = 336
        elif mem_size >= 16:
            length_mm = 320
        elif mem_size >= 12:
            length_mm = 300
        else:
            length_mm = 280
        
        # Parse price (estimate based on specs)
        price = None
        if mem_size >= 24:
            price = 1599
        elif mem_size >= 16:
            price = 999
        elif mem_size >= 12:
            price = 599
        elif mem_size >= 8:
            price = 399
        else:
            price = 249
        
        record = {
            'objectID': f"gpu-{row['manufacturer'].lower()}-{row['productName'].lower().replace(' ', '-').replace('/', '-')}",
            'component_type': 'GPU',
            'brand': row['manufacturer'],
            'model': row['productName'],
            'vram_gb': int(row['memSize']) if pd.notna(row['memSize']) else None,
            'memory_type': row.get('memType', 'GDDR6'),
            'memory_bus_width': int(row['memBusWidth']) if pd.notna(row.get('memBusWidth')) else None,
            'gpu_clock_mhz': int(row['gpuClock']) if pd.notna(row.get('gpuClock')) else None,
            'memory_clock_mhz': int(row['memClock']) if pd.notna(row.get('memClock')) else None,
            'cuda_cores': int(row['unifiedShader']) if pd.notna(row.get('unifiedShader')) else None,
            'tdp_watts': tdp,
            'length_mm': length_mm,
            'pcie_version': '4.0' if row.get('releaseYear', 2020) >= 2022 else '3.0',
            'price_usd': price,
            'release_year': int(row['releaseYear']) if pd.notna(row.get('releaseYear')) else None,
            'bus_interface': row.get('bus', 'PCIe 4.0 x16'),
        }
        records.append(record)
    
    logger.info(f"Processed {len(records)} GPU records")
    return records


def process_amd_cpus(filepath: Path, limit: int = 100) -> list:
    """
    Process AMD CPU specs from Kaggle dataset.
    
    Filters to desktop CPUs from recent generations.
    """
    logger.info(f"Processing AMD CPUs from {filepath}")
    
    df = pd.read_csv(filepath)
    
    # Filter to desktop CPUs (exclude mobile/laptop)
    df = df[~df['platform'].str.contains('Laptop|Mobile', case=False, na=False)].copy()
    
    # Filter to recent CPUs (2020+)
    df = df[df['launchDate'].astype(str).str.contains('202[0-9]', na=False)].copy()
    
    # Filter to Ryzen desktop processors
    df = df[df['model'].str.contains('Ryzen', case=False, na=False)].copy()
    
    # Sort by launch date and take top entries
    df = df.head(limit)
    
    records = []
    for _, row in df.iterrows():
        # Parse TDP
        tdp = None
        if pd.notna(row.get('defaultTDP')):
            try:
                tdp = int(float(str(row['defaultTDP']).replace('W', '').strip()))
            except:
                tdp = 105  # Default for desktop
        else:
            tdp = 105
        
        # Parse socket
        socket_raw = row.get('cpuSocket', 'AM5')
        socket = 'AM5'  # Default
        if pd.notna(socket_raw):
            socket_str = str(socket_raw)
            if 'AM5' in socket_str:
                socket = 'AM5'
            elif 'AM4' in socket_str:
                socket = 'AM4'
            elif 'FP' in socket_str:
                socket = 'AM4'  # Mobile chips, map to AM4 for simplicity
        
        # Parse memory type
        mem_type = row.get('sysMemType', 'DDR5')
        if 'DDR5' in str(mem_type):
            mem_type = 'DDR5'
        elif 'DDR4' in str(mem_type):
            mem_type = 'DDR4'
        
        # Estimate price based on core count
        cores = int(row['numCores']) if pd.notna(row.get('numCores')) else 8
        if cores >= 16:
            price = 549
        elif cores >= 12:
            price = 399
        elif cores >= 8:
            price = 299
        elif cores >= 6:
            price = 199
        else:
            price = 149
        
        record = {
            'objectID': f"cpu-amd-{row['model'].lower().replace(' ', '-').replace('™', '').replace('®', '')}",
            'component_type': 'CPU',
            'brand': 'AMD',
            'model': row['model'].replace('™', '').replace('®', ''),
            'socket': socket,
            'cores': cores,
            'threads': int(row['numThreads']) if pd.notna(row.get('numThreads')) else cores * 2,
            'base_clock_ghz': float(row['baseClock']) if pd.notna(row.get('baseClock')) else None,
            'boost_clock_ghz': float(row['maxboostClock']) if pd.notna(row.get('maxboostClock')) else None,
            'tdp_watts': tdp,
            'memory_type': mem_type,
            'l3_cache_mb': int(row['L3Cache']) if pd.notna(row.get('L3Cache')) else None,
            'pcie_version': row.get('PCIeVersion', '4.0'),
            'integrated_graphics': pd.notna(row.get('graphicsModel')) and str(row.get('graphicsModel')) != '',
            'price_usd': price,
            'launch_year': int(str(row['launchDate'])[:4]) if pd.notna(row.get('launchDate')) else None,
        }
        records.append(record)
    
    logger.info(f"Processed {len(records)} AMD CPU records")
    return records


def process_intel_cpus(filepath: Path, limit: int = 100) -> list:
    """
    Process Intel CPU specs from Kaggle dataset.
    
    Filters to recent desktop processors.
    """
    logger.info(f"Processing Intel CPUs from {filepath}")
    
    df = pd.read_csv(filepath)
    
    # Filter to launched products
    df = df[df['status'] == 'Launched'].copy()
    
    # Filter to recent CPUs (2020+)
    df = df[df['releaseDate'].astype(str).str.contains('202[0-9]', na=False)].copy()
    
    # Filter to Core i-series (desktop focused)
    df = df[df['product'].str.contains('Core i[3579]|Core Ultra', case=False, na=False)].copy()
    
    df = df.head(limit)
    
    records = []
    for _, row in df.iterrows():
        # Parse TDP
        tdp = None
        if pd.notna(row.get('TDP')):
            try:
                tdp_str = str(row['TDP']).replace('W', '').strip()
                tdp = int(float(tdp_str))
            except:
                tdp = 125
        else:
            tdp = 125
        
        # Determine socket based on generation
        # - 10th gen (10xxx) = LGA1200
        # - 11th gen (11xxx) = LGA1200
        # - 12th gen (12xxx) = LGA1700
        # - 13th gen (13xxx) = LGA1700
        # - 14th gen (14xxx) = LGA1700
        # - Core Ultra = LGA1851
        product = str(row['product']) if pd.notna(row.get('product')) else ''
        if 'Ultra' in product:
            socket = 'LGA1851'
        elif '-14' in product or ' 14' in product:
            socket = 'LGA1700'
        elif '-13' in product or ' 13' in product:
            socket = 'LGA1700'
        elif '-12' in product or ' 12' in product:
            socket = 'LGA1700'
        elif '-11' in product or ' 11' in product:
            socket = 'LGA1200'
        elif '-10' in product or ' 10' in product:
            socket = 'LGA1200'
        else:
            socket = 'LGA1200'
        
        # Parse cores
        cores = int(row['cores']) if pd.notna(row.get('cores')) else 8
        threads = int(row['threads']) if pd.notna(row.get('threads')) else cores * 2
        
        # Parse clocks
        base_clock = None
        if pd.notna(row.get('baseClock')):
            try:
                base_clock = float(str(row['baseClock']).replace('GHz', '').strip())
            except:
                pass
        
        boost_clock = None
        if pd.notna(row.get('maxTurboClock')):
            try:
                boost_clock = float(str(row['maxTurboClock']).replace('GHz', '').strip())
            except:
                pass
        
        # Estimate price
        if 'i9' in product or 'Ultra 9' in product:
            price = 589
        elif 'i7' in product or 'Ultra 7' in product:
            price = 409
        elif 'i5' in product or 'Ultra 5' in product:
            price = 249
        else:
            price = 149
        
        record = {
            'objectID': f"cpu-intel-{row['product'].lower().replace(' ', '-').replace('®', '').replace('™', '')}",
            'component_type': 'CPU',
            'brand': 'Intel',
            'model': row['product'].replace('®', '').replace('™', ''),
            'socket': socket,
            'cores': cores,
            'threads': threads,
            'base_clock_ghz': base_clock,
            'boost_clock_ghz': boost_clock,
            'tdp_watts': tdp,
            'memory_type': ['DDR4', 'DDR5'] if socket == 'LGA1700' else 'DDR4',
            'integrated_graphics': pd.notna(row.get('integratedG')) and 'N/A' not in str(row.get('integratedG')),
            'price_usd': price,
            'launch_year': int(str(row['releaseDate'])[:4]) if pd.notna(row.get('releaseDate')) else None,
        }
        records.append(record)
    
    logger.info(f"Processed {len(records)} Intel CPU records")
    return records


def process_ram(filepath: Path, ddr4_limit: int = 150, ddr5_limit: int = 50) -> list:
    """
    Process RAM benchmarks from Kaggle dataset.
    
    Imports a balanced mix of DDR4 and DDR5 modules.
    DDR4 is more common for older systems, so we import more of it.
    """
    logger.info(f"Processing RAM from {filepath}")
    
    df = pd.read_csv(filepath)
    
    # Filter to entries with valid data
    df = df[df['memoryName'].notna()].copy()
    df = df[df['readUncached'].notna()].copy()
    df = df[df['gen'].isin(['DDR4', 'DDR5'])].copy()
    
    import re
    
    records = []
    seen_models = set()  # Track unique models to avoid duplicates
    
    # Process DDR4 and DDR5 separately to ensure balance
    for gen, limit in [('DDR4', ddr4_limit), ('DDR5', ddr5_limit)]:
        gen_df = df[df['gen'] == gen].copy()
        
        # Sort by performance within each generation
        gen_df = gen_df.sort_values('readUncached', ascending=False).head(limit * 2)  # Get more to filter duplicates
        
        count = 0
        for _, row in gen_df.iterrows():
            if count >= limit:
                break
                
            name = row['memoryName']
            
            # Parse capacity from name
            capacity_gb = 16  # Default
            if '64GB' in name:
                capacity_gb = 64
            elif '32GB' in name:
                capacity_gb = 32
            elif '16GB' in name:
                capacity_gb = 16
            elif '8GB' in name:
                capacity_gb = 8
            
            # Parse speed from name (e.g., F5-6400 = 6400 MHz, 3200 = 3200 MHz)
            speed_mhz = 3200 if gen == 'DDR4' else 5600  # Default by gen
            speed_match = re.search(r'(\d{4,5})', name)
            if speed_match:
                parsed_speed = int(speed_match.group(1))
                # Validate the speed is reasonable
                if gen == 'DDR4' and 2133 <= parsed_speed <= 5000:
                    speed_mhz = parsed_speed
                elif gen == 'DDR5' and 4800 <= parsed_speed <= 8000:
                    speed_mhz = parsed_speed
            
            # Parse brand
            brand = 'Generic'
            name_lower = name.lower()
            if 'kingston' in name_lower:
                brand = 'Kingston'
            elif 'g skill' in name_lower or 'g.skill' in name_lower or 'gskill' in name_lower:
                brand = 'G.Skill'
            elif 'corsair' in name_lower:
                brand = 'Corsair'
            elif 'crucial' in name_lower:
                brand = 'Crucial'
            elif 'samsung' in name_lower:
                brand = 'Samsung'
            elif 'teamgroup' in name_lower or 'team group' in name_lower:
                brand = 'TeamGroup'
            elif 'patriot' in name_lower:
                brand = 'Patriot Memory (PDP Systems)'
            elif 'a-data' in name_lower or 'adata' in name_lower:
                brand = 'ADATA'
            elif 'v-color' in name_lower:
                brand = 'V-Color Technology Inc.'
            elif 'apacer' in name_lower:
                brand = 'Apacer Technology'
            elif 'mushkin' in name_lower:
                brand = 'Mushkin'
            elif 'pny' in name_lower:
                brand = 'PNY'
            
            # Create unique key to avoid duplicates
            unique_key = f"{brand}-{gen}-{speed_mhz}-{capacity_gb}"
            if unique_key in seen_models:
                continue
            seen_models.add(unique_key)
            
            # Price estimation
            price = row.get('price')
            if pd.isna(price) or price == 0:
                if gen == 'DDR5':
                    price = 89 + (capacity_gb - 16) * 3 + (speed_mhz - 5600) * 0.02
                else:
                    price = 49 + (capacity_gb - 16) * 2 + (speed_mhz - 3200) * 0.01
            
            record = {
                'objectID': f"ram-{brand.lower().replace(' ', '-').replace('.', '')}-{gen.lower()}-{speed_mhz}-{capacity_gb}gb-{len(records)}",
                'component_type': 'RAM',
                'brand': brand,
                'model': name[:80],  # Truncate long names
                'memory_type': gen,
                'capacity_gb': capacity_gb,
                'speed_mhz': speed_mhz,
                'modules': 1,
                'latency': int(row['latency']) if pd.notna(row.get('latency')) else None,
                'read_speed': float(row['readUncached']) if pd.notna(row.get('readUncached')) else None,
                'write_speed': float(row['write']) if pd.notna(row.get('write')) else None,
                'price_usd': float(price) if pd.notna(price) else 79,
            }
            records.append(record)
            count += 1
        
        logger.info(f"  - Processed {count} {gen} RAM records")
    
    logger.info(f"Processed {len(records)} total RAM records")
    return records


def add_compatibility_tags(records: list) -> list:
    """Add compatibility tags to all records."""
    tagger = CompatibilityTagger()
    
    for record in records:
        tags = tagger.generate_tags(record)
        record['compatibility_tags'] = tags
        
        # Add performance tier
        price = record.get('price_usd', 0) or 0
        if price >= 500:
            record['performance_tier'] = 'enthusiast'
        elif price >= 300:
            record['performance_tier'] = 'high'
        elif price >= 150:
            record['performance_tier'] = 'mid'
        else:
            record['performance_tier'] = 'budget'
    
    return records


def main():
    """Main import function."""
    logger.info("=" * 60)
    logger.info("KAGGLE DATA IMPORT FOR SPEC-LOGIC")
    logger.info("=" * 60)
    
    all_records = []
    
    # Process GPUs
    gpu_file = KAGGLE_DATA_DIR / "gpu_specs_v7.csv"
    if gpu_file.exists():
        gpu_records = process_gpus(gpu_file, limit=150)
        all_records.extend(gpu_records)
    
    # Process AMD CPUs
    amd_file = KAGGLE_DATA_DIR / "AMDfullspecs_adjusted.csv"
    if amd_file.exists():
        amd_records = process_amd_cpus(amd_file, limit=80)
        all_records.extend(amd_records)
    
    # Process Intel CPUs
    intel_file = KAGGLE_DATA_DIR / "INTELpartialspecs_adjusted.csv"
    if intel_file.exists():
        intel_records = process_intel_cpus(intel_file, limit=80)
        all_records.extend(intel_records)
    
    # Process RAM (balanced mix of DDR4 and DDR5)
    ram_file = KAGGLE_DATA_DIR / "RAM_Benchmarks_megalist.csv"
    if ram_file.exists():
        ram_records = process_ram(ram_file, ddr4_limit=150, ddr5_limit=50)
        all_records.extend(ram_records)
    
    # Add compatibility tags
    all_records = add_compatibility_tags(all_records)
    
    logger.info(f"Total records to upload: {len(all_records)}")
    
    # Upload to Algolia
    loader = AlgoliaLoader()
    
    # Configure index
    loader.create_index()
    
    # Upload records (clear existing first)
    result = loader.upload_records(all_records, clear_existing=True)
    
    logger.info("=" * 60)
    logger.info("IMPORT COMPLETE")
    logger.info(f"Uploaded: {result['uploaded']}")
    logger.info(f"Errors: {result['errors']}")
    logger.info("=" * 60)
    
    # Verify
    stats = loader.get_index_stats()
    logger.info(f"Index now contains: {stats.get('nb_hits', 0)} records")
    
    # Test search
    test_results = loader.search("RTX 4090")
    logger.info(f"Test search 'RTX 4090': {len(test_results['hits'])} results")


if __name__ == "__main__":
    main()
