/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

// console.log('hello world');
let url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=4600+Silver+Hill+Rd%2C+Washington%2C+DC+20233&benchmark=2020&format=json';
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