import React from "react";

const steps = [
  {
    id: 1,
    img: "/assets/how-it-works/openapp.png",
    title: "Open the app",
    description:
      "Choose from over 7000 products across groceries, fresh fruits & veggies, meat, pet care, beauty items & more",
  },
  {
    id: 2,
    img: "/assets/how-it-works/placeorder.png",
    title: "Place an order",
    description:
      "Add your favourite items to the cart & avail the best offers",
  },
  {
    id: 3,
    img: "/assets/how-it-works/freedelivery.png",
    title: "Get free delivery",
    description:
      "Experience lightning-fast speed & get all your items delivered in 10 minutes",
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.id}
            className="bg-white shadow-lg rounded-2xl p-6 text-center hover:shadow-xl transition"
          >
            <img
              src={step.img}
              alt={step.title}
              className="w-32 h-32 object-contain mx-auto mb-6"
            />
            <h3 className="text-lg font-semibold text-gray-800">
              {step.title}
            </h3>
            <p className="text-gray-600 text-sm mt-2">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
