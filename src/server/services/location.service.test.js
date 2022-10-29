const locationHelper = require("../helpers/location.helper");

const miamiBranch = {
  id: 1,
  address: "1510 Johnson St, Jacksonville, FL 32209, USA",
  lat: 26.01520735956236,
  lng: -80.27988951543888
};
const tampaBranch = {
  id: 2,
  address: "1814 N 47th St, Tampa, FL 33605, USA",
  lat: 27.96233584175628,
  lng: -82.40635723814592
};
const fortPierceBranch = {
  id: 3,
  address: "3625 Pleasant Acres Rd, Fort Pierce, FL 34982, USA",
  lat: 27.393523308469046,
  lng: -80.33002544315342
};

jest.mock("../database/models", () => ({
  PlatformLocation: {
    findOne: jest.fn(filter =>
      filter.where.address === miamiBranch.address ? miamiBranch : null
    ),
    create: jest.fn()
  },
  rra_db: {
    Location: {
      findOne: jest.fn(filter =>
        filter.where.address === tampaBranch.address ? tampaBranch : null
      ),
      create: jest.fn()
    }
  }
}));

jest.mock("../helpers/location.helper");

locationHelper.getGeoLocation = jest.fn(async address => {
  const locations = [];

  if (address == fortPierceBranch) {
    locations.push(fortPierceBranch);
  }

  return [];
});

describe("Location service", () => {
  const locationService = require("./location.service");

  describe("getOrSetAddress", () => {
    const company = { dbName: "rra_db" };

    test("Should not use the GeoCoding API (Location inside global locations table)", async () => {
      await locationService().getOrSetAddress(miamiBranch.address, company);

      expect(locationHelper.getGeoLocation).toHaveBeenCalledTimes(0);
    });

    test("Should not use the GeoCoding API (Location inside company locations table)", async () => {
      await locationService().getOrSetAddress(tampaBranch.address, company);

      expect(locationHelper.getGeoLocation).toHaveBeenCalledTimes(0);
    });

    test("Should use the GeoCoding API (location not stored in any of the tables)", async () => {
      await locationService().getOrSetAddress(
        fortPierceBranch.address,
        company
      );

      expect(locationHelper.getGeoLocation).toHaveBeenCalledTimes(1);
    });
  });
});
