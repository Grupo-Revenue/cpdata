
import React from 'react';

// Temporary debug component to help identify Select issues
export const SelectDebugger = () => {
  React.useEffect(() => {
    console.log('SelectDebugger: Component mounted, checking for Select components with empty values');
    
    // Find all select elements in the DOM
    const selectElements = document.querySelectorAll('[role="combobox"], [role="listbox"]');
    console.log('Found select elements:', selectElements.length);
    
    selectElements.forEach((element, index) => {
      console.log(`Select ${index}:`, element);
      const items = element.querySelectorAll('[role="option"]');
      items.forEach((item, itemIndex) => {
        const value = item.getAttribute('data-value') || item.getAttribute('value');
        if (value === '' || value === null) {
          console.error(`Found Select.Item with empty value at index ${itemIndex}:`, item);
        }
      });
    });
  }, []);

  return null;
};
