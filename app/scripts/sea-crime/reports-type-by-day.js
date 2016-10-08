'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportTypeDay', [function() {
    return {
      // name: '',
      // priority: 1,
      // terminal: true,
      scope: {
        'reports': '=reportData',
        'reportCount': '=reportCount'
      }, // {} = isolate, true = child, false/undefined = no change
      // controller: function($scope, $element, $attrs, $transclude) {},
      // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
      // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
      // template: '',
      // templateUrl: '',
      // replace: true,
      // transclude: true,
      // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
      link: function($scope, element) {

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var total = $scope.reportCount;

        var days = wrapper.selectAll('div')
          .data($scope.reports)
          .enter()
          .append('div')
          .style('width', function(d) {
            return Math.floor((d.values.length / total) * 100) + '%';
          })
          .text(function(d) {
            return d.key + ' Count: ' + d.values.length;
          });

        days.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .classed({ 'report-days': true })
          .style('background', function(d) {
            return d.fillColor;
          });
      }
    };
  }]);
