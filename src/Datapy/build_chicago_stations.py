#!/usr/bin/env python3
"""
Build a TypeScript station file for a Geo Alarm app from official Chicago transit data.

Sources used by this script:
- CTA current 'L' stop list CSV (City of Chicago open data)
- Metra current static GTFS ZIP

Outputs:
- chicagoStations.ts

Run:
    python build_chicago_stations.py
or:
    python build_chicago_stations.py /path/to/output/chicagoStations.ts
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple

CTA_CSV_URL = "https://data.cityofchicago.org/api/views/8pix-ypme/rows.csv?accessType=DOWNLOAD"
METRA_GTFS_URL = "https://schedules.metrarail.com/gtfs/schedule.zip"

LINE_COLUMN_MAP = {
    "red": "Red",
    "blue": "Blue",
    "g": "Green",
    "green": "Green",
    "brn": "Brown",
    "brown": "Brown",
    "p": "Purple",
    "pexp": "Purple Express",
    "y": "Yellow",
    "yellow": "Yellow",
    "pnk": "Pink",
    "pink": "Pink",
    "o": "Orange",
    "orange": "Orange",
}

PAREN_RE = re.compile(r"\s*\([^)]*\)")
WHITESPACE_RE = re.compile(r"\s+")


@dataclass
class StationRecord:
    id: str
    name: str
    latitude: float
    longitude: float
    aliases: Set[str] = field(default_factory=set)
    lines: Set[str] = field(default_factory=set)
    city: Optional[str] = None

    def to_typescript_object(self) -> str:
        aliases = sorted(a for a in self.aliases if a and a != self.name)
        parts = [
            f"  {{",
            f"    id: {json.dumps(self.id)},",
            f"    name: {json.dumps(self.name)},",
        ]
        if aliases:
            parts.append(f"    aliases: {json.dumps(aliases)},")
        if self.lines:
            parts.append(f"    line: {json.dumps(', '.join(sorted(self.lines)))},")
        if self.city:
            parts.append(f"    city: {json.dumps(self.city)},")
        parts.extend(
            [
                f"    latitude: {self.latitude:.8f},",
                f"    longitude: {self.longitude:.8f},",
                f"  }},",
            ]
        )
        return "\n".join(parts)


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def normalize_key(name: str) -> str:
    return WHITESPACE_RE.sub(" ", name).strip().lower()


def cleaned_alias(name: str) -> str:
    value = PAREN_RE.sub("", name or "")
    value = WHITESPACE_RE.sub(" ", value).strip(" -")
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

    # Handles CSV location strings like: (41.878723, -87.63374)
    m = re.match(r"\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?", raw)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Handles WKT-like POINT (-87.6317 41.8755)
    m = re.match(r"POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)", raw, flags=re.I)
    if m:
        lon = float(m.group(1))
        lat = float(m.group(2))
        return lat, lon

    return None, None


def canonical_name(value: str) -> str:
    value = WHITESPACE_RE.sub(" ", value or "").strip()
    return value


def load_csv_rows(raw_bytes: bytes) -> List[Dict[str, str]]:
    text = raw_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def load_zip_csvs(raw_bytes: bytes) -> Dict[str, List[Dict[str, str]]]:
    out: Dict[str, List[Dict[str, str]]] = {}
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        for name in zf.namelist():
            if not name.lower().endswith(".txt"):
                continue
            with zf.open(name) as fh:
                text = fh.read().decode("utf-8-sig")
                out[name] = list(csv.DictReader(io.StringIO(text)))
    return out


def build_cta_records() -> List[StationRecord]:
    raw = fetch_bytes(CTA_CSV_URL)
    rows = load_csv_rows(raw)
    records: Dict[str, StationRecord] = {}

    for row in rows:
        lowered = {k.lower(): (v or "") for k, v in row.items()}

        map_id = lowered.get("map_id") or lowered.get("mapid") or lowered.get("map id")
        station_name = canonical_name(lowered.get("station_name") or lowered.get("station name") or lowered.get("stop_name") or lowered.get("name"))
        descriptive = canonical_name(lowered.get("station_descriptive_name") or lowered.get("station descriptive name"))
        stop_name = canonical_name(lowered.get("stop_name") or lowered.get("stop name"))

        lat = parse_float(lowered.get("latitude"))
        lon = parse_float(lowered.get("longitude"))

        if lat is None or lon is None:
            location_fields = [
                lowered.get("location"),
                lowered.get("the_geom"),
                lowered.get("point"),
            ]
            for candidate in location_fields:
                maybe_lat, maybe_lon = parse_location_pair(candidate or "")
                if maybe_lat is not None and maybe_lon is not None:
                    lat, lon = maybe_lat, maybe_lon
                    break

        if not station_name or lat is None or lon is None:
            continue

        station_id = f"cta-{map_id}" if map_id else f"cta-{normalize_key(station_name).replace(' ', '-') }"
        record = records.get(station_id)
        if record is None:
            record = StationRecord(
                id=station_id,
                name=station_name,
                latitude=lat,
                longitude=lon,
                city="Chicago",
            )
            records[station_id] = record

        if descriptive:
            record.aliases.add(descriptive)
        if stop_name:
            record.aliases.add(stop_name)
            clean_stop = cleaned_alias(stop_name)
            if clean_stop:
                record.aliases.add(clean_stop)

        clean_station = cleaned_alias(station_name)
        if clean_station and clean_station != station_name:
            record.aliases.add(clean_station)

        for col, line_name in LINE_COLUMN_MAP.items():
            value = lowered.get(col, "").strip().lower()
            if value in {"true", "t", "1", "yes", "y"}:
                record.lines.add(line_name)

    return sorted(records.values(), key=lambda r: (r.name.lower(), r.id))


def build_metra_records() -> List[StationRecord]:
    raw = fetch_bytes(METRA_GTFS_URL)
    tables = load_zip_csvs(raw)

    stops = {row["stop_id"]: row for row in tables.get("stops.txt", []) if row.get("stop_id")}
    routes = {row["route_id"]: row for row in tables.get("routes.txt", []) if row.get("route_id")}
    trips = {row["trip_id"]: row for row in tables.get("trips.txt", []) if row.get("trip_id")}

    station_records: Dict[str, StationRecord] = {}

    # roll stop-level records up to parent station when present
    for row in tables.get("stop_times.txt", []):
        stop_id = row.get("stop_id", "")
        trip_id = row.get("trip_id", "")
        stop = stops.get(stop_id)
        trip = trips.get(trip_id)
        if not stop or not trip:
            continue

        route = routes.get(trip.get("route_id", ""), {})
        line = (route.get("route_short_name") or route.get("route_long_name") or "").strip()

        parent_id = (stop.get("parent_station") or "").strip()
        station_id = parent_id or stop_id
        station = stops.get(station_id, stop)

        station_name = canonical_name(station.get("stop_name") or stop.get("stop_name") or "")
        lat = parse_float(station.get("stop_lat") or stop.get("stop_lat") or "")
        lon = parse_float(station.get("stop_lon") or stop.get("stop_lon") or "")

        if not station_name or lat is None or lon is None:
            continue

        app_station_id = f"metra-{station_id}"
        rec = station_records.get(app_station_id)
        if rec is None:
            rec = StationRecord(
                id=app_station_id,
                name=station_name,
                latitude=lat,
                longitude=lon,
            )
            station_records[app_station_id] = rec

        if line:
            rec.lines.add(line)

        stop_alias = canonical_name(stop.get("stop_name") or "")
        if stop_alias and stop_alias != station_name:
            rec.aliases.add(stop_alias)
            clean_alias = cleaned_alias(stop_alias)
            if clean_alias:
                rec.aliases.add(clean_alias)

        clean_station = cleaned_alias(station_name)
        if clean_station and clean_station != station_name:
            rec.aliases.add(clean_station)

    return sorted(station_records.values(), key=lambda r: (r.name.lower(), r.id))


def build_output(cta_records: List[StationRecord], metra_records: List[StationRecord]) -> str:
    all_records = sorted(cta_records + metra_records, key=lambda r: (r.name.lower(), r.id))
    parts = [
        "// Auto-generated from official CTA and Metra public data sources.",
        "// Generated by build_chicago_stations.py",
        "",
        "export type Station = {",
        "  id: string;",
        "  name: string;",
        "  aliases?: string[];",
        "  line?: string;",
        "  city?: string;",
        "  latitude: number;",
        "  longitude: number;",
        "};",
        "",
        f"export const stations: Station[] = [",
    ]

    for record in all_records:
        parts.append(record.to_typescript_object())

    parts.append("]\n")
    return "\n".join(parts)


def main() -> int:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("chicagoStations.ts")

    print("Downloading CTA station data...")
    cta_records = build_cta_records()
    print(f"CTA stations built: {len(cta_records)}")

    print("Downloading Metra GTFS data...")
    metra_records = build_metra_records()
    print(f"Metra stations built: {len(metra_records)}")

    ts_text = build_output(cta_records, metra_records)
    output_path.write_text(ts_text, encoding="utf-8")

    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
