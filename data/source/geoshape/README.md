
## Simplified using mapshaper.org
- removed details with Visvalingam / effective area method (21.5%)
http://www.mapshaper.org/

## join original file with LC Codes
- better to generate such file
mapshaper -i dc_polygon.topo.json -join data.csv keys=DC_CODE,DC_CODE:str fields=LC_CODE -o dc_with_lc.topo.json

- merging them & simplify
mapshaper -i dc_with_lc.topo.json --dissolve LC_CODE copy-fields=LC_CODE  -simplify 20%
