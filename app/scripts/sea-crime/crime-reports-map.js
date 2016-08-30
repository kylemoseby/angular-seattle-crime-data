'use strict';


angular.module('mkm.seaCrimeData')
  .directive('mapCanvas', ['$window', function($window) {

    return {
      'templateUrl': 'views/template-map-canvas.html',
      'scope': {
        '$promise': '=mapPromise',
        'vizID': '=mapTimeline'
      },
      'link': function link($scope) {

        $scope.mapID = {
          $g: null
        };

        $scope.$promise.promise
          .then(function(data) {
            $scope.toolTipLock = $scope.toolTipLock || false;

            $scope.mapID.markers = null;

            $scope.markerOver = null;

            $scope.mapID.refresh = function() {
              $scope.mapID.$g.fitBounds(data.mapBounds);
            };

            $scope.mapID.$g = new google.maps.Map(document.getElementById('map-canvas'), {
              'scrollwheel': false,
              'streetViewControl': false,
              'mapTypeControl': false,
              'panControl': false
            });

            $scope.mapID.$g.setOptions({
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
              if ($scope.mapID.$g !== undefined && $scope.mapID.$g !== undefined) {

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
              var currentFiltered = $scope.mapIndexFilter();

              //  PARENT TYPE
              var offType = event.feature.f.offense_type;

              var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

              if (currentFiltered.indexOf(parentType) === -1) {

                var _incident = event.feature.f;

                var _latitude = Number(_incident.latitude);
                var _longitude = Number(_incident.longitude);

                var uluru = {
                  'lat': _latitude,
                  'lng': _longitude
                };

                // remove old marker
                if ($scope.mapID.markers !== null) {
                  $scope.mapID.markers.setMap(null);
                }

                var _marker = new google.maps.Marker({
                  'position': uluru,
                  'map': $scope.mapID.$g,
                  'icon': 'images/spacer.png'
                });

                var _HTMLcontent = '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' + $scope.$parent.$index[parentType].fillColor + '\"></span>&nbsp;' + _incident.summarized_offense_description;

                var infowindow = new google.maps.InfoWindow({
                  content: _HTMLcontent
                });

                infowindow.open($scope.mapID.$g, _marker);

                google.maps.event.addListener(infowindow, 'closeclick', function() {

                  $scope.incidentDetail = null;

                  $scope.$apply();

                  $scope.vizID.toolTipHide();
                });

                $scope.mapID.$g.setCenter(_marker.getPosition());

                // Cache marker for removal later
                $scope.mapID.markers = infowindow;

                $scope.incidentDetail = _incident;

                $scope.$apply();

                $scope.vizID.toolTipShow(_incident);

                if ($scope.$detailMap !== undefined) {

                  var StreetView = new google.maps.Map(document.getElementById('street-view-detail'), {
                    scrollwheel: false,
                    zoomControl: false,
                    zoom: 0
                  });

                  var panorama = new google.maps.StreetViewPanorama(

                    document.getElementById('street-view-detail'), {
                      'position': uluru,
                      'pov': {
                        'heading': 34,
                        'pitch': 5
                      },
                      'scrollwheel': false
                    });

                  StreetView.setStreetView(panorama);
                }
              }
            }

            $scope.mapID.$g.data.addGeoJson({
              'type': 'FeatureCollection',
              'features': data.incidents
            });

            $scope.mapID.$g.data.setStyle(plotstyleBasic);

            $scope.mapID.$g.data.addListener('click', function($event) {
              markerClick($event);
            });

            $scope.mapID.$g.fitBounds(data.mapBounds);

            $scope.mapID.update = function(indexArray) {
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

              $scope.mapID.$g.data.setStyle(indexSelected);
            };

            angular.element($window).bind('resize', function() {

              $scope.mapID.$g.fitBounds(data.mapBounds);

            });

          });
      }

    };

  }]);
