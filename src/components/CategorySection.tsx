import React from "react";

interface Category {
  id: number;
  name: string;
  image: string;
}

// Generate a stable inline SVG data URL with an emoji for reliable rendering
const emojiDataUrl = (emoji: string) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#f8fafc'/>
        <stop offset='100%' stop-color='#eef2f7'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='100' ry='100' fill='url(#g)'/>
    <text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' font-size='96'>${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const categories: Category[] = [
  {
    id: 1,
    name: "Dairy, Bread & Eggs",
    image: "/categories/dairy-bread-eggs.png",
  },
  {
    id: 2,
    name: "Cold Drinks & Juices",
    image: "/categories/cold-drinks-juices.png",
  },
  {
    id: 3,
    name: "Rice, Atta & Grains",
    image: "/categories/rice-atta-grains.png",
  },
  {
    id: 4,
    name: "Sugar, Jaggery & Salt",
    image: "/categories/sugar-jaggery-salt.png",
  },
  {
    id: 5,
    name: "Masale & Spices",
    image: "/categories/masale-spices.png",
  },
  {
    id: 6,
    name: "Biscuits & Snacks",
    image: "/categories/dairy-bread-eggs.png",
  },
  {
    id: 7,
    name: "Tea, Coffee & Beverages",
    image: "/categories/cold-drinks-juices.png",
  },
  {
    id: 8,
    name: "Oil & Ghee",
    image: "/categories/rice-atta-grains.png",
  },
  {
    id: 9,
    name: "Personal Care",
    image: "/categories/sugar-jaggery-salt.png",
  },
  {
    id: 10,
    name: "Household Cleaning",
    image: "/categories/masale-spices.png",
  },
];

const CategorySection: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore by Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer shadow-card hover:shadow-md transition hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden rounded-full bg-secondary">
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = emojiDataUrl("📦");
                  if (target.src !== fallback) target.src = fallback;
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full bg-white p-1 transition-transform duration-200 hover:scale-[1.03]"
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
