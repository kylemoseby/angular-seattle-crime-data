'use strict';

angular.module('mkm.seaCrimeData').directive('filterReportTypes', [function() {

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

}]);
