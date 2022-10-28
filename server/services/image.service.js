const imageService = () => {
  const toBase64 = image => {
    return new Promise((resolve, reject) => {
      try {
        const buffer = Buffer.from(image, "binary");
        const base64 = buffer.toString("base64");

        resolve(`data:image/png;base64,${base64}`);
      } catch (e) {
        reject(e);
      }
    });
  };

  return {
    toBase64
  };
};

module.exports = imageService;
