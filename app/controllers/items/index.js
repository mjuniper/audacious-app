import Controller from '@ember/controller';
import SearchController from 'audacious-app/mixins/search-controller';
import { computed } from '@ember/object';

export default Controller.extend(SearchController, {

  // query parameters used by components
  queryParams: ['start', 'num'],
  start: 1,
  num: 10,

  // compute current page number based on start record
  // and the number of records per page
  pageNumber: computed('num', 'model.start', function () {
    const pageSize = this.get('num');
    const start = this.get('model.start');
    return ((start - 1) / pageSize) + 1;
  }),

  actions: {
    changePage (page) {
      // calculate next start record based on
      // the number of records per page
      const pageSize = this.get('num');
      const nextStart = ((page - 1) * pageSize) + 1;
      this.set('start', nextStart);
    }
  }

});
