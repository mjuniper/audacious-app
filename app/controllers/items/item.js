import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Controller.extend({

  itemDescription: computed('model.item.description', function () {
    return htmlSafe(this.get('model.item.description'));
  })

});
