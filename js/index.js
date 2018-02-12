$(function() {
  
  var genderDonut, ageRepartitionPie, chart;
  
  var period = "24h", oneTick = 1;
  
  var query = {
    fromDate: new Date(Date.now() - convertPeriodToMs('1d')).toISOString(),
    toDate: new Date(),
    aboutAWeekAgo: new Date(Date.now() - convertPeriodToMs('7d')).toISOString()
  };
  
  var token = 'YOUR TOKEN';
  
  var globalUrl = 'https://data.angus.ai';
  
  var urlGlobal = `/api/1/entities?metrics=satisfaction,gender,category,passing_by,interested,stop_time,attention_time`;
  
  var urlChart = `/api/1/entities?metrics=passing_by,interested&time=by_hour`;
  
  
  function convertPeriodToMs(period) {
    if (period.indexOf('m') !== -1) {
      var minutes = parseInt(period.split('m')[0]);
      return minutes * 60 * 1000;
    } else if(period.indexOf('h') !== -1) {
      var hours = parseInt(period.split('h')[0]);
      return hours * 60 * 60 * 1000;
    } else if(period.indexOf('d') !== -1) {
      var days = parseInt(period.split('d')[0]);
      return days * 24 * 60 * 60 * 1000;
    }
  }
  
  function getCurrentTime() {
    return new Date(Date.now());//.setHours(0, 0, 0, 0);
  }
  
  var load;
  $(document).ajaxStart(function() {
    load = setTimeout(function() {
      $('#loading').show();
    }, 3000);
  });

  $(document).ajaxStop(function () {
    clearTimeout(load);
    $('#loading').hide();
  });
  
  $( '.pie-timer' ).show();
  
  setInterval(function () {
    aggregateAndDisplayData(client_id);
  }, 60000);
  
  $('[data-toggle="tooltip"]').tooltip();
  
  $('.period').on('click', function(e) {
    
    switch ($(this).html()) {
        
      case "24 hours (default)":
        $("#current_period_of_time").html("Data for the last 24 hours");
        period = "24h";
        oneTick = 1;
        break;
      case "3 days":
        $("#current_period_of_time").html("Data for the last 3 days");
        period = "3d";
        oneTick = 3;
        break;
      case "1 week":
        $("#current_period_of_time").html("Data for the last week");
        period = "7d";
        oneTick = 12;
        break;
    }
    
    getData();
    
  });
  
  
  function getGlobalData(cb) {
    var twoHoursBefore = 0;
    if (period !== '24h') {
      //twoHoursBefore = convertPeriodToMs('2h');
    }
    var fromDate = (new Date(getCurrentTime() - convertPeriodToMs(period) - twoHoursBefore).toISOString());
    $.ajax({
      type: 'GET',
      url: globalUrl + urlGlobal + `&from_date=${fromDate}`,
      headers: { 'Authorization': `Bearer ${token}` },
      success: function (results) {
        cb(null, results);
      },
      error: function(a, b, c) {
        cb('Error');
      }
    });
  }
  
  function getChartData(urlPage, cb) {
    var twoHoursBefore = 0;
    if (period !== '24h') {
      //twoHoursBefore = convertPeriodToMs('2h');
    }
    var fromDate = (new Date(getCurrentTime() - convertPeriodToMs(period) - twoHoursBefore).toISOString());
    var url = urlPage ? globalUrl + urlPage : (globalUrl + urlChart + `&from_date=${fromDate}`);
    $.ajax({
      type: 'GET',
      url: url,
      headers: { 'Authorization': `Bearer ${token}` },
      success: function (results) {
        cb(null, results);
      },
      error: function(a, b, c) {
        cb('Error');
      }
    });
  }
  
  function getData() {
    getGlobalData(function(err, results) {
      if (!err) {
        gender(results);
        attentionTime(results);
        stoppingTime(results);
        passingBy(results);
        interested(results);
        ageRepartition(results);
      } else {
        console.log(err);
      }
    });
  
    retrieveAndParseChartData(function(err) {
      if (err) {
        console.log(err);
        alert('Please refresh token in index.js file. At this page https://console.angus.ai/api-token-authstream/');
      }
    });
  }
  
  function getFirstTick(oneTickInMs, numberOfTicks) {
    // End of Period
    var now = new Date();
    var beginningOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    var nbOfFinishedTicksSinceBeginningOfDay = Math.floor((now - beginningOfDay) / oneTickInMs);
    beginningOfDay -= 0;
    var previousTickDate = beginningOfDay + (nbOfFinishedTicksSinceBeginningOfDay * oneTickInMs);
    
    // Beginning of the period
    var firstDateOnGraph = previousTickDate - (numberOfTicks * oneTickInMs);
    
    return firstDateOnGraph;
  }
  
  function parseAndDrawChart(entities) {
    var timestamps = [], passingByes = [], interested = [], entitiesArray = [];
    var oneTickInMs = convertPeriodToMs(`${oneTick}h`);
    var numberOfTicks = convertPeriodToMs(period) / oneTickInMs;
    
    for (let timestamp in entities) {
      entitiesArray.push({
        timestamp: new Date(timestamp),
        passingBy: entities[timestamp].passing_by.value, 
        interested: entities[timestamp].interested.value 
      });
    }
    
    entitiesArray.sort(function(a, b) {
      return a.timestamp - b.timestamp;
    });
    
    var countPassingBy = 0, countInterested = 0;
    var workingDate = getFirstTick(oneTickInMs, numberOfTicks);
    var countTicks = 0;
    for (var i = 0; i < entitiesArray.length && countTicks <= numberOfTicks + 1; i++) {
      if (entitiesArray[i].timestamp.getTime() === workingDate + oneTickInMs) {
        timestamps.push(new Date(workingDate));
        passingByes.push(countPassingBy);
        interested.push(countInterested);
        countPassingBy = entitiesArray[i].passingBy;
        countInterested = entitiesArray[i].interested;
        workingDate += oneTickInMs;
        countTicks += 1;
      } else {
        countPassingBy += entitiesArray[i].passingBy;
        countInterested += entitiesArray[i].interested;
      }
    }
    
    if (!chart) {
      chart = c3.generate({
        bindto: '#chart',
        data: {
          x:'Temps',
          columns:[
            ['Number of interested people'].concat(interested),
            ['Number of people passing by'].concat(passingByes),
            ['Temps'].concat(timestamps)
          ],
          colors: {
            'Number of interested people' : '#FCCB5C',
            'Number of people passing by' : '#5C96FC'
          },
          type: 'area'
        },
        axis:{
          x: {
            type: 'timeseries',
            tick: {
              format: function (x) { // x comes in as a time string.
                switch (period) {
                  case '24h':
                    return d3.time.format('%H:%M')(x);
                  case '3d':
                    return d3.time.format('%d/%m %H:%M')(x);
                  case '7d':
                    return d3.time.format('%d/%m')(x);
                }
              }
            }
          }
        },
        tooltip: {
          format: {
            title: function (x) { return d3.time.format('%d/%m/%Y %H:%M')(x); }
          }
        },
        size: {
          width: 800,
          height: 200
        }
      });
    } else {
      //Plus besoin de crée la courbe de 0, juste une recharge suffit
      chart.load({
        columns:[
          ['Number of interested people'].concat(interested),
          ['Number of people passing by'].concat(passingByes),
          ['Temps'].concat(timestamps)
        ]
      });
    }
  }
  
  function retrieveAndParseChartData(cb) {
    var entities = {}, lastResults = null;
    
    async.during(
      function (callback) {
        if (lastResults) {
          return callback(null, lastResults.next_page); 
        } else {
          getChartData(null, function(err, results) {
            if (err) return callback(err);
            lastResults = results;
            entities = results.entities;
            return callback(null, results.next_page);
          });
        }
      },
      function (callback) {
        getChartData(lastResults.next_page, function(err, results) {
          if (err) return callback(err);
          lastResults = results;
          $.extend(entities, results.entities);
          callback();
        });
      },
      function (err) {
        if (err) return cb(err);
        parseAndDrawChart(entities);
      }
    );
  }
  
  function gender(results){
    var dataGender = results.entities.global.gender;

    if(dataGender["male"] !== 0 || dataGender["female"] !== 0 || dataGender["?"] !== 0) {
      if (!genderDonut) {
          genderDonut = c3.generate({
            bindto: "#gender_donut",
            data: {
              columns: [
                  ['Male'].concat(dataGender['male']),
                  ['Female'].concat(dataGender['female']),
                  ['Unknown'].concat(dataGender['?'])
              ],
              colors: {
                  'Male': "#447ebc",
                  'Female': "#e5a8e2",
                  'Unknown': "#629e51"
              },
              type: 'donut'
            },
            legend: {
              position: 'right'
            },
            donut: {
              label: {
                  show: false
              },
              width: 15
            },
            size: {
              height: 110
            }
        });
      } else {
        genderDonut.load({
          columns: [
            ['Male'].concat(dataGender['male']),
            ['Female'].concat(dataGender['female']),
            ['Unknown'].concat(dataGender['?'])
          ]
        });
      }
    }
  }
  
  function stoppingTime(results) {
    $("#stopping_time").html(Math.floor(results.entities.global.stop_time.value));
  }
  
  function passingBy(results) {
    $("#passing_by").html(results.entities.global.passing_by.value);
  }
  
  function interested(results) {
    $("#interested").html(results.entities.global.interested.value);
  }
  
  function attentionTime(results) {
    $("#attention_time").html(Math.ceil(results.entities.global.attention_time.value));
  }
  
  function ageRepartition(results) {
    var repartition = results.entities.global.category;
    
    if (repartition["young_male"] !== 0 || repartition["senior_male"] !== 0 || repartition["young_female"] !== 0 || repartition["senior_female"] !== 0) {
      if (!ageRepartitionPie) {
        ageRepartitionPie = c3.generate({
          bindto: '#age_repartition_pie',
          data: {
            columns: [
              ['Young male'].concat(repartition['young_male']),
              ['Senior male'].concat(repartition['senior_male']),
              ['Young female'].concat(repartition['young_female']),
              ['Senior female'].concat(repartition['senior_female'])
            ],
            colors: {
              'Young male': "#447ebc",
              'Senior male': "#f2c96d",
              'Young female': "#ba43a9",
              'Senior female': "#7eb26d"
            },
            type: 'pie'
          },
          legend: {
              position: 'right'
          },
          pie: {
            label: {
              show: false
            }
          },
          size: {
            height: 100
          }
        });
      } else {
        ageRepartitionPie.load({
          columns: [
            ['Young male'].concat(repartition['young_male']),
            ['Senior male'].concat(repartition['senior_male']),
            ['Young female'].concat(repartition['young_female']),
            ['Senior female'].concat(repartition['senior_female'])
          ]
        });
      }
    }
  }
  
  getData();
  
});