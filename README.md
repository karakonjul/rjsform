# rjsform
jQuery widget for JavaScript form management

This page will be expanded in the future - for now, examine the demo page in the master branch to see how this works. Below is a very short draft describing the features of this widget.

## Description
$.rjsform is a jQuery widget that allows setting data to and retrieving it from a form structure that is very similar to the one used by the standard \<form\> element. This is mainly targeted to JS apps that need to work with forms which are not submitted with the usual GET/POST mechanism. Form data is set and retrieved as a plain object. Nested objects are, of course, supported. However, while in standard HTML you would do something like \<input name="data[key1][key2]"\>, with RJSForm you implement this hierarchy like this:

```html
<div data-form-name="data">
  <div data-form-name="key1">
    <input data-form-name="key2">
  </div>
</div>
```

RJSForm doesn't use any of the standard form attributes in order to avoid contaminating existing \<form\> elements. This means that radiogroups need to be implemented using pure JS, which is automatically done by the widget. Same goes for labels.

## Branches
- dev: development branch, unstable.
- master: release branch, stable. Versions will be tagged here.
- deploy: deployment branch, stable. This branch will always be in sync with master, but will only contain the rjsform.js file. Suitable for adding as a submodule in another project.
