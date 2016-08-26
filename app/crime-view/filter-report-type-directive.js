'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .directive('filterReportTypes', [function() {
    function link(scope, element) {

      // Dynamically set property names on view
      var filterInd = element.attr('filter-report-types');
      var filterMap = element.attr('crime-map-filter');
      var filterTime = element.attr('crime-timeline-filter');

      // Used to update class on 'update buttons'
      scope.updated = false;

      /*
        toggles clicked  index values 'show' attribute
        true / false
      */
      scope.filterPushSplice = function($event) {

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

        if (typeof this.mapIndexFilter === 'function') {
          this[filterMap].update(_index);
        }

        if (typeof this[filterTime].filterData === 'function') {
          this[filterTime].filterData(_index);
        }

        scope.updated = false;
      };

      /*
        Sets all attributes 'show' to 'false' on index
      */
      scope.filterClear = function($event) {

        $event.preventDefault();

        $event.cancelBubble = true;

        for (var key in this[filterInd]) {

          this[filterInd][key].show = false;
        }

        scope.updated = false;
      };

      /*
        Sets all attributes 'show' to 'true' on index
      */
      scope.filterReset = function($event) {

        $event.preventDefault();

        $event.cancelBubble = true;

        for (var key in this[filterInd]) {

          this[filterInd][key].show = true;
        }

        scope.updated = true;
      };

      scope.mapIndexFilter = function() {
        var _index_ = this[filterInd] || {};

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

    return {
      'link': link,
      'templateUrl': 'crime-view/template-crime-map-filter.html'
    };

  }]);
