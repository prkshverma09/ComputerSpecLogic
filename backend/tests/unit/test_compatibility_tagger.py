"""
Unit tests for CompatibilityTagger.
"""

import pytest
import pandas as pd

from etl.transformers.compatibility_tagger import CompatibilityTagger


class TestCompatibilityTagger:
    """Tests for the CompatibilityTagger class."""
    
    @pytest.fixture
    def tagger(self):
        """Create tagger instance."""
        return CompatibilityTagger()
    
    # CPU tagging tests
    
    def test_generate_cpu_tags_am5(self, tagger):
        """Test tag generation for AM5 CPU."""
        cpu = {
            "component_type": "CPU",
            "socket": "AM5",
            "memory_type": ["DDR5"],
            "pcie_version": "5.0",
            "tdp_watts": 120,
            "integrated_graphics": False,
            "cores": 12,
            "performance_tier": "high-end",
        }
        
        tags = tagger.generate_tags(cpu)
        
        assert "am5" in tags
        assert "ddr5" in tags
        assert "pcie50" in tags
        assert "high-tdp" in tags
        assert "no-igpu" in tags
        assert "high-core-count" in tags
        assert "high-end" in tags
    
    def test_generate_cpu_tags_with_igpu(self, tagger):
        """Test tag generation for CPU with integrated graphics."""
        cpu = {
            "component_type": "CPU",
            "socket": "LGA1700",
            "memory_type": ["DDR4", "DDR5"],
            "pcie_version": "5.0",
            "tdp_watts": 65,
            "integrated_graphics": True,
            "cores": 6,
        }
        
        tags = tagger.generate_tags(cpu)
        
        assert "igpu" in tags
        assert "lga1700" in tags
        assert "mid-tdp" in tags or "low-tdp" in tags
    
    def test_generate_cpu_tags_core_count_categories(self, tagger):
        """Test CPU core count category tags."""
        # Quad-core
        tags = tagger.generate_tags({
            "component_type": "CPU",
            "cores": 4,
        })
        assert "quad-core" in tags
        
        # Octa-core
        tags = tagger.generate_tags({
            "component_type": "CPU",
            "cores": 8,
        })
        assert "octa-core" in tags
        
        # High core count
        tags = tagger.generate_tags({
            "component_type": "CPU",
            "cores": 16,
        })
        assert "high-core-count" in tags
        
        # Extreme core count
        tags = tagger.generate_tags({
            "component_type": "CPU",
            "cores": 32,
        })
        assert "extreme-core-count" in tags
    
    # GPU tagging tests
    
    def test_generate_gpu_tags_nvidia_rtx(self, tagger):
        """Test tag generation for NVIDIA RTX GPU."""
        gpu = {
            "component_type": "GPU",
            "brand": "NVIDIA",
            "model": "GeForce RTX 4070",
            "tdp_watts": 200,
            "vram_gb": 12,
            "length_mm": 280,
            "pcie_version": "4.0",
            "memory_type": "GDDR6X",
        }
        
        tags = tagger.generate_tags(gpu)
        
        assert "nvidia" in tags
        assert "rtx" in tags
        assert "ray-tracing" in tags
        assert "mid-tdp" in tags
        assert "vram-12gb" in tags
        assert "standard-gpu" in tags
        assert "pcie40" in tags
        assert "gddr6x" in tags
    
    def test_generate_gpu_tags_amd_rdna(self, tagger):
        """Test tag generation for AMD RDNA GPU."""
        gpu = {
            "component_type": "GPU",
            "brand": "AMD",
            "model": "Radeon RX 7800 XT",
            "tdp_watts": 263,
            "vram_gb": 16,
            "length_mm": 267,
            "pcie_version": "4.0",
        }
        
        tags = tagger.generate_tags(gpu)
        
        assert "amd" in tags
        assert "rdna" in tags
        assert "high-tdp" in tags
        assert "vram-16gb" in tags
    
    def test_generate_gpu_tags_high_power_warning(self, tagger):
        """Test high power GPU tags."""
        # High power (300W+)
        gpu = {
            "component_type": "GPU",
            "tdp_watts": 320,
        }
        tags = tagger.generate_tags(gpu)
        assert "high-power-gpu" in tags
        
        # Extreme power (400W+)
        gpu = {
            "component_type": "GPU",
            "tdp_watts": 450,
        }
        tags = tagger.generate_tags(gpu)
        assert "extreme-power-gpu" in tags
    
    def test_generate_gpu_tags_length_categories(self, tagger):
        """Test GPU length category tags."""
        # Compact
        tags = tagger.generate_tags({
            "component_type": "GPU",
            "length_mm": 200,
        })
        assert "compact-gpu" in tags
        
        # Standard
        tags = tagger.generate_tags({
            "component_type": "GPU",
            "length_mm": 280,
        })
        assert "standard-gpu" in tags
        
        # Long
        tags = tagger.generate_tags({
            "component_type": "GPU",
            "length_mm": 330,
        })
        assert "long-gpu" in tags
        
        # Extra long
        tags = tagger.generate_tags({
            "component_type": "GPU",
            "length_mm": 360,
        })
        assert "extra-long-gpu" in tags
    
    # Motherboard tagging tests
    
    def test_generate_motherboard_tags(self, tagger):
        """Test tag generation for motherboard."""
        mobo = {
            "component_type": "Motherboard",
            "socket": "AM5",
            "memory_type": ["DDR5"],
            "form_factor": "ATX",
            "chipset": "X670E",
            "wifi": True,
            "m2_slots": 4,
            "memory_slots": 4,
        }
        
        tags = tagger.generate_tags(mobo)
        
        assert "am5" in tags
        assert "ddr5" in tags
        assert "atx" in tags
        assert "x670e" in tags
        assert "wifi" in tags
        assert "many-m2" in tags
        assert "4-dimm" in tags
    
    # RAM tagging tests
    
    def test_generate_ram_tags_ddr5(self, tagger):
        """Test tag generation for DDR5 RAM."""
        ram = {
            "component_type": "RAM",
            "memory_type": "DDR5",
            "speed_mhz": 6400,
            "capacity_gb": 16,
            "modules": 2,
            "cas_latency": 32,
            "rgb": True,
        }
        
        tags = tagger.generate_tags(ram)
        
        assert "ddr5" in tags
        assert "high-speed-ddr5" in tags
        assert "32gb" in tags
        assert "dual-channel" in tags
        assert "rgb" in tags
    
    def test_generate_ram_tags_ddr4(self, tagger):
        """Test tag generation for DDR4 RAM."""
        ram = {
            "component_type": "RAM",
            "memory_type": "DDR4",
            "speed_mhz": 3600,
            "capacity_gb": 16,
            "modules": 2,
            "cas_latency": 16,
        }
        
        tags = tagger.generate_tags(ram)
        
        assert "ddr4" in tags
        assert "high-speed-ddr4" in tags
        assert "32gb" in tags
        assert "low-latency" in tags
    
    # PSU tagging tests
    
    def test_generate_psu_tags(self, tagger):
        """Test tag generation for PSU."""
        psu = {
            "component_type": "PSU",
            "wattage": 850,
            "efficiency_rating": "80+ Gold",
            "modular": "Full Modular",
            "form_factor": "ATX",
        }
        
        tags = tagger.generate_tags(psu)
        
        assert "psu-850w" in tags
        assert "80plus-gold" in tags
        assert "full-modular" in tags
        assert "atx" in tags
    
    def test_generate_psu_tags_wattage_tiers(self, tagger):
        """Test PSU wattage tier tags."""
        # Test various wattage tiers
        test_cases = [
            (500, "psu-450w"),
            (650, "psu-650w"),
            (850, "psu-850w"),
            (1000, "psu-1000w"),
            (1200, "psu-1200w-plus"),
        ]
        
        for wattage, expected_tag in test_cases:
            tags = tagger.generate_tags({
                "component_type": "PSU",
                "wattage": wattage,
            })
            assert expected_tag in tags
    
    # Case tagging tests
    
    def test_generate_case_tags(self, tagger):
        """Test tag generation for case."""
        case = {
            "component_type": "Case",
            "form_factor_support": ["ATX", "Micro-ATX", "Mini-ITX"],
            "max_gpu_length_mm": 400,
            "max_cooler_height_mm": 170,
            "radiator_support": ["360mm", "280mm"],
        }
        
        tags = tagger.generate_tags(case)
        
        assert "supports-atx" in tags
        assert "supports-micro-atx" in tags
        assert "supports-mini-itx" in tags
        assert "full-clearance" in tags
        assert "tall-cooler-support" in tags
        assert "rad-360mm" in tags
    
    # Cooler tagging tests
    
    def test_generate_cooler_tags_air(self, tagger):
        """Test tag generation for air cooler."""
        cooler = {
            "component_type": "Cooler",
            "cooler_type": "Air",
            "socket_support": ["AM5", "LGA1700"],
            "height_mm": 165,
            "tdp_rating": 250,
            "rgb": False,
        }
        
        tags = tagger.generate_tags(cooler)
        
        assert "air-cooling" in tags
        assert "supports-am5" in tags
        assert "supports-lga1700" in tags
        assert "tower-cooler" in tags
        assert "high-tdp-cooling" in tags
    
    def test_generate_cooler_tags_aio(self, tagger):
        """Test tag generation for AIO cooler."""
        cooler = {
            "component_type": "Cooler",
            "cooler_type": "AIO",
            "socket_support": ["AM5"],
            "height_mm": 38,
            "radiator_size_mm": 360,
            "tdp_rating": 350,
        }
        
        tags = tagger.generate_tags(cooler)
        
        assert "aio" in tags
        assert "liquid-cooling" in tags
        assert "360mm-rad" in tags
        assert "high-tdp-cooling" in tags
    
    # TDP category tests
    
    def test_tdp_categories(self, tagger):
        """Test TDP category assignment."""
        assert tagger._get_tdp_category(45) == "low-tdp"
        assert tagger._get_tdp_category(65) == "low-tdp"
        assert tagger._get_tdp_category(100) == "mid-tdp"
        assert tagger._get_tdp_category(150) == "high-tdp"
        assert tagger._get_tdp_category(250) == "extreme-tdp"
    
    # DataFrame tagging tests
    
    def test_tag_dataframe(self, tagger, sample_cpu_df):
        """Test tagging a DataFrame."""
        df = sample_cpu_df.copy()
        result = tagger.tag_dataframe(df)
        
        assert "compatibility_tags" in result.columns
        assert all(isinstance(tags, list) for tags in result["compatibility_tags"])
    
    # Edge cases
    
    def test_generate_tags_unknown_component(self, tagger):
        """Test tag generation for unknown component type."""
        result = tagger.generate_tags({
            "component_type": "Unknown",
            "price_usd": 100,
        })
        
        assert result == []  # Should return empty list
    
    def test_generate_tags_no_duplicates(self, tagger):
        """Test that generated tags don't contain duplicates."""
        cpu = {
            "component_type": "CPU",
            "socket": "AM5",
            "memory_type": ["DDR5", "DDR5"],  # Duplicate memory type
            "performance_tier": "high-end",
        }
        
        tags = tagger.generate_tags(cpu)
        
        # Should not have duplicate tags
        assert len(tags) == len(set(tags))
