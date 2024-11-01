# About Better Select

Better Select makes html `<select>` elements better, by adding features like type to search, multi-select, and customizable styling and templates.

> The current version of Better Select is an *extreme* proof of concept. There are still quite a few features to be added.


## Basic Usage

To use, simply wrap a normal `<select>` element in a `<better-select>` tag.

```html 
<better-select>
  <select>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
    <option value="orange">Orange</option>
    <option value="pear">Pear</option>
    <option value="kiwi">Kiwi</option>
  </select>
</better-select>
```

This will render a simple dropdown with a search input, like so.

#### Demo

<!-- @include: filename{start-end} -->

<better-select>
  <select name="fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
    <option value="orange">Orange</option>
    <option value="pear">Pear</option>
    <option value="kiwi">Kiwi</option>
    <option value="mango">Mango</option>
    <option value="apple2">Apple 2</option>
    <option value="banana2">Banana 2</option>
    <option value="cherry2">Cherry 2</option>
    <option value="orange2">Orange 2</option>
    <option value="pear2">Pear 2</option>
    <option value="kiwi2">Kiwi 2</option>
    <option value="mango2">Mango 2</option>
    <option value="apple3">Apple 3</option>
    <option value="banana3">Banana 3</option>
    <option value="cherry3">Cherry 3</option>
    <option value="orange3">Orange 3</option>
    <option value="pear3">Pear 3</option>
    <option value="kiwi3">Kiwi 3</option> 
    <option value="mango3">Mango 3</option>
    <option value="apple4">Apple 4</option>
    <option value="banana4">Banana 4</option>
    <option value="cherry4">Cherry 4</option>
    <option value="orange4">Orange 4</option>
    <option value="pear4">Pear 4</option>
    <option value="kiwi4">Kiwi 4</option>
    <option value="mango4">Mango 4</option>
    <option value="apple5">Apple 5</option>
    <option value="banana5">Banana 5</option>
    <option value="cherry5">Cherry 5</option>
    <option value="orange5">Orange 5</option>
    <option value="pear5">Pear 5</option>
    <option value="kiwi5">Kiwi 5</option> 
    <option value="mango5">Mango 5</option>
    <option value="apple6">Apple 6</option>
    <option value="banana6">Banana 6</option>
    <option value="cherry6">Cherry 6</option>
    <option value="orange6">Orange 6</option>
    <option value="pear6">Pear 6</option>
    <option value="kiwi6">Kiwi 6</option> 
    <option value="mango6">Mango 6</option> 
  </select>
</better-select>

<br/>

## Multiple Selections

To enable multiple selections, add the `multiple` attribute to the `<select>` element.

```html
<better-select>
  <select multiple>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
    <option value="orange">Orange</option>
    <option value="pear">Pear</option>
    <option value="kiwi">Kiwi</option>
  </select>
</better-select>
```

#### Demo

<better-select>
  <select multiple name="fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
    <option value="orange">Orange</option>
    <option value="pear">Pear</option>
    <option value="kiwi">Kiwi</option>
  </select>
</better-select>

## Templates 

You can specify custom templates for the pills and dropdown items.

- Specify your data as a json hash in the `data-item` attribute of the `<option>` element.
- Use `item.key` to access the data in the templates. You can use `data-text`, `data-src`, or `data-href` to set properties.
- Use `<template data-for="item">` to specify the template for the dropdown items and `<template data-for="pill">` to specify the template for the selected pills.

```html
<better-select>
  <select multiple>
    <option value="1" data-item='{"icon": "🍎", "name": "Apple", "description": "Fresh red apple", "color": "#ffebee"}'>Apple</option>
    <option value="2" data-item='{"icon": "🍌", "name": "Banana", "description": "Ripe yellow banana", "color": "#fff3e0"}'>Banana</option>
  </select>
  <!-- Template for dropdown items -->
  <template data-for="item">
    <div data-checkbox>
    </div>
    <div class="flex flex-col">
      <div class="font-bold">
        <span data-text="item.icon"></span>
        <span data-text="item.name"></span>
      </div>
      <div data-field="item.description"></div>
    </div>
  </template>
  <!-- Template for selected pills -->
  <template data-for="pill">
    <div data-text="item.icon"></div>
    <span data-text="item.name"></span>
  </template>
</better-select>
```


#### Demo

<div v-pre>
  <better-select>
    <select multiple name="fruit" >
      <option value="1" data-item='{"icon": "🍎", "name": "Apple", "description": "Fresh red apple", "color": "#ffebee"}'>Apple</option>
      <option value="2" data-item='{"icon": "🍌", "name": "Banana", "description": "Ripe yellow banana", "color": "#fff3e0"}'>Banana</option>
      <option value="3" data-item='{"icon": "🍒", "name": "Cherry", "description": "Sweet dark cherries", "color": "#fce4ec"}'>Cherry</option>
      <option value="4" data-item='{"icon": "🍇", "name": "Grape", "description": "Purple wine grapes", "color": "#f3e5f5"}'>Grape</option>
      <option value="5" data-item='{"icon": "🍊", "name": "Orange", "description": "Juicy citrus", "color": "#fff3e0"}'>Orange</option>
      <option value="6" data-item='{"icon": "🍐", "name": "Pear", "description": "Sweet and juicy", "color": "#f1f8e9"}'>Pear</option>
      <option selected value="7" data-item='{"icon": "🫐", "name": "Blueberry", "description": "Wild blueberries", "color": "#e8eaf6"}'>Blueberry</option>
      <option value="8" data-item='{"icon": "🥝", "name": "Kiwi", "description": "Fresh and tangy", "color": "#f9fbe7"}'>Kiwi</option>
    </select>
    <!-- Template for dropdown items -->
    <template data-for="item">
      <div data-checkbox></div>
      <div class="flex flex-col">
        <div class="font-bold">
          <span class="pr-1" data-text="item.icon"></span>
          <span data-text="item.name"></span>
        </div>
        <div class="text-sm text-gray-400" data-text="item.description"></div>
      </div>
    </template>
    <!-- Template for selected pills -->
    <template data-for="pill">
      <div data-text="item.icon"></div>
      <span data-text="item.name"></span>
    </template>
  </better-select>
</div>


## Remote Results 

You can load results from a remote url by specifying a `data-url` attribute on the `<select>` element.

- Be sure to include `{query}`, which will be replaced with the current search query.
- Your response should include an array of objects, each with a `value` and `name` property.

```html
<better-select>
  <select multiple name="fruit" data-url="http://demo.h1rails.localhost/search?query={query}">
  </select>
</better-select>
```

#### Demo

<div v-pre>
  <better-select>
    <select multiple name="fruit" data-url="http://demo.h1rails.localhost/search?query={query}">
    </select>
  </better-select>
</div>


<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

<script v-pre>

</script>


<style>

</style>