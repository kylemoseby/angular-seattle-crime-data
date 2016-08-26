'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .directive('incidentDetail', [function() {

    function link(scope, element) {
      var mapID = element.attr('map-id');
      var vizID = element.attr('timeline-id');

      scope.incidentDetail = null;

      if (document.getElementById('street-view-detail') !== null) {

        scope.$detailMap = new google.maps.Map(document.getElementById('street-view-detail'), {
          zoom: 14
        });
      }

      scope.closeDetail = function() {
        try {
          scope[mapID].$markers.close();
        } catch (e) {}

        scope[vizID].toolTipHide();

        this.incidentDetail = null;
      };
    }

    return {
      'link': link,
      'templateUrl': 'crime-view/template-incident-detail.html'
    };

  }]);
