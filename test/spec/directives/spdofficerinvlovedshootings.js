'use strict';

describe('Directive: spdOfficerInvlovedShootings', function () {

  // load the directive's module
  beforeEach(module('angularSeatleCrimeDataApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<spd-officer-invloved-shootings></spd-officer-invloved-shootings>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the spdOfficerInvlovedShootings directive');
  }));
});
