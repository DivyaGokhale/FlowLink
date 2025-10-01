import React from "react";

interface Category {
  id: number;
  name: string;
  image: string;
}

const categories: Category[] = [
  {
    id: 1,
    name: "Dairy, Bread & Eggs",
    image: "/src/assets/categories/dairy.png",
  },
  {
    id: 2,
    name: "Cold Drinks & Juices",
    image: "/src/assets/categories/cold_drinks.png",
  },
  {
    id: 3,
    name: "Rice, Atta & Grains",
    image: "/src/assets/categories/rice_atta_grains.png",
  },
  {
    id: 4,
    name: "Sugar, Jaggery & Salt",
    image: "/src/assets/categories/sugar_jaggery_salt.png",
  },
  {
    id: 5,
    name: "Masale & Spices",
    image: "/src/assets/categories/masale_spices.png",
  },
  {
    id: 6,
    name: "Biscuits & Snacks",
    image: "/src/assets/categories/biscuits_snacks.png",
  },
  {
    id: 7,
    name: "Tea, Coffee & Beverages",
    image: "/src/assets/categories/beverages.png",
  },
  {
    id: 8,
    name: "Oil & Ghee",
    image: "/src/assets/categories/oil_ghee.png",
  },
  {
    id: 9,
    name: "Personal Care",
    image: "/src/assets/categories/personal_Care.png",
  },
  {
    id: 10,
    name: "Household Cleaning",
    image: "/src/assets/categories/household.png",
  },
];

const CategorySection: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white shadow-sm border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden rounded-full bg-gray-50">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700 text-center">
              {cat.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
