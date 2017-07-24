'use strict';

angular
  .module('mkm.crimeDemo', [
    'ngMaterial',
    'mkm.seaCrimeData'
  ]);

angular.module('mkm.seaCrimeData')
  .controller('PlottedReportrsCtrl', ['$scope', '$http',
    function($scope, $http) {

      $scope._seaCrimeData_ = $http({
        method: 'GET',
        url: 'https://data.seattle.gov/resource/7ais-f98f.json'
      });
    }
  ])
  .factory('crimeReportPanelPlots', ['$mdPanel', function($mdPanel) {
    var $panel = $mdPanel;

    function _showPanel(d, $event, d3elm) {

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
        attachTo: $elm,
        // attachTo: angular.element(document.body),
        // controller: DialogController,
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
          report: d
        }
      };

      $mdPanel.open(config)
        .then(function(result) {
          $panel = result;
        });
    }

    // function DialogController(MdPanelRef) {
    //   function closeDialog() {
    //     if (MdPanelRef) {
    //       MdPanelRef.close();
    //     }
    //   }
    // }


    return function reportPanel() {
      return {
        test: 'kylemoseby',
        showPanel: _showPanel
      };
    };
  }])
  .directive("seattleCrimePlotted", ['$window', 'crimeReportPanelPlots', function($window, $reportPanel) {

    function _link_($scope, $element) {

      function calcScales(dataArr, _svg_) {
        //         Get X scale info

        var svgElm = _svg_.node();

        // Date range for Crime Reports
        var dateReportedExt = d3.extent(dataArr, function(d) {
          return new Date(d.date_reported);
        });

        //         Get Y scale info
        // var disrictMap = dataArr.map(function(d) {
        //   return d.district_sector;
        // });
        // console.log(disrictMap);
        // var codeExtMap = dataArr.map(function(d) {
        //   return d.summary_offense_code;
        //   // return d.summary_offense_code;
        // });
        // console.log(codeExtMap);

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

        // RETURNED SCALES
        return {

          dateReported: new d3.scaleTime()
            .domain(dateReportedExt)
            .range([20, svgElm.width.baseVal.value - 20]),


          extBand: new d3.scaleBand()
            .domain(offenseCode)
            .range([20, svgElm.height.baseVal.value - 20]),


          extColour: new d3.scaleOrdinal(d3.schemeCategory20b),


          distBand: new d3.scaleBand()
            .domain(distrists)
            .range([20, svgElm.height.baseVal.value - 20]),


          distColour: new d3.scaleOrdinal(d3.schemeCategory20)
          // END RETURNED SCALES
        };
      }



      $scope.loaded = false;

      var $panel = $reportPanel();


      // DISPLAY OPTIONS
      var viewopts = {
        axis: 'district', // district || extension
        color: 'extension' // district || extension
      };
      // END DISPLAY OPTIONS

      function init(response) {


        var crimeReports = response.data;

        // FIX ELEMENT LOOKUPS
        // SVG element cast as D3
        var $svg = d3.select(
            $element.children()[0]
          )
          .attr('height', $element[0].offsetHeight)
          .attr('width', $element[0].offsetWidth);

        // CALCULATED SCALES OBJECT
        var $scales = calcScales(crimeReports, $svg);

        // AXIS CLASSES
        // X AXIS
        var xAxis = d3.axisBottom()
          .ticks(d3.timeHour, 24)
          .tickFormat(d3.timeFormat('%m/%d'))
          .scale($scales.dateReported);

        // APPEND X AXIS
        $svg.append('g')
          .attr('class', 'axis x')
          .call(xAxis);



        // Y AXIS
        var yAxisDist = d3.axisLeft()
          .scale($scales.distBand);

        var yAxisExt = d3.axisLeft()
          .scale($scales.extBand);

        // DISPLAY DISTRICTS ON INIT()
        var axDist = $svg.append('g')
          .attr('transform', 'translate(20, -22)')
          .attr('class', 'axis y dist')
          .attr('opacity', 1)
          .call(yAxisDist);

        // APPEND X AXIS
        var axExt = $svg.append('g')
          .attr('transform', 'translate(20, -22)')
          .attr('class', 'axis y type')
          .attr('opacity', 0) // hide code extension axis
          .call(yAxisExt);



        // CRIME REPORT CIRCLES
        var circWrap = $svg.append('g')
          .attr('class', 'crime-report-plots');

        var circles = circWrap.selectAll('circle')
          .data(response.data)
          .enter()
          .append('circle')
          .attr('r', '.5vh')
          .attr('class', 'timeline-circle')
          .attr('cx', function(d) {
            return $scales.dateReported(new Date(d.date_reported));
          })
          .attr('cy', function(d) {
            return $scales.distBand(d.district_sector); //plot by district
          })
          .style('fill', function(d) {
            return $scales.extColour(d.summary_offense_code); // fill by code extension
          })
          .on('click', function(d) {
            $panel.showPanel(d, d3.event, this);
          });


        // Transistions definitions
        var t = d3.transition()
          .duration(950)
          .ease(d3.easeLinear);


        function circSetStyleCodeExt() {

          circles.transition(t)
            .style('fill', function(d) {
              return $scales.extColour(d.summary_offense_code);
            });

          viewopts.color = 'extension';
        }



        function circSetStyleDist() {

          circles.transition(t)
            .style('fill', function(d) {
              return $scales.distColour(d.district_sector);
            });

          viewopts.color = 'district';
        }



        // Event Handlers
        $scope.circSetColorType = circSetStyleCodeExt;
        $scope.circSetColorDist = circSetStyleDist;

        function plotDistricts() {
          axDist.attr('opacity', 1);

          axExt.attr('opacity', 0);

          circles.transition(t)
            .attr('cy', function(d) {
              return $scales.distBand(d.district_sector); //plot by district
            });

        }


        function plotCodeExt() {
          axDist.attr('opacity', 0);

          axExt.attr('opacity', 1);

          circles.transition(t)
            .attr('cy', function(d) {
              return $scales.extBand(d.summary_offense_code); //plot by offense code
            });

        }


        $scope.toggleAxis = function() {

          if (viewopts.axis === 'extension') {

            plotDistricts();

            viewopts.axis = 'district';

          } else if (viewopts.axis === 'district') {

            plotCodeExt();

            viewopts.axis = 'extension';
          }
        };


        // UPDATE DOM
        $scope.scaleType = $scales.extColour;

        $scope.scaleDist = $scales.distColour;

      }


      angular.element($window).bind('resize', function() {
        console.log('resize plots for new window');
      });




      $scope._seaCrimeData_
        .then(init)
        .finally(function() {
          $scope.loaded = true;
        });
    }

    return {
      // name: '',
      // priority: 1,
      // terminal: true,
      // scope: {
      //   reportsData: '=reports'
      // }, // {} = isolate, true = child, false/undefined = no change
      // controller: function($scope, $element, $attrs, $transclude) {},
      // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
      // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
      // templateUrl: '',
      // replace: true,
      // transclude: true,
      // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
      link: _link_
    };
  }]);
