#!/usr/bin/env python3
"""
Build a future-proof TypeScript rail dataset for a Geo Alarm app.

Sources:
- CTA 'L' Stops CSV (City of Chicago open data)
- Metra static GTFS ZIP

Output:
- chicagoRailPlaces.ts

FIX: Metra's CSV files have leading spaces in column names and values
(e.g. ' stop_lat' instead of 'stop_lat', '  AURORA' instead of 'AURORA').
All CSV loading now strips whitespace from both keys and values.

Run:
    python build_chicago_rail_places.py
or:
    python build_chicago_rail_places.py /path/to/chicagoRailPlaces.ts
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

CTA_CSV_URL = "https://data.cityofchicago.org/api/views/8pix-ypme/rows.csv?accessType=DOWNLOAD"
METRA_GTFS_URL = "https://schedules.metrarail.com/gtfs/schedule.zip"

CTA_LINE_COLUMN_MAP = {
    "red": "Red",
    "blue": "Blue",
    "g": "Green",
    "green": "Green",
    "brn": "Brown",
    "brown": "Brown",
    "p": "Purple",
    "pexp": "Purple",
    "y": "Yellow",
    "yellow": "Yellow",
    "pnk": "Pink",
    "pink": "Pink",
    "o": "Orange",
    "orange": "Orange",
}

METRA_ROUTE_NAME_TO_CODE = {
    "bnsf": "BNSF",
    "bnsf railway": "BNSF",
    "burlington northern": "BNSF",
    "heritage corridor": "HC",
    "metra electric": "ME",
    "metra electric district": "ME",
    "milwaukee north": "MD-N",
    "milwaukee district north": "MD-N",
    "milwaukee west": "MD-W",
    "milwaukee district west": "MD-W",
    "north central service": "NCS",
    "rock island": "RI",
    "southwest service": "SWS",
    "south west service": "SWS",
    "union pacific north": "UP-N",
    "union pacific northwest": "UP-NW",
    "union pacific west": "UP-W",
}

KNOWN_METRA_CODES = {
    "BNSF", "HC", "ME", "MD-N", "MD-W",
    "NCS", "RI", "SWS", "UP-N", "UP-NW", "UP-W",
}

PAREN_RE = re.compile(r"\s*\([^)]*\)")
WHITESPACE_RE = re.compile(r"\s+")
NON_ID_RE = re.compile(r"[^a-z0-9]+")


@dataclass
class TransitPlaceRecord:
    id: str
    name: str
    latitude: float
    longitude: float
    agency: str
    mode: str = "rail"
    kind: str = "station"
    source_stop_id: Optional[str] = None
    city: Optional[str] = None
    aliases: Set[str] = field(default_factory=set)
    line_codes: Set[str] = field(default_factory=set)

    def to_typescript_object(self) -> str:
        aliases = sorted(a for a in self.aliases if a and a != self.name)
        line_codes = sorted(self.line_codes)

        parts = [
            "  {",
            f"    id: {json.dumps(self.id)},",
            f"    name: {json.dumps(self.name)},",
            f"    agency: {json.dumps(self.agency)},",
            f"    mode: {json.dumps(self.mode)},",
            f"    kind: {json.dumps(self.kind)},",
        ]
        if aliases:
            parts.append(f"    aliases: {json.dumps(aliases)},")
        if self.city:
            parts.append(f"    city: {json.dumps(self.city)},")
        if self.source_stop_id:
            parts.append(f"    sourceStopId: {json.dumps(self.source_stop_id)},")
        if line_codes:
            parts.append(f"    lineCodes: {json.dumps(line_codes)},")
        parts.extend([
            f"    latitude: {self.latitude:.8f},",
            f"    longitude: {self.longitude:.8f},",
            "  },",
        ])
        return "\n".join(parts)


# ─── Utility functions ────────────────────────────────────────────────────────

def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()

def normalize_space(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value or "").strip()

def normalize_key(value: str) -> str:
    return normalize_space(value).lower()

def slugify(value: str) -> str:
    value = normalize_key(value)
    value = NON_ID_RE.sub("-", value).strip("-")
    return value or "unknown"

def canonical_name(value: str) -> str:
    return normalize_space(value)

def cleaned_alias(value: str) -> str:
    value = PAREN_RE.sub("", value or "")
    value = normalize_space(value).strip(" -")
    return value

def parse_float(value: str) -> Optional[float]:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None

def parse_location_pair(raw: str) -> Tuple[Optional[float], Optional[float]]:
    if not raw:
        return None, None
    raw = raw.strip()
    m = re.match(r"\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?", raw)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.match(r"POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)", raw, flags=re.I)
    if m:
        return float(m.group(2)), float(m.group(1))
    return None, None

def is_truthy(value: str) -> bool:
    return (value or "").strip().lower() in {"1", "true", "t", "yes", "y"}


# ─── CSV loading — strips whitespace from keys AND values ─────────────────────
#
# This is the critical fix. Metra's GTFS CSVs are formatted like:
#   stop_id, stop_name, stop_lat, stop_lon
#   GENEVA, Geneva, 41.88, -88.31
#
# Python's csv.DictReader preserves the leading space, producing keys like
# ' stop_lat' and values like ' 41.88'. Our code then does row.get("stop_lat")
# which returns None because the actual key is ' stop_lat'.

def _strip_row(row: Dict[str, str]) -> Dict[str, str]:
    """Strip whitespace from both keys and values in a CSV row."""
    return {k.strip(): v.strip() for k, v in row.items()}

def load_csv_rows(raw_bytes: bytes) -> List[Dict[str, str]]:
    text = raw_bytes.decode("utf-8-sig")
    return [_strip_row(row) for row in csv.DictReader(io.StringIO(text))]

def load_zip_csvs(raw_bytes: bytes) -> Dict[str, List[Dict[str, str]]]:
    out: Dict[str, List[Dict[str, str]]] = {}
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        for name in zf.namelist():
            if not name.lower().endswith(".txt"):
                continue
            base_name = name.split("/")[-1].split("\\")[-1].lower()
            with zf.open(name) as fh:
                text = fh.read().decode("utf-8-sig")
                out[base_name] = [_strip_row(row) for row in csv.DictReader(io.StringIO(text))]
    return out


# ─── Route inference ──────────────────────────────────────────────────────────

def infer_metra_line_code(route_row: Dict[str, str]) -> Optional[str]:
    short_name = normalize_space(route_row.get("route_short_name", ""))
    long_name = normalize_space(route_row.get("route_long_name", ""))
    route_id = normalize_space(route_row.get("route_id", ""))

    for candidate in (short_name, route_id):
        if candidate.upper() in KNOWN_METRA_CODES:
            return candidate.upper()

    for text in (short_name, long_name, route_id):
        key = normalize_key(text)
        if key in METRA_ROUTE_NAME_TO_CODE:
            return METRA_ROUTE_NAME_TO_CODE[key]

    for phrase, code in METRA_ROUTE_NAME_TO_CODE.items():
        if phrase in normalize_key(long_name) or phrase in normalize_key(route_id):
            return code

    return short_name or long_name or route_id or None


# ─── CTA Builder ──────────────────────────────────────────────────────────────

def build_cta_records() -> List[TransitPlaceRecord]:
    raw = fetch_bytes(CTA_CSV_URL)
    rows = load_csv_rows(raw)
    records: Dict[str, TransitPlaceRecord] = {}

    for row in rows:
        lowered = {str(k).lower(): (v or "") for k, v in row.items()}

        map_id = lowered.get("map_id") or lowered.get("mapid") or lowered.get("map id")
        station_name = canonical_name(
            lowered.get("station_name")
            or lowered.get("station name")
            or lowered.get("stop_name")
            or lowered.get("name")
        )
        descriptive = canonical_name(
            lowered.get("station_descriptive_name") or lowered.get("station descriptive name")
        )
        stop_name = canonical_name(lowered.get("stop_name") or lowered.get("stop name"))

        lat = parse_float(lowered.get("latitude"))
        lon = parse_float(lowered.get("longitude"))

        if lat is None or lon is None:
            for candidate in (
                lowered.get("location"),
                lowered.get("the_geom"),
                lowered.get("point"),
            ):
                maybe_lat, maybe_lon = parse_location_pair(candidate or "")
                if maybe_lat is not None and maybe_lon is not None:
                    lat, lon = maybe_lat, maybe_lon
                    break

        if not station_name or lat is None or lon is None:
            continue

        source_stop_id = map_id or ""
        record_id = f"cta-rail-{slugify(source_stop_id or station_name)}"

        rec = records.get(record_id)
        if rec is None:
            rec = TransitPlaceRecord(
                id=record_id,
                name=station_name,
                latitude=lat,
                longitude=lon,
                agency="CTA",
                city="Chicago",
                source_stop_id=source_stop_id or None,
            )
            records[record_id] = rec

        for text in (descriptive, stop_name, cleaned_alias(stop_name), cleaned_alias(station_name)):
            if text:
                rec.aliases.add(text)

        for col, line_name in CTA_LINE_COLUMN_MAP.items():
            if is_truthy(lowered.get(col, "")):
                rec.line_codes.add(line_name)

    return sorted(records.values(), key=lambda r: (r.name.lower(), r.id))


# ─── Metra Builder ────────────────────────────────────────────────────────────

def build_metra_records() -> List[TransitPlaceRecord]:
    raw = fetch_bytes(METRA_GTFS_URL)
    tables = load_zip_csvs(raw)

    print("  Metra GTFS tables found:", sorted(tables.keys()))

    stops_rows = tables.get("stops.txt", [])
    routes_rows = tables.get("routes.txt", [])
    trips_rows = tables.get("trips.txt", [])
    stop_times_rows = tables.get("stop_times.txt", [])

    print(f"  stops={len(stops_rows)} routes={len(routes_rows)} "
          f"trips={len(trips_rows)} stop_times={len(stop_times_rows)}")

    # Build lookup tables
    stops: Dict[str, Dict[str, str]] = {}
    for row in stops_rows:
        stop_id = row.get("stop_id", "")
        if stop_id:
            stops[stop_id] = row

    routes: Dict[str, Dict[str, str]] = {}
    for row in routes_rows:
        route_id = row.get("route_id", "")
        if route_id:
            routes[route_id] = row

    trip_to_route: Dict[str, str] = {}
    for row in trips_rows:
        trip_id = row.get("trip_id", "")
        route_id = row.get("route_id", "")
        if trip_id and route_id:
            trip_to_route[trip_id] = route_id

    print(f"  Lookups: stops={len(stops)} routes={len(routes)} trips={len(trip_to_route)}")

    # Check feed structure
    has_hierarchy = False
    parent_to_children: Dict[str, Set[str]] = {}

    for stop_id, row in stops.items():
        parent = row.get("parent_station", "")
        location_type = row.get("location_type", "")
        if location_type == "1" or parent:
            has_hierarchy = True
            if parent:
                parent_to_children.setdefault(parent, set()).add(stop_id)

    print(f"  Has hierarchy: {has_hierarchy}")

    # Walk stop_times to map stop → route lines
    station_lines: Dict[str, Set[str]] = {}
    station_aliases: Dict[str, Set[str]] = {}
    station_fallback: Dict[str, Dict[str, str]] = {}
    bad_stop = bad_trip = bad_route = 0

    for row in stop_times_rows:
        stop_id = row.get("stop_id", "")
        trip_id = row.get("trip_id", "")
        if not stop_id or not trip_id:
            continue

        stop_row = stops.get(stop_id)
        if not stop_row:
            bad_stop += 1
            continue

        if has_hierarchy:
            parent = stop_row.get("parent_station", "")
            station_id = parent or stop_id
        else:
            station_id = stop_id

        station_fallback.setdefault(station_id, stop_row)

        route_id = trip_to_route.get(trip_id)
        if not route_id:
            bad_trip += 1
            continue

        route_row = routes.get(route_id)
        if not route_row:
            bad_route += 1
            continue

        line_code = infer_metra_line_code(route_row)
        if line_code:
            station_lines.setdefault(station_id, set()).add(line_code)

        stop_name = canonical_name(stop_row.get("stop_name", ""))
        if stop_name:
            station_aliases.setdefault(station_id, set()).add(stop_name)
            clean = cleaned_alias(stop_name)
            if clean:
                station_aliases.setdefault(station_id, set()).add(clean)

    print(f"  Join misses: stop={bad_stop} trip={bad_trip} route={bad_route}")
    print(f"  Stations with lines: {len(station_lines)}")

    # Collect all station IDs
    all_station_ids = set(station_lines.keys())
    if not all_station_ids:
        all_station_ids = set(stops.keys())

    # Gather child aliases for hierarchical feeds
    for parent_id, child_ids in parent_to_children.items():
        for child_id in child_ids:
            child = stops.get(child_id)
            if not child:
                continue
            name = canonical_name(child.get("stop_name", ""))
            if name:
                station_aliases.setdefault(parent_id, set()).add(name)
                clean = cleaned_alias(name)
                if clean:
                    station_aliases.setdefault(parent_id, set()).add(clean)
            station_fallback.setdefault(parent_id, child)

    # Build records
    records: List[TransitPlaceRecord] = []
    no_coords = 0

    for station_id in sorted(all_station_ids):
        station_row = stops.get(station_id) or station_fallback.get(station_id)
        if not station_row:
            continue

        name = canonical_name(station_row.get("stop_name", ""))
        lat = parse_float(station_row.get("stop_lat", ""))
        lon = parse_float(station_row.get("stop_lon", ""))

        if lat is None or lon is None or not name:
            fb = station_fallback.get(station_id)
            if fb:
                name = name or canonical_name(fb.get("stop_name", ""))
                lat = lat if lat is not None else parse_float(fb.get("stop_lat", ""))
                lon = lon if lon is not None else parse_float(fb.get("stop_lon", ""))

        if not name or lat is None or lon is None:
            no_coords += 1
            continue

        lines = station_lines.get(station_id, set())
        if not lines and not has_hierarchy:
            continue

        rec = TransitPlaceRecord(
            id=f"metra-rail-{slugify(station_id)}",
            name=name,
            latitude=lat,
            longitude=lon,
            agency="Metra",
            city="Chicago",
            source_stop_id=station_id,
        )
        rec.line_codes.update(lines)
        rec.aliases.update(station_aliases.get(station_id, set()))
        clean = cleaned_alias(name)
        if clean:
            rec.aliases.add(clean)
        records.append(rec)

    print(f"  Skipped: no_coords={no_coords}")

    # Dedup by name (flat feeds may have direction variants)
    deduped: Dict[str, TransitPlaceRecord] = {}
    for rec in records:
        key = normalize_key(rec.name)
        if key in deduped:
            existing = deduped[key]
            existing.line_codes.update(rec.line_codes)
            existing.aliases.update(rec.aliases)
            if rec.source_stop_id and existing.source_stop_id:
                if len(rec.source_stop_id) < len(existing.source_stop_id):
                    existing.source_stop_id = rec.source_stop_id
                    existing.id = f"metra-rail-{slugify(rec.source_stop_id)}"
        else:
            deduped[key] = rec

    final = sorted(deduped.values(), key=lambda r: (r.name.lower(), r.id))
    print(f"  After dedup: {len(records)} -> {len(final)}")
    return final


# ─── Output ───────────────────────────────────────────────────────────────────

def build_output(cta_records: List[TransitPlaceRecord], metra_records: List[TransitPlaceRecord]) -> str:
    all_records = sorted(cta_records + metra_records, key=lambda r: (r.name.lower(), r.id))

    parts = [
        "// Auto-generated from official CTA and Metra public data sources.",
        "// Generated by build_chicago_rail_places.py",
        "",
        "export type TransitPlace = {",
        "  id: string;",
        "  name: string;",
        "  aliases?: string[];",
        "  city?: string;",
        "  latitude: number;",
        "  longitude: number;",
        "  agency: 'CTA' | 'Metra';",
        "  mode: 'rail';",
        "  kind: 'station';",
        "  sourceStopId?: string;",
        "  lineCodes?: string[];",
        "};",
        "",
        "export const chicagoRailPlaces: TransitPlace[] = [",
    ]
    for record in all_records:
        parts.append(record.to_typescript_object())
    parts.append("]\n")
    return "\n".join(parts)


def main() -> int:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("chicagoRailPlaces.ts")

    print("Downloading CTA rail data...")
    cta_records = build_cta_records()
    print(f"CTA stations built: {len(cta_records)}\n")

    print("Downloading Metra GTFS data...")
    metra_records = build_metra_records()
    print(f"Metra stations built: {len(metra_records)}\n")

    ts_text = build_output(cta_records, metra_records)
    output_path.write_text(ts_text, encoding="utf-8")

    total = len(cta_records) + len(metra_records)
    print(f"Wrote {output_path} ({total} total records)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())