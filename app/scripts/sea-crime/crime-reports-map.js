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

            var markers = null;

            $scope.markerOver = null;

            var $map = new google.maps.Map(document.getElementById('map-canvas'), {
              'scrollwheel': false,
              'streetViewControl': false,
              'mapTypeControl': false,
              'panControl': false
            });

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

              var infowindow = new google.maps.InfoWindow({
                content: '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' +
                  $scope.$parent.$index[parentType].fillColor +
                  '\"></span>&nbsp;' + _incident.summarized_offense_description
              });

              infowindow.open($map, _marker);

              google.maps.event.addListener(infowindow, 'closeclick', function() {});

              $map.setCenter(_marker.getPosition());

              // Cache marker for removal later
              markers = infowindow;

              // }
            }

            $map.data.addGeoJson({
              'type': 'FeatureCollection',
              'features': data.incidents
            });

            $map.data.setStyle(plotstyleBasic);

            $map.data.addListener('click', function($event) {
              markerClick($event);
            });

            $map.fitBounds(data.mapBounds);

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
              $map.fitBounds(data.mapBounds);
            };

            angular.element($window).bind('resize', function() {

              $map.fitBounds(data.mapBounds);

            });

          });
      }

    };

  }]);
