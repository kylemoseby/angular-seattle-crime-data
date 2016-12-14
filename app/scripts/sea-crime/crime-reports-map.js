'use strict';

angular.module('mkm.seaCrimeData')
  .directive('mapCanvas', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {
      'templateUrl': 'views/template-map-canvas.html',
      'scope': {
        '$promise': '=mapPromise',
        'mapStyle': '=mapStyle',
        'report': '=crimeReport'
      },

      link: function link($scope, $element) {

        var infowindow = null;

        $scope.$index = {};
        $scope.reportFilter = [];

        $scope.startDate = null;
        $scope.endDate = null;

        $scope.$panel = $mdPanel;


        var $map = new google.maps.Map($element.children('.map-canvas')[0], {
          'scrollwheel': false,
          'streetViewControl': false,
          'mapTypeControl': false,
          'panControl': false,
          'maxZoom': 17
        });

        // Google map style options (like CSS)
        // https://mapstyle.withgoogle.com/
        if (!!$scope.mapStyle) {
          $map.setOptions($scope.mapStyle);
        }

        // sets report data for $map
        function mapAddGEOJSON(reports) {
          $map.data.addGeoJson({
            'type': 'FeatureCollection',
            'features': reports
          });
        }

        function mapRemoveGEOJSON() {
          $map.data.forEach(function(feature) {
            // If you want, check here for some constraints.
            $map.data.remove(feature);
          });
        }

        function filterByDate(report) {

          var dateReported = new Date(report.f.date_reported);

          if (dateReported >= $scope.startDate && dateReported <= $scope.endDate) {

            return true;

          } else {

            return false;
          }
        }

        function markerClick(event) {

          var _incident = event.feature.f;

          // Google Map Marker
          var _marker = new google.maps.Marker({
            'position': {
              'lat': Number(_incident.latitude),
              'lng': Number(_incident.longitude),
            },
            'map': $map,
            'icon': 'images/spacer.png'
          });


          // INFO WINDOW STUFF
          // Uses class from boostreap list-instyled
          var infoWindDate = d3.time.format('%a, %x at %H:%M%p');

          if (infowindow !== null) {
            infowindow.close();
          }

          infowindow = new google.maps.InfoWindow({
            content: '<ul class=\"list-unstyled\">' +
              '<li><span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' +
              _incident.fillColor + '\"></span></li>' +
              _incident.summarized_offense_description +
              '<li>' + infoWindDate(new Date(_incident.date_reported)) + '</li>' +
              '<li>' + _incident.hundred_block_location + '</li>' +
              '<li><button id="map-info-btn" type="button" class="btn btn-secondary btn-sm btn-block">More info.</button></li>' +
              '</ul>'
          });

          infowindow.open($map, _marker);

          google.maps.event.addListener(infowindow, 'domready', function() {

            var infoWinBtn = d3.select("#map-info-btn");

            infoWinBtn.on('click',
              // Report detail: Google Angular Material Modal
              function() {

                function reportDetailCtrl($scope, mdPanelRef, incidentDetail) {

                  $scope.incidentDetail = incidentDetail;

                  $scope.closeDetail = function() {

                    this.incidentDetail = null;

                    mdPanelRef.close();
                  };
                }

                var position = $scope.$panel.newPanelPosition()
                  .absolute()
                  .center();

                /* OPEN THE PANEL */
                $scope.$panel.open({
                    attachTo: angular.element(document.body),
                    controller: reportDetailCtrl,
                    controllerAs: 'ctrl',
                    disableParentScroll: true,
                    templateUrl: 'views/template-incident-detail.html',
                    hasBackdrop: true,
                    panelClass: 'map-report-detail',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: true,
                    targetEvent: event,
                    locals: {
                      incidentDetail: _incident
                    }
                  })
                  .finally(function() {

                    var $modalElm = angular.element('.map-report-detail #street-view-detail')[0];

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

                $scope.incidentDetail = _incident;
              }
            );
          });

          $map.setCenter(_marker.getPosition());
        }

        function plotstyleDetail(feature) {
          return {
            icon: {
              'path': google.maps.SymbolPath.CIRCLE,
              'scale': 6,
              'fillColor': feature.f.fillColor,
              'fillOpacity': 1,
              'strokeWeight': 0
            }
          };
        }

        function plotFilterByType(feature) {
          //  PARENT TYPE
          var offType = feature.f.offense_type;

          var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

          var filterOffence = ($scope.reportFilter.indexOf(parentType) === -1);

          return {
            icon: {
              'path': google.maps.SymbolPath.CIRCLE,
              'scale': 2.75,
              'fillColor': filterOffence ? 'transparent' : feature.f.fillColor,
              'fillOpacity': filterOffence ? 0 : 1,
              'strokeWeight': 0,
              'zIndex': filterOffence ? 100 : 1
            }
          };
        }

        function plotShowAll(feature) {

          return {
            icon: {
              'path': google.maps.SymbolPath.CIRCLE,
              'scale': 4,
              'fillColor': feature.f.fillColor,
              'fillOpacity': filterByDate(feature) ? 1 : 0,
              'strokeWeight': 0
            }
          };
        }

        $map.data.setStyle(plotShowAll);

        // map event handlers
        $map.data.addListener('click', markerClick);

        $scope.mapRefresh = function() {

          // $map.fitBounds($scope.mapBounds);

          mapRemoveGEOJSON();
        };

        /*
            FILTER STUFF
          toggles clicked  index values 'show' attribute
          true / false
        */
        $scope.filterToggleType = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          var toggleKey = $scope.reportFilter.indexOf(this.val.key);

          if (toggleKey === -1) {
            $scope.reportFilter.push(this.val.key);
          } else {
            $scope.reportFilter.splice(toggleKey, 1);
          }

          $scope.updated = true;
        };

        /*
          filters any viz and maps based on current index
        */
        $scope.filterApply = function($event) {

          $event.preventDefault();

          $map.data.setStyle(plotFilterByType);

          $scope.updated = false;
        };

        /*
          Sets all attributes 'show' to 'true' on index
        */
        $scope.filterReset = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          $scope.reportFilter = [];

          $scope.updated = false;
        };

        /*
            INITIATE FROM A PROMISE
        */
        if ($scope.$promise !== undefined) {

          $scope.$promise.promise
            .then(function(data) {

              mapAddGEOJSON(data.incidents);

              $map.fitBounds(data.mapBounds);

              var startEnd = d3.extent(data.incidents, function(d) {
                return new Date(d.properties.date_reported);
              });

              $scope.dateRange = startEnd;

              var filterDate = new Date(startEnd[0].toDateString());

              $scope.startDate = new Date(filterDate.toDateString());

              filterDate.setDate(filterDate.getDate() + 1);

              $scope.endDate = new Date(filterDate.toDateString());

              $scope.$index = data.index;
              $scope.reports = data.incidents;
              $scope.mapBounds = data.mapBounds;

              // REFORMAT ON WINDOW RESIZE
              angular.element($window).bind('resize', function() {
                $map.fitBounds($scope.mapBounds);
              });

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

            mapAddGEOJSON([{
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [_longitude, _latitude]
              },
              'properties': report
            }]);

            $map.data.setStyle(plotstyleDetail);

            var detailBounds = new google.maps.LatLngBounds();

            detailBounds.extend(new google.maps.LatLng(_latitude, _longitude));

            $map.fitBounds(detailBounds);

            // REFORMAT ON WINDOW RESIZE
            angular.element($window).bind('resize', function() {
              $map.fitBounds(detailBounds);
            });
          }
        }
      }
    };

  }]);
