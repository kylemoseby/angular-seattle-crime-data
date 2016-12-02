'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportTypeDay', ['$window', function($window) {

    var $w = angular.element($window);

    $w.bind('resize', function(event) {
      console.log(event.currentTarget.outerWidth);
    });

    return {
      scope: {
        'reports': '=reportData',
        'reportCount': '=reportCount'
      },
      link: function($scope, element) {

        element.ready(function(event) {
          $scope.elmWidth = event('report-type-day').outerWidth();
        });

        var wrapper = d3.select(element[0]);

        // var total = $scope.reportCount;

        var reportDate = wrapper.selectAll('div.report-date')
          .data($scope.reports)
          .enter()
          .append('div')
          .attr('layout', 'row')
          .classed({ 'report-date': true })
          .text(function(d) {
            return d.key + ' Count: ' + d.values.length;
          });

        var reportTypes = reportDate.append('div')
          .classed({ 'report-types': true })
          // .attr('flex', function(d) {
          //   console.log(d);
          //   return ;
          // })
          .style('width', function(d) {
            return Math.ceil((d.values.length)) + '%';
          })
          .style('background', function(d) {
            return d.values[0].fillColor;
          });

        reportTypes.selectAll('div')
          .data(function(d, i) {
            console.log(i);
            return d.values;
          })
          .enter()
          .append('div')
          .classed({ 'report-type': true })
          .style('background', function() {
            return 'red';
          })
          .style('width', function() {
            return Math.ceil($scope.elmWidth * 0.01) + 'px';
          })
          // .style('width', function() {
          // return Math.ceil(($scope.reports[i].values.length) / total) + '%';
          // })
          .html('&nbsp;');
      }
    };
  }]);
