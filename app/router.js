import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('items', function() {
    this.route('item', {
      path: ':id'
    });
  });
});

export default Router;
