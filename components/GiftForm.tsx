
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FormData } from '../types';
import { Gender } from '../types';
import { 
  INITIAL_CHARACTERISTICS_COUNT, 
  MAX_CHARACTERISTICS_COUNT, 
  SINGLE_CHARACTERISTIC_CHAR_LIMIT,
  MIN_BUDGET_ABSOLUTE,
  MAX_BUDGET_ABSOLUTE,
  BUDGET_STEP
} from '../constants';

interface GiftFormProps {
  formData: FormData;
  onFormDataChange: (formData: FormData) => void;
  onSubmit: () => void; 
  isLoading: boolean;
}

const getCharacteristicPlaceholder = (index: number): string => {
  const placeholders = [
    "e.g., Loves gardening (required)",
    "e.g., Big sci-fi fan (optional)",
    "e.g., Collects vintage maps (optional)",
    "e.g., Learning to play guitar (optional)",
    "e.g., Passionate about cooking (optional)"
  ];
  return placeholders[index] || `Another detail about them (optional)`;
};

export const GiftForm: React.FC<GiftFormProps> = ({ formData, onFormDataChange, onSubmit, isLoading }) => {
  const [charCounts, setCharCounts] = useState<number[]>(
    formData.recipientCharacteristics.map(char => char.length)
  );
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Omit<FormData, 'minBudget' | 'maxBudget'> | `characteristic${number}` | 'budget', string>>>({});

  const currentYear = new Date().getFullYear();

  const trackRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLButtonElement>(null);
  const maxThumbRef = useRef<HTMLButtonElement>(null);

  const draggingRef = useRef<{ type: 'min' | 'max',startX: number, startValue: number } | null>(null);

  useEffect(() => {
    setCharCounts(formData.recipientCharacteristics.map(char => char.length));
  }, [formData.recipientCharacteristics]);

  const handleBudgetChange = useCallback((newMin: number, newMax: number) => {
    let validatedMin = Math.max(MIN_BUDGET_ABSOLUTE, Math.min(newMin, MAX_BUDGET_ABSOLUTE - BUDGET_STEP));
    let validatedMax = Math.min(MAX_BUDGET_ABSOLUTE, Math.max(newMax, MIN_BUDGET_ABSOLUTE + BUDGET_STEP));

    validatedMin = Math.round(validatedMin / BUDGET_STEP) * BUDGET_STEP;
    validatedMax = Math.round(validatedMax / BUDGET_STEP) * BUDGET_STEP;
    
    if (validatedMin > validatedMax - BUDGET_STEP) {
        if (draggingRef.current?.type === 'min') {
             validatedMin = validatedMax - BUDGET_STEP;
        } else {
             validatedMax = validatedMin + BUDGET_STEP;
        }
    }
    
    validatedMin = Math.max(MIN_BUDGET_ABSOLUTE, validatedMin);
    validatedMax = Math.min(MAX_BUDGET_ABSOLUTE, validatedMax);
    if (validatedMin > validatedMax) { 
        if (draggingRef.current?.type === 'min') validatedMin = validatedMax;
        else validatedMax = validatedMin;
    }

    onFormDataChange({ ...formData, minBudget: validatedMin, maxBudget: validatedMax });
     if (formErrors.budget) {
        setFormErrors(prev => ({...prev, budget: undefined}));
    }
  }, [formData, onFormDataChange, formErrors.budget]);


  const valueToPercent = useCallback((value: number) => {
    return ((value - MIN_BUDGET_ABSOLUTE) / (MAX_BUDGET_ABSOLUTE - MIN_BUDGET_ABSOLUTE)) * 100;
  }, []);

  const percentToValue = useCallback((percent: number) => {
    return Math.round(((percent / 100) * (MAX_BUDGET_ABSOLUTE - MIN_BUDGET_ABSOLUTE) + MIN_BUDGET_ABSOLUTE) / BUDGET_STEP) * BUDGET_STEP;
  }, []);


  const handleThumbDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingRef.current || !trackRef.current) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const trackRect = trackRef.current.getBoundingClientRect();
    const deltaX = clientX - draggingRef.current.startX;
    const percentChange = (deltaX / trackRect.width) * 100;
    
    let newValue = percentToValue(valueToPercent(draggingRef.current.startValue) + percentChange);

    if (draggingRef.current.type === 'min') {
      handleBudgetChange(newValue, formData.maxBudget);
    } else {
      handleBudgetChange(formData.minBudget, newValue);
    }
  }, [formData.minBudget, formData.maxBudget, handleBudgetChange, valueToPercent, percentToValue]);

  const stopDrag = useCallback(() => {
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', handleThumbDrag);
    document.removeEventListener('touchend', stopDrag);
    draggingRef.current = null;
  }, [handleThumbDrag]);

  const startDrag = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, type: 'min' | 'max') => {
    e.preventDefault();
    draggingRef.current = {
        type,
        startX: 'touches' in e ? e.touches[0].clientX : e.clientX,
        startValue: type === 'min' ? formData.minBudget : formData.maxBudget
    };
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', handleThumbDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, type: 'min' | 'max') => {
    let newMin = formData.minBudget;
    let newMax = formData.maxBudget;

    if (type === 'min') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newMin -= BUDGET_STEP;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newMin += BUDGET_STEP;
    } else { // type === 'max'
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newMax -= BUDGET_STEP;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newMax += BUDGET_STEP;
    }
    handleBudgetChange(newMin, newMax);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData | `characteristic${number}` | 'budget', string>> = {};
    
    if (!formData.recipientCharacteristics[0]?.trim()) {
      errors[`characteristic0`] = "Please provide at least one detail about them.";
    }
    formData.recipientCharacteristics.forEach((char, index) => {
        if (char.length > SINGLE_CHARACTERISTIC_CHAR_LIMIT) {
            errors[`characteristic${index}`] = `Detail #${index + 1} exceeds ${SINGLE_CHARACTERISTIC_CHAR_LIMIT} characters.`;
        }
    });

    if (formData.yearOfBirth) {
      const year = parseInt(formData.yearOfBirth, 10);
      if (isNaN(year) || year < 1900 || year > currentYear) {
        errors.yearOfBirth = `Please enter a valid year (1900-${currentYear}).`;
      }
    }
    
    if (!formData.location.trim()) {
      errors.location = "Please enter their location.";
    }

    if (formData.minBudget > formData.maxBudget) {
        errors.budget = "Minimum budget cannot be greater than maximum budget.";
    }
    if (formData.minBudget < MIN_BUDGET_ABSOLUTE || formData.maxBudget > MAX_BUDGET_ABSOLUTE) {
        errors.budget = `Budget must be between £${MIN_BUDGET_ABSOLUTE} and £${MAX_BUDGET_ABSOLUTE}.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCharacteristicChange = (index: number, value: string) => {
    if (value.length <= SINGLE_CHARACTERISTIC_CHAR_LIMIT) {
      const newCharacteristics = [...formData.recipientCharacteristics];
      newCharacteristics[index] = value;
      onFormDataChange({ ...formData, recipientCharacteristics: newCharacteristics });

      if (formErrors[`characteristic${index}`] && value.trim()) {
        setFormErrors(prev => ({...prev, [`characteristic${index}`]: undefined}));
      }
      if (index === 0 && formErrors[`characteristic0`] && value.trim()) {
         setFormErrors(prev => ({...prev, characteristic0: undefined}));
      }
    }
  };

  const addCharacteristicField = () => {
    if (formData.recipientCharacteristics.length < MAX_CHARACTERISTICS_COUNT) {
      onFormDataChange({
        ...formData,
        recipientCharacteristics: [...formData.recipientCharacteristics, '']
      });
    }
  };

  const removeCharacteristicField = (index: number) => {
    if (formData.recipientCharacteristics.length > INITIAL_CHARACTERISTICS_COUNT && index >= INITIAL_CHARACTERISTICS_COUNT) {
      const newCharacteristics = formData.recipientCharacteristics.filter((_, i) => i !== index);
      onFormDataChange({ ...formData, recipientCharacteristics: newCharacteristics });
      setFormErrors(prev => {
        const updatedErrors = {...prev};
        delete updatedErrors[`characteristic${index}`];
        return updatedErrors;
      });
    }
  };
  
  const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFormDataChange({ ...formData, [name]: value });
    if (formErrors[name as keyof FormData]) {
        setFormErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(); 
    }
  };

  const minPercent = valueToPercent(formData.minBudget);
  const maxPercent = valueToPercent(formData.maxBudget);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-body mb-1">
          Tell me about them:
        </label>
        <div className="space-y-3">
          {formData.recipientCharacteristics.map((characteristic, index) => (
            <div key={index} className="relative">
              <input
                type="text"
                value={characteristic} 
                onChange={(e) => handleCharacteristicChange(index, e.target.value)}
                placeholder={getCharacteristicPlaceholder(index)}
                maxLength={SINGLE_CHARACTERISTIC_CHAR_LIMIT}
                aria-describedby={`char-count-characteristic-${index} ${formErrors[`characteristic${index}`] ? `error-characteristic-${index}` : ''}`}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-accent-amber focus:border-transparent transition duration-150 ease-in-out ${formErrors[`characteristic${index}`] ? 'border-error-red' : 'border-gray-300'} text-text-body`}
                required={index === 0}
              />
              <div id={`char-count-characteristic-${index}`} className="text-right text-xs text-text-muted mt-1 pr-1">
                {charCounts[index] !== undefined ? charCounts[index] : 0}/{SINGLE_CHARACTERISTIC_CHAR_LIMIT}
              </div>
              {index >= INITIAL_CHARACTERISTICS_COUNT && (
                <button
                  type="button"
                  onClick={() => removeCharacteristicField(index)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-error-red hover:text-red-700 font-semibold text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                  style={{marginTop: `-${(charCounts[index] !== undefined && charCounts[index] > 0) || formErrors[`characteristic${index}`] ? '0.625rem' : '0px'}`}} 
                  aria-label={`Remove detail ${index + 1}`}
                >
                  Remove
                </button>
              )}
              {formErrors[`characteristic${index}`] && <p id={`error-characteristic-${index}`} className="text-error-red text-xs mt-1">{formErrors[`characteristic${index}`]}</p>}
            </div>
          ))}
        </div>
        {formData.recipientCharacteristics.length < MAX_CHARACTERISTICS_COUNT && (
          <button
            type="button"
            onClick={addCharacteristicField}
            className="mt-3 text-sm text-forest-mid hover:text-forest-dark font-medium py-2 px-3 border border-forest-mid rounded-md hover:bg-forest-light hover:bg-opacity-30 transition duration-150 ease-in-out"
          >
            + Add another detail
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-text-body mb-1">
            Gender:
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender} 
            onChange={handleGenericChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-amber focus:border-transparent transition duration-150 ease-in-out text-text-body"
          >
            {Object.values(Gender).map(genderValue => (
              <option key={genderValue} value={genderValue}>{genderValue}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yearOfBirth" className="block text-sm font-medium text-text-body mb-1">
            Year of Birth (optional):
          </label>
          <input
            type="number"
            id="yearOfBirth"
            name="yearOfBirth"
            value={formData.yearOfBirth} 
            onChange={handleGenericChange}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-accent-amber focus:border-transparent transition duration-150 ease-in-out ${formErrors.yearOfBirth ? 'border-error-red' : 'border-gray-300'} text-text-body`}
            placeholder={`e.g., ${currentYear - 30}`}
            min="1900"
            max={currentYear.toString()}
          />
          {formErrors.yearOfBirth && <p className="text-error-red text-xs mt-1">{formErrors.yearOfBirth}</p>}
        </div>
      </div>
      
      <div>
        <label htmlFor="budgetRange" className="block text-sm font-medium text-text-body mb-1">
          Budget Range (£):
        </label>
        <div className="relative pt-1 mb-2">
          <div ref={trackRef} className="relative w-full h-2 bg-gray-200 rounded-lg mt-4 mb-2">
            <div 
              className="absolute h-2 bg-forest-mid rounded-lg"
              style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
            ></div>
            <button
              ref={minThumbRef}
              type="button"
              onMouseDown={(e) => startDrag(e, 'min')}
              onTouchStart={(e) => startDrag(e, 'min')}
              onKeyDown={(e) => handleKeyDown(e, 'min')}
              className="absolute w-5 h-5 bg-main-bg border-2 border-forest-mid rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent-amber shadow"
              style={{ left: `${minPercent}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              aria-label={`Minimum budget: £${formData.minBudget}`}
              aria-valuemin={MIN_BUDGET_ABSOLUTE}
              aria-valuemax={MAX_BUDGET_ABSOLUTE - BUDGET_STEP}
              aria-valuenow={formData.minBudget}
              role="slider"
            ></button>
            <button
              ref={maxThumbRef}
              type="button"
              onMouseDown={(e) => startDrag(e, 'max')}
              onTouchStart={(e) => startDrag(e, 'max')}
              onKeyDown={(e) => handleKeyDown(e, 'max')}
              className="absolute w-5 h-5 bg-main-bg border-2 border-forest-mid rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent-amber shadow"
              style={{ left: `${maxPercent}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              aria-label={`Maximum budget: £${formData.maxBudget}`}
              aria-valuemin={MIN_BUDGET_ABSOLUTE + BUDGET_STEP}
              aria-valuemax={MAX_BUDGET_ABSOLUTE}
              aria-valuenow={formData.maxBudget}
              role="slider"
            ></button>
          </div>
        </div>
        <div className="flex justify-between text-sm text-text-body mt-1">
          <span>£{formData.minBudget}</span>
          <span>£{formData.maxBudget}{formData.maxBudget === MAX_BUDGET_ABSOLUTE ? '+' : ''}</span>
        </div>
        {formErrors.budget && <p className="text-error-red text-xs mt-1">{formErrors.budget}</p>}
      </div>

      <div>
          <label htmlFor="location" className="block text-sm font-medium text-text-body mb-1">
            Location (required):
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location} 
            onChange={handleGenericChange}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-accent-amber focus:border-transparent transition duration-150 ease-in-out ${formErrors.location ? 'border-error-red' : 'border-gray-300'} text-text-body`}
            placeholder="e.g., City, State or Country"
            required
          />
          {formErrors.location && <p className="text-error-red text-xs mt-1">{formErrors.location}</p>}
        </div>
      
      <div>
        <label htmlFor="occasion" className="block text-sm font-medium text-text-body mb-1">
          Occasion (optional):
        </label>
        <input
          type="text"
          id="occasion"
          name="occasion"
          value={formData.occasion || ''} 
          onChange={handleGenericChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-amber focus:border-transparent transition duration-150 ease-in-out text-text-body"
          placeholder="e.g., Birthday, Anniversary, Thank You"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full text-white font-semibold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                   bg-gradient-to-r from-accent-amber via-yellow-500 to-amber-600
                   hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700
                   focus:ring-amber-400 
                   transform hover:scale-105 focus:scale-105
                   transition-all duration-200 ease-in-out
                   flex items-center justify-center"
        aria-live="polite"
      >
        <span aria-hidden="true" className="mr-2">→</span>
        {isLoading ? 'Thinking of Gifts...' : 'Find Gifts'}
      </button>
    </form>
  );
};
