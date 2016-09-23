'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.crimeDemo', [
    'ngRoute',
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

  }])
  .controller('CrimeReportrsCtrl', ['$scope', 'seattleDataGov', function($scope, seattleDataGov) {

    $scope.crimeData = seattleDataGov;

    $scope.crimeData.promise
      .then(function(data) {

        $scope.$index = data.index;

        $scope.$reports = data.incidents;

      });

  }]);
