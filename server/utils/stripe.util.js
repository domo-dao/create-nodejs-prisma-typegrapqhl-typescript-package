const {
  stripeSecretKey,
  dashboardUrl,
  stripeWebhookKey
} = require("../config/vars");

const stripe = require("stripe")(stripeSecretKey);

exports.generateCustomerId = async (name = "", email = "") => {
  return await stripe.customers.create({
    email,
    name
  });
};

exports.assignSubscriptionTrail = async (customerId, priceId) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    trial_period_days: 30,
    items: [
      {
        quantity: 1,
        price: priceId
      }
    ]
  });
};

exports.getPaymentLinkTrail = async (
  { stripePriceId, duration },
  customerId
) => {
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1
      }
    ],
    success_url: `${dashboardUrl}/company/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${dashboardUrl}/company/payment/error`,
    subscription_data: {
      trial_period_days: duration
    }
  });
};

exports.getPaymentLink = async ({ stripePriceId }, customerId) => {
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    customer: customerId,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1
      }
    ],
    success_url: `${dashboardUrl}/app/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${dashboardUrl}/app/payment/error`
  });
};
exports.getReActivePaymentLink = async ({ stripePriceId }, customerId) => {
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    customer: customerId,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1
      }
    ],
    success_url: `${dashboardUrl}/app/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${dashboardUrl}/user/login`
  });
};

exports.getSubscriptionDetails = (id = "") => {
  return stripe.subscriptions.retrieve(id);
};

exports.cancelSubscription = (id = "") => {
  return stripe.subscriptions.update(id, { cancel_at_period_end: true });
};

exports.createPaymentMethod = async (data = {}) => {
  return await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: data.number,
      exp_month: data.exp_month,
      exp_year: data.exp_year,
      cvc: data.cvc
    }
  });
};

exports.attachPaymentMethodToSubscription = async (
  subscriptionId,
  paymentMethodId
) => {
  return await stripe.subscriptions.update(subscriptionId, {
    default_payment_method: paymentMethodId
  });
};

exports.attachPaymentMethodToCustomer = async (customerId, paymentMethodId) => {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });
};

exports.constructEvent = (body, sig) => {
  return stripe.webhooks.constructEvent(body, sig, stripeWebhookKey);
};

exports.getPaymentMethods = async customerId => {
  return stripe.customers.listPaymentMethods(customerId, {
    type: "card",
    limit: 50
  });
};

exports.getPaymentMethodDetails = async paymentMethodId => {
  return stripe.paymentMethods.retrieve(paymentMethodId);
};

exports.getCustomerPaymentHistory = async customerId => {
  return stripe.paymentIntents.list({
    customer: customerId,
    limit: 50
  });
};
