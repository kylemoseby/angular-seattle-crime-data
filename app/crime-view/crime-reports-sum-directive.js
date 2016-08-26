'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .directive('crimeReportsSummary', [function() {
    function link(scope, element) {

      var summaryType = element.attr('crime-reports-summary');
      var summaryIndex = element.attr('summary-index');

      scope[summaryType] = {
        data: null,
        filtered: false,
        renderChart: function(reportTypes) {

          scope[summaryType].data = reportTypes;

          scope.$apply();
        }
      };

      /*
        Sets summarytype's data attribute to 'null'
        Hides view from DOM
      */
      scope.clearTypeDetail = function($event) {
        scope[summaryType].data = null;
      };

      scope.filterTypeDetail = function($event) {

        scope[summaryType].filtered = !scope[summaryType].filtered;

        if (scope[summaryType].filtered) {

          var d = scope[summaryType].data;

          var offenseCategory = (d.offenseCategory === 'VEH-THEFT-AUTO') ? 'VEH' : d.offenseCategory;

          scope.filterClear($event);

          scope[summaryIndex][offenseCategory].show = true;

          scope.filterApply($event);

        } else {

          scope.filterReset($event);

          scope.filterApply($event);
        }
      };
    }

    return {
      'link': link,
      'templateUrl': '/crime-view/template-reports-summary.html'
    };

  }]);
