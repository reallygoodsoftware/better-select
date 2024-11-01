class BetterSelect extends HTMLElement {
  constructor() {
    super();
    this.currentHighlightIndex = -1;
    this.selectedValues = new Map(); // Change to Map to store value->option pairs
    this.templates = {};
    this.isKeyboardNavigation = false; // Track if user is using keyboard navigation
    this.searchDebounceTimeout = null;
    this.isLoading = false;
    this.currentOptions = []; // Store current options to avoid re-fetching
  }

  async fetchItems(query) {
    // Don't fetch if query is empty
    if (!query) return null;

    const select = this.querySelector('select');
    const url = select.dataset.url;
    if (!url) return null;

    const parsedUrl = url.replace('{query}', encodeURIComponent(query));
    
    try {
      this.isLoading = true;
      const response = await fetch(parsedUrl);
      const json = await response.json();
      
      // Parse items based on data-items path if specified
      const itemsPath = select.dataset.items;
      if (itemsPath) {
        return itemsPath.split('.').reduce((obj, key) => obj[key], json);
      }
      return json;
    } catch (err) {
      console.error('Error fetching items:', err);
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  initializeDropdown() {
    const select = this.querySelector('select');
    if (!select) return;

    const isMultiple = select.hasAttribute('multiple');
    const isRemote = select.hasAttribute('data-url');

    // Create hidden input that mirrors the select
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = select.name;
    hiddenInput.value = isMultiple ? Array.from(select.selectedOptions).map(opt => opt.value).join(',') : select.value;

    const templates = this.querySelectorAll('template');
    templates.forEach(template => {
      const templateFor = template.dataset.for || 'item';
      this.templates[templateFor] = template;
    });

    const options = Array.from(select.options);
    const container = document.createElement('div');
    container.className = 'ui-betterselect';
    
    const selectedTags = document.createElement('div');
    selectedTags.className = '--tags';
    
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = '--dropdown --closed';
    
    const searchInput = document.createElement('input');
    searchInput.className = `--input ${select.className}`;
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to search...';
    
    const dropdownList = document.createElement('div');
    dropdownList.className = '--option-list';
    dropdownList.setAttribute('role', 'listbox');

    // Clear highlight when mouse enters the options list
    dropdownList.addEventListener('mouseenter', () => {
      if (this.isKeyboardNavigation) {
        this.isKeyboardNavigation = false;
        const items = Array.from(dropdownList.children);
        items.forEach(item => item.classList.remove('--highlighted'));
        this.currentHighlightIndex = -1;
      }
    });
    
    select.style.display = 'none';

     const handleDataAttribute = (element, attrName, data) => {
       const field = element.getAttribute(attrName);
       if (!field.startsWith('item')) {
         return;
       }

       let value;
       if (field === 'item' && typeof data === 'string') {
         value = data;
       } else if (field.startsWith('item.')) {
         const path = field.slice(5); // Remove 'item.'
         value = path.split('.').reduce((obj, key) => obj?.[key], data);
       }

       if (value !== undefined) {
         switch(attrName) {
           case 'data-text':
             element.textContent = value;
             break;
           case 'data-src':
             element.src = value;
             break;
           case 'data-href':
             element.href = value;
             break;
         }
       }
     };

     const renderItemTemplate = (option, data) => {
      const template = this.templates['item'];
      if (!template) {
        if (isMultiple) {
          const checkbox = document.createElement('div');
          checkbox.className = `--checkbox ${this.selectedValues.has(option.value) ? '--checked' : ''}`;
          const text = document.createElement('span');
          text.textContent = option.text;
          const fragment = document.createDocumentFragment();
          fragment.appendChild(checkbox);
          fragment.appendChild(text);
          return fragment;
        } else {
          const text = document.createElement('span');
          text.textContent = option.text;
          return text;
        }
      }

      const clone = template.content.cloneNode(true);
      const elements = clone.querySelectorAll('[data-text], [data-src], [data-href]');
      
      // Handle checkbox placeholder if present
      if (isMultiple) {
        const checkboxPlaceholder = clone.querySelector('[data-checkbox]');
        if (checkboxPlaceholder) {
          const checkbox = document.createElement('div');
          checkbox.className = `--checkbox ${this.selectedValues.has(option.value) ? '--checked' : ''}`;
          checkboxPlaceholder.replaceWith(checkbox);
        }
      }
      
      elements.forEach(element => {
        if (element.hasAttribute('data-text')) {
          handleDataAttribute(element, 'data-text', data);
        }
        if (element.hasAttribute('data-src')) {
          handleDataAttribute(element, 'data-src', data);
        }
        if (element.hasAttribute('data-href')) {
          handleDataAttribute(element, 'data-href', data);
        }
      });

      return clone;
    };

    const renderPillTemplate = (option, data) => {
      const template = this.templates['pill'];
      if (!template) {
        const text = document.createElement('span');
        text.textContent = option.text;
        return text;
      }

      const clone = template.content.cloneNode(true);
      const elements = clone.querySelectorAll('[data-text], [data-src], [data-href]');
      
      elements.forEach(element => {
        if (element.hasAttribute('data-text')) {
          handleDataAttribute(element, 'data-text', data);
        }
        if (element.hasAttribute('data-src')) {
          handleDataAttribute(element, 'data-src', data);
        }
        if (element.hasAttribute('data-href')) {
          handleDataAttribute(element, 'data-href', data);
        }
      });

      return clone;
    };

    const updateTags = () => {
      if (!isMultiple) return;      
      selectedTags.innerHTML = '';
      this.selectedValues.forEach((optionData, value) => {
        const tag = document.createElement('div');
        tag.className = '--tag';
        
        const content = renderPillTemplate(
          optionData, 
          JSON.parse(optionData.dataset?.item || '{}')
        );
        tag.appendChild(content);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = '--remove';
        removeBtn.dataset.value = value;
        removeBtn.setAttribute('aria-label', 'Remove');
        
        tag.appendChild(removeBtn);
        selectedTags.appendChild(tag);
      });
    };

    const toggleSelection = (value) => {
      const option = this.currentOptions.find(opt => opt.value === value);
      if (!option) return;

      if (isMultiple) {
        if (this.selectedValues.has(value)) {
          this.selectedValues.delete(value);
        } else {
          this.selectedValues.set(value, option);
        }
        searchInput.value = ''; // Clear search input for multi-select
      } else {
        this.selectedValues.clear();
        this.selectedValues.set(value, option);
        searchInput.value = option.text;
        closeDropdown();
      }
      
      Array.from(select.options).forEach(option => {
        option.selected = this.selectedValues.has(option.value);
      });
      
      // Update hidden input value
      hiddenInput.value = isMultiple ? Array.from(this.selectedValues.keys()).join(',') : value;
      
      updateTags();
      
      // Reset search and show all options
      if (isMultiple) {
        updateDropdownItems('');
      } else {
        renderCurrentOptions(); // Just re-render current options instead of fetching new ones
      }
      
      const event = new Event('change');
      select.dispatchEvent(event);
    };

    const selectHighlightedItem = () => {
      const items = Array.from(dropdownList.children);
      const highlightedItem = items[this.currentHighlightIndex];
      if (highlightedItem) {
        toggleSelection(highlightedItem.dataset.value);
      }
    };

    const updateHighlight = (newIndex) => {
      this.isKeyboardNavigation = true;
      const items = Array.from(dropdownList.children);
      items.forEach(item => item.classList.remove('--highlighted'));
      
      this.currentHighlightIndex = newIndex;
      
      if (items[this.currentHighlightIndex]) {
        items[this.currentHighlightIndex].classList.add('--highlighted');
        items[this.currentHighlightIndex].scrollIntoView({ block: 'nearest' });
      }
    };

    const renderCurrentOptions = () => {
      dropdownList.innerHTML = '';
      
      this.currentOptions.forEach(option => {
        const item = document.createElement('button');
        item.className = '--item';
        item.setAttribute('role', 'option');
        if (this.selectedValues.has(option.value)) {
          item.classList.add('--selected');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.setAttribute('aria-selected', 'false');
        }
        
        const itemData = isRemote ? 
          (typeof option.dataset.item === 'string' && option.dataset.item[0] === '{' ? 
            JSON.parse(option.dataset.item) : 
            option.dataset.item
          ) : 
          JSON.parse(option.dataset?.item || '{}');

        item.appendChild(renderItemTemplate(option, itemData));
        
        item.dataset.value = option.value;
        
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSelection(option.value);
          searchInput.focus();
        });
        
        dropdownList.appendChild(item);
      });

      // Always highlight first item if there are results
      if (this.currentOptions.length > 0) {
        this.currentHighlightIndex = 0;
        updateHighlight(0);
      } else {
        this.currentHighlightIndex = -1;
      }
    };

    const updateDropdownItems = async (filterText = '') => {
      dropdownList.innerHTML = '';
      
      let filteredOptions;
      
      if (isRemote) {
        // Only show loading and fetch if there is search text
        if (filterText) {
          const loadingText = document.createElement('div');
          loadingText.className = '--loading';
          loadingText.textContent = 'Loading...';
          dropdownList.appendChild(loadingText);

          if (this.isLoading) {
            loadingText.classList.remove('--hidden');
            return;
          } else {
            loadingText.classList.add('--hidden');
          }

          const items = await this.fetchItems(filterText);
          if (items) {
            // Convert remote items to option-like objects
            this.currentOptions = items.map(item => {
              if (typeof item === 'string' || typeof item === 'number') {
                return {
                  value: item,
                  text: item,
                  dataset: { item: item }
                };
              }
              return {
                value: item.id || item.value,
                text: item.name || item.text || item.label,
                dataset: { item: JSON.stringify(item) }
              };
            });
          } else {
            this.currentOptions = [];
          }
        } else {
          // Clear options if no search text
          this.currentOptions = [];
        }
      } else {
        this.currentOptions = options.filter(option => 
          option.text.toLowerCase().includes(filterText.toLowerCase())
        );
      }
          
      renderCurrentOptions();
    };

    const openDropdown = () => {
      dropdownContainer.classList.remove('--closed');
      dropdownContainer.classList.add('--open');
      updateDropdownItems(searchInput.value);
    };

    const closeDropdown = () => {
      dropdownContainer.classList.remove('--open');
      dropdownContainer.classList.add('--closed');
      this.currentHighlightIndex = -1;
      this.isKeyboardNavigation = false;
    };

    selectedTags.addEventListener('click', (e) => {
      if (e.target.classList.contains('--remove')) {
        const value = e.target.dataset.value;
        toggleSelection(value);
      }
    });

    // Prevent clicks inside the component from closing the dropdown
    container.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      openDropdown();
    });

    searchInput.addEventListener('keydown', (e) => {
      const items = Array.from(dropdownList.children);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (dropdownContainer.classList.contains('--closed')) {
            openDropdown();
          }
          updateHighlight(Math.min(this.currentHighlightIndex + 1, items.length - 1));
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (dropdownContainer.classList.contains('--closed')) {
            openDropdown();
          }
          updateHighlight(Math.max(this.currentHighlightIndex - 1, 0));
          break;
          
        case 'Enter':
          e.preventDefault();
          if (items.length > 0) {
            selectHighlightedItem();
            if (!isMultiple) {
              updateDropdownItems(''); // Reset to show all options after selection
            }
          }
          break;
          
        case 'Escape':
          closeDropdown();
          break;
      }
    });

    searchInput.addEventListener('input', () => {
      openDropdown();
      
      // Debounce remote requests
      if (isRemote) {
        if (this.searchDebounceTimeout) {
          clearTimeout(this.searchDebounceTimeout);
        }
        this.searchDebounceTimeout = setTimeout(() => {
          updateDropdownItems(searchInput.value);
        }, 200);
      } else {
        updateDropdownItems(searchInput.value);
      }
    });

    // Handle clicks outside
    document.addEventListener('click', () => {
      closeDropdown();
    });

    options.forEach(option => {
      if (option.selected) {
        this.selectedValues.set(option.value, option);
      }
    });

    updateTags();
    updateDropdownItems();

    dropdownContainer.appendChild(searchInput);
    dropdownContainer.appendChild(dropdownList);
    container.appendChild(selectedTags);
    container.appendChild(dropdownContainer);
    container.appendChild(hiddenInput);
    this.appendChild(container);
  }

  connectedCallback() {
    if (this.isConnected) {
      requestAnimationFrame(() => this.initializeDropdown());
    }
  }
}

customElements.define('better-select', BetterSelect);

const style = document.createElement('style');
style.textContent = `
:root {

  --ui-betterselect-container-gap: 10px;
  --ui-betterselect-gray-200: rgb(229 231 235);
  --ui-betterselect-gray-300: rgb(209 213 219);
  --ui-betterselect-gray-400: rgb(160 160 160);
  --ui-betterselect-gray-800: rgb(17 24 39);

  --ui-betterselect-tag-border-radius: 8px;
  --ui-betterselect-tag-border: 1px solid var(--ui-betterselect-gray-200);
  --ui-betterselect-tag-padding: 0 2px 0 6px;
  --ui-betterselect-tag-height: 26px;
  --ui-betterselect-tag-font-size: 12px;

  --ui-betterselect-input-height: 50px;
  --ui-betterselect-input-border-width: 2px; 
  --ui-betterselect-input-border-radius: 8px;
  --ui-betterselect-input-border-color: var(--ui-betterselect-gray-200);
  --ui-betterselect-input-border-color-focus: var(--ui-betterselect-gray-800);
  --ui-betterselect-input-padding: 6px 10px;
  --ui-betterselect-input-padding-desktop: var(--ui-input-padding);

  --ui-betterselect-option-background-color-highlighted: var(--ui-betterselect-gray-200);
  --ui-betterselect-option-outline-highlighted: var(--ui-betterselect-input-border-width) solid var(--ui-betterselect-gray-800);
  --ui-betterselect-option-background-color-selected: var(--ui-betterselect-gray-200);

  --ui-betterselect-checkbox-size: 16px;
  --ui-betterselect-checkbox-border-width: 2px;
  --ui-betterselect-checkbox-border-radius: 3px;
  --ui-betterselect-checkbox-background-color: white;
  --ui-betterselect-checkbox-border-color: var(--ui-betterselect-gray-300);
  --ui-betterselect-checkbox-checked-background: var(--h1-dropdown-checkbox-checked-background, #3b82f6);
  --ui-betterselect-checkbox-checked-border: var(--h1-dropdown-checkbox-checked-border, #3b82f6);

}

.ui-betterselect {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--ui-betterselect-container-gap);
  .--tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: var(--ui-betterselect-tag-font-size);
    .--tag {
      display: flex;
      align-items: center;
      line-height: 1.5;
      gap: 4px;
      height: var(--ui-betterselect-tag-height);
      background-color: var(--ui-betterselect-tag-background-color);
      border-radius: var(--ui-betterselect-tag-border-radius);
      border: var(--ui-betterselect-tag-border);
      padding: var(--ui-betterselect-tag-padding); 
    }
    .--remove {
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background-color: none;
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
      background-size: 10px;
      background-position: center;
      background-repeat: no-repeat;
      transition: background-color 0.2s;
      &:hover {
        background-color: #d1d5db;
      }
    }
  }
  .--dropdown {
    .--input {
      line-height: 1.5;
      height: var(--ui-betterselect-input-height);
      border-width: var(--ui-betterselect-input-border-width);
      border-radius: var(--ui-betterselect-input-border-radius);
      border-color: var(--ui-betterselect-input-border-color);
      padding: var(--ui-betterselect-input-padding);
      padding-right: 40px;
      width: 100%;
      outline: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(160 160 160)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 9l4-4 4 4'/%3E%3Cpath d='M16 15l-4 4-4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 20px;
      &:focus {
        border-color: var(--ui-betterselect-input-border-color-focus);
      }
    }
    .--option-list {
      z-index: 100;
      position: absolute; 
      top: calc(100% - var(--ui-betterselect-input-border-width));
      right: 0;
      left: 0;
      font-weight: normal;
      opacity: 0;
      text-align: left;
      transform: scale(0.95);
      transition: opacity 0.1s ease-out, transform 0.1s ease-out;
      transform-origin: top left;
      pointer-events: none;
      max-height: 300px;
      overflow-y: auto;
      border-style: solid;
      background-color: white;  
      border-color: var(--ui-betterselect-input-border-color-focus);
      border-width: var(--ui-betterselect-input-border-width);
      border-radius: var(--ui-betterselect-input-border-radius);
      border-top-width: 0;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      padding-top: 2px;
      .--item {
        align-items: center;
        text-align: left;
        display: flex;
        gap: 8px;
        line-height: 1.5;
        border: none;
      }
      .--loading {
        color: var(--ui-betterselect-gray-400);
        text-align: center;
      }
      .--checkbox {
        width: 16px;
        height: 16px;
        border-style: solid;
        background-color: var(--ui-betterselect-checkbox-background-color);
        border-color: var(--ui-betterselect-checkbox-border-color);
        border-width: var(--ui-betterselect-checkbox-border-width);
        border-radius: var(--ui-betterselect-checkbox-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        &.--checked {
          background: var(--ui-betterselect-checkbox-checked-background);
          border-color: var(--ui-betterselect-checkbox-checked-border);
          &::after {
            content: '✓';
            color: white;
            font-size: 12px;
          }
        }
      }
    }
    &.--open {
      .--input {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-color: var(--ui-betterselect-input-border-color-focus);
        border-bottom-color: transparent;
      }
      .--option-list {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
        & > * {
          width: 100%;
          padding: var(--ui-betterselect-input-padding);
          &:hover,
          &.--highlighted {
            outline: var(--ui-betterselect-option-outline-highlighted);
            background-color: var(--ui-betterselect-option-background-color-highlighted);
            color: var(--ui-betterselect-option-text-color-highlighted);
          }
          &.--selected {
            background-color: var(--ui-betterselect-option-background-color-selected);
            color: var(--ui-betterselect-option-text-color-selected);
          }
        }
      }
    }
  }
} 
`;

document.head.appendChild(style);