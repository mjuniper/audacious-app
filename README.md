# audacious-app

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Scaffold the application

- `ember new audacious-app --no-welcome --yarn`
- `ember s`
- [localhost:4200](http://localhost:4200)


- working (tho barebones) app
- development server with live-reload
- build pipeline with template compilation js/css minification, etc, etc, etc
- ESNext features via babel
- testing framework
- js linting

## Add template linting

- `ember install ember-cli-template-lint`

## Add some markup and CSS

- `ember install ember-bootstrap`
- `ember generate ember-bootstrap --bootstrap-version=4 --preprocessor=sass`
- `rm app/styles/app.css`
- `app/styles/app.scss` ==>

```css
body {
  padding-top: 3.5rem;
}
```

- `app/templates/application.hbs` ==>

```htmlbars
{{#bs-navbar class="navbar-expand-md navbar-dark fixed-top bg-dark" as |navbar|}}
  <div class="navbar-header">
    {{navbar.toggle}}
    {{#link-to 'index' class="navbar-brand"}}Audacious ArcGIS App{{/link-to}}
  </div>
{{/bs-navbar}}

<div class="container mt-5">
  {{outlet}}
</div>
```

## Scaffold some routes

### Add index route

- `ember generate route index`
- Download https://livingatlas.arcgis.com/assets/img/background-banners/Banner9.jpg ==> `public/assets/images/Banner9.jpg`
- `app/styles/app.scss` ==>

```css
/* index */
.jumbotron {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(./images/Banner9.jpg) center top/cover no-repeat;
}
```

- `app/templates/index.hbs` ==>

```htmlbars
<div class="jumbotron">
  <h1 class="display-3 text-light text-center mb-5">Audacious ArcGIS App</h1>
  <form {{action "doSearch" q on="submit"}}>
    <div class="input-group input-group-lg">
      {{input class="form-control" placeholder="search for items" value=q}}
      <div class="input-group-append">
        <button class="btn btn-secondary" type="submit">Search</button>
      </div>
    </div>
  </form>
</div>
```

### Add index controller

- `ember g controller index`
- `app/controllers/index.js` ==>

```js
actions: {
  doSearch (q) {
    this.transitionToRoute('items', {
      queryParams: { q }
    });
  }
}
```

- click on the home link and enter search terms

### Add items route

- `ember g route items`
- `app/routes/items.js` ==>

```js
import Route from '@ember/routing/route';

export default Route.extend({

  // changes to these query parameter will cause this route to
  // update the model by calling the "model()" hook again
  queryParams: {
    q: { refreshModel: true }
  },

  model () {
    return {
      total: 0,
      results: []
    }
  }

});
```

- `app/templates/items.hbs` ==>

```htmlbars
<h2>Your search for "{{q}}" yielded {{model.total}} items</h2>
```

## Add nav

- `app/templates/application.hbs` ==>

```htmlbars
{{#navbar.content}}
  {{#navbar.nav as |nav|}}
    {{#nav.item}}
      {{#nav.link-to "index"}}Home{{/nav.link-to}}
    {{/nav.item}}
    {{#nav.item}}
      {{#nav.link-to "items"}}Items{{/nav.link-to}}
    {{/nav.item}}
  {{/navbar.nav}}
{{/navbar.content}}
```

## Add auth

### Add torii and torii-provider-arcgis

- `ember install torii && ember install torii-provider-arcgis`
- `config/environment.js` ==>

```js
torii: {
  sessionServiceName: 'session',
  providers: {
   'arcgis-oauth-bearer': {
      apiKey: 'AUgdcuQ5IgPR3nbp',
      portalUrl: 'https://www.arcgis.com'
    }
  }
}
```

### Add some markup

`app/templates/application.hbs`

```htmlbars
{{#navbar.nav class="ml-auto" as |nav| }}
  {{#if session.isAuthenticated}}
    {{#nav.item class="ml-auto"}}
      <a class="nav-link active" href="#" {{action 'signout'}}>Sign Out</a>
    {{/nav.item}}
  {{else}}
    {{#nav.item class="ml-auto"}}
      <a class="nav-link active" href="#" {{action 'signin'}}>Sign In</a>
    {{/nav.item}}
  {{/if}}
{{/navbar.nav}}
```

### Add an application route with some actions

- `ember g route application`
- `app/routes/application.js` ==>

```js
import Route from '@ember/routing/route';
import { debug } from '@ember/debug';

export default Route.extend({

  actions: {
    signin () {
      this.get('session').open('arcgis-oauth-bearer')
      .then((authorization) => {
        debug('AUTH SUCCESS: ', authorization);
        //transition to some secured route or... so whatever is needed
        this.transitionTo('index');
      })
      .catch((err)=>{
        debug('AUTH ERROR: ', err);
      });
    },
    signout () {
      this.get('session').close();
    }
  }

});
```

### Add a user dropdown
- `app/templates/application.hbs` ==>

```htmlbars
{{#nav.dropdown as |dd|}}
  {{#dd.toggle class="ml-auto"}}{{session.currentUser.fullName}}
    <span class="caret"></span>
  {{/dd.toggle}}
  {{#dd.menu as |ddm|}}
    {{#ddm.item}}<a class="dropdown-item" href="#" {{action 'signout'}}>Sign Out</a>{{/ddm.item}}
  {{/dd.menu}}
{{/nav.dropdown}}
```

### Make auth persistent

- `app/routes/application.js` ==>

```js
beforeModel () {
  return this._initSession();
},

_initSession () {
  return this.get('session').fetch()
  .then(() => {
    debug('User has been automatically logged in... ');
  })
  .catch((/*err*/) => {
    // we want to catch this, otherwise Ember will redirect to an error route!
    debug('No cookie was found, user is anonymous... ');
  });
},
```

## Add search...

### Add ember-arcgis-portal-services and implement model hook

- `ember install ember-arcgis-portal-services`
- `app/routes/items.js` ==>

```js
import { inject as service } from '@ember/service';
```

```js
  // from ember-arcgis-portal-services
  itemsService: service('items-service'),

  // the model hook is used to fetch any data based on route parameters
  model (params) {
    const itemsService = this.get('itemsService');
    const q = params.q || '*';
    return itemsService.search({ q });
  }
```

### Display the results

- `app/templates/items.hbs` ==>

```htmlbars
<div class="row">
  <div class="col-12">
    <table class="table table-striped table-bordered table-hover">
      <thead class="thead-dark">
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        {{#each model.results as |item|}}
          <tr>
            <td>{{item.title}}</td>
            <td>{{item.type}}</td>
            <td>{{item.owner}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
</div>
```

## Add pagination

- `ember install ember-intl && ember install ember-arcgis-portal-components`
- `.template-lintrc.js` ==>

```js
rules: {
  'bare-strings': false
}
```

- `app/routes/application.js` ==>

```js
import { inject as service } from '@ember/service';
```

```js
intl: service(),
```

```js
// add to beforeModel
this.get('intl').setLocale('en-us');
```

- `app/routes/items.js` ==>

```js
// paging query params
start: { refreshModel: true },
num: { refreshModel: true },
```

```js
return itemsService.search({ q, num: params.num, start: params.start });
```

- `ember g controller items`
- `app/controllers/items.js` ==>

```js
import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({

  // query parameters used by components
  queryParams: [ 'start', 'num' ],
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
    },
  }
});
```

- `app/controllers/index.js` ==>

```js
// for a new query string, start on first page
queryParams: { q, start: 1 }
```

- `app/templates/items.hbs` ==>

```html
{{item-pager
  pageSize=num
  totalCount=model.total
  pageNumber=pageNumber
  changePage=(action "changePage")
}}
```

## Format numbers
- `app/templates/items.hbs` ==>

```htmlbars
{{format-number model.total}}
```

## Refactor search into component

- `ember g component ago-search`
- `app/templates/components/ago-search.hbs` ==>

```htmlbars
<form {{action onSearch searchCopy on="submit"}}>
  <div class="input-group {{sizeClass}}">
    {{input class="form-control" placeholder="search for items" value=searchCopy}}
    <div class="input-group-append">
      <button class="btn btn-secondary" type="submit">Search</button>
    </div>
  </div>
</form>
```

- `app/components/ago-search/component.js` ==>

```js
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: ['search-form'],

  // use a copy so that we don't immediately update bound URL parameters
  searchCopy: computed.reads('q'),

  // allow the consuming template to set the input size ('lg' or 'sm')
  sizeClass: computed('size', function () {
    const size = this.get('size');
    if (size) {
      return `input-group-${size}`;
    } else {
      return '';
    }
  })

});
```

- replace `<form>` tag in app/index/template.hbs with:

```htmlbars
{{ago-search q=q onSearch=(action "doSearch") size="lg"}}
```

## Add search component to items page

- `app/controllers/items.js` ==>

```js
// add to `actions` hash
doSearch (q) {
  // NOTE: don't need to pass route name b/c same route
  this.transitionToRoute({
    queryParams: { q, start: 1 }
  });
}
```

- `app/styles/app.scss` ==>

```css
/* items */
.search-form-inline {
  margin-top: 5px;
}
```

- `app/templates/items.hbs` ==>

```htmlbars
<div class="row mb-2">
  <div class="col-9">
    <h2>Your search for "{{q}}" yielded {{format-number model.total}} items</h2>
  </div>
  <div class="col-3">
    {{ago-search q=q onSearch=(action "doSearch") class="search-form-inline" size="sm"}}
  </div>
</div>
```

## Add a map

- `ember install ember-esri-loader`
- `config/environment.js` ==>

```js
map: {
  options: {
    basemap: 'gray'
  },
  itemExtents: {
    symbol: {
      color: [51, 122, 183, 0.125],
      outline: {
        color: [51, 122, 183, 1],
        width: 1,
        type: 'simple-line',
        style: 'solid'
      },
      type: 'simple-fill',
      style: 'solid'
    },
    popupTemplate: {
      title: '{title}',
      content: '{snippet}'
    }
  }
}
```

- restart server
- `app/styles/app.scss` ==>

```css
/* esri styles */
@import url('https://js.arcgis.com/4.6/esri/css/main.css');

/* map */
.extents-map {
  height: 300px;
}
```

- `ember g service map-service`
- `app/services/map-service.js` ==>

```js
import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
  esriLoader: service('esri-loader'),
  // create a new map object at an element
  newMap(element, mapOptions) {
    // load the map modules
    return this.get('esriLoader').loadModules(['esri/Map', 'esri/views/MapView', 'esri/Graphic'])
    .then(([Map, MapView, Graphic]) => {
      if (!element || this.get('isDestroyed') || this.get('isDestroying')) {
        // component or app was likely destroyed
        return;
      }
      // create function to return new graphics
      this._newGraphic = (jsonGraphic) => {
        return new Graphic(jsonGraphic);
      };
      var map = new Map(mapOptions);
      // show the map at the element and
      // hold on to the view reference for later operations
      this._view = new MapView({
        map,
        container: element,
        zoom: 2
      });
      return this._view.when(() => {
        this._view.on("mouse-wheel", function(evt){
          // prevents zooming with the mouse-wheel event
          evt.stopPropagation();
        });
        // let the caller know that the map is available
        return;
      });
    });
  },

  // clear and add graphics to the map
  refreshGraphics (jsonGraphics) {
    const view = this._view;
    if (!view || !view.ready) {
      return;
    }
    // clear any existing graphics
    view.graphics.removeAll();
    // convert json to graphics and add to map's graphic layer
    if (!jsonGraphics || jsonGraphics.length === 0) {
      return;
    }
    jsonGraphics.forEach(jsonGraphic => {
      view.graphics.add(this._newGraphic(jsonGraphic));
    });
  },

  // destroy the map if it was already created
  destroyMap() {
    if (this._view) {
      delete this._view;
    }
  }
});
```

- `ember g component extents-map`
- `rm app/templates/components/extents-map.hbs`
- `app/components/extents-map.js` ==>

```js
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import config from '../config/environment';

export default Component.extend({
  classNames: ['extents-map'],

  mapService: service('map-service'),

  // wait until after the component is added to the DOM before creating the map
  didInsertElement () {
    this._super(...arguments);
    // create a map at this element's DOM node
    const mapService = this.get('mapService');
    // create a map at this element's DOM node
    mapService.newMap(this.elementId, config.APP.map.options)
    .then(() => {
      this.showItemsOnMap();
    });
  },

  // whenever items change, update the map
  didUpdateAttrs () {
    this.showItemsOnMap();
  },

  // destroy the map before this component is removed from the DOM
  willDestroyElement () {
    this._super(...arguments);
    const mapService = this.get('mapService');
    mapService.destroyMap();
  },

  // show new item extents on map
  showItemsOnMap () {
    const { symbol, popupTemplate } = config.APP.map.itemExtents;
    const items = this.get('items');
    const jsonGraphics = items && items.map(item => {
      const geometry = this.coordsToExtent(item.extent);
      return { geometry, symbol, attributes: item, popupTemplate };
    });
    this.get('mapService').refreshGraphics(jsonGraphics);
  },

  coordsToExtent (coords) {
    if (coords && coords.length === 2) {
      return {
        type: 'extent',
        xmin: coords[0][0],
        ymin: coords[0][1],
        xmax: coords[1][0],
        ymax: coords[1][1],
        spatialReference:{
          wkid:4326
        }
      };
    }
  }

});
```

- `app/templates/items.js` ==>

```htmlbars
<div class="row mb-3">
  <div class="col-12">
    {{extents-map items=model.results}}
  </div>
</div>
```

## Refactor search action into a mixin

- `ember g mixin search-controller`
- `app/mixins/search-controller.js` ==>

```js
actions: {
  doSearch (q) {
    this.transitionToRoute('items', {
      queryParams: { q, start: 1 }
    });
  }
}
```

- `app/controllers/index.js` ==>

```js
import Controller from '@ember/controller';
import SearchController from 'audacious-app/mixins/search-controller';

export default Controller.extend(SearchController, {
});
```

- `app/controllers/items.js` ==>

```js
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
```

## Create an item details nested route

- `ember g route items/item --path=:item_id`
- `app/routes/items/item.js` ==>

```js
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
```

- `templates/items.hbs` ==> `templates/items/index.hbs`
- `controllers/items.js` ==> `controllers/items/index.js`
- `routes/items.js` ==> `routes/items/index.js`

- `app/templates/items/item.hbs` ==>

```htmlbars
<div class="row">
  <div class="col-9">
    <h1>{{model.item.title}}</h1>
    <dl>
      <dt>Type</dt>
      <dd>{{model.item.type}}</dd>
      <dt>Description</dt>
      <dd>{{itemDescription}}</dd>
    </dl>
  </div>
</div>
```

- `ember g controller items/item`
- `app/controllers/items/item.js` ==>

```js
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Controller.extend({

  itemDescription: computed('model.item.description', function () {
    return htmlSafe(this.get('model.item.description'));
  })

});
```

- `app/templates/items/index.hbs` ==>

```htmlbars
<th class="text-center">Info</th>
```

```htmlbars
<td class="text-center">
  {{#link-to "items.item" item.id}}
    Details
  {{/link-to}}
</td>
```
