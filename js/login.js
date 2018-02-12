$(function() {
  
  $('.submit').on('click', function(e) {
    e.preventDefault();
    var data = {
      username: $('#email').val(), 
      client_id: $('#clientId').val(), 
      access_token: $('#accessKey').val()
    };
    
    $.ajax({
      method: 'POST',
      url: 'https://console.angus.ai/api-token-authstream',
      data: data,
      dataType: 'json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      success: function(results) {
        console.log(results);
        //window.location.href = './index.html';
      },
      error: function() {
        console.log('error');
      }
    });
  });
  
});