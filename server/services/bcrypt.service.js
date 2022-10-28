const bcrypt = require("bcrypt");

const bcryptService = () => {
  const password = password => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);

    return hash;
  };

  const comparePassword = (pw, hash) => bcrypt.compareSync(pw, hash);

  return {
    password,
    comparePassword
  };
};

module.exports = bcryptService;
