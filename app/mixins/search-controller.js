import Mixin from '@ember/object/mixin';

export default Mixin.create({

  actions: {
    doSearch (q) {
      this.transitionToRoute('items', {
        queryParams: { q, start: 1 }
      });
    }
  }

});
