'use strict';
angular.module('mkm.seaCrimeData')
  .directive('seattleCrimeMap', ['seattleDataGov', 'mapStyle', function(seattleDataGov, mapStyle) {
    // Runs during compile
    return {
      controller: function($scope) {

        $scope.getIncidentParent = function(report) {
          return (report.indexOf('-') === -1) ?
            report :
            report.slice(0, report.indexOf('-'));
        };

        $scope.$seaCrimeData = seattleDataGov;

        $scope.$seaCrimeData.promise
          .then(function(data) {

            $scope.$index = data.index;

            $scope.$reports = data.incidents;


            $scope.dateRange = d3.extent(data.incidents, function(d) {
              return new Date(d.date_reported);
            });

            $scope.filters.startDate = $scope.dateRange[0];
            $scope.filters.endDate = $scope.dateRange[1];

            $scope.indexOffType = data.indexOffType;
            $scope.colorScaleOff = data.colorScaleOff;

          });

        $scope.mapStyle = mapStyle !== undefined ? mapStyle : null;
      }
    };
  }])
  .directive('mapCanvas', ['$window', '$mdPanel', function($window, $mdPanel) {

    // REPORT DETAIL MODAL
    var $panel = $mdPanel;

    var $detailModal = function(_incident) {

      var position = $panel.newPanelPosition()
        .absolute()
        .center();

      $panel.open({
          attachTo: angular.element(document.body),
          controller: function($scope, mdPanelRef, incidentDetail) {
            $scope.incidentDetail = incidentDetail;
            $scope.closeDetail = function() {
              this.incidentDetail = null;
              mdPanelRef.close();
            };
          },
          panelClass: 'map-report-detail',
          controllerAs: 'ctrl',
          templateUrl: 'views/template-incident-detail.html',
          zIndex: 150,
          disableParentScroll: true,
          hasBackdrop: true,
          position: position,
          trapFocus: true,
          clickOutsideToClose: true,
          escapeToClose: true,
          focusOnOpen: true,
          targetEvent: event,
          locals: {
            incidentDetail: _incident
          }
        })
        .finally(function() {

          var $modalElm = document.getElementById('street-view-detail');

          // slect element from modal that was just created
          // class .map-report-detail defined above at Init
          var StreetView = new google.maps.Map($modalElm, {
            scrollwheel: false,
            zoomControl: false,
            zoom: 0
          });

          var panorama = new google.maps.StreetViewPanorama(
            $modalElm, {
              'position': {
                'lat': Number(_incident.latitude),
                'lng': Number(_incident.longitude)
              },
              'pov': {
                'heading': 34,
                'pitch': 1
              },
              'zoom': 0,
              'scrollwheel': false
            });

          StreetView.setStreetView(panorama);
        });
    };
    // END REPORT DETAIL MODAL

    return {
      require: '^seattleCrimeMap',
      link: function($scope, $element) {

        $scope.$map = (function() {

          var $googleMap = new google.maps.Map($element[0], {
            'scrollwheel': false,
            'streetViewControl': false,
            'mapTypeControl': false,
            'panControl': false,
            'maxZoom': 17
          });


          function markerClick($event) {
            // $scope.$infoWindow($googleMap, $event);

            $detailModal($event.feature.f);
          }

          $googleMap.data.addListener('click', markerClick);

          // Google map style options (like CSS)
          // https://mapstyle.withgoogle.com/
          if (!!$scope.mapStyle) {
            $googleMap.setOptions($scope.mapStyle);
          }

          return {

            addCrimeData: function(reports) {

              var plots = [];

              var $mapBounds = new google.maps.LatLngBounds();

              // Opacity <>
              function filterByDate(reportDate) {

                var dateReported = new Date(reportDate);

                return (dateReported >= $scope.filters.startDate && dateReported <= $scope.filters.endDate) ? true : false;
              }

              // Opacity Array.length of > 0
              function filterByType(reportType) {
                return ($scope.filters.reportFilter.indexOf($scope.getIncidentParent(reportType)) > -1) ? false : true;
              }

              // Add report count {{reports.length}} to progress bar
              $scope.progressBar.setVal('max', reports.length);

              // filter reports loop
              for (var i = reports.length - 1; i >= 0; i--) {

                var _report_ = reports[i];

                var long = Number(_report_.longitude);
                var lati = Number(_report_.latitude);

                // valid location
                if (!isNaN(long) && !isNaN(lati)) {
                  // filter type filter date /push/bounds
                  if (filterByDate(_report_.date_reported)) {

                    if (filterByType(_report_.offense_type)) {

                      $mapBounds.extend(new google.maps.LatLng(lati, long));

                      plots.push({
                        'type': 'Feature',
                        'geometry': {
                          'type': 'Point',
                          'coordinates': [long, lati],
                        },
                        'properties': _report_
                      });
                    }
                  }
                  // end valid lat/long
                }
                // end validation

                // update progress bar
                $scope.progressBar.setVal('now', 1);

                if (i === 0) {

                  $scope.progressBar.loadingComplete();
                }
              }
              // END filter reports loop

              $googleMap.data.addGeoJson({
                "type": "FeatureCollection",
                "features": plots
              });

              $googleMap.fitBounds($mapBounds);

              // REFORMAT ON WINDOW RESIZE
              angular.element($window).bind('resize', function() {

                $googleMap.fitBounds($mapBounds);
              });

              return this;
            },

            applyFilters: function() {

              $googleMap.data.setStyle(function(feature) {
                return {
                  icon: {
                    'path': google.maps.SymbolPath.CIRCLE,
                    'scale': 4,
                    'fillColor': typeof($scope.colorScaleOff) === 'function' ? $scope.colorScaleOff($scope.getIncidentParent(feature.f.offense_type)) : 'transparent',
                    'fillOpacity': 1,
                    'strokeWeight': 0
                  }
                };
              });

              return this;
            },

            removeCrimeData: function() {

              $googleMap.data.forEach(function(feature) {
                $googleMap.data.remove(feature);
              });

              return this;
            }
          };
        })();

        $scope.mapRefresh = function() {

          $scope.$map.removeCrimeData();
        };

        // $scope.filterToggleType = function($event) {
        //   $event.preventDefault();
        //   $event.cancelBubble = true;
        //   var toggleKey = $scope.filters.reportFilter.indexOf(this.val.key);
        //   if (toggleKey === -1) {
        //     $scope.filters.reportFilter.push(this.val.key);
        //   } else {
        //     $scope.filters.reportFilter.splice(toggleKey, 1);
        //   }
        //   $scope._apply = true;
        // };

        $scope.filterAll = function() {

          for (var filter in $scope.indexOffType) {

            $scope.indexOffType[filter].filtered = false;
          }

          $scope._apply = true;
        };

        $scope.filterNone = function() {

          for (var filter in $scope.indexOffType) {

            $scope.indexOffType[filter].filtered = true;
          }

          $scope._apply = true;
        };

        $scope.dateChange = function($event) {

          $event.preventDefault();

          $scope._apply = true;
        };

        $scope.filterApply = function($event) {

          $event.preventDefault();

          $scope.$map.removeCrimeData();

          $scope.filters.reportFilter = $scope.indexOffType.filter(function(d) {
              if (!d.filtered) {
                return d;
              }
            })
            .map(function(d) {
              return d.key;
            });

          $scope.$map.addCrimeData($scope.$reports);
          $scope.$map.applyFilters();

          $scope._apply = false;
        };


        // INIT
        if ($scope.$seaCrimeData !== undefined) {

          $scope.$seaCrimeData.promise
            .then(function(data) {
              $scope.$map
                .addCrimeData(data.incidents)
                .applyFilters();

              $scope.indexOffType.sort(function(a, b) {
                return d3.descending(a.values.length, b.values.length);
              });

            });

        } else if ($scope.report !== undefined) {

          var report = $scope.report;

          $scope.filters.startDate = new Date(report.date_reported);
          $scope.filters.endDate = new Date(report.date_reported);

          var _longitude = Number(report.longitude);
          var _latitude = Number(report.latitude);

          if (!isNaN(_longitude) && !isNaN(_latitude)) {

            var detailBounds = new google.maps.LatLngBounds();

            detailBounds.extend(new google.maps.LatLng(_latitude, _longitude));

            $scope.$map
              .addCrimeData([report])
              .applyFilters();
          }

        }
      }
    };
  }])
  .directive('mapFilters', [function() {
    return {
      require: '^seattleCrimeMap',
      templateUrl: 'views/template-map-filters.html',
      link: function($scope) {

        $scope.filters = {
          reportFilter: [],
          startDate: new Date(),
          endDate: new Date(),
        };

        $scope._apply = false;

        $scope.applyShow = function() {
          $scope._apply = true;
        };

        $scope.colorScaleOff = d3.schemeCategory20;
      }
    };
  }])
  .directive('mapLoadProgress', ['$animate', function($animate) {

    return {
      require: '^seattleCrimeMap', // Array = multiple requires, ? = optional, ^ = check parent elements
      link: function($scope, $element) {
        console.log($element);
        $animate.on('addClass', $element, function callback(element, phase) {
          // cool we detected an enter animation within the container
          console.log(element);
          console.log(phase);
        });

        $scope.progressBar = {
          valnow: 0,
          valmin: 0,
          valmax: 0,
          loaded: false,

          setVal: function(prop, val) {

            $scope.progressBar['val' + prop] += val;
          },

          valWidth: function() {

            var _width_ = Math.floor(this.valnow / this.valmax) * 100;

            return _width_ + '%';
          },

          loadingComplete: function() {

            this.loaded = true;
          }
        };
      }
    };
  }]);
