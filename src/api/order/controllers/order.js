"use strict";
const stripe = require("stripe")(
  "sk_test_51NsGK8IPNQYM4iQCsIuz5AGrNNQA1GRUL2jfj25TftAUG2yE1D8OfFkaDbMvUYRUnZ5EeY4X6tmzUxYVUvpc0Rqh001G1PwzQ4"
);

function calcDiscountPrice(price, discount) {
  if (!discount) return price;

  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;

  return result.toFixed(2);
}

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, idUser, addressShipping } = ctx.body;

    let totalPayment = 0;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      totalPayment += Number(priceTemp) * product.attributes.quantity;
    });

    const charge = stripe.charges.create({
      amount: Math.round(totalPayment * 100),
      currency: "usd",
      source: token.id,
      description: `User ID: ${idUser}`,
    });

    const data = {
      products,
      user: idUser,
      totalPayment,
      idPayment: charge.id,
      addressShipping,
    };

    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreation(
      model,
      data
    );

    const entry = await strapi.db
      .query("api::order.order")
      .create({ data: validData });

    return entry;
  },

  //override create endpoint
  //   async create(ctx) {

  //   }
}));
