const httpStatus = require("http-status");

const APIError = require("../utils/APIError");
const messageConstants = require("../constants/message.constants");
const companyService = require("./company.service");

const { PRODUCT_TOURS } = require("../constants/tour.constants");

const tourService = () => {
  const completeTour = async (user, name, company) => {
    const { CompletedTour } = await companyService().getCompanyDatabase(
      company.dbName
    );

    const tour = getTourByName(name);

    if (!tour) {
      const err = {
        code: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.TOUR_NOT_FOUND
      };
      throw new APIError(err);
    }

    const hasBeenCompleted = await getTourCompletionStatus(user, name, company);

    if (!hasBeenCompleted) {
      await CompletedTour.create({
        userId: user.id,
        name
      });
    }

    return true;
  };

  const getTourCompletionStatus = async (user, name, company) => {
    const { CompletedTour } = await companyService().getCompanyDatabase(
      company.dbName
    );

    const tour = getTourByName(name);

    if (!tour) {
      const err = {
        code: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.TOUR_NOT_FOUND
      };
      throw new APIError(err);
    }

    const previouslyCompletedTour = await CompletedTour.findOne({
      where: { userId: user.id, name },
      raw: true
    });

    return previouslyCompletedTour ? true : false;
  };

  const getTourByName = name => {
    return Object.keys(PRODUCT_TOURS).find(
      tour => PRODUCT_TOURS[tour] === name
    );
  };

  return {
    completeTour,
    getTourCompletionStatus
  };
};

module.exports = tourService;
