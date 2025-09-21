// src/components/BackButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  confirmOnPayment?: boolean; // special case for PaymentPage
  fallbackPath?: string;      // optional fixed fallback (e.g., /cart)
}

const BackButton: React.FC<BackButtonProps> = ({ confirmOnPayment, fallbackPath }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (confirmOnPayment) {
      const confirm = window.confirm(
        "⚠️ Going back may discard entered payment details. Do you want to continue?"
      );
      if (!confirm) return;
    }

    if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate(-1); // default: go back in history
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
    >
      ← Back
    </button>
  );
};

export default BackButton;
