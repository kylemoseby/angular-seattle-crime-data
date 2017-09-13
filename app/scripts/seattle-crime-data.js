'use strict';

angular.module('mkm.seaCrimeData', [
    'ngMaterial'
  ])
  .service('seattleDataGov', ['$http', '$q', function($http, $q) {

    var _http = $http({
      'method': 'GET',
      'url': 'https://data.seattle.gov/resource/7ais-f98f.json'
      //  Test URL if data.gov is down / included with GitHub project
      // url: '/7ais-f98f.json'
    });

    /*
      Promise is resolved with data from returned from _http that has been processed by processIncidentData this is then rendered by directives
    */
    var _promise = $q.defer();

    _http.then(function(response) {

      function getIncidentParent(report) {
        return (report.indexOf('-') === -1) ?
          report :
          report.slice(0, report.indexOf('-'));
      }

      var $offTypeNest = d3.nest()
        .key(function(d) {
          try {
            return getIncidentParent(d.offense_type);
          } catch (e) {
            console.log(e);
            console.log(d);
          }
        })
        .entries(response.data);

      var $typeColorScale = d3.scaleOrdinal()
        .domain($offTypeNest
          .map(function(d) {
            return d.key;
          }))
        .range(d3.schemeCategory20);

      _promise.resolve({
        incidents: response.data,
        indexOffType: $offTypeNest,
        colorScaleOff: $typeColorScale
      });

    });

    return _promise;
  }])
  .controller('CrimeReportrsCtrl', ['$scope', 'seattleDataGov', 'mapStyle', function($scope, seattleDataGov, mapStyle) {

    $scope.$seaCrimeData = seattleDataGov;

    $scope.$seaCrimeData.promise.then(function(data) {

      $scope.$index = data.index;

      $scope.$reports = data.incidents;
    });

    $scope.mapStyle = mapStyle;
  }]);
