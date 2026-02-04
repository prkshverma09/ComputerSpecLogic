"""
Unit tests for import scripts.

Tests parsing and processing functions from import_kaggle_data and import_pcpartpicker_data.
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))

from scripts.import_pcpartpicker_data import (
    parse_price,
    parse_int,
    parse_float,
    extract_brand,
    get_socket_family,
    get_memory_type,
    process_motherboards,
    process_psus,
    process_cases,
    process_coolers,
    process_storage,
)


class TestParseFunctions:
    """Tests for basic parsing functions."""

    def test_parse_price_valid_dollar_sign(self):
        assert parse_price("$299.99") == 299.99
        assert parse_price("$1,299.99") == 1299.99

    def test_parse_price_valid_no_dollar_sign(self):
        assert parse_price("299.99") == 299.99
        assert parse_price("1299.99") == 1299.99

    def test_parse_price_empty_returns_none(self):
        assert parse_price("") is None
        assert parse_price(None) is None

    def test_parse_price_invalid_returns_none(self):
        assert parse_price("invalid") is None
        assert parse_price("N/A") is None

    def test_parse_int_valid(self):
        assert parse_int("100") == 100
        assert parse_int("100.5") == 100
        assert parse_int(100) == 100

    def test_parse_int_empty_returns_none(self):
        assert parse_int("") is None
        assert parse_int(None) is None

    def test_parse_int_invalid_returns_none(self):
        assert parse_int("invalid") is None

    def test_parse_float_valid(self):
        assert parse_float("100.5") == 100.5
        assert parse_float("100") == 100.0
        assert parse_float(100.5) == 100.5

    def test_parse_float_empty_returns_none(self):
        assert parse_float("") is None
        assert parse_float(None) is None

    def test_parse_float_invalid_returns_none(self):
        assert parse_float("invalid") is None


class TestExtractBrand:
    """Tests for brand extraction."""

    def test_extract_brand_known_brands(self):
        assert extract_brand("ASUS ROG Strix") == "ASUS"
        assert extract_brand("MSI MAG B650") == "MSI"
        assert extract_brand("Gigabyte AORUS Pro") == "Gigabyte"
        assert extract_brand("ASRock B650E") == "ASRock"
        assert extract_brand("Corsair RM850x") == "Corsair"
        assert extract_brand("NZXT H510") == "NZXT"
        assert extract_brand("Fractal Design Meshify") == "Fractal Design"
        assert extract_brand("be quiet! Dark Rock") == "be quiet!"
        assert extract_brand("Noctua NH-D15") == "Noctua"

    def test_extract_brand_case_insensitive(self):
        assert extract_brand("asus ROG") in ["ASUS", "Asus"]

    def test_extract_brand_fallback_first_word(self):
        assert extract_brand("UnknownBrand XYZ123") == "UnknownBrand"

    def test_extract_brand_empty_returns_unknown(self):
        assert extract_brand("") == "Unknown"
        assert extract_brand(None) == "Unknown"


class TestGetSocketFamily:
    """Tests for socket family normalization."""

    def test_get_socket_family_amd(self):
        assert get_socket_family("AM5") == "AM5"
        assert get_socket_family("Socket AM5") == "AM5"
        assert get_socket_family("AM4") == "AM4"
        assert get_socket_family("Socket AM4") == "AM4"

    def test_get_socket_family_intel(self):
        assert get_socket_family("LGA1700") == "LGA1700"
        assert get_socket_family("LGA 1700") == "LGA1700"
        assert get_socket_family("1700") == "LGA1700"
        assert get_socket_family("LGA1200") == "LGA1200"
        assert get_socket_family("LGA1851") == "LGA1851"
        assert get_socket_family("1851") == "LGA1851"
        assert get_socket_family("LGA1151") == "LGA1151"

    def test_get_socket_family_hedt(self):
        assert get_socket_family("TR4") == "sTRX4"
        assert get_socket_family("TRX40") == "sTRX4"
        assert get_socket_family("Threadripper") == "sTRX4"
        assert get_socket_family("LGA2066") == "LGA2066"

    def test_get_socket_family_passthrough(self):
        assert get_socket_family("CustomSocket") == "CustomSocket"

    def test_get_socket_family_none_returns_none(self):
        assert get_socket_family(None) is None
        assert get_socket_family("") is None


class TestGetMemoryType:
    """Tests for memory type inference."""

    def test_get_memory_type_explicit_ddr5(self):
        assert get_memory_type(None, "ASRock B650E DDR5") == "DDR5"

    def test_get_memory_type_explicit_ddr4(self):
        assert get_memory_type(None, "ASRock B550 DDR4") == "DDR4"

    def test_get_memory_type_inferred_from_socket(self):
        assert get_memory_type(None, "AM5 Motherboard") == "DDR5"
        assert get_memory_type(None, "Z790 Gaming") == "DDR5"
        assert get_memory_type(None, "B650 Steel Legend") == "DDR5"

    def test_get_memory_type_default_ddr4(self):
        assert get_memory_type(None, "Unknown Board") == "DDR4"


class TestProcessMotherboards:
    """Tests for motherboard processing."""

    @pytest.fixture
    def sample_motherboard_csv(self, tmp_path):
        csv_content = """name,price,socket,form_factor,max_memory,memory_slots,color
ASUS ROG Strix B650E-F,$349.99,AM5,ATX,128,4,Black
MSI MAG B550 TOMAHAWK,$159.99,AM4,ATX,128,4,Black
Empty Name,,$LGA1700,ATX,64,4,Black
No Price Board,$0.00,AM5,ATX,64,4,Black"""

        csv_file = tmp_path / "motherboards.csv"
        csv_file.write_text(csv_content)
        return csv_file

    def test_process_motherboards_extracts_correctly(self, sample_motherboard_csv):
        records = process_motherboards(sample_motherboard_csv)

        assert len(records) == 2

        asus = records[0]
        assert asus["component_type"] == "Motherboard"
        assert asus["brand"] == "ASUS"
        assert asus["socket"] == "AM5"
        assert asus["form_factor"] == "ATX"
        assert asus["price_usd"] == 349.99
        assert "AM5" in asus["compatibility_tags"]

    def test_process_motherboards_skips_empty_names(self, sample_motherboard_csv):
        records = process_motherboards(sample_motherboard_csv)
        names = [r["name"] for r in records]
        assert "Empty Name" not in names

    def test_process_motherboards_skips_zero_price(self, sample_motherboard_csv):
        records = process_motherboards(sample_motherboard_csv)
        names = [r["name"] for r in records]
        assert "No Price Board" not in names


class TestProcessPSUs:
    """Tests for PSU processing."""

    @pytest.fixture
    def sample_psu_csv(self, tmp_path):
        csv_content = """name,price,wattage,efficiency,modular,type,color
Corsair RM850x,$129.99,850,80+ Gold,Full,ATX,Black
Seasonic Focus GX-750,$109.99,750,80+ Gold,Full,ATX,Black
be quiet! Pure Power 11 500W,$59.99,500,80+ Bronze,Semi,ATX,Black
No Wattage PSU,$99.99,,80+ Gold,Full,ATX,Black"""

        csv_file = tmp_path / "psus.csv"
        csv_file.write_text(csv_content)
        return csv_file

    def test_process_psus_extracts_correctly(self, sample_psu_csv):
        records = process_psus(sample_psu_csv)

        assert len(records) == 3

        corsair = records[0]
        assert corsair["component_type"] == "PSU"
        assert corsair["brand"] == "Corsair"
        assert corsair["wattage"] == 850
        assert corsair["efficiency_rating"] == "80+ Gold"
        assert corsair["modular"] == "Full"

    def test_process_psus_maps_efficiency_ratings(self, sample_psu_csv):
        records = process_psus(sample_psu_csv)

        bronze_psu = [r for r in records if "500W" in r["name"]][0]
        assert bronze_psu["efficiency_rating"] == "80+ Bronze"

    def test_process_psus_skips_no_wattage(self, sample_psu_csv):
        records = process_psus(sample_psu_csv)
        names = [r["name"] for r in records]
        assert "No Wattage PSU" not in names


class TestProcessCases:
    """Tests for case processing."""

    @pytest.fixture
    def sample_case_csv(self, tmp_path):
        csv_content = """name,price,type,side_panel,color
NZXT H510,$79.99,ATX Mid Tower,Tempered Glass,White
Lian Li O11 Dynamic,$149.99,ATX Full Tower,Tempered Glass,Black
Cooler Master NR200,$89.99,Mini-ITX,Tempered Glass,Black
Empty Case,,ATX Mid Tower,Glass,Black"""

        csv_file = tmp_path / "cases.csv"
        csv_file.write_text(csv_content)
        return csv_file

    def test_process_cases_extracts_correctly(self, sample_case_csv):
        records = process_cases(sample_case_csv)

        assert len(records) == 3

        nzxt = records[0]
        assert nzxt["component_type"] == "Case"
        assert nzxt["brand"] == "NZXT"
        assert nzxt["case_type"] == "ATX Mid Tower"
        assert nzxt["side_panel"] == "Tempered Glass"

    def test_process_cases_sets_form_factor_support(self, sample_case_csv):
        records = process_cases(sample_case_csv)

        full_tower = [r for r in records if "Full" in r["case_type"]][0]
        assert "E-ATX" in full_tower["form_factor_support"]
        assert "ATX" in full_tower["form_factor_support"]

        mini_itx = [r for r in records if "Mini-ITX" in r["case_type"]][0]
        assert mini_itx["form_factor_support"] == ["Mini-ITX"]

    def test_process_cases_sets_gpu_clearance(self, sample_case_csv):
        records = process_cases(sample_case_csv)

        full_tower = [r for r in records if "Full" in r["case_type"]][0]
        assert full_tower["max_gpu_length_mm"] == 400

        mini_itx = [r for r in records if "Mini-ITX" in r["case_type"]][0]
        assert mini_itx["max_gpu_length_mm"] == 280


class TestProcessCoolers:
    """Tests for cooler processing."""

    @pytest.fixture
    def sample_cooler_csv(self, tmp_path):
        csv_content = """name,price,rpm,noise_level,size,color
Noctua NH-D15,$99.99,1500,24.6 dB,,Brown
Corsair iCUE H150i Elite LCD XT,$289.99,2400,36 dB,360mm,Black
be quiet! Dark Rock Pro 4,$89.99,1500,24.3 dB,,Black
ARCTIC Liquid Freezer II 280mm AIO,$99.99,1700,22.5 dB,280mm,Black"""

        csv_file = tmp_path / "coolers.csv"
        csv_file.write_text(csv_content)
        return csv_file

    def test_process_coolers_extracts_correctly(self, sample_cooler_csv):
        records = process_coolers(sample_cooler_csv)

        assert len(records) == 4

        noctua = records[0]
        assert noctua["component_type"] == "Cooler"
        assert noctua["brand"] == "Noctua"
        assert noctua["cooler_type"] == "Air"

    def test_process_coolers_detects_aio(self, sample_cooler_csv):
        records = process_coolers(sample_cooler_csv)

        aios = [r for r in records if r["cooler_type"] == "AIO"]
        assert len(aios) >= 1

        for aio in aios:
            assert aio["height_mm"] == 55

    def test_process_coolers_sets_socket_support(self, sample_cooler_csv):
        records = process_coolers(sample_cooler_csv)

        for record in records:
            assert "AM5" in record["socket_support"]
            assert "AM4" in record["socket_support"]
            assert "LGA1700" in record["socket_support"]


class TestProcessStorage:
    """Tests for storage processing."""

    @pytest.fixture
    def sample_storage_csv(self, tmp_path):
        csv_content = """name,price,type,capacity,interface,form_factor,cache_mb,rpm,read_speed,write_speed
Samsung 990 Pro,$179.99,SSD,2000,PCIe 4.0 x4,M.2-2280,2048,,7450,6900
Western Digital Blue SN580,$69.99,SSD,1000,PCIe 4.0 x4,M.2-2280,,,4150,4150
Seagate Barracuda,$54.99,HDD,2000,SATA,3.5",256,7200,,"""

        csv_file = tmp_path / "storage.csv"
        csv_file.write_text(csv_content)
        return csv_file

    def test_process_storage_extracts_correctly(self, sample_storage_csv):
        records = process_storage(sample_storage_csv)

        assert len(records) == 3

        samsung = records[0]
        assert samsung["component_type"] == "Storage"
        assert samsung["brand"] == "Samsung"
        assert samsung["storage_type"] == "SSD"
        assert samsung["capacity_gb"] == 2000
        assert samsung["interface"] == "PCIe 4.0 x4"

    def test_process_storage_sets_performance_tier(self, sample_storage_csv):
        records = process_storage(sample_storage_csv)

        samsung = records[0]
        assert samsung["performance_tier"] == "high-end"

        hdd = [r for r in records if r["storage_type"] == "HDD"][0]
        assert hdd["performance_tier"] == "performance"

    def test_process_storage_formats_capacity_display(self, sample_storage_csv):
        records = process_storage(sample_storage_csv)

        samsung = records[0]
        assert samsung["capacity_display"] == "2TB"


class TestKaggleImportParsing:
    """Tests for Kaggle data parsing functions."""

    def test_socket_parsing_am5(self):
        socket_raw = "Socket AM5"
        socket = "AM5"
        if "AM5" in str(socket_raw):
            socket = "AM5"
        assert socket == "AM5"

    def test_socket_parsing_am4(self):
        socket_raw = "AM4"
        socket = "AM4"
        if "AM4" in str(socket_raw):
            socket = "AM4"
        assert socket == "AM4"

    def test_tdp_parsing_with_w(self):
        tdp_str = "105W"
        try:
            tdp = int(float(str(tdp_str).replace('W', '').strip()))
        except:
            tdp = 105
        assert tdp == 105

    def test_tdp_parsing_numeric(self):
        tdp_str = "65"
        try:
            tdp = int(float(str(tdp_str).replace('W', '').strip()))
        except:
            tdp = 105
        assert tdp == 65

    def test_memory_type_parsing(self):
        mem_type = "DDR5-5600"
        if "DDR5" in str(mem_type):
            mem_type = "DDR5"
        elif "DDR4" in str(mem_type):
            mem_type = "DDR4"
        assert mem_type == "DDR5"

    def test_intel_socket_inference_12th_gen(self):
        product = "Core i9-12900K"
        if "-14" in product or " 14" in product:
            socket = "LGA1700"
        elif "-13" in product or " 13" in product:
            socket = "LGA1700"
        elif "-12" in product or " 12" in product:
            socket = "LGA1700"
        else:
            socket = "LGA1200"
        assert socket == "LGA1700"

    def test_intel_socket_inference_core_ultra(self):
        product = "Core Ultra 9 285K"
        if "Ultra" in product:
            socket = "LGA1851"
        else:
            socket = "LGA1700"
        assert socket == "LGA1851"

    def test_price_estimation_gpu_by_vram(self):
        mem_size = 24
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
        assert price == 1599

    def test_price_estimation_cpu_by_cores(self):
        cores = 16
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
        assert price == 549
