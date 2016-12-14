'use strict';

/**
 * @ngdoc service
 * @name mkm.mapStyle
 * @description
 * # mapStyle
 * Service in the mkm.
 */
angular.module('mkm.mapStyle', [])
  .service('mapStyle', function() {
    // Google map style options (like CSS)
    // https://mapstyle.withgoogle.com/
    return {
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
    };
  });
