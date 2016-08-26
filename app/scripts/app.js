'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/seattle-crime-map', {
        'templateUrl': 'views/crime-view.html',
        'controller': 'CrimeMapCtrl'
      })
      .otherwise({
        redirectTo: '/seattle-crime-map'
      });
  }])
  .controller('CrimeMapCtrl', ['$scope', 'seattleDataGov', function($scope, seattleDataGov) {

    $scope.crimeData = seattleDataGov;

    $scope.crimeData.promise
      .then(function(data) {

        $scope.$index = data.index;

        $scope.$reports = data.incidents;
      });

  }]);
