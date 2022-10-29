const admin = require("firebase-admin");

const { env, googleFirebaseCredentials } = require("../config/vars");

let messaging;

if (env !== "test") {
  const serviceAccount = require(`../../${googleFirebaseCredentials}`);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  messaging = admin.messaging();
}

module.exports = {
  messaging
};
