/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003, United States
  // https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=place&state=11&place=50000
  // https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=msa&msa=47900
// 9229 East Marginal Way South Tukwila, WA 98108
// 3895 Punahele Rd, Princeville, Hawaii 96722

// Note: anything between the st address & city (e.g. apartment) is ignored automatically

function noAddressesErr(address) {
    alert(`No matches found for address "${address}"`);
    // alt: display an element on page
}

// varies based on geos used
function extractGeoData(geo) {
    // let geoType = '';
    // switch (geo[0]) { // may make more automated later
    //     case 'state': 
    //         geoType = '';
    //         break;
    //     case 'county':
    //         geoType = ''; 
    //         break;
    //     case 'place': 
    //         geoType = '';
    //         break;
    //     case 'tract': 
    //         geoType = '';
    //         break;
    //     case 'state': 
    //         geoType = '';
    //         break;
    //     case 'state': 
    //         geoType = '';
    //         break;
    //     case 'state': 
    //         geoType = '';
    //         break;
    //     case 'state': 
    //         geoType = '';
    //         break;
    // }
    let geoType = geo[0]; // unsure at what point the geography type should be converted into singular geoType
    let geoData = geo[1][0];
    return {
        name: geoData.NAME,
        geoType: geoType,
        stateId: geoData.STATE || null,
        geoId: geoData.GEOID,
    };
}

function makeNarrativeProfileUrl(geoData) {
    let url = `https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=${geoData.geoType}&${geoData.geoType}=`;
    switch (geoData.geoType) {
        // case 'state': 
        //     url += ``;
        //     break;
        case 'county': 
        case 'place':
            url += `state=${geoData.stateId}`;
            break;
        case 'tract': 
            url += ``;
            break;
        case 'state': 
            url += ``;
            break;
        case 'state': 
            url += ``;
            break;
        case 'state': 
            url += ``;
            break;
        case 'state': 
            url += ``;
            break;
    }

    return url;
}

// 1600 Pennsylvania Ave NW, Washington, DC 20500-0003, United States
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=state&state=11
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=county&state=11&county=001
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=place&state=11&place=50000
// tract ex: https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=tract&tract=000100&state=11&county=001
// ZIP ex: https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=zcta&zcta=20001
// https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=msa&msa=47900
// AIAN ex: https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/2018/report.php?geotype=aian&aian=0010


/**
 * Takes array of geographies & displays them on widget
 */
function displayResults(geos) {
    if ($("#resultsDescriptor").css('display') === 'none') {
        $("#resultsDescriptor").slideDown();
    }
    $("#resultsList").empty();
    // $("#resultsList").append('<h4 style="margin-bottom: 20px;">Results:</h4>')

    // if () {
    //     $("#resultsList").append('<p>No results found for that match!</p>');
    // } else {

    // let displayOrder = [

    // ]

    geos.forEach((geo) => {
        // extract data from geo
        let geoData = extractGeoData(geo);
        console.log('geoData');
        console.log(geoData);

        // make narrative profile url from geo
        // let geoUrl = makeNarrativeProfileUrl(getData);
        let geoUrl = '';

        // display result on page
        let html;
        // html = $(`<p class="singleResult"><a href="${geoUrl}">${geoData.geoType}: ${geoData.name}</a></p><hr>`);
        // html = $(`<p class="singleResult"><a href="">${geoUrl}</a></p><hr>`); // testing only
        html = $(`<p class="singleResult"><a href="">${geoData.geoType}: ${geoData.name}</a></p><hr>`); // testing only


        $("#resultsList").append(html);
        $(html).slideDown();
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
        // 'Metropolitan Statistical Areas', // 'Metropolitan Statistical Areas' || 'Micropolitan Statistical Areas'
        // '',
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
