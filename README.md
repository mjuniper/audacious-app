# audacious-app

## TODO

- add items/:id route
- add map to details page
- hover over row, highlight extent, vice versa

---

# Building an Application

## Scaffold the application

1. `ember new audacious-app`
1. `ember s`
1. [localhost:4200](http://localhost:4200)

## Use Pods structure

1. `.ember-cli` ==> `"usePods": true`
1. `mkdir app/application && mv app/templates/application.hbs app/application/template.hbs && rm -rf app/controllers app/routes app/templates`

## Add some markup and CSS

- `app/styles/app.css` ==>

```css
/* bootstrap styles */
@import "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";

body {
  padding-top: 20px;
  padding-bottom: 20px;
}

.navbar {
  margin-bottom: 20px;
}
```

- `app/application/template.hbs` ==>

```html
<div class="container">

  <!-- navbar -->
  <nav class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <span class="navbar-brand">Audacious ArcGIS App</span>
      </div>
    </div><!--/.container-fluid -->
  </nav>

  <!-- page content -->
  {{outlet}}

</div> <!-- /container -->
```

## Scaffold some routes

### Add index route

- `ember g route index`
- Download https://livingatlas.arcgis.com/assets/img/background-banners/Banner9.jpg ==> `/public/assets/images/Banner9.jpg`
- `app/styles/app.css` ==>

```css
/* index */
.jumbotron-hero {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(./images/Banner9.jpg) center top/cover no-repeat;
}
.jumbotron-hero h1 {
  color:#fff;
  text-shadow: 0 3px 2px rgba(0,0,0,0.75);
  text-align: center;
  padding-bottom: 40px;
  border-bottom: 1px solid #fff;
  margin-bottom: 40px;
}
```

- `app/index/template.hbs` ==>

```html
<!-- Main component for a primary marketing message or call to action -->
<div class="jumbotron jumbotron-hero">
  <h1>Audacious ArcGIS App</h1>
  <form {{action "doSearch" q on="submit"}}>
    <div class="input-group input-group-lg">
      {{input class="form-control" placeholder="search for items" value=q}}
      <span class="input-group-btn">
        <button class="btn btn-default" type="submit">
          <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
        </button>
      </span>
    </div>
  </form>
</div>
```

### Add index controller

- `ember g controller index`
- `app/index/controller.js` ==>

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
- `app/items/route.js` ==>

```js
import Ember from 'ember';

export default Ember.Route.extend({
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

- `app/items/template.hbs` ==>

```html
<h2>Your search for "{{q}}" yielded {{model.total}} items</h2>
```

- visit http://localhost:4200/items?q=test and http://localhost:4200/items?q=test&type=maps

## Add nav

- `ember install ember-cli-active-link-wrapper`
- `app/application/template.hbs` ==>

```html
<ul class="nav navbar-nav">
  {{#active-link}}
    {{link-to "Home" "index"}}
  {{/active-link}}
  {{#active-link}}
    {{link-to "Items" "items"}}
  {{/active-link}}
</ul>
```

## Add auth

### Add torii and torii-provider-arcgis

- `ember install ember-network && ember install torii && ember install torii-provider-arcgis`
- in config/environment.js add:

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

`/app/application/template.hbs`

```html
<ul class="nav navbar-nav navbar-right">
  {{#if session.isAuthenticated}}
    <li><a href="#" {{action 'signout'}}>Sign Out</a></li>
  {{else}}
    {{#active-link}}
      <a href="#" {{action 'signin'}}>Sign In</a>
    {{/active-link}}
  {{/if}}
</ul>
```

### Add an application route with some actions

- `ember g route application`
- `/app/application/route.js` ==>

```js
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
```

### Add a user dropdown

- `app/index.html` ==>
```
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" crossorigin="anonymous"></script>
```

- `app/application/template.hbs` ==>

```html
{{#if session.isAuthenticated}}
  <li class="dropdown">
    <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">{{session.currentUser.fullName}} <span class="caret"></span></a>
    <ul class="dropdown-menu">
      <li><a href="#" {{action 'signout'}}>Sign Out</a></li>
    </ul>
  </li>
{{else}}
```

### Make auth persistent

- `/app/application/route.js` ==>

```js
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
```

## Add search...

### Add ember-arcgis-portal-services and implement model hook

- `ember install ember-arcgis-portal-services`
- `app/items/route.js` ==>

```js
  // from ember-arcgis-portal-services
  itemsService: Ember.inject.service('items-service'),

  // the model hook is used to fetch any data based on route parameters
  model (params) {
    const itemsService = this.get('itemsService');
    const q = params.q || '*';
    return itemsService.search({ q });
  }
```

### Display the results

- `app/items/template.hbs` ==>

```html
<div class="row">
  <div class="col-md-12">
    <table class="table table-responsive table-bordered table-hover table-striped">
      <thead>
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

- `ember install ember-arcgis-opendata-components`
- `app/items/route.js` ==>

```js
// paging query params
start: { refreshModel: true },
num: { refreshModel: true },
```

and

```js
return itemsService.search({ q, num: params.num, start: params.start });
```

- `ember g controller items`
- `app/items/controller.js` ==>

```js
// query parameters used by components
queryParams: ['start', 'num'],
start: 1,
num: 10,
```

- `app/index/controller.js` ==>

```js
// for a new query string, start on first page
queryParams: { q, start: 1 }
```

- `app/items/template.hbs` ==>

```html
{{item-list-pager model=model num=num}}
```

## Refactor search into component

- `ember g component search-form`
- `app/components/search-form/template.hbs` ==>

```html
<form {{action onSearch searchCopy on="submit"}}>
  <div class="input-group {{sizeClass}}">
    {{input class="form-control" placeholder="search for items" value=searchCopy}}
    <span class="input-group-btn">
      <button class="btn btn-default" type="submit">
        <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
      </button>
    </span>
  </div>
</form>
```

- `app/components/search-form/component.js` ==>

```js
import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['search-form'],

  // use a copy so that we don't immediately update bound URL parameters
  searchCopy: Ember.computed.reads('q'),

  // allow the consuming template to set the input size ('lg' or 'sm')
  sizeClass: Ember.computed('size', function () {
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

```hbs
{{search-form q=q onSearch=(action "doSearch") size="lg"}}
```

## Add search component to items page

- `app/items/controller.js` ==>

```js
actions: {
  doSearch (q) {
    // NOTE: don't need to pass route name b/c same route
    this.transitionToRoute('items', {
      queryParams: { q, start: 1 }
    });
  }
}
```

- `app/styles/app.css` ==>

```css
/* items */
.search-form-inline {
  margin-top: 20px;
}
```

- `app/items/template.hbs` ==>

```hbs
<div class="row">
  <div class="col-md-9">
    <h2>Your search for "{{q}}" yielded {{model.total}} items</h2>
  </div>
  <div class="col-md-3">
    {{search-form q=q onSearch=(action "doSearch") class="search-form-inline"}}
  </div>
</div>
```
