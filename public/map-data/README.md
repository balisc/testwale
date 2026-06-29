# India Official Boundary Overlay

To render India map boundaries as per official Indian standard (including disputed regions as required by your policy), add this file:

- `public/map-data/india-official-boundary.geojson`

Optional:

- Set `NEXT_PUBLIC_INDIA_BOUNDARY_GEOJSON_URL` in `.env.local` to load the same GeoJSON from a remote trusted source.

Notes:

- Use only a legally approved/officiated boundary dataset for India (for example, from your licensed/government-compliant provider).
- The map practice page automatically overlays this boundary in `India` scope when the file is available.
