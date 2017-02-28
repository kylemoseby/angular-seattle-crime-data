'use strict';

/**
 * @ngdoc directive
 * @name angularSeatleCrimeDataApp.directive:test4test
 * @description
 * # test4test
 */
angular.module('angularSeatleCrimeDataApp')
  .directive('test4test', function () {
    return {
      template: '<div></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('this is the test4test directive');
      }
    };
  });
