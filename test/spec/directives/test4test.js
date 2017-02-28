'use strict';

describe('Directive: test4test', function() {

  // load the directive's module
  beforeEach(module('mkm.seaCrimeData'));

  var element,
    scope;

  beforeEach(inject(function($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function($compile) {
    element = angular.element('<test4test></test4test>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the test4test directive');
  }));
});
