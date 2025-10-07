import React from "react";

const paymentMethods = [
  { name: "Visa", img: "/assets/payment/visa.png" },
  { name: "Mastercard", img: "/assets/payment/mastercard.png" },
  { name: "RuPay", img: "/assets/payment/rupay.png" },
  { name: "UPI", img: "/assets/payment/upi.png" },
  { name: "Google Pay", img: "/assets/payment/gpay.png" },
  { name: "Paytm", img: "/assets/payment/paytm.png" },
  { name: "Cash on Delivery", img: "/assets/payment/cod.png" },
];

const PaymentOptions: React.FC = () => {
  return (
    <section className="w-full py-12 bg-white text-center animate-fade-in-up">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        Payment Options
      </h2>

      <div className="flex flex-wrap justify-center items-center gap-8">
        {paymentMethods.map((method) => (
          <img
            key={method.name}
            src={method.img}
            alt={method.name}
            className="h-10 object-contain opacity-90 hover:opacity-100 transition-transform duration-300 hover:scale-[1.04]"
          />
        ))}
      </div>
    </section>
  );
};

export default PaymentOptions;
