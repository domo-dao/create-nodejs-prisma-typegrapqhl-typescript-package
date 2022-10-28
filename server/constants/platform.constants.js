const PLATFORM_SETTINGS = {
  translateAddressesWithinDays: 'TRANSLATE_ADDRESSES_WITHIN_DAYS',
  enableSubscriptionPaywall: 'ENABLE_SUBSCRIPTION_PAYWALL',
  enableProductTour: 'ENABLE_PRODUCT_TOUR',
  mobileAppApiUrl: 'MOBILE_APP_API_URL',
  enableInfractionMap: 'ENABLE_INFRACTION_MAP',
  enableNewActiveShift: 'ENABLE_NEW_ACTIVE_SHIFTS',
  enableSessionManagement: 'ENABLE_SESSION_MANAGEMENT',
};

const PUBLIC_PLATFORM_SETTINGS = [
  PLATFORM_SETTINGS.enableSubscriptionPaywall,
  PLATFORM_SETTINGS.enableProductTour,
  PLATFORM_SETTINGS.mobileAppApiUrl,
  PLATFORM_SETTINGS.enableInfractionMap,
  PLATFORM_SETTINGS.enableNewActiveShift,
  PLATFORM_SETTINGS.enableSessionManagement,
];

const platformConstants = {
  PLATFORM_SETTINGS,
  PUBLIC_PLATFORM_SETTINGS,
};

module.exports = platformConstants;
