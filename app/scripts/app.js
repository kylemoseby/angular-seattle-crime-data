'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.crimeDemo', [
    'ngRoute',
    'mkm.mapStyle',
    'mkm.seaCrimeData'
  ])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when('/seattle-crime-reports', {
        'templateUrl': 'views/crime-view.html',
        'controller': 'CrimeReportrsCtrl'
      })
      .otherwise({
        redirectTo: '/seattle-crime-reports'
      });
  }]);
