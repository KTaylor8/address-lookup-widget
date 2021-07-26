/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// console.log('hello world');
$('#addressSubmit').on('click', function() {
    let streetAddress = document.getElementById("addressInput").value;
    console.log(`streetAddress: ${streetAddress}`);
    // let streetAddress = `4600 Silver Hill Rd, Washington, DC 20233`;
    let benchmark = '2020';
    let vintage = 'Census2020_Census2020';
    let url = encodeURI(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${streetAddress}&benchmark=${benchmark}&format=json`);
    // let url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=4600+Silver+Hill+Road%2C+Washington+DC+20233&benchmark=2020&vintage=Census2020_Census2020&format=json';
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        crossDomain: true,
        // beforeSend: function() {
        // }
        // ,
        success: function( result ) {
            console.log(result);
        }
        ,
        error: function( err ){
        console.log(err);
        }
        // ,
        // complete: function() {
        // }
    });
});
