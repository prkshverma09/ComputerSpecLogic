"""
Type definitions for Spec-Logic ETL Pipeline

This module contains TypedDict definitions for component data structures
used throughout the ETL pipeline.
"""

from typing import TypedDict, Optional, List, Literal


class CPURecord(TypedDict, total=False):
    """Raw CPU data structure from extraction"""
    objectID: str
    component_type: Literal["CPU"]
    brand: str
    model: str
    socket: str
    tdp_watts: int
    max_tdp_watts: Optional[int]
    cores: int
    threads: int
    base_clock_ghz: float
    boost_clock_ghz: float
    memory_type: List[str]
    pcie_version: str
    integrated_graphics: bool
    price_usd: float
    release_date: Optional[str]
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class GPURecord(TypedDict, total=False):
    """Raw GPU data structure from extraction"""
    objectID: str
    component_type: Literal["GPU"]
    brand: str
    model: str
    length_mm: int
    tdp_watts: int
    vram_gb: int
    memory_type: str
    memory_bandwidth_gbps: Optional[float]
    pcie_version: str
    power_connectors: Optional[str]
    recommended_psu_watts: Optional[int]
    price_usd: float
    release_date: Optional[str]
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class MotherboardRecord(TypedDict, total=False):
    """Motherboard data structure"""
    objectID: str
    component_type: Literal["Motherboard"]
    brand: str
    model: str
    socket: str
    chipset: str
    form_factor: str
    memory_type: List[str]
    memory_slots: int
    max_memory_gb: int
    pcie_slots: dict
    m2_slots: int
    sata_ports: int
    usb_ports: dict
    wifi: bool
    bluetooth: bool
    price_usd: float
    release_date: Optional[str]
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class RAMRecord(TypedDict, total=False):
    """RAM data structure"""
    objectID: str
    component_type: Literal["RAM"]
    brand: str
    model: str
    memory_type: str
    speed_mhz: int
    capacity_gb: int
    modules: int
    cas_latency: int
    voltage: float
    rgb: bool
    price_usd: float
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class PSURecord(TypedDict, total=False):
    """PSU data structure"""
    objectID: str
    component_type: Literal["PSU"]
    brand: str
    model: str
    wattage: int
    efficiency_rating: str  # 80+ Bronze, Gold, Platinum, Titanium
    modular: str  # Full, Semi, Non
    form_factor: str  # ATX, SFX, SFX-L
    fan_size_mm: Optional[int]
    price_usd: float
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class CaseRecord(TypedDict, total=False):
    """Case data structure"""
    objectID: str
    component_type: Literal["Case"]
    brand: str
    model: str
    form_factor_support: List[str]  # ATX, Micro-ATX, Mini-ITX
    max_gpu_length_mm: int
    max_cooler_height_mm: int
    max_psu_length_mm: Optional[int]
    drive_bays_35: int
    drive_bays_25: int
    fan_slots: dict
    radiator_support: List[str]
    front_io: dict
    price_usd: float
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


class CoolerRecord(TypedDict, total=False):
    """CPU Cooler data structure"""
    objectID: str
    component_type: Literal["Cooler"]
    brand: str
    model: str
    cooler_type: str  # Air, AIO
    socket_support: List[str]
    height_mm: int
    radiator_size_mm: Optional[int]  # For AIOs: 120, 240, 280, 360
    fan_rpm_max: int
    noise_dba: Optional[float]
    tdp_rating: Optional[int]
    rgb: bool
    price_usd: float
    performance_tier: str
    image_url: Optional[str]
    compatibility_tags: List[str]


# Union type for all component records
ComponentRecord = CPURecord | GPURecord | MotherboardRecord | RAMRecord | PSURecord | CaseRecord | CoolerRecord

ComponentType = Literal["CPU", "GPU", "Motherboard", "RAM", "PSU", "Case", "Cooler"]


class ValidationIssue(TypedDict):
    """Compatibility validation issue"""
    type: Literal["error", "warning"]
    code: str
    message: str
    affected_components: List[str]
    suggestion: Optional[str]


class PowerAnalysis(TypedDict):
    """PSU power analysis result"""
    total_tdp: int
    recommended_psu: int
    current_psu: Optional[int]
    headroom: Optional[int]
    efficiency_at_load: Optional[str]


class ValidationResult(TypedDict):
    """Build validation result"""
    valid: bool
    complete: bool
    issues: List[ValidationIssue]
    power_analysis: PowerAnalysis
    missing_components: List[str]
