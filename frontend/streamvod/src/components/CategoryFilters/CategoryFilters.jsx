// src/components/CategoryFilters/CategoryFilters.jsx

import React, { useState } from 'react';
import styles from './CategoryFilters.module.css';

// list
const categories = [
  'Tất cả', 'Âm nhạc', 'Tin tức', 'Du lịch', 'Trò chơi', 'Thiên nhiên', 
  'Nấu ăn', 'Game shows', 'Hài kịch', 'Danh sách kết hợp', 'Deep House',
  'Trực tiếp', 'Mới tải lên'
];

const CategoryFilters = () => {
  // state
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    // 
    console.log(`Filtered by: ${category}`);
  };

  return (
    <div className={styles.filtersContainer}>
      {categories.map((category) => (
        <button
          key={category}
          //
          className={`${styles.filterButton} ${activeCategory === category ? styles.active : ''}`
                    }   
          onClick={() => handleCategoryClick(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilters;