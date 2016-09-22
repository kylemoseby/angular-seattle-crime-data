'use strict';

angular.module('mkm.seaCrimeData')
  .directive('filterReportTypes', [function() {

    return {
      'templateUrl': 'views/template-crime-map-filter.html',
      'scope': {
        'filterInd': '=filterReportTypes',
        'filterMap': '=crimeMapFilter',
        'filterTime': '=crimeTimelineFilter'
      },
      'link': function(scope) {

        console.log(scope);

        // Used to update class on 'update buttons'
        scope.updated = false;


        // scope.openFilters = function($mdOpenMenu, ev) {
        //   console.log('you got it');

        //   $mdOpenMenu(ev);
        // };

        /*
          toggles clicked  index values 'show' attribute
          true / false
        */
        scope.filterPushSplice = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          this.val.show = !this.val.show;

          scope.updated = true;
        };

        /*
          filters any viz and maps based on current index
        */
        scope.filterApply = function($event) {

          $event.preventDefault();

          var _index = this.mapIndexFilter();

          // if (typeof this.mapIndexFilter === 'function') {
          scope.filterMap.update(_index);
          // }

          // if (typeof scope.$parent.$vizTimeline.filterData === 'function') {
          scope.filterTime.filterData(_index);
          // }

          scope.updated = false;
        };

        /*
          Sets all attributes 'show' to 'false' on index
        */
        scope.filterClear = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          for (var key in scope.filterInd) {

            scope.filterInd[key].show = false;
          }

          scope.updated = false;
        };

        /*
          Sets all attributes 'show' to 'true' on index
        */
        scope.filterReset = function($event) {

          $event.preventDefault();

          $event.cancelBubble = true;

          for (var key in scope.filterInd) {

            scope.filterInd[key].show = true;
          }

          scope.updated = true;
        };

        scope.mapIndexFilter = function() {
          var _index_ = scope.filterInd || {};

          // Create lookup array for speed
          var filteredArray = [];

          for (var key in _index_) {

            if (!_index_[key].show) {

              filteredArray.push(key);
            }
          }

          return filteredArray;
        };

        // scope.$indexLength = function() {
        //   return (this[filterInd] === undefined || null) ? 0 : Object.keys(this[filterInd]).length;
        // };
      }
    };

  }])
  .directive('summaryList', [function() {

    return {
      'templateUrl': 'views/template-summary-list.html'
    };

  }])
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
      scope.clearTypeDetail = function() {
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
      'templateUrl': '/views/template-reports-summary.html'
    };

  }])
  .directive('incidentDetail', [function() {

    function link(scope, element) {
      var vizID = element.attr('timeline-id');

      scope.incidentDetail = null;

      if (document.getElementById('street-view-detail') !== null) {

        scope.$detailMap = new google.maps.Map(document.getElementById('street-view-detail'), {
          zoom: 14
        });
      }

      scope.closeDetail = function() {
        try {
          scope.mapID.$markers.close();
        } catch (e) {}

        scope[vizID].toolTipHide();

        this.incidentDetail = null;
      };
    }

    return {
      'link': link,
      'templateUrl': 'views/template-incident-detail.html'
    };

  }])
  .filter('orderObjectBy', function() {
    /*
        Originally found at:

        http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
    */
    return function(items, field, reverse) {

      var filtered = [];

      angular.forEach(items, function(item) {
        filtered.push(item);
      });

      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });

      if (reverse) {
        filtered.reverse();
      }

      return filtered;
    };

  });
