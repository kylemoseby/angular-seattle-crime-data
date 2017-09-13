'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportZoneBeat', ['$mdMenu', function($mdMenu) {
    // Runs during compile
    return {
      scope: {
        'reports': '=reportData',
        'reportColor': '=reportColor'
      },
      'templateUrl': 'views/template-zone-beat.html',
      link: function($scope, element) {

        var reportsByZone = $scope.reports;

        var $wrapper = d3.select(element.find('.report-zone-beat')[0]);

        $scope.$typeColorScale = d3.scaleOrdinal(d3.schemeCategory20)
          .domain($scope.reports
            .map(function(d) {
              return d.summarized_offense_description;
            })
          );

        var labels = $wrapper.insert('div')
          .html('Districts<br>Zones');

        var wdthStr = Math.floor(100 / reportsByZone.length) + '%';

        var districts = $wrapper.selectAll('div')
          .data(reportsByZone)
          .enter()
          .append('div')
          .sort(function(a, b) {
            return d3.ascending(a.key, b.key);
          })
          .classed('report-districts', true)
          .text(function(d) {
            return d.key;
          })
          .style('width', wdthStr);

        var zones = districts.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .sort(function(a, b) {
            return d3.ascending(a.key, b.key);
          })
          .classed({ 'report-zones': true })
          .text(function(d) {
            return d.key;
          });

        var report = zones.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .style('background', $scope.reportColor)
          .classed({
            'badge': true
          })
          .html(function() {
            // return d.zone_beat + ' ' + d.summarized_offense_description;
            return '&nbsp;';
          });

        /*
            FILTERING REPORTS
        */

        $scope.sortBy = 'zone id';

        $scope.labelShow = true;

        // Apply sort functino
        $scope.sortReports = function(sortStr) {

          switch (sortStr) {
            case 'report count by district':

              districts.sort(function(a, b) {
                return d3.ascending(a.values.length, b.values.length);
              });

              break;

            case 'report count by zone':

              zones.sort(function(a, b) {
                return d3.descending(a.values.length, b.values.length);
              });
              break;

            case 'zone id':
              zones.sort(function(a, b) {
                return d3.ascending(a.key, b.key);
              });

              break;

            case 'district id':

              districts.sort(function(a, b) {
                return d3.ascending(a.key, b.key);
              });

              break;

              //Statements executed when the result of expression matches value1
              // [break;]
          }
        };

        $scope.openMenu = function(ev) {
          $mdMenu.show(ev);
        };

        $scope.changeColor = function() {

          report.style('background', function(d) {
            return $scope.$typeColorScale(d.summarized_offense_description);
          });
        };

        $scope.labelsHide = function() {

          labels.style('opacity', $scope.labelShow ? 0 : 1);

          $scope.labelShow = !$scope.labelShow;
        };

      }
    };
  }]);
