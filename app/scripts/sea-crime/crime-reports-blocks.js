'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('crimeReportsBlock', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {

      'templateUrl': 'views/template-reports-block.html',

      'scope': {
        '$promise': '=crimeReportsData'
      },

      'link': function(scope, element) {

        var $elm = element[0];

        scope.$panel = $mdPanel;

        var wrapper = d3.select($elm);

        //  SVG DIMENSIONS
        var padding = $elm.offsetWidth * 0.033;
        var wdth = $elm.offsetWidth;
        var hght = $elm.offsetHeight;
        var barHght = hght - padding - 120;

        var svg = wrapper
          .append('svg')
          .attr({
            'height': hght,
            'width': wdth
          });

        var scaleAxisX = d3.scale.ordinal()
          .rangeBands([padding, (wdth - padding)]);

        var scaleAxisY = d3.scale.linear()
          .range([padding, barHght]);

        /*
          Necessary because of the way parent child relationships are stored in SPD Data
          VEH-THEFT-AUTO appears to be it's own distint topice, but all the other
          parent child relationsips are designated by the '-' as far as I can tell
          -mkm
        */
        function checkVehKey(reportKey) {
          return (reportKey === 'VEH-THEFT-AUTO') ? 'VEH' : reportKey;
        }

        // Type detail modal
        function typeDetailModalInit(d) {

          var position = scope.$panel
            .newPanelPosition()
            .absolute()
            .center();

          /* OPEN THE PANEL */
          scope.$panel
            .open({
              attachTo: angular.element(document.body),
              controllerAs: 'ctrl',
              disableParentScroll: true,
              templateUrl: 'views/template-report-type-detail.html',
              hasBackdrop: true,
              panelClass: 'report-type-detail',
              position: position,
              trapFocus: true,
              zIndex: 150,
              clickOutsideToClose: true,
              escapeToClose: true,
              focusOnOpen: true,
              targetEvent: event,
              locals: {
                reportType: d
              },
              controller: function($scope, mdPanelRef, reportType) {

                $scope.reportType = reportType;

                $scope.dataTypeDay = d3.nest()
                  .key(function(d) {
                    var byDay = d3.time.format('%x');
                    return byDay(new Date(d.date_reported));
                  })
                  .entries(reportType.values);

                $scope.dataTypeChild = d3.nest()
                  .key(function(d) {
                    return d.offense_type;
                  })
                  .entries(reportType.values);

                $scope.dataZoneBeat = d3.nest()
                  .key(function(d) {
                    return d.district_sector;
                  })
                  .key(function(d) {
                    return d.zone_beat;
                  })
                  .entries(reportType.values);

                $scope.closeDetail = function() {
                  mdPanelRef.close();
                };
              }
            })
            .finally(function() {});
        }


        scope.$promise.promise.then(function(data) {

          var _index_ = data.indexOffType.sort(function(a, b) {
            return d3.descending(a.values.length, b.values.length);
          });

          var colorScale = data.colorScaleOff;

          var axisTitles = _index_.map(function(d) {
            return checkVehKey(d.key);
          });

          scaleAxisX.domain(axisTitles.reverse());

          scaleAxisY.domain([0, d3.max(_index_, function(d) {
            return d.values.length;
          })]);

          var rectGroup = svg.selectAll('g.reports-index-rect')
            .data(_index_)
            .enter()
            .append('g')
            .attr('id', function(d) {
              return d.key;
            })
            .attr('class', 'reports-index-rect')
            // FIX LATER
            .attr('transform', 'translate(' + padding + ',80)');

          var rect = rectGroup.append('rect')
            .attr('transform', function(d) {
              var scaleVal = scaleAxisX(checkVehKey(d.key));
              return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
            })
            .attr('y', function() {
              return barHght - padding;
            })
            .attr('width', scaleAxisX.rangeBand())
            .attr('height', function(d) {
              return scaleAxisY(d.values.length);
            })
            .attr('fill', function(d) {
              return colorScale(d.key);
            })
            .on('click', typeDetailModalInit);

          // CATEGORY LABELS
          var labelCatg = rectGroup.append('text')
            .attr('transform', function(d) {

              var xTrans = scaleAxisX(checkVehKey(d.key));

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 9) + ') rotate(-33)';
            })
            .attr('text-anchor', 'end')
            .attr('class', 'block-label category')
            .text(function(d) {
              return d.key;
            });

          // COUNT LABELS
          var labelCnt = rectGroup.append('text')
            .attr('transform', function(d) {

              var xTrans = scaleAxisX(checkVehKey(d.key));

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.5)) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 5) + ')';
            })
            .attr('class', 'block-label count')
            .attr('text-anchor', 'middle')
            .text(function(d) {
              return d.values.length;
            });

          function _refreshBlocks() {

            padding = $elm.offsetWidth * 0.033;
            wdth = $elm.offsetWidth;
            hght = $elm.offsetHeight;
            barHght = hght - padding - 120;

            svg
              .attr({
                'height': hght,
                'width': wdth
              });

            scaleAxisX.rangeBands([padding, (wdth - padding)]);

            scaleAxisY.range([padding, barHght]);

            labelCatg
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr("transform", function(d) {
                var xTrans = scaleAxisX(checkVehKey(d.key));

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 7) + ') rotate(-50)';
              });

            labelCnt
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr("transform", function(d) {
                var xTrans = scaleAxisX(checkVehKey(d.key));

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.5)) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 6) + ')';
              });

            rect
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr('transform', function(d) {
                var scaleVal = scaleAxisX(checkVehKey(d.key));

                return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
              })
              .attr('y', function() {
                return barHght - padding;
              })
              .attr('width', scaleAxisX.rangeBand())
              .attr('height', function(d) {
                return scaleAxisY(d.values.length);
              });
          }

          scope.blockID = {
            refreshBlocks: _refreshBlocks
          };

          angular.element($window).bind('resize', _refreshBlocks);

        });
      }

    };
  }]);
