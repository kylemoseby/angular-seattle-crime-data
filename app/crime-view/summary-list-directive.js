'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .directive('summaryList', [function() {

    return {
      'templateUrl': 'crime-view/template-summary-list.html'
    };

  }]);
