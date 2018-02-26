var Rest = {
  get: function(url, headers, cb) {
    axios({
      method:'get',
      url: url,
      headers: headers
    })
    .then(function(response) {
      cb(null, response.data);
    })
    .catch(function(err) {
      cb(err);
    });
  },
  post: function(url, headers, data, cb) {
    axios({
      method: 'post',
      url: url,
      headers: headers,
      data: data
    })
    .then(function(response) {
      cb(null, response.data);
    })
    .catch(function(err) {
      cb(err);
    });
  }
};