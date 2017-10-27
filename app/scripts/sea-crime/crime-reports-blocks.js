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

        // Angular Modal
        scope.$panel = $mdPanel;


        // DOM ELEMENTS
        var wrapper = d3.select($elm);

        var progressBar = wrapper.select('.loading-wrapper');

        var svg = wrapper.append('svg');

        var rectGroup = svg.selectAll('g.reports-index-rect');


        // PROGRESS BAR LOADING
        scope.progress = {
          now: 2,
          max: 100,
          loaded: 2
        };

        function progressUpdate() {
          scope.progress.now++;
          scope.progress.loaded = (scope.progress.now / scope.progress.max) * 100;
        }

        function hideProgressBar() {

          progressBar.classed('loaded', true);
        }
        // END PROGRESS BAR LOADING

        /*
          Necessary because of the way parent child relationships are stored in SPD Data
          VEH-THEFT-AUTO appears to be it's own distint topice, but all the other
          parent child relationsips are designated by the '-' as far as I can tell
        */
        function checkVehKey(reportKey) {
          return (reportKey === 'VEH-THEFT-AUTO') ? 'VEH' : reportKey;
        }

        // render Visualization with returned data
        function renderBlocksWithData(data) {

          //  SVG DIMENSIONS
          var padding = $elm.offsetWidth * 0.033;
          var wdth = $elm.offsetWidth;
          var hght = $elm.offsetHeight;
          var barHght = hght - padding - (hght * 0.45);

          // AXIS
          var scaleAxisX = d3.scaleBand()
            .range([padding, (wdth - padding)]);

          var scaleAxisY = d3.scaleLinear()
            .range([padding, barHght]);

          svg
            .attr('height', hght)
            .attr('width', wdth);

          var _index_ = data.indexOffType.sort(function(a, b) {
            return d3.descending(a.values.length, b.values.length);
          });

          scope.progress.max = _index_.length;


          var colorScale = data.colorScaleOff;

          var axisTitles = _index_.map(function(d) {
            return checkVehKey(d.key);
          });

          scaleAxisX.domain(axisTitles.reverse());

          scaleAxisY.domain([0, d3.max(_index_, function(d) {
            return d.values.length;
          })]);

          // Category Detail Modal
          function typeDetailModalInit(d) {

            /*
              _d_ = {
                fillColor: '#ffbb78'
                key: 'ASSLT'
                values: [{
                    census_tract_2000: '7500.4017',
                    date_reported: '2017-09-06T22:29:00',
                    district_sector: 'E',
                    general_offense_number: '2017332238',
                    hundred_block_location: '10XX BLOCK OF E PIKE ST',
                    latitude: '47.614089966',
                    location: {
                        l
                        atitude: '47.614089966',
                        needs_recoding: false,
                        longitude: '-122.31879425'
                    },
                    longitude: '-122.318794250',
                    month: '9',
                    occurred_date_or_date_range_start: '2017-09-06T22:29:00',
                    offense_code: '1313',
                    offense_code_extension: '0',
                    offense_type: 'ASSLT-NONAGG',
                    rms_cdw_id: '1274601',
                    summarized_offense_description: 'ASSAULT',
                    summary_offense_code: '1300',
                    year: '2017',
                    zone_beat: 'E2'
                  }]
               };
             */

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
                  $scope.reportType.fillColor = colorScale(reportType.key);

                  $scope.reports = reportType.values;

                  $scope.dataTypeDay = d3.nest()
                    .key(function(d) {
                      var byDay = d3.timeFormat('%x');
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
              });
          }
          // END Category Detail Modal



          // Bar chart wrappers
          rectGroup
            .data(_index_)
            .enter()
            .append('g')
            .attr('id', function(d) { return d.key; })
            .attr('class', 'reports-index-rect')
            .attr('transform', 'translate(' + padding + ',80)');
          // END Bar chart wrappers

          // CATEGORY LABELS
          var labelCatg = svg.selectAll('g.reports-index-rect')
            .append('text')
            .attr('transform', function(d) {
              var xTrans = scaleAxisX(checkVehKey(d.key));
              return 'translate(' + (xTrans - (scaleAxisX.bandwidth() * 0.33)) + ', ' + (barHght - padding + 9) + ') rotate(-50)';
            })
            .attr('text-anchor', 'end')
            .attr('class', 'block-label category')
            .text(function(d) {
              return d.key;
            });

          // COUNT LABELS
          var labelCnt = svg.selectAll('g.reports-index-rect')
            .append('text')
            .attr('transform', function(d) {
              var xTrans = scaleAxisX(checkVehKey(d.key));
              return 'translate(' + (xTrans - (scaleAxisX.bandwidth() * 0.5)) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 5) + ')';
            })
            .attr('class', 'block-label count')
            .attr('text-anchor', 'middle')
            .text(function(d) {
              return d.values.length;
            });


          // Bar chart | SVG rects
          var rect = svg.selectAll('g.reports-index-rect')
            .append('rect')
            .attr('transform', function(d) {
              var scaleVal = scaleAxisX(checkVehKey(d.key));
              return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
            })
            .attr('y', function() {
              return barHght - padding;
            })
            .attr('width', scaleAxisX.bandwidth())
            .attr('height', function(d) {
              return scaleAxisY(d.values.length);
            })
            .attr('fill', function(d) {
              progressUpdate();

              return colorScale(d.key);
            })
            .on('click', typeDetailModalInit);
          // END Bar chart

          function _refreshBlocks() {

            padding = $elm.offsetWidth * 0.033;
            wdth = $elm.offsetWidth;
            hght = $elm.offsetHeight;
            barHght = hght - padding - 120;

            svg
              .attr('height', hght)
              .attr('width', wdth);

            scaleAxisX.range([padding, (wdth - padding)]);

            scaleAxisY.range([padding, barHght]);

            // Transistions definitions
            var t = d3.transition()
              .duration(100)
              .ease(d3.easeLinear);

            labelCatg
              .transition(t)
              .attr('transform', function(d) {
                var xTrans = scaleAxisX(checkVehKey(d.key));
                return 'translate(' + (xTrans - (scaleAxisX.bandwidth() * 0.33)) + ', ' + (barHght - padding + 7) + ') rotate(-50)';
              });

            labelCnt
              .transition(t)
              .attr('transform', function(d) {
                var xTrans = scaleAxisX(checkVehKey(d.key));
                return 'translate(' + (xTrans - (scaleAxisX.bandwidth() * 0.5)) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 6) + ')';
              });

            rect
              .transition(t)
              .attr('transform', function(d) {
                var scaleVal = scaleAxisX(checkVehKey(d.key));
                return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
              })
              .attr('y', function() {
                return barHght - padding;
              })
              .attr('width', scaleAxisX.bandwidth())
              .attr('height', function(d) {
                return scaleAxisY(d.values.length);
              });
          }

          angular.element($window).bind('resize', _refreshBlocks);

          scope.blockID = {
            refreshBlocks: _refreshBlocks
          };
        }
        // END render Visualization

        // INIT
        scope.$promise.promise.then(renderBlocksWithData);
        scope.$promise.promise.finally(hideProgressBar);


      }
    };
  }])
  .controller('PathReportrsCtrl', [
    '$scope',
    'seattleDataGov',
    function($scope, seattleDataGov) {
      $scope.$seaCrimeData = seattleDataGov;

      $scope.$seaCrimeData.promise.then(function(data) {
        $scope.index = data.index;

        $scope.reports = data.incidents;
      });
    }
  ])
  .directive('pathDistrictCount', [
    function() {
      return {
        link: function($scope, $element) {

          // SCALES
          var scaleXTime = d3.scaleTime();
          var scaleYCount = d3.scaleLinear();
          var districtColor = d3.scaleOrdinal().range(d3.schemeCategory20);



          // DOM ELEMENTS
          var $wrapper = d3.select($element[0]);

          var $svg = $wrapper.append('svg');

          var D3path = function() {

            var _path = $svg
              .append('path');

            var valueline = d3.line()
            // .interpolate("basis")
              .x(function(d) {
                return Math.floor(scaleXTime(new Date(d.date_reported)));
              })
              .y(function(d, i) {
                return scaleYCount(i);
              });

            function _addData(data) {

              _path
                .data([data.sort(function(a, b) {
                  return d3.ascending(a.date_reported, b.date_reported);
                })])
                .attr('class', 'line')
                .attr('d', valueline);
            }

            return {
              getPath: _path,
              addData: _addData
            };
          };


          function svgApplyFraming(_reports) {

            var padding = 40;
            var hght = $element[0].offsetHeight;
            var wdth = $element[0].offsetWidth;

            $svg
            .attr('width', wdth)
            .attr('height', hght);

            var districtSectors = d3
              .nest()
              .key(function(d) {
                return d.district_sector;
              })
              .entries(_reports);

              console.log(districtSectors);


            scaleXTime.domain(
                d3.extent(_reports, function(d) {
                  return new Date(d.date_reported);
                })
              )
              .range([padding, wdth - padding]);

            scaleYCount
              .domain([0, _reports.length])
              .range([hght - padding, padding]);

            districtColor
              .domain(districtSectors
                .map(function(d) {
                  return d.key;
                }));

            $svg.append('g')
              .attr('transform', 'translate(0,' + (hght - padding) + ')')
              .call(d3.axisBottom(scaleXTime));

            $svg.append('g')
              .attr('transform', 'translate(' + padding + ',0)')
              .call(d3.axisLeft(scaleYCount));


            var totalReports = new D3path();

            totalReports.addData(_reports);

            totalReports.getPath
              .attr('stroke', 'blue');

            districtSectors.forEach(function(d) {
              var distLine = new D3path();

              distLine.addData(d.values);

              distLine.getPath
                .attr('stroke', districtColor(d.key));
            });
          }


          // Data might be delivered via a $promise
          $scope.$watch('reports', function(newValues) {
            if (Array.isArray(newValues)) {
              svgApplyFraming(newValues);
            }
          });
        }
      };
    }
  ]);
