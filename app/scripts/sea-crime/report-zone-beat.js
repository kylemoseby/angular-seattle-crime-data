'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportZoneBeat', [function() {
    // Runs during compile
    return {
      scope: {
        'reports': '=reportData'
      },
      link: function($scope, element) {

        var zoneColor = d3.scale.category20b()
          .domain(d3.map($scope.reports, function(d) {
              return d.key;
            })
            .keys());

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var districts = wrapper.selectAll('div')
          .data($scope.reports)
          .enter()
          .append('div')
          .classed('report-districts', true)
          .text(function(d) {
            return d.key;
          });

        var zones = districts.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .classed({ 'report-zones': true });

        zones.selectAll('span')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('span')
          .style('background', function(d) {
            return zoneColor(d.district_sector);
          })
          .classed({
            'badge': true
          })
          .text(function(d) {
            return d.zone_beat;
          });
      }
    };
  }]);
