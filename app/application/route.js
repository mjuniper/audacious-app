import Ember from 'ember';

export default Ember.Route.extend({

  beforeModel () {
    return this._initSession();
  },

  _initSession () {
    return this.get('session').fetch()
      .then(() => {
        Ember.debug('User has been automatically logged in... ');
      })
      .catch((/*err*/) => {
        // we want to catch this, otherwise Ember will redirect to an error route!
        Ember.debug('No cookie was found, user is anonymous... ');
      });
  },

  actions: {
    signin () {
      this.get('session').open('arcgis-oauth-bearer')
        .then((authorization) => {
          Ember.debug('AUTH SUCCESS: ', authorization);
          //transition to some secured route or... so whatever is needed
          this.transitionTo('index');
        })
        .catch((err)=>{
          Ember.debug('AUTH ERROR: ', err);
        });
    },
    signout () {
      this.get('session').close();
    }
  }
});
