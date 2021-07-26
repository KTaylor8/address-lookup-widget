/** JS for Address Lookup Widget
 * Widget made by Katie Taylor with advising by Peggy Gill
*/

console.log('hello world');
let url = '';
$.ajax({
    url: url,
    dataType: "html",
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