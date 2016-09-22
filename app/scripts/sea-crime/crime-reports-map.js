'use strict';


angular.module('mkm.seaCrimeData')
  .directive('mapCanvas', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {
      'templateUrl': 'views/template-map-canvas.html',
      'scope': {
        '$promise': '=mapPromise',
        'vizID': '=mapTimeline',
        '$geoJSON': '=mapData'
      },
      'link': function link($scope) {

        $scope.toolTipLock = $scope.toolTipLock || false;

        var markers = null;

        $scope.markerOver = null;

        var $map = new google.maps.Map(document.getElementById('map-canvas'), {
          'scrollwheel': false,
          'streetViewControl': false,
          'mapTypeControl': false,
          'panControl': false
        });

        $scope.$panel = $mdPanel;

        function mapAddGEOJSON(reports) {

          $map.data.addGeoJson({
            'type': 'FeatureCollection',
            'features': reports
          });
        }

        $map.setOptions({
          'styles': [{
            'stylers': [{
              'hue': '#fff'
            }, {
              'saturation': -100
            }]
          }, {
            'featureType': 'road',
            'elementType': 'geometry',
            'stylers': [{
              'lightness': 100
            }, {
              'visibility': 'simplified'
            }]
          }, {
            'featureType': 'road',
            'elementType': 'labels',
            'stylers': [{
              'visibility': 'off'
            }]
          }, {
            'featureType': 'transit.line',
            'stylers': [{
              'visibility': 'off'
            }]
          }, {
            'featureType': 'poi',
            'stylers': [{
              'visibility': 'off'
            }]
          }, {
            'featureType': 'water',
            'elementType': 'labels',
            'stylers': [{
              'visibility': 'off'
            }]
          }, {
            'featureType': 'road',
            'stylers': [{
              'visibility': 'on'
            }]
          }]
        });

        function plotstyleBasic(feature) {
          if ($map !== undefined) {

            //  PARENT TYPE
            var offType = feature.f.offense_type;

            var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

            var offense = $scope.$parent.$index[parentType];

            return {
              icon: {
                'path': google.maps.SymbolPath.CIRCLE,
                'scale': 3,
                'fillColor': offense.fillColor,
                'fillOpacity': 1,
                'strokeWeight': 0
              }
            };
          }
        }

        function markerClick(event) {
          $scope.toolTipLock = true;

          // Map data
          // var currentFiltered = $scope.mapIndexFilter();

          //  PARENT TYPE
          var offType = event.feature.f.offense_type;

          var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

          // if (currentFiltered.indexOf(parentType) === -1) {

          var _incident = event.feature.f;

          var _latitude = Number(_incident.latitude);
          var _longitude = Number(_incident.longitude);

          var uluru = {
            'lat': _latitude,
            'lng': _longitude
          };

          // remove old marker
          if (markers !== null) {
            markers.setMap(null);
          }

          var _marker = new google.maps.Marker({
            'position': uluru,
            'map': $map,
            'icon': 'images/spacer.png'
          });

          console.log(_incident);

          // Uses class from boostreap list-instyled

          var infoWindDate = d3.time.format('%a, %x at %H:%M%p');

          var infowindow = new google.maps.InfoWindow({
            content: '<ul class=\"list-unstyled\">' +
              '<li>' + _incident.summarized_offense_description +
              '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' + $scope.$parent.$index[parentType].fillColor + '\"></span></li>' +
              '<li>' + infoWindDate(new Date(_incident.date_reported)) + '</li>' +
              '<li>' + _incident.hundred_block_location + '</li>' +
              '<li><button id="map-info-btn" type="button" class="btn btn-secondary btn-sm btn-block">More info.</button></li>' +
              '</ul>'
          });

          infowindow.open($map, _marker);

          google.maps.event.addListener(infowindow, 'closeclick', function() {});

          google.maps.event.addListener(infowindow, 'domready', function() {
            console.log('windows');

            function crimeReportDetail($scope, mdPanelRef, incidentDetail) {

              $scope.incidentDetail = incidentDetail;

              $scope.closeDetail = function() {

                this.incidentDetail = null;

                mdPanelRef.close();
              };
            }

            var infoWinBtn = d3.select("#map-info-btn");

            infoWinBtn.on('click', function() {

              var position = $scope.$panel.newPanelPosition()
                .absolute()
                .center();

              /* OPEN THE PANEL */
              $scope.$panel.open({
                attachTo: angular.element(document.body),
                controller: crimeReportDetail,
                controllerAs: 'ctrl',
                disableParentScroll: true,
                templateUrl: 'views/template-incident-detail.html',
                hasBackdrop: true,
                panelClass: 'crime-report-detail',
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
              }).finally(function() {

                var StreetView = new google.maps.Map(document.getElementById('street-view-detail'), {
                  scrollwheel: false,
                  zoomControl: false,
                  zoom: 0
                });

                var panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('street-view-detail'), {
                    'position': {
                      'lat': Number(_incident.latitude),
                      'lng': Number(_incident.longitude)
                    },
                    'pov': {
                      'heading': 34,
                      'pitch': 5
                    },
                    'scrollwheel': false
                  });

                StreetView.setStreetView(panorama);

                // promise resolved with GEOJSON

              });

              $scope.incidentDetail = _incident;

            });

          });

          $map.setCenter(_marker.getPosition());

          // Cache marker for removal later
          markers = infowindow;
          // }
        }

        $map.data.setStyle(plotstyleBasic);

        $map.data.addListener('click', markerClick);

        $scope.mapUpdate = function(indexArray) {
          function indexSelected(feature) {
            //  PARENT TYPE
            var offType = feature.f.offense_type;

            var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

            var filterOffence = (indexArray.indexOf(parentType) > -1);

            var offenseHex = $scope.$parent.$index[parentType].fillColor;

            return {
              icon: {
                'path': google.maps.SymbolPath.CIRCLE,
                'scale': 2.75,
                'fillColor': filterOffence ? 'transparent' : offenseHex,
                'fillOpacity': filterOffence ? 0 : 1,
                'strokeWeight': 0,
                'zIndex': filterOffence ? 100 : 1
              }
            };
          }

          $map.data.setStyle(indexSelected);
        };

        $scope.mapRefresh = function() {
          $map.fitBounds($scope.mapBounds);
        };

        angular.element($window).bind('resize', function() {

          $map.fitBounds($scope.mapBounds);

        });

        if ($scope.$promise.promise !== undefined) {

          $scope.$promise.promise
            .then(function(data) {

              mapAddGEOJSON(data.incidents);

              $map.fitBounds(data.mapBounds);

              $scope.reports = data.incidents;

              $scope.mapBounds = data.mapBounds;

            });
        }
      }

    };

  }]);
