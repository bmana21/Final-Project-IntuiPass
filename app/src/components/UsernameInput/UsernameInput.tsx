import React, { useEffect } from 'react';
import './UsernameInput.css';

interface UsernameInputProps {
  value: string;
  onChange: (username: string) => void;
  onValidation: (isValid: boolean) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ value, onChange, onValidation }) => {
  useEffect(() => {
    const isValid = value.trim().length > 0;
    onValidation(isValid);
  }, [value, onValidation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="username-input-container">
      <div className="username-input-wrapper">
        <input
          id="username-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Enter username or email"
          className={`username-input ${!value.trim() ? 'invalid' : 'valid'}`}
          autoComplete="username"
        />
      </div>
      
      {!value.trim() && (
        <div className="validation-message">
          Username is required to create a pattern
        </div>
      )}
      
      {value.trim() && (
        <div className="validation-success">
          ✓ Username is valid
        </div>
      )}
    </div>
  );
};

export default UsernameInput;