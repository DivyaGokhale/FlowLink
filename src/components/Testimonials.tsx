import React from "react";

const testimonials = [
  {
    id: 1,
    name: "Ananya Mehta",
    role: "CEO, TechStart Inc.",
    image: "/assets/customers/cust1.jpg",
    text: "The team exceeded our expectations with their innovative approach and attention to detail. Our project was delivered on time and within budget.",
  },
  {
    id: 2,
    name: "Rohit Sharma",
    role: "CTO, InnovateHub",
    image: "/assets/customers/cust2.jpg",
    text: "Outstanding service and exceptional results. The collaboration was seamless and the final product has significantly improved our operations.",
  },
  {
    id: 3,
    name: "Priya Nair",
    role: "Director, Creative Solutions",
    image: "/assets/customers/cust3.jpg",
    text: "Professional, reliable, and innovative. They transformed our vision into reality with precision and creativity that went beyond our expectations.",
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mt-2 mb-4">
        What Clients Say
      </h2>
      <p className="text-gray-800 max-w-2xl mx-auto mb-6">
        Discover how our solutions have helped clients achieve their goals 
        through innovative technology and dedicated support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition"
          >
            <img
              src={t.image}
              alt={t.name}
              className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow-md"
            />
            <p className="text-gray-700 italic mb-4">"{t.text}"</p>
            <h3 className="font-semibold text-gray-900">{t.name}</h3>
            <p className="text-sm text-gray-500">{t.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
