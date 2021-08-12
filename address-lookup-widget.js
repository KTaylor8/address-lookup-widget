/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

/**
 * Extracts data from geographies returned by Geocoder API and turns it into a usable geoData object
 * (Will vary based on geos used)
 * @param {Array} geo Geography data returned by Geocoder API
 * @returns {Object} geoData
 */
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

    let countyId = geoInfo.COUNTY?.padStart(3, '0') || undefined;

    // geoId used as narrative profile url parameter should only include numbers
    let geoId = geoInfo.GEOID.replace(/[^0-9]+/g, '');

    let geoData = {
        name: geoInfo.NAME,
        geoType: geoType || undefined, // for geotype= param
        geoVar: geoVar || undefined, // for naming its own variable param
        stateId: geoInfo.STATE || undefined, // only used if zcta is NOT 1 of geos requested
        countyId: countyId, // ignore 1st 2 digits: stateId
        geoId: geoId, // for the val of the param that geoVar represents
    };
    return geoData;
}

/**
 * Create url for a geography's narrative profile based on extracted geography data
 * @param {Object} geoData from extractGeoData()
 * @param {string} stateId substitute for undefined geoData.stateId (e.g. for ZCTA), sourced from States geo
 * @returns {string} url for geography's narrative profile
 */
function makeNarrativeProfileUrl(geoData, stateId = undefined) {
    let profilesYear = '2019';
    let url = `https://www.census.gov/acs/www/data/data-tables-and-tools/narrative-profiles/${profilesYear}/report.php?geotype=${geoData.geoType}`;
    let id = geoData.geoId; // id used in url isn't always geoId
    let st = geoData.stateId;

    url += `&state=${st}`;
    id = id.slice(st.length); // remove stateId from geoId
    // console.log(`id for ${geoData.geoType} after removing state: ${id}`);    

    url += `&county=${geoData.countyId}`;
    id = id.slice(geoData.countyId.length); // remove countyId from geoId
    // console.log(`id for ${geoData.geoType} after removing county: ${id}`);

    url += `&${geoData.geoVar}=${id}`;
    url = encodeURI(url);
    return url;
}

/**
 * Takes array of geographies & displays them as results on widget
 * @param {Array} geos 
 */
function displayResults(geos) {
    let resultsSuccessText = 'Tract found:';
    if ($('#resultsDescriptor').text() != resultsSuccessText) { // transition from pending text
        $('#resultsDescriptor').text(resultsSuccessText);
    }
    $('#resultsList').empty();

    let geosArr = Object.entries(geos);
    console.log(geosArr);
    geosArr.forEach((geo) => {
        extractGeoData(geo).then( (geoData) => {
            let geoUrl = makeNarrativeProfileUrl(geoData);

            let html = $(
                `<div class="singleResult">
                    ${geoData.name}
                    <a href="${geoUrl}" target="_blank">
                        <button class="uscb-secondary-button" type="button">View Narrative Profile</button>
                    </a>
                    <hr>
                </div>`
            );

            $('#resultsList').append(html);
            $(html).slideDown();
        }); 
    });
}

/**
 * Indicate that no geographies were found for an address
 * (May be used to display an element on the page to indicate the error)
 * @param {string} address address entered by user
 */
 function noAddressesErr(address) {
    alert(`No geographies found for address "${address}"`);
    $('#resultsDescriptor').text(`No geographies found for address "${address}"`)
    // alt option: display an element on page
}

/**
 * Handle on-click submission of address input
 */
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
    let layer = 'Census Tracts';
    // layer = 'all';
    let url = encodeURI(`https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?benchmark=${benchmark}&vintage=${vintage}&layers=${layer}&format=json&address=${address}`);
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        crossDomain: true,
        success: function( resp ) {
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
                $('#resultsDescriptor').text(`No results for this address`)
            } else { // true success
                let geos = match[0].geographies;
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
                $('#resultsDescriptor').text(`Unable to return results.`)
			} catch (e) {
				console.log(`no responseJSON for error. verify that it's not a cors issue`);
				errorMsg = `We're sorry, an unexpected error has occurred with the app / Geocoder service`;
                $('#resultsDescriptor').text(`Unable to access database. Please try again later.`)

			}
            alert(errorMsg);
        }
    });
});
