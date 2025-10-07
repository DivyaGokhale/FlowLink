import React, { useState } from "react";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useAddress, Address } from "./AddressContext";
import AddAddressModal from "./AddAddressModal";

// Props for the AddressCard component
interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const fullAddress = `${address.name}, ${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postalCode}`;

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm cursor-pointer transition-all duration-300 relative ${
        isSelected
          ? "border-green-500 ring-2 ring-green-200 bg-green-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelect(address.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-bold text-lg">{address.type}</h3>
            {address.isDefault && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
        </div>
        <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
          {address.time || "25 mins"}
        </span>
      </div>
      <p className="text-gray-600 mb-4 text-sm">{fullAddress}</p>
      <p className="text-gray-600 mb-4 text-sm">{address.phone}</p>

      {onEdit && onDelete && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address.id);
            }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          {!address.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this address?')) {
                  onDelete(address.id);
                }
              }}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      )}

      <button
        className={`w-full py-2 rounded-lg font-semibold text-center transition-colors duration-300 ${
          isSelected
            ? "bg-green-600 text-white shadow-md hover:bg-green-700"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!isSelected}
      >
        {isSelected ? "Selected" : "Select Address"}
      </button>
    </div>
  );
};

const AddNewAddressCard: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  return (
    <div
      className="p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-full min-h-[220px] text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors cursor-pointer"
      onClick={onAdd}
    >
      <div className="flex items-center justify-center bg-gray-100 rounded-full p-3 mb-3">
        <Plus className="w-8 h-8" />
      </div>
      <p className="font-semibold mb-2">Add New Address</p>
      <p className="text-sm text-center">Click to add a new delivery address</p>
    </div>
  );
};

const AddressSelector: React.FC = () => {
  const { addresses, selectedAddress, selectAddress, deleteAddress } = useAddress();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddressSelect = (id: string) => {
    selectAddress(id);
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  return (
    <section className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Choose a delivery address
          </h2>
          {addresses.length > 0 && (
            <span className="text-sm text-gray-600">
              {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No addresses yet</h3>
            <p className="text-gray-500 mb-6">Add your first address to continue with your order</p>
            <button
              onClick={handleAddNew}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                isSelected={selectedAddress?.id === addr.id}
                onSelect={handleAddressSelect}
                onEdit={(id) => {
                  // TODO: Implement edit functionality
                  console.log('Edit address:', id);
                }}
                onDelete={deleteAddress}
              />
            ))}
            <AddNewAddressCard onAdd={handleAddNew} />
          </div>
        )}
      </div>

      <AddAddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default AddressSelector;
