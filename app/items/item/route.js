import Ember from 'ember';

export default Ember.Route.extend({

  itemsService: Ember.inject.service('items-service'),

  model (params) {
    const itemsService = this.get('itemsService');
    return Ember.RSVP.hash({
      item: itemsService.getById(params.id),
      data: itemsService.getDataById(params.id).catch(() => {})
    });
  }

});
