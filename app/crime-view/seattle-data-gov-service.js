'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .service('seattleDataGov', ['$http', '$q', function($http, $q) {
    console.log('fired');

    var _mapBounds = new google.maps.LatLngBounds();

    var _http = $http({
      'method': 'GET',
      'url': 'https://data.seattle.gov/resource/7ais-f98f.json'
        // url: 'crime-view/7ais-f98f.json'
    });

    /*
      Promise is resolved with data from returned from _http
       that has been processed by processIncidentData
       this is then rendered by directives
    */
    var _promise = $q.defer();

    _http
      .then(function(response) {
        var processedData = processIncidentData(response.data);

        _promise.resolve({
          'incidents': processedData.reports,
          'index': processedData.index,
          'mapBounds': _mapBounds
        });
      });

    return _promise;

    function processIncidentData(data) {
      /*
          Loops through data returns from 'https://data.seattle.gov/resource/7ais-f98f.json'
          Establishes parent/child relationships from offense description
          Assigns incident colors based up incident catefories
          creates a GEOJSON object to pass to mapCanvas directive compatable with Google Maps API standards
      */

      var _index_ = {};

      var _plots_ = [];

      for (var i = data.length - 1; i >= 0; i--) {

        plotsAddReport(data[i]);

        indexUpdate(data[i]);
      }

      function indexUpdate(_report_) {

        //  PARENT TYPE
        var offType = _report_.offense_type;

        var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

        if (_index_.hasOwnProperty(parentType)) {

          var childrenNow = _index_[parentType].children;

          _index_[parentType].children = updateIndex(offType, childrenNow);

          _index_[parentType].count++;

        } else if (parentType !== undefined) {

          // if code is node found a new $inex object property is created
          _index_[parentType] = {
            'count': 1,
            'offenseCategory': offType === 'VEH-THEFT-AUTO' ? offType : parentType,
            'show': true,
            'children': null
          };

          _index_[parentType].children = updateIndex(offType, {});
        }

        function updateIndex(typeStr, currentChildren) {

          if (typeStr !== 'VEH-THEFT-AUTO') {

            var newChildren = getChildType(typeStr);

            for (var i = newChildren.length - 1; i >= 0; i--) {
              var childType = newChildren[i];

              if (currentChildren.hasOwnProperty(childType)) {
                currentChildren[childType].count++;
              } else {
                currentChildren[childType] = {
                  $type: childType,
                  count: 1
                };
              }
            }
          }

          return currentChildren;
        }

        /*
            Returns all childtypes from index

            requires report full report type string

            uses indexof('-') to splice string and get childtypes
        */
        function getChildType(typeStr) {

          var q = typeStr;
          var childTypes = [];

          while (q.lastIndexOf('-') !== -1) {
            childTypes.push(q.slice(q.lastIndexOf('-') + 1, q.length));

            q = q.slice(0, q.lastIndexOf('-'));
          }

          return childTypes;
        }
      }

      /*
        GET report object

        extends _mapBounds and adds a GEOJSON report object to _plots_
      */
      function plotsAddReport(_report_) {
        var _longitude = Number(_report_.longitude);
        var _latitude = Number(_report_.latitude);

        _mapBounds.extend(new google.maps.LatLng(_latitude, _longitude));

        _plots_.push({
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [_longitude, _latitude]
          },
          'properties': _report_
        });
      }

      (function setIndexColors() {

        // function colorBrewer(ind) {
        //   var brew = [
        //     '#1f78b4',
        //     '#b2df8a',
        //     '#33a02c',
        //     '#fb9a99',
        //     '#a6cee3',
        //     '#e31a1c',
        //     '#fdbf6f',
        //     '#ff7f00',
        //     '#cab2d6',
        //     '#6a3d9a',
        //     '#ffff99',
        //     '#b15928'
        //   ];

        //   return brew[ind % brew.length];
        // }

        // var q = 0;

        // for (var key in _index_) {

        //   _index_[key].fillColor = colorBrewer(q);

        //   q++;
        // }

        var d3Colour = d3.scale.category20()
          .domain(d3.keys(_index_));

        for (var key in _index_) {
          _index_[key].fillColor = d3Colour(key);
        }
      }());

      return {
        reports: _plots_,
        index: _index_
      };
    }

  }]);
