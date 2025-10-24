import React from "react";
import { useNavigate, useParams } from "react-router-dom";

//Brand interface
interface Brand {
  id: number;
  name: string;
  logo: string;
}

// Utility: fallback emoji as image
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

// Top brands
const brands: Brand[] = [
  { id: 1, name: "Amul", logo: "https://static.sociofyme.com/thumb/msid-99353072,width-900,height-1200,resizemode-6.cms" },
  { id: 2, name: "Tata", logo: "https://img.clevup.in/285827/1675243149439_1631207454313smpann.jpeg?width=260&height=260&format=webp" },
  { id: 3, name: "Nestle", logo: "https://crystalpng.com/wp-content/uploads/2025/03/nestle_logo.png" },
  { id: 4, name: "Britannia", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Britannia_Industries_logo.svg/1200px-Britannia_Industries_logo.svg.png" },
  { id: 5, name: "Parle", logo: "https://www.parleproducts.com/images/home_logo.webp" },
  { id: 6, name: "Fortune", logo: "https://www.fortunefoods.com/wp-content/uploads/2022/12/logo-fortune-1.png" },
  { id: 7, name: "Dabur", logo: "https://www.dabur-usa.com/assets/images/dabur_logo.png" },
  { id: 8, name: "Patanjali", logo: "https://www.patanjaliayurved.net/media/images/logo.svg" },
  { id: 9, name: "Saffola", logo: "https://www.saffola.in/images/saffola-oils-logo.png" },
  { id: 10, name: "Mother Dairy", logo: "https://pbs.twimg.com/profile_images/1786284419961044992/XTJsC67i_400x400.png" },
];

const TopBrandsSection: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();

  return (
    <section id="brands" className="w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Top Brands
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {brands.map((brand) => (
          <div
            key={brand.id}
            onClick={() => navigate(`${shop ? `/${shop}` : ""}/brand/${encodeURIComponent(brand.name)}`)}
            role="button"
            aria-label={brand.name}
            className="group bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-gray-100">
              <img
                src={brand.logo}
                alt={brand.name}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = emojiDataUrl("🏷️");
                  if (target.src !== fallback) target.src = fallback;
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain bg-white rounded-full transition-transform duration-300 group-hover:scale-[1.06]"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800 text-center">
              {brand.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopBrandsSection;
