import EmberObject from '@ember/object';
import SearchControllerMixin from 'audacious-app/mixins/search-controller';
import { module, test } from 'qunit';

module('Unit | Mixin | search-controller', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let SearchControllerObject = EmberObject.extend(SearchControllerMixin);
    let subject = SearchControllerObject.create();
    assert.ok(subject);
  });
});
