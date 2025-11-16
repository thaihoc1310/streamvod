// src/components/TextInputWithCounter/TextInputWithCounter.jsx
import React from 'react';
import styles from './TextInputWithCounter.module.css';

const TextInputWithCounter = ({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  isTextarea = false,
  disabled = false,
}) => {
  const currentLength = value.length;

  return (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      {isTextarea ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          rows="5"
          disabled={disabled}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
        />
      )}
      <span className={styles.counter}>
        {currentLength} / {maxLength}
      </span>
    </div>
  );
};

export default TextInputWithCounter;