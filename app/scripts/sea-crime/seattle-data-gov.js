'use strict';

angular.module('mkm.seaCrimeData', [
    'ngMaterial'
  ])
  .service('seattleDataGov', ['$http', '$q', function($http, $q) {

    var _mapBounds = new google.maps.LatLngBounds();

    var _http = $http({
      'method': 'GET',
      'url': 'https://data.seattle.gov/resource/7ais-f98f.json'
        // url: 'scripts/sea-crime/7ais-f98f.json'
    });

    var $fillColor = d3.scale.category20();

    function getIncidentParent(report) {
      return (report.indexOf('-') === -1) ?
        report :
        report.slice(0, report.indexOf('-'));
    }

    function processIncidentData(data) {

      var _plots_ = [];

      for (var i = data.length - 1; i >= 0; i--) {
        /*
          GET report object

          extends _mapBounds and adds a GEOJSON report object to _plots_
        */
        var _report_ = data[i];

        _report_.fillColor = $fillColor(getIncidentParent(_report_.offense_type));

        var _longitude = Number(_report_.longitude);
        var _latitude = Number(_report_.latitude);

        if (!isNaN(_longitude) && !isNaN(_latitude)) {

          _mapBounds.extend(new google.maps.LatLng(_latitude, _longitude));

          _plots_.push({
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [_longitude, _latitude],
            },
            'properties': _report_
          });

        }
      }

      return {
        reports: _plots_
      };
    }

    function buildIndex(data) {

      var $indxOffType = d3.nest()
        .key(function(d) {
          try {

            return getIncidentParent(d.offense_type);

          } catch (e) {
            console.log(e);
            console.log(d);
          }
        })
        .entries(data);

      $fillColor.domain($indxOffType
        .map(function(d) {
          return d.key;
        })
        .reverse());

      return $indxOffType.map(function(d) {

        d.fillColor = $fillColor(d.key);

        return d;

      });
    }

    /*
      Promise is resolved with data from returned from _http
       that has been processed by processIncidentData
       this is then rendered by directives
    */
    var _promise = $q.defer();

    _http
      .then(function(response) {

        var $index = buildIndex(response.data);

        var processedData = processIncidentData(response.data, $index);

        _promise.resolve({
          'incidents': processedData.reports,
          'index': $index.sort(function(a, b) {
              return d3.ascending(a.values.length, b.values.length);
            })
            .reverse(),
          'mapBounds': _mapBounds
        });
      });

    return _promise;

  }]);
