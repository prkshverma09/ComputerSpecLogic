"""
Compatibility Tagger for Spec-Logic ETL Pipeline

Generates compatibility tags for components based on their specifications.
These tags are used for faceted filtering and compatibility checking.
"""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)


class CompatibilityTagger:
    """
    Generates compatibility tags for PC components.
    
    Tags are used to:
    - Enable faceted filtering in Algolia
    - Support compatibility checking logic
    - Power the AI agent's filtering capabilities
    """
    
    # TDP category thresholds
    TDP_CATEGORIES = {
        "low-tdp": (0, 65),
        "mid-tdp": (66, 125),
        "high-tdp": (126, 200),
        "extreme-tdp": (201, float("inf")),
    }
    
    # VRAM tier thresholds (GB)
    VRAM_TIERS = {
        "vram-4gb": (0, 4),
        "vram-8gb": (5, 8),
        "vram-12gb": (9, 12),
        "vram-16gb": (13, 16),
        "vram-24gb": (17, 24),
        "vram-32gb-plus": (25, float("inf")),
    }
    
    # GPU length categories (mm)
    GPU_LENGTH_CATEGORIES = {
        "compact-gpu": (0, 250),
        "standard-gpu": (251, 310),
        "long-gpu": (311, 350),
        "extra-long-gpu": (351, float("inf")),
    }
    
    # Cooler height categories (mm)
    COOLER_HEIGHT_CATEGORIES = {
        "low-profile": (0, 70),
        "mid-height": (71, 130),
        "tower-cooler": (131, 165),
        "tall-tower": (166, float("inf")),
    }
    
    # Case clearance categories
    CASE_GPU_CLEARANCE = {
        "compact-clearance": (0, 280),
        "standard-clearance": (281, 330),
        "extended-clearance": (331, 380),
        "full-clearance": (381, float("inf")),
    }
    
    # PSU wattage tiers
    PSU_WATTAGE_TIERS = {
        "psu-450w": (0, 500),
        "psu-550w": (501, 600),
        "psu-650w": (601, 700),
        "psu-750w": (701, 800),
        "psu-850w": (801, 900),
        "psu-1000w": (901, 1100),
        "psu-1200w-plus": (1101, float("inf")),
    }
    
    def generate_tags(self, component: Dict[str, Any]) -> List[str]:
        """
        Generate compatibility tags for a component.
        
        Args:
            component: Dictionary with component data
            
        Returns:
            List of compatibility tag strings
        """
        component_type = component.get("component_type", "").upper()
        
        tag_generators = {
            "CPU": self._generate_cpu_tags,
            "GPU": self._generate_gpu_tags,
            "MOTHERBOARD": self._generate_motherboard_tags,
            "RAM": self._generate_ram_tags,
            "PSU": self._generate_psu_tags,
            "CASE": self._generate_case_tags,
            "COOLER": self._generate_cooler_tags,
        }
        
        generator = tag_generators.get(component_type)
        if generator:
            return generator(component)
            
        logger.warning(f"Unknown component type: {component_type}")
        return []
    
    def _generate_cpu_tags(self, cpu: Dict[str, Any]) -> List[str]:
        """Generate tags for CPU."""
        tags = []
        
        # Socket tag
        socket = cpu.get("socket")
        if socket:
            tags.append(socket.lower())
            
        # Memory type support
        memory_types = cpu.get("memory_type", [])
        if isinstance(memory_types, str):
            memory_types = [memory_types]
        for mem_type in memory_types:
            if mem_type:
                tags.append(mem_type.lower())
                
        # PCIe version
        pcie = cpu.get("pcie_version")
        if pcie:
            tags.append(f"pcie{pcie}".lower().replace(".", ""))
            
        # TDP category
        tdp = cpu.get("tdp_watts") or cpu.get("max_tdp_watts")
        if tdp:
            tags.append(self._get_tdp_category(tdp))
            
        # Integrated graphics
        if cpu.get("integrated_graphics"):
            tags.append("igpu")
        else:
            tags.append("no-igpu")
            
        # Core count category
        cores = cpu.get("cores")
        if cores:
            if cores <= 4:
                tags.append("quad-core")
            elif cores <= 8:
                tags.append("octa-core")
            elif cores <= 16:
                tags.append("high-core-count")
            else:
                tags.append("extreme-core-count")
                
        # Performance tier
        tier = cpu.get("performance_tier")
        if tier:
            tags.append(tier)
            
        return list(set(tags))  # Remove duplicates
    
    def _generate_gpu_tags(self, gpu: Dict[str, Any]) -> List[str]:
        """Generate tags for GPU."""
        tags = []
        
        # TDP category
        tdp = gpu.get("tdp_watts")
        if tdp:
            tags.append(self._get_tdp_category(tdp))
            
            # High-power warning tag
            if tdp >= 300:
                tags.append("high-power-gpu")
            if tdp >= 400:
                tags.append("extreme-power-gpu")
                
        # VRAM tier
        vram = gpu.get("vram_gb")
        if vram:
            tags.append(self._get_vram_tier(vram))
            
        # Length category
        length = gpu.get("length_mm")
        if length:
            tags.append(self._get_gpu_length_category(length))
            
        # PCIe version
        pcie = gpu.get("pcie_version")
        if pcie:
            tags.append(f"pcie{pcie}".lower().replace(".", ""))
            
        # Memory type
        mem_type = gpu.get("memory_type")
        if mem_type:
            tags.append(mem_type.lower())
            
        # Brand-specific tags
        brand = gpu.get("brand", "").lower()
        model = gpu.get("model", "").lower()
        
        if "nvidia" in brand or "geforce" in model:
            tags.append("nvidia")
            if "rtx" in model:
                tags.append("rtx")
                tags.append("ray-tracing")
            if "gtx" in model:
                tags.append("gtx")
        elif "amd" in brand or "radeon" in model:
            tags.append("amd")
            if "rx" in model:
                tags.append("rdna")
                
        # Performance tier
        tier = gpu.get("performance_tier")
        if tier:
            tags.append(tier)
            
        return list(set(tags))
    
    def _generate_motherboard_tags(self, mobo: Dict[str, Any]) -> List[str]:
        """Generate tags for motherboard."""
        tags = []
        
        # Socket tag
        socket = mobo.get("socket")
        if socket:
            tags.append(socket.lower())
            
        # Memory type support
        memory_types = mobo.get("memory_type", [])
        if isinstance(memory_types, str):
            memory_types = [memory_types]
        for mem_type in memory_types:
            if mem_type:
                tags.append(mem_type.lower())
                
        # Form factor
        form_factor = mobo.get("form_factor")
        if form_factor:
            tags.append(form_factor.lower().replace(" ", "-"))
            
        # Chipset
        chipset = mobo.get("chipset")
        if chipset:
            tags.append(chipset.lower())
            
        # WiFi support
        if mobo.get("wifi"):
            tags.append("wifi")
            
        # M.2 slots
        m2_slots = mobo.get("m2_slots", 0)
        if m2_slots >= 4:
            tags.append("many-m2")
        elif m2_slots >= 2:
            tags.append("multi-m2")
            
        # Memory slots
        mem_slots = mobo.get("memory_slots", 0)
        if mem_slots >= 4:
            tags.append("4-dimm")
        else:
            tags.append("2-dimm")
            
        # Performance tier
        tier = mobo.get("performance_tier")
        if tier:
            tags.append(tier)
            
        return list(set(tags))
    
    def _generate_ram_tags(self, ram: Dict[str, Any]) -> List[str]:
        """Generate tags for RAM."""
        tags = []
        
        # Memory type
        mem_type = ram.get("memory_type")
        if mem_type:
            tags.append(mem_type.lower())
            
        # Speed tier
        speed = ram.get("speed_mhz")
        if speed:
            if mem_type and "ddr5" in mem_type.lower():
                if speed >= 6400:
                    tags.append("high-speed-ddr5")
                elif speed >= 5600:
                    tags.append("mid-speed-ddr5")
                else:
                    tags.append("standard-ddr5")
            elif mem_type and "ddr4" in mem_type.lower():
                if speed >= 3600:
                    tags.append("high-speed-ddr4")
                elif speed >= 3200:
                    tags.append("mid-speed-ddr4")
                else:
                    tags.append("standard-ddr4")
                    
        # Capacity
        capacity = ram.get("capacity_gb", 0)
        modules = ram.get("modules", 1)
        total_capacity = capacity * modules if capacity else 0
        
        if total_capacity >= 64:
            tags.append("64gb-plus")
        elif total_capacity >= 32:
            tags.append("32gb")
        elif total_capacity >= 16:
            tags.append("16gb")
        else:
            tags.append("8gb-or-less")
            
        # Kit configuration
        if modules == 2:
            tags.append("dual-channel")
        elif modules == 4:
            tags.append("quad-channel")
            
        # RGB
        if ram.get("rgb"):
            tags.append("rgb")
            
        # CAS latency tier
        cas = ram.get("cas_latency")
        if cas:
            if cas <= 16:
                tags.append("low-latency")
            elif cas <= 22:
                tags.append("mid-latency")
            else:
                tags.append("high-latency")
                
        return list(set(tags))
    
    def _generate_psu_tags(self, psu: Dict[str, Any]) -> List[str]:
        """Generate tags for PSU."""
        tags = []
        
        # Wattage tier
        wattage = psu.get("wattage")
        if wattage:
            tags.append(self._get_psu_wattage_tier(wattage))
            
        # Efficiency rating
        efficiency = psu.get("efficiency_rating", "")
        if efficiency:
            eff_lower = efficiency.lower()
            if "titanium" in eff_lower:
                tags.append("80plus-titanium")
            elif "platinum" in eff_lower:
                tags.append("80plus-platinum")
            elif "gold" in eff_lower:
                tags.append("80plus-gold")
            elif "silver" in eff_lower:
                tags.append("80plus-silver")
            elif "bronze" in eff_lower:
                tags.append("80plus-bronze")
            elif "80" in eff_lower or "plus" in eff_lower:
                tags.append("80plus")
                
        # Modularity
        modular = psu.get("modular", "")
        if modular:
            mod_lower = modular.lower()
            if "full" in mod_lower:
                tags.append("full-modular")
            elif "semi" in mod_lower:
                tags.append("semi-modular")
            else:
                tags.append("non-modular")
                
        # Form factor
        form_factor = psu.get("form_factor")
        if form_factor:
            tags.append(form_factor.lower())
            
        return list(set(tags))
    
    def _generate_case_tags(self, case: Dict[str, Any]) -> List[str]:
        """Generate tags for case."""
        tags = []
        
        # Form factor support
        form_factors = case.get("form_factor_support", [])
        if isinstance(form_factors, str):
            form_factors = [form_factors]
        for ff in form_factors:
            if ff:
                tags.append(f"supports-{ff.lower().replace(' ', '-')}")
                
        # GPU clearance
        gpu_clearance = case.get("max_gpu_length_mm")
        if gpu_clearance:
            tags.append(self._get_case_gpu_clearance(gpu_clearance))
            
        # Cooler clearance
        cooler_clearance = case.get("max_cooler_height_mm")
        if cooler_clearance:
            if cooler_clearance >= 170:
                tags.append("tall-cooler-support")
            elif cooler_clearance >= 155:
                tags.append("tower-cooler-support")
            elif cooler_clearance >= 120:
                tags.append("mid-cooler-support")
            else:
                tags.append("low-profile-only")
                
        # Radiator support
        radiators = case.get("radiator_support", [])
        if isinstance(radiators, str):
            radiators = [radiators]
        for rad in radiators:
            if rad:
                tags.append(f"rad-{rad.lower()}")
                
        # Drive bays
        bays_35 = case.get("drive_bays_35", 0)
        bays_25 = case.get("drive_bays_25", 0)
        if bays_35 >= 4 or bays_25 >= 4:
            tags.append("many-drive-bays")
            
        return list(set(tags))
    
    def _generate_cooler_tags(self, cooler: Dict[str, Any]) -> List[str]:
        """Generate tags for CPU cooler."""
        tags = []
        
        # Socket support
        sockets = cooler.get("socket_support", [])
        if isinstance(sockets, str):
            sockets = [sockets]
        for socket in sockets:
            if socket:
                tags.append(f"supports-{socket.lower()}")
                
        # Cooler type
        cooler_type = cooler.get("cooler_type", "")
        if cooler_type:
            type_lower = cooler_type.lower()
            if "aio" in type_lower or "liquid" in type_lower or "water" in type_lower:
                tags.append("aio")
                tags.append("liquid-cooling")
            else:
                tags.append("air-cooling")
                
        # Height category
        height = cooler.get("height_mm")
        if height:
            tags.append(self._get_cooler_height_category(height))
            
        # Radiator size (for AIOs)
        rad_size = cooler.get("radiator_size_mm")
        if rad_size:
            tags.append(f"{rad_size}mm-rad")
            
        # TDP rating
        tdp_rating = cooler.get("tdp_rating")
        if tdp_rating:
            if tdp_rating >= 250:
                tags.append("high-tdp-cooling")
            elif tdp_rating >= 150:
                tags.append("mid-tdp-cooling")
            else:
                tags.append("low-tdp-cooling")
                
        # RGB
        if cooler.get("rgb"):
            tags.append("rgb")
            
        return list(set(tags))
    
    def _get_tdp_category(self, tdp: int) -> str:
        """Get TDP category tag."""
        for category, (min_val, max_val) in self.TDP_CATEGORIES.items():
            if min_val <= tdp <= max_val:
                return category
        return "extreme-tdp"
    
    def _get_vram_tier(self, vram_gb: int) -> str:
        """Get VRAM tier tag."""
        for tier, (min_val, max_val) in self.VRAM_TIERS.items():
            if min_val <= vram_gb <= max_val:
                return tier
        return "vram-32gb-plus"
    
    def _get_gpu_length_category(self, length_mm: int) -> str:
        """Get GPU length category tag."""
        for category, (min_val, max_val) in self.GPU_LENGTH_CATEGORIES.items():
            if min_val <= length_mm <= max_val:
                return category
        return "extra-long-gpu"
    
    def _get_cooler_height_category(self, height_mm: int) -> str:
        """Get cooler height category tag."""
        for category, (min_val, max_val) in self.COOLER_HEIGHT_CATEGORIES.items():
            if min_val <= height_mm <= max_val:
                return category
        return "tall-tower"
    
    def _get_case_gpu_clearance(self, clearance_mm: int) -> str:
        """Get case GPU clearance category tag."""
        for category, (min_val, max_val) in self.CASE_GPU_CLEARANCE.items():
            if min_val <= clearance_mm <= max_val:
                return category
        return "full-clearance"
    
    def _get_psu_wattage_tier(self, wattage: int) -> str:
        """Get PSU wattage tier tag."""
        for tier, (min_val, max_val) in self.PSU_WATTAGE_TIERS.items():
            if min_val <= wattage <= max_val:
                return tier
        return "psu-1200w-plus"
    
    def tag_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add compatibility tags to all records in DataFrame.
        
        Args:
            df: DataFrame with component data
            
        Returns:
            DataFrame with compatibility_tags column added
        """
        df = df.copy()
        
        df["compatibility_tags"] = df.apply(
            lambda row: self.generate_tags(row.to_dict()),
            axis=1
        )
        
        logger.info(f"Generated compatibility tags for {len(df)} records")
        return df
