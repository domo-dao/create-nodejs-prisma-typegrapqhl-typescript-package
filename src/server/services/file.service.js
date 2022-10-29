const fs = require("fs");

const fileService = () => {
  const readFile = fileName => {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, "utf8", function (error, data) {
        if (error) return reject(error);

        resolve(data);
      });
    });
  };

  const writeFile = (filePath, fileName, content) => {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      fs.writeFile(`${filePath}${fileName}`, content, error => {
        if (error) return reject(error);

        resolve();
      });
    });
  };

  const createNewFilename = name => {
    name.__proto__.withExtension = function (extension = "") {
      if (extension) {
        return `${this}.${extension}`;
      }

      return this;
    };

    return name;
  };

  const generateRandomFilename = () => {
    return createNewFilename(
      new Buffer.from(new Date(), "binary").toString("base64")
    );
  };

  return {
    readFile,
    writeFile,
    createNewFilename,
    generateRandomFilename
  };
};

module.exports = fileService;
