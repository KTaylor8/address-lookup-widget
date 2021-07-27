/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// 4600 Silver Hill Rd, Washington, DC 20233
// 516 High St, Bellingham, WA 98225, United States

// Note: anything between the st address & city (e.g. apartment) is ignored automatically

function noAddressesErr(address) {
    alert(`No matches found for address "${address}"`);
    // alt: display an element on page
}

$('#addressSubmit').on('click', function() {
    let address = document.getElementById("addressInput").value;
    console.log(`address entered: ${address}`);
    // let address = `4600 Silver Hill Rd, Washington, DC 20233`;
    let benchmark = 'Public_AR_Current';
    let vintage = 'ACS2019_Current'; // current to ACS, not (decennial) Census
    // let layersArr = [
    //     'States',
    //     'Counties',
    //     'Places',
    //     'Census Tracts',
    //     '2010 Census ZIP Code Tabulation Areas',
    //     'Metropolitan Statistical Areas',
    //     '',
    //     'County Subdivisions'
    // ];
    // let layers = layersArr.join(' ');
    let layers = 'all';
    let url = encodeURI(`https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?benchmark=${benchmark}&vintage=${vintage}&layers=${layers}&format=json&address=${address}`);
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        crossDomain: true,
        success: function( resp ) {
            console.log(resp);
            // console.log(resp.result);
            if (resp.errors) {
                let errorMsg = '';
                resp.errors.forEach((errorStr) => {
                    errorMsg += (' ' + errorStr);
                    console.log('ERROR in response: ', errorStr);
                });
                noAddressesErr(address);
            } else if (resp.result.addressMatches.length === 0) {
                noAddressesErr(address);
            } else {
                console.log(`matchedAddress: ${resp.result.addressMatches[0].matchedAddress}`);
                let geos = resp.result.addressMatches[0].geographies;
                console.log('Geos returned:');
                console.log(geos);
                console.log(`number of geos: ${Object.keys(geos).length}`);
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
