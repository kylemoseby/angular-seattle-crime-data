'use strict';

/**
 * @ngdoc directive
 * @name mkm.seaCrimeData.directive:spdOfficerInvlovedShootings
 * @description
 * # spdOfficerInvlovedShootings
 */
angular.module('mkm.seaCrimeData')
  .controller('OISCtrl', ['$scope', '$http', function($scope, $http) {

    var _http = $http({
      cached: true,
      method: 'GET',
      url: 'https://data.seattle.gov/api/views/mg5r-efcm/rows.json'
    });

    _http.then(function success(response) {

      $scope.OIS = response.data;

      console.log($scope.OIS);

    }, function failure(response) {

      $scope.error = response;
    });

  }])
  .directive('spdOfficerInvolvedShootings', [function() {
    // Runs during compile
    return {
      link: function($scope) {

        function setHiddenColumns(meta) {

          var metaCols = meta.columns;

          $scope.hiddenCols = metaCols.map(function(col) {

            if (col.hasOwnProperty('flags')) {

              return col.flags[0] === 'hidden' ? true : false;
            }

          });
        }

        $scope.$watch('OIS', function(data) {
          if (data !== undefined) {
            setHiddenColumns(data.meta.view);
          }
        });


        // $scope.metaHideCol = function(ind){};
      }
    };
  }])
  .directive('incidentByRace', [function() {
    // Runs during compile
    return {
      // name: '',
      // priority: 1,
      // terminal: true,
      // scope: {}, // {} = isolate, true = child, false/undefined = no change
      // controller: function($scope, $element, $attrs, $transclude) {},
      // require: '^spdOfficerInvolvedShootings', // Array = multiple requires, ? = optional, ^ = check parent elements
      // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
      // template: '',
      // templateUrl: '',
      // replace: true,
      // transclude: true,
      // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
      link: function($scope, $element) {

        var hght = $element[0].offsetHeight;
        var wdth = $element[0].offsetWidth;

        var $wrapper = d3.select($element[0]);

        var $svg = $wrapper.append('svg');

        $svg.attr('height', hght)
          .attr('width', wdth);

        var stratify = d3.stratify()
          .parentId(function(d) {
            console.log(d);
            // return d.id.substring(0, d.id.lastIndexOf("."));
            return d[24];
          });


        var pack = d3.pack()
          .size([wdth - 20, hght - 20])
          .padding(3);

        $scope.$watch('OIS', function(newVal) {

          console.log(newVal);

          if (newVal !== undefined) {

            var byRace = d3.nest()
              .key(function(d) {
                return d[24];
              })
              .entries(newVal.data);

            var troot = stratify(byRace)
              .sum(function(d) {
                console.log(d);
                return d.value;
              })
              .sort(function(a, b) {
                console.log(a);
                console.log(b);
                return b.value - a.value;
              });

            pack(troot);

            var node = $svg.select("g")
              .selectAll("g")
              .data(troot.descendants())
              .enter()
              .append("g")
              // .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
              // .attr("class", function(d) { return "node" + (!d.children ? " node--leaf" : d.depth ? "" : " node--root"); })
              .each(function(d) { d.node = this; });

            console.log(node);

          }
        });
      }
    };
  }]);
