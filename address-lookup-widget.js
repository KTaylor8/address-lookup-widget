/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003
// 9229 East Marginal Way South Tukwila, WA 98108
// Micro: 3895 Punahele Rd, Princeville, Hawaii 96722
// AIA: 9575 Ethan Wade Way SE, Snoqualmie, WA 98065
// HH: 168 Kahanu St, Kaunakakai, HI 96748
// ANA: 617 Rangeview Ave, Homer, AK 99603

// Note: anything between the st address & city (e.g. apartment) is ignored automatically

function noAddressesErr(address) {
    alert(`No geographies found for address "${address}"`);
    $('#resultsDescriptor').text(`No geographies found for address "${address}"`)
    // alt: display an element on page
}

// varies based on geos used
async function extractGeoData(geo) {
    let geoTypesFile = './geo-types.json'; // will need to change filepath for web3
    const json = await $.ajax({
        url: geoTypesFile,
        dataType: 'json',
        error: () => {console.log(`cannot get data from ${geoTypesFile}`);}
    });
    let geoType, geoVar;
    if (json[geo[0]] === undefined) {
        console.log(`unable to find geo ${geo[0]} in json`);
    } else {
        geoType = json[geo[0]].geoType;
        geoVar = json[geo[0]].geoVar;
    }
    let geoInfo = geo[1][0];

    let countyId = geoInfo.COUNTY?.padStart(3, '0') || '';

    // geoId used as narrative profile url parameter should only include numbers
    let geoId = geoInfo.GEOID.replace(/[^0-9]+/g, '');

    let geoData = {
        name: geoInfo.NAME,
        geoType: geoType || undefined, // for geotype= param
        geoVar: geoVar || undefined, // for naming its own variable param
        stateId: geoInfo.STATE || undefined, // only used if zcta is NOT 1 of the requested geos
        countyId: countyId, // ignore 1st 2 digits: stateId
        geoId: geoId, // for the val of the param that geoVar represents
    };
    return geoData;
}

function makeNarrativeProfileUrl(geoData, stateId) {
    let profilesYear = '2019';
    let url = `https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/${profilesYear}/report.php?geotype=${geoData.geoType}`;
    let considerState = ['county', 'place', 'tract', 'zcta', 'county subdivision'];
    // there seems to usually be a link between which geos require state/county id as a param in their narrative profiles url and that those geos also include those ids in the geoid, but not always
    // subdivision url doesn't need state param (but can't hurt) but it DOES need to have stateId removed from geoId
    // zcta url needs state param but doesn't need to have stateId removed from geoId
    // unsure how common issues inconsistencies like those above are 
    let considerCounty = ['tract', 'county subdivision'];
    let id = geoData.geoId; // id used in url isn't always geoId

    // determine additional query paramters to add
    if ( considerState.includes(geoData.geoType) ) {
        if (geoData.geoType === 'tract') {
            console.log(`countyId for tract === ${geoData.countyId}`);
        }

        let st = undefined;
        try {
            // console.log(`geoData.stateId for ${geoData.geoType}: ${geoData.stateId}`);
            // console.log(`stateId for ${geoData.geoType}: ${stateId}`);
            st = geoData.stateId || stateId;
            // console.log(`st for ${geoData.geoType} = ${st}`);
            // posssible that they may differ for geos that stretch over multiple states
        } catch (e) {
            console.log('Neither a STATE attribute for this geography nor a geoId from the state geography has been detected. You need one or the other in order to create links to each narrative profile.');
            alert('An error occurred while processing data for your address. Any links returned by this tool may not function correctly.');
        }
        
        url += `&state=${st}`;

        // remove stateId from geoId -- i tried to nest these but may need to be separate
        if ( id.slice(0, st.length) === st ) { // not zcta
            id = id.slice(st.length); 
            console.log(`id for ${geoData.geoType} after removing state: ${id}`);    
        }

        if ( considerCounty.includes(geoData.geoType) ) {
            url += `&county=${geoData.countyId}`;

            // remove countyId from geoId
            if ( id.slice(0, geoData.countyId.length) === geoData.countyId) {
                id = id.slice(geoData.countyId.length);
                console.log(`id for ${geoData.geoType} after removing county: ${id}`);
            }
        }
    }
    url += `&${geoData.geoVar}=${id}`;
    url = encodeURI(url);
    return url;
}

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=state&state=11
// geoId=11
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county&state=11&county=001
// geoId=11001
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=place&state=11&place=50000
// geoId=1150000
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=tract&tract=006202&state=11&county=001
// geoId=11001006202
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=zcta&zcta=20006&state=11
// geoId=20006
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2019/report.php?geotype=msa&msa=47900
// geoId=47900
// AIAN ex: https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=aian&aian=0010
// county subdivision prediction: https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county%20subdivision&county_sub=50000
// geoId=50000
https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county%20subdivision&state=11&county=001&county_sub=50000


/**
 * Takes array of geographies & displays them on widget
 */
function displayResults(geos) {
    let resultsSuccessText = 'Narrative Profiles for';
    if ($('#resultsDescriptor').text() != resultsSuccessText) { // transition from pending text
        $('#resultsDescriptor').text(resultsSuccessText);
    }
    $('#resultsList').empty();

    // let displayOrder = [

    // ]

    // issue: zcta requires state in params for narrative profiles, but geocoder api doesn't return STATE attribute (id) for that geography nor can it be derived from the zcta geoid
    // solution: need to store state id separately
    let stateGeoId = geos.States?.[0].GEOID || undefined;
    console.log(stateGeoId);

    // let additionalParams = ['state', 'county'];

    // geos currently displayed in whatever order they get fetched from geocoder, but I'll want to sort them into the order of the narrative profiles at some point
    let geosArr = Object.entries(geos);
    console.log(geosArr);
    geosArr.forEach((geo) => {
        extractGeoData(geo).then( (geoData) => {
            // make narrative profile url from geo
            let geoUrl = makeNarrativeProfileUrl(geoData, stateGeoId);
            // console.log(makeNarrativeProfileUrl(geoData));
            // let geoUrl = '';

            // display result on page
            // let html;
            // html = $(`<p class="singleResult"><a href="${geoUrl}">${geoData.geoType}: ${geoData.name}</a></p><hr>`);
            let html = $(`<p class="singleResult"><a href="${geoUrl}">${geoData.geoType}: ${geoData.name}<br>(${geoUrl})</a></p><hr>`); // for testing only

            $('#resultsList').append(html);
            $(html).slideDown();
        });
        
    });
    
}

$('#addressSubmit').on('click', function() {
    /** clear traces of previous results */
    $('#resultsList').empty();
    $('#resultsDescriptor').text('Looking up address...');

    if ($('#resultsDescriptor').css('display') === 'none') {
        $('#resultsDescriptor').slideDown('slow');
    }

    /** process input */
    let address = document.getElementById('addressInput').value;
    console.log(`address entered: ${address}`);
    let benchmark = 'Public_AR_Current';
    let vintage = 'ACS2019_Current'; // current to ACS, not (decennial) Census
    let layersArr = [
        'States', // required for '2010 Census ZIP Code Tabulation Areas' layer
        '2010 Census ZIP Code Tabulation Areas', // requires 'States' layer
        'Counties',
        'County Subdivisions',
        'Census Tracts',
        // places:
        'Census Designated Places',
        'Incorporated Places',
        // msas:
        'Metropolitan Statistical Areas',
        'Micropolitan Statistical Areas',
        // aians:
        'Federal American Indian Reservations',
        'Hawaiian Home Lands',
        'Alaska Native Village Statistical Areas'
    ];
    let layers = layersArr.join(',');
    // let layers = 'all';
    let url = encodeURI(`https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?benchmark=${benchmark}&vintage=${vintage}&layers=${layers}&format=json&address=${address}`);
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        crossDomain: true,
        success: function( resp ) {
            console.log(resp);
            let match = resp.result.addressMatches;
            
            // sometimes errs returned on success
            if (resp.errors) {
                let errorMsg = '';
                resp.errors.forEach((errorStr) => {
                    errorMsg += (' ' + errorStr);
                    console.log('ERROR in response: ', errorStr);
                });
                noAddressesErr(address);
            } else if (match.length === 0) {
                noAddressesErr(address);
            } else if ( Object.entries(match[0].geographies).length === 0 ) {
                console.log(`Error: The Census' TIGERweb API isn't returning any geographies for this address`);
            } else { // true success
                // console.log(`matchedAddress: ${match[0].matchedAddress}`);
                let geos = match[0].geographies;
                // console.log('Geos returned:');
                // console.log(geos);
                // console.log(`number of geos: ${Object.keys(geos).length}`);
                displayResults(geos);
            }
        }
        ,
        error: function( err ){
            console.log(err);
            console.log(err.responseJSON);

            let errorMsg = '';
            // most common error is if address is empty or >100 chars
			try {
				let errs = err.responseJSON.errors || err.responseJSON.exceptions;
				console.log(errs);
				errs.forEach((errorStr) => {
					errorMsg += errorStr;
					console.log('ERROR (No response): ', errorStr);
				});
			} catch (e) {
				console.log(`no responseJSON for error. verify that it's not a cors issue`);
				errorMsg = 'An unexpected error has occurred with the app / Geocoder service';
			}
            alert(errorMsg);
        }
    });
});
