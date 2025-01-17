// https://davidwalsh.name/essential-javascript-functions
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// function debounce(func, wait, immediate) {
//   var timeout;
//   return function() {
//     var context = this,
//       args = arguments;
//     var later = function() {
//       timeout = null;
//       if (!immediate) { func.apply(context, args); }
//     };
//     var callNow = immediate && !timeout;
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//     if (callNow) { func.apply(context, args); }
//   };
// }


'use strict';

angular.module('mkm.seaCrimeData')
  .directive("seattleCrimePlotted", ['$http', function($http) {

    function _controller_($scope, $element) {

      $element.addClass('loading');

      $scope._seaCrimeData_ = $http({
        method: 'GET',
        url: 'https://data.seattle.gov/resource/7ais-f98f.json'
      });

      // https://data.seattle.gov/Public-Safety/SPD-Offense-Codes/22zb-azac/about
      $scope._offenseCodes_ = $http({
          method: 'GET',
          url: 'https://data.seattle.gov/resource/aj7i-nahf.json'
        })
        .then(function(response) {
          $scope.offCodeMap = d3.map(response.data, function(d) {
            return d.summary_offense_code;
          });
        })
        .finally(function() {
          $element.removeClass('loading');
        });

      // DISPLAY OPTIONS
      $scope.disp = {
        axis: 'district', // district || extension
        color: 'extension', // district || extension
        circRad: 5 // 5 - 20  applied as vh
      };
      // END DISPLAY OPTIONS

      $scope.filter = {
        extension: {},
        district: {}
      };


      var $scales = $scope.scales = {

        dateReported: d3.scaleTime(),

        extBand: d3.scaleBand(),

        extColour: d3.scaleOrdinal(d3.schemeCategory20),

        distBand: d3.scaleBand(),

        distColour: d3.scaleOrdinal(d3.schemeCategory20)
      };

      $scope.setElementScales = function(_svg_) {

        var svgElm = _svg_.node();

        // pad 75 on right for Y axis labels
        $scales.dateReported
          .range([75, svgElm.width.baseVal.value - 10]);

        $scales.distBand
          .range([25, svgElm.height.baseVal.value - 20]);

          // pad 30 on bottom for X axis label
        $scales.extBand
          .range([25, svgElm.height.baseVal.value - 20]);
      };

      $scope.setDataScales = function(dataArr) {

        // Date range for Crime Reports
        var dateReportedExt = d3.extent(dataArr, function(d) {
          return new Date(d.date_reported);
        });


        $scales.dateReported
          .domain(dateReportedExt);


        var distrists = [];
        var offenseCode = [];

        dataArr.forEach(function(d) {

          if (!distrists.includes(d.district_sector)) {
            distrists.push(d.district_sector);
          }

          if (!offenseCode.includes(d.summary_offense_code)) {
            offenseCode.push(d.summary_offense_code);
          }
        });

        $scales.extBand
          .domain(offenseCode.sort(function(a, b) {
            return d3.ascending(a, b);
          }));

        $scales.distBand
          .domain(distrists.sort(function(a, b) {
            return d3.ascending(a, b);
          }));
      };

      function calcTotals(response) {

        function d3Nest(_data, _prop) {

          return d3.nest()
            .key(function(d) {
              return d[_prop];
            })
            .entries(_data);
        }

        $scope.offCodes = d3Nest(response.data, 'summary_offense_code');

        $scope.districts = d3Nest(response.data, 'district_sector');
      }

      $scope._seaCrimeData_
        .then(calcTotals);
    }

    return {
      controller: _controller_,
    };
  }])
  .directive('crimePlotSvg', ['$window', 'crimeReportPanelPlots', function($window, $reportPanel) {

    function _link_($scope, $element) {

      var $panel = $reportPanel();

      // SVG element cast as D3
      var $svg = d3
        .select($element[0])
        .append('svg');

      var xAxis = d3.axisBottom()
        .ticks(d3.timeHour, 24)
        .tickFormat(d3.timeFormat('%m/%d'));

      var yAxisDist = d3.axisLeft();
      var yAxisExt = d3.axisLeft();

      var axDate = $svg.append('g')
        .attr('class', 'axis x');


      // DISPLAY DISTRICTS ON INIT()
      var axDist = $svg.append('g')
        .attr('transform', 'translate(65, -22)')
        .attr('class', 'axis y dist')
        .attr('opacity', 1);

      // APPEND X AXIS
      var axExt = $svg.append('g')
        .attr('transform', 'translate(65, -22)')
        .attr('class', 'axis y type')
        .attr('opacity', 0); // hide code extension axis

      // AXIS CLASSES
      function callAxis(_scales_) { // X AXIS

        xAxis.scale(_scales_.dateReported);

        // APPEND X AXIS
        axDate.call(xAxis);

        // Y AXIS
        yAxisDist.scale(_scales_.distBand);
        yAxisExt.scale(_scales_.extBand);

        axDist.call(yAxisDist);
        axExt.call(yAxisExt);
      }

      // CRIME REPORT $scope.CIRCLES
      var circWrap = $svg.append('g')
        .attr('class', 'crime-report-plots');

      $scope.circles = circWrap.selectAll('circle');

      var $scales = $scope.scales;

      function labelShowToggle(_axis) {
        return $scope.disp.axis === _axis ? 'visible' : 'hidden';
      }

      var labelExtn = $svg
        .append('text')
        .text('Plots by Code Extension')
        .attr("font-family", "sans-serif")
        .attr('x', 10)
        .attr('y', 100)
        .attr('transform', 'rotate(90, 50, 100)')
        .attr('visibility', labelShowToggle('extension'));


      var labelDist = $svg
        .append('text')
        .text('Plots by District')
        .attr("font-family", "sans-serif")
        .attr('x', 10)
        .attr('y', 100)
        .attr('transform', 'rotate(90, 100, 100)')
        .attr('visibility', labelShowToggle('district'));

      function toggleLabels() {
        labelExtn.attr('visibility', labelShowToggle('extension'));
        labelDist.attr('visibility', labelShowToggle('district'));
      }



      // Transistions definitions
      var _t_ = d3.transition()
        .duration(950)
        .ease(d3.easeLinear);


      function _init_(response) {

        var crimeReports = response.data;

        $svg
          .attr('height', $element[0].offsetHeight)
          .attr('width', $element[0].offsetWidth);


        // CALCULATED SCALES OBJECT
        $scope.setElementScales($svg);
        $scope.setDataScales(crimeReports);

        callAxis($scales);


        function calcCircR(d) {

          if ($scope.filter.extension[d.summary_offense_code] &&
            $scope.filter.district[d.district_sector]) {

            return ($scope.disp.circRad / 10) + 'vh';

          } else {

            return '0px';
          }
        }


        $scope.circles = circWrap.selectAll('circle')
          .data(response.data)
          .enter()
          .append('circle')
          .attr('r', calcCircR)
          .attr('class', 'timeline-circle')
          .attr('cx', function(d) {
            return $scales.dateReported(new Date(d.date_reported));
          })
          .attr('cy', function(d) {
            return $scales.distBand(d.district_sector); //plot by district
          })
          .style('fill', function(d) {
            // populates district scale
            $scales.distColour(d.district_sector);
            return $scales.extColour(d.summary_offense_code); // fill by code extension
          })
          .on('click', function(d) {
            $panel.showPanel(d, d3.event, this);
          });

        function reloadCanvas() {

          console.log('reload canvas');

          $svg
            .attr('height', $element[0].offsetHeight)
            .attr('width', $element[0].offsetWidth);

          $scope.setElementScales($svg);

          $scope.circles.transition(_t_)
            .attr('cx', function(d) {
              return $scales.dateReported(new Date(d.date_reported));
            })
            .attr('cy', function(d) {

              if ($scope.disp.axis === 'district') {

                return $scales.distBand(d.district_sector);

              } else if ($scope.disp.axis === 'extension') {

                return $scales.extBand(d.summary_offense_code);
              }
            });

          callAxis($scales);
        }


        $scope.setCircleRad = function() {
          // debounce(function() {
          $scope.circles
            .transition(_t_)
            .attr('r', calcCircR);
          // }, 250);
        };


        // $scope.filterCircle = reloadCanvas;
        $scope.filterCircle = function() {
          // debounce(function() {
          $scope.circles.transition(_t_)
            .attr('r', calcCircR);
          // }, 500);
        };

        // Event Handlers

        function plotDistricts() {

          axDist.attr('opacity', 1);
          axExt.attr('opacity', 0);

          $scope.circles.transition(_t_)
            .attr('cy', function(d) {
              return $scales.distBand(d.district_sector); //plot by district
            });

          $scope.circles.transition(_t_)
            .style('fill', function(d) {
              return $scales.extColour(d.summary_offense_code);
            });
        }


        function plotCodeExt() {

          axDist.attr('opacity', 0);
          axExt.attr('opacity', 1);

          $scope.circles.transition(_t_)
            .attr('cy', function(d) {
              return $scales.extBand(d.summary_offense_code); //plot by offense code
            });


          $scope.circles.transition(_t_)
            .style('fill', function(d) {
              return $scales.distColour(d.district_sector);
            });
        }


        $scope.toggleAxis = function() {

          if ($scope.disp.axis === 'extension') {

            plotDistricts();

            $scope.disp.color = 'extension';
            $scope.disp.axis = 'district';

          } else if ($scope.disp.axis === 'district') {

            plotCodeExt();

            $scope.disp.color = 'district';
            $scope.disp.axis = 'extension';
          }

          toggleLabels($scope.disp.axis);
        };


        angular.element($window).bind('resize', reloadCanvas);


        // UPDATE DOM
        $scope.scaleType = $scales.extColour;

        $scope.scaleDist = $scales.distColour;
      }


      $scope._seaCrimeData_.then(_init_);
    }
    return {
      require: ['^seattleCrimePlotted'],
      link: _link_
    };
  }])
  .directive('crimePlotMenu', [function() {
    return {
      require: '^seattleCrimePlotted',
      templateUrl: 'views/template-crime-plot-menu.html',
      link: function($scope) {

        // FILTER FUNCTIONS ???
        $scope.isIndeterminate = function() {
          return ($scope.selected.length !== 0 &&
            $scope.selected.length !== $scope.items.length);
        };

        $scope.isChecked = function(type) {

          var _filter_ = $scope.filter[type];

          var checked = true;

          if (Object.keys(_filter_).length > 0) {

            for (var key in _filter_) {

              if (!_filter_[key]) {

                checked = false;
                break;
              }
            }
          }

          return checked;
        };

        $scope.toggleAll = function(type) {

          var vals = Object.values($scope.filter[type]);

          var $test = vals.every(function(d) {
            return d === true;
          });

          for (var key in $scope.filter[type]) {
            $scope.filter[type][key] = !$test;
          }

          $scope.filterCircle();
        };

        $scope.filterChange = function() {
          $scope.filterCircle();
        };
        // END FILTER FUNCTIONS ???
      }
    };
  }])
  .factory('crimeReportPanelPlots', ['$mdPanel', function($mdPanel) {

    var $panel = $mdPanel;

    function _showPanel(_report_, $event, d3elm) {

      var $elm = angular.element(d3elm);

      var panelPosition = $mdPanel
        .newPanelPosition()
        .relativeTo($elm);

      var panelAnimation = $mdPanel.newPanelAnimation()
        .openFrom($elm)
        .duration(137)
        .closeTo($elm)
        .withAnimation($mdPanel.animation.SCALE);

      var config = {
        attachTo: angular.element(document.body),
        controller: DialogController,
        controllerAs: 'ctrl',
        position: panelPosition,
        animation: panelAnimation,
        targetEvent: $event,
        panelClass: 'timeline-report-detail-panel',
        templateUrl: 'views/timeline-report-detail-panel.html',
        clickOutsideToClose: true,
        escapeToClose: true,
        focusOnOpen: true,
        locals: {
          report: _report_
        }
      };

      $panel
        .open(config)
        .then(function(result) {
          $panel = result;
        })
        .finally(function() {

          var $modalElm = document.getElementById('street-view-detail');

          // slect element from modal that was just created
          // class .map-report-detail defined above at Init
          var StreetView = new google.maps.Map($modalElm, {
            scrollwheel: false,
            zoomControl: false,
            zoom: 0
          });

          var panorama = new google.maps.StreetViewPanorama(
            $modalElm, {
              'position': {
                'lat': Number(_report_.latitude),
                'lng': Number(_report_.longitude)
              },
              'pov': {
                'heading': 34,
                'pitch': 1
              },
              'zoom': 0,
              'scrollwheel': false
            });

          StreetView.setStreetView(panorama);

        });
    }

    function DialogController($scope, mdPanelRef, report) {

      $scope.report = report;
      $scope.keys = Object.keys(report);

      $scope.closeDetail = function() {
        if (mdPanelRef) {
          mdPanelRef.close();
        }
      };
    }


    return function reportPanel() {
      return {
        showPanel: _showPanel
      };
    };
  }]);
