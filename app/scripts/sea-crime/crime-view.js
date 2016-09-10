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

    function processIncidentData(data) {
      /*
          Loops through data returns from 'https://data.seattle.gov/resource/7ais-f98f.json'
          Establishes parent/child relationships from offense description
          Assigns incident colors based up incident catefories
          creates a GEOJSON object to pass to mapCanvas directive compatable with Google Maps API standards
      */

      function indexUpdate(_report_) {

        //  PARENT TYPE
        var offType = _report_.offense_type;

        var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

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
      }

      /*
        GET report object

        extends _mapBounds and adds a GEOJSON report object to _plots_
      */
      function plotsAddReport(_report_) {
        var _longitude = Number(_report_.longitude);
        var _latitude = Number(_report_.latitude);

        if (!isNaN(_longitude) && !isNaN(_latitude)) {

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

      }

      function setIndexColors() {

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
      }


      var _index_ = {};

      var _plots_ = [];

      for (var i = data.length - 1; i >= 0; i--) {

        plotsAddReport(data[i]);

        indexUpdate(data[i]);
      }

      setIndexColors();

      return {
        reports: _plots_,
        index: _index_
      };
    }

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

  }])
  .directive('filterReportTypes', [function() {

    return {
      'templateUrl': 'views/template-crime-map-filter.html',
      'scope': {
        'filterInd': '=filterReportTypes',
        'filterMap': '=crimeMapFilter',
        'filterTime': '=crimeTimelineFilter'
      },
      'link': function(scope) {

        console.log(scope);

        // Used to update class on 'update buttons'
        scope.updated = false;


        // scope.openFilters = function($mdOpenMenu, ev) {
        //   console.log('you got it');

        //   $mdOpenMenu(ev);
        // };

        /*
          toggles clicked  index values 'show' attribute
          true / false
        */
        scope.filterPushSplice = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          this.val.show = !this.val.show;

          scope.updated = true;
        };

        /*
          filters any viz and maps based on current index
        */
        scope.filterApply = function($event) {

          $event.preventDefault();

          var _index = this.mapIndexFilter();

          // if (typeof this.mapIndexFilter === 'function') {
          scope.filterMap.update(_index);
          // }

          // if (typeof scope.$parent.$vizTimeline.filterData === 'function') {
          scope.filterTime.filterData(_index);
          // }

          scope.updated = false;
        };

        /*
          Sets all attributes 'show' to 'false' on index
        */
        scope.filterClear = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          for (var key in scope.filterInd) {

            scope.filterInd[key].show = false;
          }

          scope.updated = false;
        };

        /*
          Sets all attributes 'show' to 'true' on index
        */
        scope.filterReset = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          for (var key in scope.filterInd) {

            scope.filterInd[key].show = true;
          }

          scope.updated = true;
        };

        scope.mapIndexFilter = function() {
          var _index_ = scope.filterInd || {};

          // Create lookup array for speed
          var filteredArray = [];

          for (var key in _index_) {

            if (!_index_[key].show) {

              filteredArray.push(key);
            }
          }

          return filteredArray;
        };

        // scope.$indexLength = function() {
        //   return (this[filterInd] === undefined || null) ? 0 : Object.keys(this[filterInd]).length;
        // };
      }
    };

  }])
  .directive('summaryList', [function() {

    return {
      'templateUrl': 'views/template-summary-list.html'
    };

  }])
  .directive('crimeReportsSummary', [function() {
    function link(scope, element) {

      var summaryType = element.attr('crime-reports-summary');
      var summaryIndex = element.attr('summary-index');

      scope[summaryType] = {
        data: null,
        filtered: false,
        renderChart: function(reportTypes) {

          scope[summaryType].data = reportTypes;

          scope.$apply();
        }
      };

      /*
        Sets summarytype's data attribute to 'null'
        Hides view from DOM
      */
      scope.clearTypeDetail = function() {
        scope[summaryType].data = null;
      };

      scope.filterTypeDetail = function($event) {

        scope[summaryType].filtered = !scope[summaryType].filtered;

        if (scope[summaryType].filtered) {

          var d = scope[summaryType].data;

          var offenseCategory = (d.offenseCategory === 'VEH-THEFT-AUTO') ? 'VEH' : d.offenseCategory;

          scope.filterClear($event);

          scope[summaryIndex][offenseCategory].show = true;

          scope.filterApply($event);

        } else {

          scope.filterReset($event);

          scope.filterApply($event);
        }
      };
    }

    return {
      'link': link,
      'templateUrl': '/views/template-reports-summary.html'
    };

  }])
  .directive('incidentDetail', [function() {

    function link(scope, element) {
      var vizID = element.attr('timeline-id');

      scope.incidentDetail = null;

      if (document.getElementById('street-view-detail') !== null) {

        scope.$detailMap = new google.maps.Map(document.getElementById('street-view-detail'), {
          zoom: 14
        });
      }

      scope.closeDetail = function() {
        try {
          scope.mapID.$markers.close();
        } catch (e) {}

        scope[vizID].toolTipHide();

        this.incidentDetail = null;
      };
    }

    return {
      'link': link,
      'templateUrl': 'views/template-incident-detail.html'
    };

  }])
  .filter('orderObjectBy', function() {
    /*
        Originally found at:

        http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
    */
    return function(items, field, reverse) {

      var filtered = [];

      angular.forEach(items, function(item) {
        filtered.push(item);
      });

      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });

      if (reverse) {
        filtered.reverse();
      }

      return filtered;
    };

  });
