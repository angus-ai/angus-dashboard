$(function() {
  
  let storage = window['localStorage'];
  let url = 'https://ppd-console.angus.ai/api-token-authstream/';
  
  $('#submit').on('click', function(e) {
    e.preventDefault();
    var data = {
      username: $('#email').val(), 
      client_id: $('#clientId').val(), 
      access_token: $('#accessToken').val()
    };
    
    hideErrorMessages();
    
    Rest.post(url, {}, data, function(err, results) {
      if (!err) {
        storage.setItem('username', data.username);
        storage.setItem('clientId', data.client_id);
        storage.setItem('accessToken', data.access_token);
        storage.setItem('authToken', results.token);
        window.location.href = './index.html';
      } else {
        parseError(err.response.data);
      }
    });
    
  });
  
  function hideErrorMessages() {
    $('#emailError').addClass('hide');
    $('#clientIdError').addClass('hide');
    $('#accessTokenError').addClass('hide');
    $('#error').addClass('hide');
  }
  
  function parseError(error) {
    if (error.username) {
      $('#emailError').removeClass('hide');
      $('#emailError').text(error.username);
    }
    if (error.client_id) {
      $('#clientIdError').removeClass('hide');
      $('#clientIdError').text(error.client_id);
    }
    if (error.access_token) {
      $('#accessTokenError').removeClass('hide');
      $('#accessTokenError').text(error.access_token);
    }
    
    if (error.non_field_errors) {
      $('#error').removeClass('hide');
      $('#error').text(error.non_field_errors[0]);
    }
  }
  
});