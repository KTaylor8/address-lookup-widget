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
    let geoType, geoVar, displayedGeoType;
    if (json[geo[0]] === undefined) {
        console.log(`unable to find geo ${geo[0]} in json`);
    } else {
        geoType = json[geo[0]].geoType;
        geoVar = json[geo[0]].geoVar;
        displayedGeoType = json[geo[0]].displayedGeoType;
    }
    let geoInfo = geo[1][0];

    let countyId = geoInfo.COUNTY?.padStart(3, '0') || '';

    // geoId used as narrative profile url parameter should only include numbers
    let geoId = geoInfo.GEOID.replace(/[^0-9]+/g, '');

    let geoData = {
        name: geoInfo.NAME,
        geoType: geoType || undefined, // for geotype= param
        geoVar: geoVar || undefined, // for naming its own variable param
        stateId: geoInfo.STATE || undefined, // only used if zcta is NOT 1 of geos requested
        countyId: countyId, // ignore 1st 2 digits: stateId
        geoId: geoId, // for the val of the param that geoVar represents
        displayedGeoType: displayedGeoType
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
    let considerState = ['county', 'place', 'tract', 'zcta', 'county subdivision'];
    let considerCounty = ['tract', 'county subdivision'];
    let id = geoData.geoId; // id used in url isn't always geoId

    // determine additional query paramters to add
    if ( considerState.includes(geoData.geoType) ) {
        if (geoData.geoType === 'tract') {
            console.log(`countyId for tract === ${geoData.countyId}`);
        }

        let st = undefined;
        try {
            st = geoData.stateId || stateId;
            // console.log(`st for ${geoData.geoType} = ${st}`);
            // posssible that they may differ for geos that stretch over multiple states
        } catch (e) {
            console.log('Neither a STATE attribute for this geography nor a geoId from the state geography has been detected. You need one or the other in order to create links to each narrative profile.');
            alert('An error occurred while processing data for your address. Any links returned by this tool may not function correctly.');
        }
        
        url += `&state=${st}`;

        // remove stateId from geoId
        if ( id.slice(0, st.length) === st ) { // excludes zcta
            id = id.slice(st.length); 
            // console.log(`id for ${geoData.geoType} after removing state: ${id}`);    
        }

        if ( considerCounty.includes(geoData.geoType) ) {
            url += `&county=${geoData.countyId}`;

            // remove countyId from geoId
            if ( id.slice(0, geoData.countyId.length) === geoData.countyId) {
                id = id.slice(geoData.countyId.length);
                // console.log(`id for ${geoData.geoType} after removing county: ${id}`);
            }
        }
    }
    url += `&${geoData.geoVar}=${id}`;
    url = encodeURI(url);
    return url;
}

/**
 * Takes array of geographies & displays them as results on widget
 * @param {Array} geos 
 */
function displayResults(geos) {
    let resultsSuccessText = 'Found links to profiles for:';
    if ($('#resultsDescriptor').text() != resultsSuccessText) { // transition from pending text
        $('#resultsDescriptor').text(resultsSuccessText);
    }
    $('#resultsList').empty();

    // let displayOrder = [
    // ]

    let stateGeoId = geos.States?.[0].GEOID || undefined;
    console.log(stateGeoId);

    
    let geosArr = Object.entries(geos);
    console.log(geosArr);
    geosArr.forEach((geo) => {
        extractGeoData(geo).then( (geoData) => {
            let geoUrl = makeNarrativeProfileUrl(geoData, stateGeoId);

            let html = $(`<p class="singleResult"><a href="${geoUrl}" target="_blank">${geoData.displayedGeoType}: ${geoData.name}</a></p><hr>`);
            // let html = $(`<p class="singleResult"><a href="${geoUrl}" target="_blank">${geoData.geoType}: ${geoData.name}<br>(${geoUrl})</a></p><hr>`); // for testing only

            // temporarily disable sub division option
            if (geoData.geoType === 'county subdivision') {
                html = $(`<p class="singleResult"><a href="${geoUrl}" target="_blank" onclick="event.preventDefault()" style="color: black; text-decoration: none;">${geoData.displayedGeoType}: ${geoData.name} <br> (coming soon)</a></p><hr>`);
            }

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
                $('#resultsDescriptor').text(`No results for this address`)
            } else { // true success
                let geos = match[0].geographies;
                // console.log(`matchedAddress: ${match[0].matchedAddress}`);
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
