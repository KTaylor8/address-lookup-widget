/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003
// 9229 East Marginal Way South Tukwila, WA 98108
// 3895 Punahele Rd, Princeville, Hawaii 96722

// Note: anything between the st address & city (e.g. apartment) is ignored automatically

function noAddressesErr(address) {
    alert(`No matches found for address "${address}"`);
    // alt: display an element on page
}

// varies based on geos used
async function extractGeoData(geo) {
    let geoTypesFile = './geo-types.json';
    const json = await $.ajax({
        url: geoTypesFile,
        dataType: 'json',
        // async: false,
        // success: processJson,
        error: () => {console.log(`cannot get data from ${geoTypesFile}`);}
    }) // will need to change filepath
    // console.log('past getJSON');
    // console.log('result: ', result);
    // console.log('accessing json to get geoData');
    let geoType = json[geo[0]].geoType;
    let geoVar = json[geo[0]].geoVar;
    // let geoType = geo[0]; // unsure at what point the geography type should be converted into singular geoType
    let geoInfo = geo[1][0];
    let countyId = '';
    try {
        countyId = geoInfo?.COUNTY.slice(2, 5).padStart(3, '0') || null;
    } catch (e) {} // idk why short-circuiting still throws an error
    // console.log(geoInfo);
    console.log(`county: ${countyId}`);

    let geoData = {
        name: geoInfo.NAME,
        geoType: geoType || null, // for geotype= param
        geoVar: geoVar || null, // for naming its own variable param
        stateId: geoInfo.STATE || '',
        countyId: countyId, // ignore 1st 2 digits: stateId
        geoId: geoInfo.GEOID,
    };
    // console.log('geoData in async: ', geoData);
    return geoData;
    // displayResults2(geoData);
}

function makeNarrativeProfileUrl(geoData) {
    let url = `https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=${geoData.geoType}`;
    let considerState = ['county', 'place', 'tract', 'zcta', 'county subdivision'];
    // there seems to usually be a link between which geos require state/county id as a param in their narrative profiles url and that those geos also include those ids in the geoid, but not always
    // subdivision url doesn't need state param (but can't hurt) but it DOES need to have stateId removed from geoId
    // zcta url needs state param but doesn't need to have stateId removed from geoId
    // unsure how common issues inconsistencies like those above are 
    let considerCounty = ['tract', 'county subdivision'];
    let id = geoData.geoId; // id used in url isn't always geoId

    // determine additional query paramters to add
    if ( considerState.includes(geoData.geoType) ) {
        url += `&state=${geoData.stateId}`;
        // remove stateId from geoId -- i tried to nest these but may need to be separate
        if ( id.slice(0, geoData.stateId.length) === geoData.stateId ) { // not zcta
            id = id.slice(geoData.stateId.length); 
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

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003, United States
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
    if ($("#results").css('display') === 'none') {
        alert('sliding down results descriptor');
        $("#results").slideDown();
        $("#resultsDescriptor").slideDown();
    }
    $("#resultsList").empty();
    // $("#resultsList").append('<h4 style="margin-bottom: 20px;">Results:</h4>')

    // if () {
    //     $("#resultsList").append('<p>No results found for that match!</p>');
    // } else {

    // let displayOrder = [

    // ]

    // geos currently displayed in whatever order they get fetched from geocoder
    geos.forEach((geo) => {
        extractGeoData(geo).then( (geoData) => {
            // make narrative profile url from geo
            let geoUrl = makeNarrativeProfileUrl(geoData);
            // console.log(makeNarrativeProfileUrl(geoData));
            // let geoUrl = '';

            // display result on page
            let html;
            // html = $(`<p class="singleResult"><a href="${geoUrl}">${geoData.geoType}: ${geoData.name}</a></p><hr>`);
            html = $(`<p class="singleResult"><a href="${geoUrl}">${geoData.geoType}: ${geoData.name}<br>(${geoUrl})</a></p><hr>`); // for testing only
            // html = $(`<p class="singleResult"><a href="">${geoUrl}</a></p><hr>`); // testing only
            // html = $(`<p class="singleResult"><a href="">${geoData.geoType}: ${geoData.name}</a></p><hr>`); // testing only


            $("#resultsList").append(html);
            $(html).slideDown();
        });
        
    });
    
}

$('#addressSubmit').on('click', function() {
    let address = document.getElementById("addressInput").value;
    console.log(`address entered: ${address}`);
    let benchmark = 'Public_AR_Current';
    let vintage = 'ACS2019_Current'; // current to ACS, not (decennial) Census
    let layersArr = [
        'States',
        'Counties',
        'Places',
        'Census Tracts',
        '2010 Census ZIP Code Tabulation Areas',
        'Metropolitan Statistical Areas', // 'Metropolitan Statistical Areas' || 'Micropolitan Statistical Areas'
        'Micropolitan Statistical Areas',
        // '', //aian
        'County Subdivisions'
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
            // console.log(resp.result);
            
            // sometimes errs returned on success
            if (resp.errors) {
                let errorMsg = '';
                resp.errors.forEach((errorStr) => {
                    errorMsg += (' ' + errorStr);
                    console.log('ERROR in response: ', errorStr);
                });
                noAddressesErr(address);
            } else if (resp.result.addressMatches.length === 0) {
                noAddressesErr(address);
            } else { // true success
                console.log(`matchedAddress: ${resp.result.addressMatches[0].matchedAddress}`);
                let geos = resp.result.addressMatches[0].geographies;
                console.log('Geos returned:');
                console.log(geos);
                console.log(`number of geos: ${Object.keys(geos).length}`);
                let geosArr = Object.entries(geos);
                console.log(geosArr);
                displayResults(geosArr);
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
				console.log('no responseJSON for error');
				errorMsg = 'An error has occurred';
			}
            alert(errorMsg);
        }
    });
});
