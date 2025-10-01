import React, { useState } from "react";
import { MapPin, Plus } from "lucide-react";

// Interface for a single address object
interface Address {
  id: number;
  type: string;
  address: string;
  time: string;
}

// Props for the AddressCard component
interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

// Sample address data
const addresses: Address[] = [
  {
    id: 1,
    type: "Home",
    address: "123 Main Street, Ratnagiri, Maharashtra 415612",
    time: "25 mins",
  },
  {
    id: 2,
    type: "Office",
    address: "456 Business Park, Ratnagiri, Maharashtra 415612",
    time: "35 mins",
  },
  {
    id: 3,
    type: "Other",
    address: "789 Residential Area, Ratnagiri, Maharashtra 415612",
    time: "28 mins",
  },
];

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
}) => {
  const { id, type, address: fullAddress, time } = address;

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm cursor-pointer transition-all duration-300 ${
        isSelected
          ? "border-green-500 ring-2 ring-green-200"
          : "border-gray-200"
      }`}
      onClick={() => onSelect(id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-lg">{type}</h3>
        </div>
        <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
          {time}
        </span>
      </div>
      <p className="text-gray-600 mb-4">{fullAddress}</p>
      <button
        className={`w-full py-2 rounded-lg font-semibold text-center transition-colors duration-300 ${
          isSelected
            ? "bg-green-600 text-white shadow-md hover:bg-green-700"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!isSelected}
      >
        Deliver Here
      </button>
    </div>
  );
};

const AddNewAddressCard: React.FC = () => {
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-full min-h-[190px] text-gray-600">
      <div className="flex items-center justify-center bg-gray-100 rounded-full p-2 mb-2">
        <Plus className="w-6 h-6" />
      </div>
      <p className="font-semibold mb-4">Add New Address</p>
      <button className="w-full py-2 rounded-lg font-semibold text-center border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-300">
        Add New
      </button>
    </div>
  );
};

const AddressSelector: React.FC = () => {
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1); // Default to 'Home'

  return (
    <section className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Choose a delivery address
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              isSelected={selectedAddressId === addr.id}
              onSelect={setSelectedAddressId}
            />
          ))}
          <AddNewAddressCard />
        </div>
      </div>
    </section>
  );
};

export default AddressSelector;
