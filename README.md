# Address Lookup Widget

This widget allows users to input their address and get back data concerning the geographies in which their address is located, using data from the Census MAF/TIGER database via the Census Geocoder API.

This widget is tailored to return Narrative Profile URLs (main branch). However, it is intended to be available for adaptation to return other geographies and integration in multiple applications around the U.S. Census Bureau where users currently have to use the separate Geocoder application.

## Branch: tract-only

The version on this branch was inspired by the original motivation for this project: users for various Census applications want to see data for their neighborhood, but few users will know the tract number for their neighborhood. This version includes only the narrative profile for tract, as other geographies may introduce further complexity and bugs.

## Example Addresses

These are the main addresses used during testing.

1. 1600 Pennsylvania Ave NW, Washington, DC 20500-0003
   - State Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=state&state=11>
      - geoId=11
   - County Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county&state=11&county=001>
     - geoId=11001
   - Place Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=place&state=11&place=50000>
     - geoId=1150000
   - Tract Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=tract&tract=006202&state=11&county=001>
     - geoId=11001006202
   - ZCTA (Zip Code Tabulation Area) Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=zcta&zcta=20006&state=11>
     - geoId=20006
   - MSA (Metropolitan/Micropolitan Statistical Area) <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=msa&msa=47900>
     - geoId=47900
   - American Indian Area / Alaska Native Area / Hawaiian Homeland Narrative Profile:: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=aian&aian=0010>
   - County Subdivision Narrative Profile Prediction (profile not yet available): <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county%20subdivision&county_sub=50000>
     - geoId=50000
   - County Subdivision Narrative Profile: <https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county%20subdivision&state=11&county=001&county_sub=50000>
2. 9229 East Marginal Way South Tukwila, WA 98108
3. Micropolitan MSA: 3895 Punahele Rd, Princeville, Hawaii 96722
4. AIA: 9575 Ethan Wade Way SE, Snoqualmie, WA 98065
5. HH: 168 Kahanu St, Kaunakakai, HI 96748
6. ANA: 617 Rangeview Ave, Homer, AK 99603

## How to Add a New Geography

1. Add the official layer name to layersArr defined in address-lookup-widget.js. This will be the layer queried to the Geocoder API. You can find the official layer name to use by pasting an address at the end of the API endpoing <https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?benchmark=Public_AR_Current&vintage=ACS2019_Current&layers=all&format=json&address=> and looking for relevant layer names in the geographies returned. There are layers in the Geocoder API layers documentation that have names that seem relevant but are not actually returned in API calls, even when set to return all layers.
2. If creating narrative profile URLs: add a new entry in geo-types.json of the form
   """
   "official layer name" : {
       "geoType": "value for the geotype URL parameter",
       "geoVar": "variable that represents its own URL parameter"
   }
   """
   (geoType and geoVar will most likely have the same value if geoType has no spaces in it)
3. If creating any sort of URLs from your geo data: Reference the needed URL form. Determine if your use case for the new geography data requires any additional URL parameters not already handled by the widget, or if the geoId extracted needs to have further digits (e.g. state id or county id) removed (i.e. as already determined by the arrays considerState and considerCounty in makeNarrativeProfileUrl()). This may entail storing more data in each geoData object (in extractGeoData()).

## Miscellaneous Notes

### RE: User Input

Anything between the street address & city (e.g. apartment number) is ignored automatically.

### RE: Making Narrative Profile Urls

There seems to usually be a positive correlation between which geos require state/county id as a parameter in their narrative profiles url and that those geos also include those ids in the geoid, but not always. For example, subdivision url doesn't need the state parameter (though having it doesn't hurt), but it DOES need to have the state id removed from the geography's geoId. Also, ZTCA urls need the state parameter, but the geocoder api doesn't return STATE attribute (id) for that geography nor can it be derived from the ZCTA geoId (also means it doesn't need to have stateId removed from the geoId). The current solution is this: store the state geography geoId separately and use it as a substitute if the state is undefined for a geography that needs it. If a developer is adapting the widget to work for more geographies, they may run into similar issues. It is unclear how common issues inconsistencies like those above are.
