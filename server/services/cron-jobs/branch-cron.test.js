const { find, uniq } = require("lodash");

describe("branch cron", () => {
  describe("checkBranchesWithDuplicateZipcodes", () => {
    test("Should not send an duplicate zipcode mail(when there is no branches)", async () => {
      const branches = [];
      expect(!branches.length).toBe(true);
    });

    test("Should not send an duplicate zipcode mail(when there is no sub branches)", async () => {
      const subBranches = [];
      expect(!subBranches.length).toBe(true);
    });

    test("Should not send an duplicate zipcode mail(when there is no zipcodes)", async () => {
      const branches = [
        {
          id: 1,
          name: "Main",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 2,
          name: "Fort Pierce",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 3,
          name: "Orlando",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 4,
          name: "Tampa",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 5,
          name: "Jacksonville",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 6,
          name: "Test branch",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        }
      ];
      expect(branches.length > 0).toBe(true);

      const subBranches = [
        {
          id: 19,
          branchId: 1,
          rdnBranchId: 4401,
          name: "Main Lot",
          address: "5425 NW 9th Ave",
          state: "FL",
          city: "Fort Lauderdale",
          zipCode: 33309,
          phone: "954-597-1396",
          displayRank: 0,
          zipCodes: null,
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        },
        {
          id: 18,
          branchId: 1,
          rdnBranchId: 11949,
          name: "Miami Branch",
          address: null,
          state: null,
          city: null,
          zipCode: 33309,
          phone: null,
          displayRank: 0,
          zipCodes: null,
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        }
      ];
      expect(subBranches.length > 0).toBe(true);

      let zipCodesWithBranchId = [];
      subBranches.map(subBranch => {
        subBranch.parsedZipCodes = [];
        if (subBranch.zipCodes) {
          subBranch.parsedZipCodes = JSON.parse(subBranch.zipCodes);
          JSON.parse(subBranch.zipCodes).map(zipCode => {
            const matchedBranch = find(
              branches,
              branch => branch.id == subBranch.branchId
            );
            if (matchedBranch) {
              const duplicateZipcodeIndex = zipCodesWithBranchId.findIndex(
                zipCodeWithBranchId => zipCodeWithBranchId.zipCode == zipCode
              );
              if (duplicateZipcodeIndex === -1) {
                zipCodesWithBranchId.push({
                  zipCode,
                  branchNames: [matchedBranch.name],
                  subBranchNames: [subBranch.name]
                });
              } else {
                zipCodesWithBranchId[duplicateZipcodeIndex] = {
                  ...zipCodesWithBranchId[duplicateZipcodeIndex],
                  branchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex].branchNames,
                    matchedBranch.name
                  ],
                  subBranchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex]
                      .subBranchNames,
                    subBranch.name
                  ]
                };
              }
            }
          });
        }
      });

      expect(!zipCodesWithBranchId.length).toBe(true);
    });

    test("Should not send an duplicate zipcode mail(when there is no duplication of zipcode)", async () => {
      const branches = [
        {
          id: 1,
          name: "Main",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 2,
          name: "Fort Pierce",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 3,
          name: "Orlando",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 4,
          name: "Tampa",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 5,
          name: "Jacksonville",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 6,
          name: "Test branch",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        }
      ];
      expect(branches.length > 0).toBe(true);

      const subBranches = [
        {
          id: 19,
          branchId: 1,
          rdnBranchId: 4401,
          name: "Main Lot",
          address: "5425 NW 9th Ave",
          state: "FL",
          city: "Fort Lauderdale",
          zipCode: 33309,
          phone: "954-597-1396",
          displayRank: 0,
          zipCodes:
            '["33004","33008","33009","33019","33020","33021","33022","33023","33024","33025","33026","33027","33028","33029","33055"]',
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        },
        {
          id: 18,
          branchId: 1,
          rdnBranchId: 11949,
          name: "Miami Branch",
          address: null,
          state: null,
          city: null,
          zipCode: 33309,
          phone: null,
          displayRank: 0,
          zipCodes:
            '["33056","33101","33102","33109","33112","33119","33122","33125","33126","33127","33128","33136","33137","33138","33139","33140","33141","33142","33147","33150","33151","33152","33153","33154","33160","33161","33162","33163","33164","33166","33167","33168","33169","33172","33178","33179","33180","33181","33182","33188","33222","33238","33239","33242","33247","33255","33261","33266","33269","33280"]',
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        }
      ];
      expect(subBranches.length > 0).toBe(true);

      let duplicateZipCodeString = "";
      let zipCodesWithBranchId = [];
      subBranches.map(subBranch => {
        subBranch.parsedZipCodes = [];
        if (subBranch.zipCodes) {
          subBranch.parsedZipCodes = JSON.parse(subBranch.zipCodes);
          JSON.parse(subBranch.zipCodes).map(zipCode => {
            const matchedBranch = find(
              branches,
              branch => branch.id == subBranch.branchId
            );
            if (matchedBranch) {
              const duplicateZipcodeIndex = zipCodesWithBranchId.findIndex(
                zipCodeWithBranchId => zipCodeWithBranchId.zipCode == zipCode
              );
              if (duplicateZipcodeIndex === -1) {
                zipCodesWithBranchId.push({
                  zipCode,
                  branchNames: [matchedBranch.name],
                  subBranchNames: [subBranch.name]
                });
              } else {
                zipCodesWithBranchId[duplicateZipcodeIndex] = {
                  ...zipCodesWithBranchId[duplicateZipcodeIndex],
                  branchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex].branchNames,
                    matchedBranch.name
                  ],
                  subBranchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex]
                      .subBranchNames,
                    subBranch.name
                  ]
                };
              }
            }
          });
        }
      });
      expect(zipCodesWithBranchId.length > 0).toBe(true);

      zipCodesWithBranchId.map(zipCodeWithBranchId => {
        if (uniq(zipCodeWithBranchId.branchNames.length) > 1) {
          duplicateZipCodeString += `(${
            zipCodeWithBranchId.zipCode
          }) belongs to branch ${uniq(
            zipCodeWithBranchId.branchNames
          )} with sub branches (${zipCodeWithBranchId.subBranchNames}) \n`;
        }
      });
      expect(!duplicateZipCodeString.length).toBe(true);
    });

    test("Should send an duplicate zipcode mail", async () => {
      const branches = [
        {
          id: 1,
          name: "Main",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 2,
          name: "Fort Pierce",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 3,
          name: "Orlando",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 4,
          name: "Tampa",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 5,
          name: "Jacksonville",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        },
        {
          id: 6,
          name: "Test branch",
          displayRank: 0,
          createdAt: null,
          updatedAt: null
        }
      ];
      expect(branches.length > 0).toBe(true);

      const subBranches = [
        {
          id: 19,
          branchId: 1,
          rdnBranchId: 4401,
          name: "Main Lot",
          address: "5425 NW 9th Ave",
          state: "FL",
          city: "Fort Lauderdale",
          zipCode: 33309,
          phone: "954-597-1396",
          displayRank: 0,
          zipCodes:
            '["33002","33004","33008","33009","33010","33011","33012","33013","33014","33015","33016","33017","33018","33019","33020","33021","33022","33023","33024","33025","33026","33027","33028","33029","33054","33055","33056","33060","33061","33062","33063","33064","33065","33066","33067","33068","33069","33071","33072","33073","33074","33075","33076","33077","33081","33082","33083","33084","33093","33097","33101","33102","33107","33109","33110","33111","33112","33114","33116","33119","33121","33122","33124","33125","33126","33127","33128","33129","33130","33131","33132","33133","33134","33135","33136","33137","33138","33139","33140","33141","33142","33143","33144","33145","33146","33147","33148","33149","33150","33151","33152","33153","33154","33155","33156","33157","33158","33159","33160","33161","33162","33163","33164","33165","33166","33167","33168","33169","33172","33173","33174","33175","33176","33177","33178","33179","33180","33181","33182","33184","33185","33186","33188","33189","33193","33194","33195","33196","33197","33199","33222","33231","33233","33234","33238","33239","33242","33243","33245","33247","33255","33256","33257","33261","33265","33266","33269","33280","33283","33296","33299","33301","33302","33303","33304","33305","33306","33307","33308","33309","33310","33311","33312","33313","33314","33315","33316","33317","33318","33319","33320","33321","33322","33323","33324","33325","33326","33327","33328","33329","33330","33331","33332","33334","33335","33336","33337","33338","33339","33340","33345","33346","33348","33349","33351","33355","33359","33388","33394","33401","33402","33403","33404","33405","33406","33407","33408","33409","33410","33411","33412","33413","33414","33415","33416","33417","33418","33419","33420","33421","33422","33424","33425","33426","33427","33428","33429","33430","33431","33432","33433","33434","33435","33436","33437","33438","33439","33441","33442","33443","33444","33445","33446","33447","33448","33454","33458","33459","33460","33461","33462","33463","33464","33465","33466","33467","33468","33469","33470","33474","33477","33478","33480","33481","33482","33483","33484","33486","33487","33488","33496","33497","33498","33499","34287"]',
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        },
        {
          id: 18,
          branchId: 2,
          rdnBranchId: 11949,
          name: "Miami Branch",
          address: null,
          state: null,
          city: null,
          zipCode: 33309,
          phone: null,
          displayRank: 0,
          zipCodes:
            '["33002","33010","33011","33012","33013","33014","33015","33016","33017","33018","33054","33055","33056","33101","33102","33109","33112","33119","33122","33125","33126","33127","33128","33136","33137","33138","33139","33140","33141","33142","33147","33150","33151","33152","33153","33154","33160","33161","33162","33163","33164","33166","33167","33168","33169","33172","33178","33179","33180","33181","33182","33188","33222","33238","33239","33242","33247","33255","33261","33266","33269","33280"]',
          createdAt: "2022-01-26T15:10:31.000Z",
          updatedAt: "2022-03-12T05:24:52.000Z"
        }
      ];

      let duplicateZipCodeString = "";
      let zipCodesWithBranchId = [];
      subBranches.map(subBranch => {
        subBranch.parsedZipCodes = [];
        if (subBranch.zipCodes) {
          subBranch.parsedZipCodes = JSON.parse(subBranch.zipCodes);
          JSON.parse(subBranch.zipCodes).map(zipCode => {
            const matchedBranch = find(
              branches,
              branch => branch.id == subBranch.branchId
            );
            if (matchedBranch) {
              const duplicateZipcodeIndex = zipCodesWithBranchId.findIndex(
                zipCodeWithBranchId => zipCodeWithBranchId.zipCode == zipCode
              );
              if (duplicateZipcodeIndex === -1) {
                zipCodesWithBranchId.push({
                  zipCode,
                  branchNames: [matchedBranch.name],
                  subBranchNames: [subBranch.name]
                });
              } else {
                zipCodesWithBranchId[duplicateZipcodeIndex] = {
                  ...zipCodesWithBranchId[duplicateZipcodeIndex],
                  branchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex].branchNames,
                    matchedBranch.name
                  ],
                  subBranchNames: [
                    ...zipCodesWithBranchId[duplicateZipcodeIndex]
                      .subBranchNames,
                    subBranch.name
                  ]
                };
              }
            }
          });
        }
      });

      expect(zipCodesWithBranchId.length > 0).toBe(true);

      zipCodesWithBranchId.map(zipCodeWithBranchId => {
        if (uniq(zipCodeWithBranchId.branchNames).length > 1) {
          duplicateZipCodeString += `(${
            zipCodeWithBranchId.zipCode
          }) belongs to branch ${uniq(
            zipCodeWithBranchId.branchNames
          )} with sub branches (${zipCodeWithBranchId.subBranchNames}) \n`;
        }
      });
      expect(duplicateZipCodeString.length > 0).toBe(true);
    });
  });
});
