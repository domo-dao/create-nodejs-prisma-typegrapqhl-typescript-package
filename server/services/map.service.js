const StaticMaps = require("staticmaps");

const fileService = require("./file.service");
const imageService = require("./image.service");

const { mapTileUrl } = require("../config/vars");
const { base64FileUpload } = require("../utils/util");
const { EMAIL_MAPS } = require("../constants/app.constants");

const mapService = () => {
  const getMap = async points => {
    if (!points.length) {
      throw new Error("No points to render");
    }

    const map = new StaticMaps({
      width: 900,
      height: 600,
      tileUrl: mapTileUrl
    });

    points.forEach(point => {
      map.addMarker({
        width: 31,
        height: 42,
        offsetX: 0,
        offsetY: 0,
        coord: [point.lng, point.lat],
        img: `${__dirname}/../static/assets/img/${
          point.isVoluntary === undefined
            ? "marker"
            : point.isVoluntary
            ? "voluntary"
            : "involuntary"
        }.png`
      });
    });

    await map.render();

    return await map.image.buffer("image/png");
  };

  const convertMapToEmbeddable = async map => {
    const embeddable = await imageService().toBase64(map);

    return embeddable;
  };

  const saveMap = async (embeddable, path) => {
    const filename = fileService().createNewFilename(path).withExtension("png");

    const url = await base64FileUpload(embeddable, filename, EMAIL_MAPS.bucket);

    return url;
  };

  const createAndSaveMap = async (points, name) => {
    try {
      const map = await getMap(points);
      const embeddable = await convertMapToEmbeddable(map);
      const url = await saveMap(embeddable, name);

      return url;
    } catch {
      return EMAIL_MAPS.default_image;
    }
  };

  return {
    getMap,
    createAndSaveMap,
    convertMapToEmbeddable
  };
};

module.exports = mapService;
