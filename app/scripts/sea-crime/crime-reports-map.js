'use strict';

angular.module('mkm.seaCrimeData')
  .directive('mapCanvas', ['$window', '$mdPanel', function($window) {
    return {
      'templateUrl': 'views/template-map-canvas.html',
      'scope': {
        '$promise': '=mapPromise',
        'mapStyle': '=mapStyle',
        'report': '=crimeReport'
      },
      link: function($scope, $element) {
        // var $detailModal = $mdPanel;

        var $map = (function() {

          var $googleMap = new google.maps.Map($element.children('.map-canvas')[0], {
            'scrollwheel': false,
            'streetViewControl': false,
            'mapTypeControl': false,
            'panControl': false,
            'maxZoom': 17
          });

          // Google map style options (like CSS)
          // https://mapstyle.withgoogle.com/
          if (!!$scope.mapStyle) {
            $googleMap.setOptions($scope.mapStyle);
          }

          var $mapBounds = function() {
            return new google.maps.LatLngBounds();
          };

          var $colorScale = null;

          return {
            addGEOJSON: function(reports) {

              var plots = [];

              var bounds = $mapBounds();

              for (var i = reports.length - 1; i >= 0; i--) {

                var report = reports[i];

                var longitude = Number(report.longitude);
                var latitude = Number(report.latitude);

                if (!isNaN(longitude) && !isNaN(latitude)) {

                  bounds.extend(new google.maps.LatLng(latitude, longitude));

                  plots.push({
                    'type': 'Feature',
                    'geometry': {
                      'type': 'Point',
                      'coordinates': [longitude, latitude],
                    },
                    'properties': report
                  });
                }
              }

              // $googleMap.data.loadGeoJson(plots);
              $googleMap.data.addGeoJson({
                "type": "FeatureCollection",
                "features": plots
              });

              $googleMap.fitBounds(bounds);

              return this;
            },
            applyFilters: function() {

              $googleMap.data.setStyle(function(feature) {
                return {
                  icon: {
                    'path': google.maps.SymbolPath.CIRCLE,
                    'scale': 4,
                    'fillColor': $colorScale(feature.f.offense_type),
                    'fillOpacity': 1,
                    'strokeWeight': 0
                  }
                };
              });

              return this;
            },
            clearMapData: function() {
              $googleMap.data.forEach(function(feature) {
                $googleMap.data.remove(feature);
              });

              return this;
            },
            setColorScale: function(colorScale) {
              $colorScale = colorScale;

              return this;
            }
          };
        })();

        $scope.$index = {};
        $scope.reportFilter = [];

        /*
            INITIATE FROM A PROMISE
        */
        if ($scope.$promise !== undefined) {

          $scope.$promise.promise
            .then(function(data) {

              $scope.dateRange = d3.extent(data.incidents, function(d) {
                return new Date(d.date_reported);
              });

              $scope.startDate = $scope.dateRange[0];
              $scope.endDate = $scope.dateRange[1];

              $scope.indexOffType = data.indexOffType;
              $scope.colorScaleOff = data.colorScaleOff;

              $map
                .setColorScale(data.colorScaleOff)
                .addGEOJSON(data.incidents)
                .applyFilters();
            });
        }
        /*
          INITIATE FROM AN INCIDENT
        */
        else if ($scope.report !== undefined) {

          var report = $scope.report;

          var _longitude = Number(report.longitude);
          var _latitude = Number(report.latitude);

          if (!isNaN(_longitude) && !isNaN(_latitude)) {

            // $map.data.setStyle(plotstyleDetail);

            var detailBounds = new google.maps.LatLngBounds();

            detailBounds.extend(new google.maps.LatLng(_latitude, _longitude));

            $map.fitBounds(detailBounds);

            // REFORMAT ON WINDOW RESIZE
            angular.element($window).bind('resize', function() {
              $map.fitBounds(detailBounds);
            });
          }
        }

        $scope.showApply = false;

        $scope.mapRefresh = function() {
          // $map.fitBounds($scope.mapBounds);
          $map.removeMapData();
        };

        $scope.filterToggleType = function($event) {
          $event.preventDefault();
          $event.cancelBubble = true;

          var toggleKey = $scope.reportFilter.indexOf(this.val.key);

          if (toggleKey === -1) {
            $scope.reportFilter.push(this.val.key);
          } else {
            $scope.reportFilter.splice(toggleKey, 1);
          }

          $scope.showApply = true;
        };

        $scope.dateChange = function($event) {
          $event.preventDefault();
          $scope.showApply = true;
        };

        $scope.filterApply = function($event) {
          $event.preventDefault();
          $map.applyFilters();
          $scope.showApply = false;
        };

        // REFORMAT ON WINDOW RESIZE
        angular.element($window).bind('resize', function() {
          // $map.fitBounds($scope.mapBounds);
        });
      }
    };
  }]);
