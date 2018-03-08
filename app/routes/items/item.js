import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';

export default Route.extend({

  itemsService: service('items-service'),

  model (params) {
    const itemsService = this.get('itemsService');
    return hash({
      item: itemsService.getById(params.item_id),
      data: itemsService.getDataById(params.item_id).catch(() => {})
    });
  }

});
