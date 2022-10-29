const Sequelize = require("sequelize");
const moment = require("moment");

const {
  SubscriptionDetails,
  CompanySubscription
} = require("../database/models");

const {
  getPaymentLinkTrail,
  generateCustomerId,
  getPaymentLink,
  getSubscriptionDetails,
  cancelSubscription,
  createPaymentMethod,
  attachPaymentMethodToSubscription,
  attachPaymentMethodToCustomer,
  getPaymentMethods,
  getPaymentMethodDetails,
  getReActivePaymentLink,
  getCustomerPaymentHistory
} = require("../utils/stripe.util");
const CONSTANTS = require("../database/config/constants");

const subscription_helper = require("../api/helpers/subscription.helper");
const {
  sendPushNotificationOnSubscriptionChange
} = require("../api/helpers/subscription.helper");
const platformService = require("./platform.service");
const { PLATFORM_SETTINGS } = require("../constants/platform.constants");
const {
  subscription_types,
  subscription_stripe_status
} = require("../database/config/constants");

exports.addSubscription = async data => {
  return await SubscriptionDetails.create({
    ...data
  });
};

exports.getAllActiveSubscriptions = async (user = {}) => {
  let users = await subscription_helper.getUsersInCompany(user.company);
  return await SubscriptionDetails.findAll({
    where: {
      allowedUsers: {
        [Sequelize.Op.gte]: users.length
        // [Sequelize.Op.gte]: 22
      },
      isActive: true
    }
  });
};

exports.getBillingLinkTrail = async (user, { id }) => {
  let subscription = await SubscriptionDetails.findOne({
    where: {
      id
    }
  });
  let customerId;
  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: user.company.id
    }
  });
  if (!companySub) {
    let customer = await generateCustomerId(
      user.company.name,
      user.company.email
    );
    await CompanySubscription.create({
      companyId: user.company.id,
      stripeCustomerId: customer.id,
      // type: subscription.type,
      status: CONSTANTS.company_subscription_status.inactive,
      // subscriptionId: subscription.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    customerId = customer.id;
  } else {
    customerId = companySub.stripeCustomerId;
    await CompanySubscription.update(
      {
        // type: subscription.type,
        // subscriptionId: subscription.id,
        updatedAt: new Date().toISOString()
      },
      {
        where: {
          id: companySub.id
        }
      }
    );
  }

  const checkout = await getPaymentLinkTrail(subscription, customerId);
  return checkout?.url ?? null;
};

exports.getBillingLink = async (user, { id }) => {
  let subscription = await SubscriptionDetails.findOne({
    where: {
      id
    }
  });
  let customerId;
  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: user.company.id
    }
  });
  if (!companySub) {
    let customer = await generateCustomerId(
      user.company.name,
      user.company.email
    );
    await CompanySubscription.create({
      companyId: user.company.id,
      stripeCustomerId: customer.id,
      // type: subscription.type,
      status: CONSTANTS.company_subscription_status.inactive,
      // subscriptionId: subscription.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    customerId = customer.id;
  } else {
    customerId = companySub.stripeCustomerId;
    await CompanySubscription.update(
      {
        type: subscription.type,
        subscriptionId: subscription.id,
        updatedAt: new Date().toISOString()
      },
      {
        where: {
          id: companySub.id
        }
      }
    );
  }

  const checkout = await getPaymentLink(subscription, customerId);
  return checkout?.url ?? null;
};

exports.cancelSubscription = async (user = {}) => {
  const companySub = await CompanySubscription.findOne({
    where: { companyId: user.company.id }
  });
  if (companySub) {
    const subscriptionId = companySub.stripeSubscriptionId;
    await cancelSubscription(subscriptionId);
  }
};

exports.updateSubscriptionOfUser = async (data = {}, eventType = "") => {
  const { id: subscriptionId, customer, status } = data;
  const priceId = data.items.data?.[0]?.price?.id;
  const updatedSubscription = await SubscriptionDetails.findOne({
    where: {
      stripePriceId: priceId
    }
  });
  if (
    status !== CONSTANTS.subscription_stripe_status.incomplete &&
    status !== CONSTANTS.subscription_stripe_status.incomplete_expired
  ) {
    await CompanySubscription.update(
      {
        stripeSubscriptionId: subscriptionId,
        type: updatedSubscription.type,
        subscriptionId: updatedSubscription.id,
        updatedAt: new Date().toISOString(),
        status:
          status === CONSTANTS.subscription_stripe_status.active ||
          status === CONSTANTS.subscription_stripe_status.trialing
            ? CONSTANTS.company_subscription_status.active
            : CONSTANTS.company_subscription_status.inactive
      },
      {
        where: {
          stripeCustomerId: customer
        }
      },
      {
        returning: true,
        plain: true
      }
    );
    const updatedCompanySubscription = await CompanySubscription.findOne({
      where: {
        stripeCustomerId: customer
      }
    });
    await sendPushNotificationOnSubscriptionChange(
      updatedCompanySubscription.companyId,
      eventType
    );
  }
};

exports.getUserSubscriptionDetails = async (user = {}) => {
  const companyId = user.company.id;
  const companySub = await CompanySubscription.findOne({
    where: {
      companyId
    }
  });
  const subDetails = await SubscriptionDetails.findOne({
    where: {
      id: companySub.subscriptionId
    }
  });
  let users = await subscription_helper.getUsersInCompany(user.company);
  const stripeSubscriptionDetails = await getSubscriptionDetails(
    companySub.stripeSubscriptionId
  );
  return {
    filledSeats: users.length,
    status: stripeSubscriptionDetails.status,
    availableSeats: subDetails.allowedUsers,
    plan: subDetails.type,
    paymentMethod: await getPaymentMethodDetails(
      stripeSubscriptionDetails.default_payment_method
    ),
    duration: subDetails.duration,
    nextCycle: moment
      .unix(stripeSubscriptionDetails.current_period_end)
      .toDate(),
    trial:
      stripeSubscriptionDetails.status ===
      CONSTANTS.subscription_stripe_status.trialing
  };
};

exports.changePaymentMethod = async (user = {}, data = {}) => {
  const companyId = user.company.id;
  const companySub = await CompanySubscription.findOne({
    where: { companyId }
  });
  let paymentMethod = await createPaymentMethod(data);
  await attachPaymentMethodToCustomer(
    companySub.stripeCustomerId,
    paymentMethod.id
  );
  return await attachPaymentMethodToSubscription(
    companySub.stripeSubscriptionId,
    paymentMethod.id
  );
};

exports.getAllUserPaymentMethods = async (user = {}) => {
  const companyId = user.company.id;
  const companySub = await CompanySubscription.findOne({
    where: { companyId }
  });
  const stripeSubscriptionDetails = await getSubscriptionDetails(
    companySub.stripeSubscriptionId
  );
  const subscriptionDefaultPaymentMenthod =
    stripeSubscriptionDetails.default_payment_method;
  let paymentMethods = await getPaymentMethods(companySub.stripeCustomerId);
  return {
    paymentMethods: paymentMethods.data,
    defaultPaymentMethod: subscriptionDefaultPaymentMenthod
  };
};

exports.getPackageDetailsReactivate = async (user = {}) => {
  let users = await subscription_helper.getUsersInCompany(user.company);
  return {
    [CONSTANTS.subscription_types.basic]: await SubscriptionDetails.findOne({
      where: {
        allowedUsers: {
          [Sequelize.Op.gte]: users.length
        },
        type: CONSTANTS.subscription_types.basic,
        isActive: true
      }
    }),
    [CONSTANTS.subscription_types.advanced]: await SubscriptionDetails.findOne({
      where: {
        allowedUsers: {
          [Sequelize.Op.gte]: users.length
        },
        type: CONSTANTS.subscription_types.advanced,
        isActive: true
      }
    })
  };
};

exports.getActivateLink = async (user = {}, id) => {
  let subscription = await SubscriptionDetails.findOne({
    where: {
      id
    }
  });
  let customerId;
  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: user.company.id
    }
  });
  if (!companySub) {
    let customer = await generateCustomerId(
      user.company.name,
      user.company.email
    );
    await CompanySubscription.create({
      companyId: user.company.id,
      stripeCustomerId: customer.id,
      type: subscription.type,
      status: CONSTANTS.company_subscription_status.inactive,
      subscriptionId: subscription.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    customerId = customer.id;
  } else {
    customerId = companySub.stripeCustomerId;
    await CompanySubscription.update(
      {
        type: subscription.type,
        subscriptionId: subscription.id,
        updatedAt: new Date().toISOString()
      },
      {
        where: {
          id: companySub.id
        }
      }
    );
  }

  const checkout = await getReActivePaymentLink(subscription, customerId);
  return checkout?.url ?? null;
};

exports.getIsCompanyHasBandwidth = async company => {
  if (company.isBetaTester) {
    return true;
  }

  const enablePaywall = await platformService().getPlatformSetting(
    PLATFORM_SETTINGS.enableSubscriptionPaywall
  );

  if (!enablePaywall) {
    return true;
  }

  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: company.id
    }
  });

  if (companySub === null) {
    return false;
  }

  const users = await subscription_helper.getUsersInCompany(company);

  const subDetails = await SubscriptionDetails.findOne({
    where: {
      id: companySub.subscriptionId
    }
  });
  if (subDetails === null) {
    return false;
  }

  return subDetails.allowedUsers > users.length;
};

exports.getSubDetailsForUserPortal = async user => {
  const { company } = user;
  if (company.isBetaTester) {
    return {
      status: subscription_stripe_status.active,
      filledSeats: 0,
      availableSeats: 200,
      plan: subscription_types.advanced,
      duration: 0,
      nextCycle: moment().toDate(),
      trial: false
    };
  }

  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: company.id
    }
  });
  const subDetails = await SubscriptionDetails.findOne({
    where: {
      id: companySub.subscriptionId
    }
  });
  const users = await subscription_helper.getUsersInCompany(user.company);
  const stripeSubscriptionDetails = await getSubscriptionDetails(
    companySub.stripeSubscriptionId
  );

  return {
    status: stripeSubscriptionDetails.status,
    filledSeats: users.length,
    availableSeats: subDetails.allowedUsers,
    plan: subDetails.type,
    duration: subDetails.duration,
    nextCycle: moment
      .unix(stripeSubscriptionDetails.current_period_end)
      .toDate(),
    trial:
      stripeSubscriptionDetails.status ===
      CONSTANTS.subscription_stripe_status.trialing
  };
};

exports.getCustomerPaymentHistory = async user => {
  const { company } = user;
  const companySub = await CompanySubscription.findOne({
    where: {
      companyId: company.id
    }
  });
  const paymentHistory = await getCustomerPaymentHistory(
    companySub.stripeCustomerId
  );
  return paymentHistory?.data ?? [];
};
