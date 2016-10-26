'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportTypeDay', [function() {
    return {
      scope: {
        'reports': '=reportData',
        'reportCount': '=reportCount'
      },
      link: function($scope, element) {

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var total = $scope.reportCount;

        wrapper.selectAll('div')
          .data($scope.reports)
          .enter()
          .append('div')
          .text(function(d) {
            return d.key + ' Count: ' + d.values.length;
          })
          .append('div')
          .style('height', '5vh')
          .style('width', function(d) {
            return Math.ceil((d.values.length / total) * 100) + '%';
          })
          .style('background', function(d) {
            return d.values[0].fillColor;
          });
      }
    };
  }]);
