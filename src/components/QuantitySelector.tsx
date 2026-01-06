import React, { useState } from "react";

interface QuantitySelectorProps {
  initialQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  min?: number;
  max?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  initialQuantity = 1,
  onQuantityChange,
  min = 1,
  max = 99
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleIncrement = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onQuantityChange?.(newQuantity);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onQuantityChange?.(newQuantity);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      const clampedValue = Math.min(Math.max(value, min), max);
      setQuantity(clampedValue);
      onQuantityChange?.(clampedValue);
    }
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-full w-fit">
      <button
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <span className="text-lg font-bold">-</span>
      </button>
      
      <input
        type="text"
        value={quantity}
        onChange={handleChange}
        className="w-10 text-center border-x border-gray-300 py-1 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
        aria-label="Quantity"
      />
      
      <button
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <span className="text-lg font-bold">+</span>
      </button>
    </div>
  );
};

export default QuantitySelector;