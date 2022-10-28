const { keys, orderBy, toLower } = require('lodash');

const API = require('./apis');

const getCameraScansAndHits = async (company, date) => {
  let api;
  if (company) {
    api = API.create(company.drnKey);
  } else {
    api = API.create();
  }

  const response = await api.getCameraHit(date);
  // const response =
  //   {
  //     data: {
  //       "direct": {
  //         "RapidFLDriver01":"2341",
  //         "RapidFLDriver06":"2923",
  //         "rapidfldriver20":"828",
  //         "rapidfldriver24":"994",
  //         "RapidFLDriver25":"151",
  //         "RapidRecFL110011":"816"
  //       },
  //       "lpr": {
  //         "RapidFLDriver01":["2S111075","3C071770","3C117431","3LW23816","3W805109","3Z015909","3Z041204","3Z161748","4L469726","4PB18377","4PB59494","4Z246392","50052124","50079678","5S495233","5Z477538","6C563166","6Z733634","75037740","75100901","85200720","8KB46010","8R275155","8R604216","92093786","95241315","9J008189","9R606603","A5008484","AZ371885","CH435486","DJ047034","DP090951","E5232418","JW234308","S0089304"],
  //         "RapidFLDriver06":["2W736109","3C063502","3C158190","3S138582","3T436583","3T511634","3Z051064","47612601","4L904728","4Z212128","5Z540984","6M256446","6Z737265","71036982","82224583","85019929","85203728","8C894254","8PA03717","8Z019629","90171520","96227528","9L434590","9P461419","AC529748","AR403872","AZ240660","AZ369308","BH771112","GH320856","KR533889","KUB66181"],
  //         "rapidfldriver20":["3C147156","40508411","A0210705","CG214562","CR219035","G1338937"],
  //         "rapidfldriver24":["4PB18054","5S463780","61107373","6L568903"],
  //         "RapidFLDriver25":["2S128576","5L563970","6C592459","75085162","85M34586","FA047331"],
  //         "RapidRecFL110011":["2W658439","5Z427084","6C617387","72130464","7BA60922","7H523217","9J004507","9R214924","ABJ31601","CL027396","DP209917","EGA11625","EJ051240","HY238879"]
  //       },
  //       "direct_hits": {
  //         "RapidFLDriver06": [
  //           "GC628797",
  //           "HC058733"
  //         ],
  //         "RapidFLDriver34": [
  //           "FC500349"
  //         ],
  //       }
  //     }
  // }
  if (response && response.ok) {
    console.log('server/drn/endpoint.js:getCameraScansAndHits:response:', response.data.direct);
    const directScans = response.data.direct || {};
    const scankeys = response.data.direct ? keys(response.data.direct) : [];
    let scans = scankeys.map((key) => ({
      id: toLower(key),
      count: Number(directScans[key]),
    }));
    scans = orderBy(scans, 'count', 'desc');
    // scans = filter(scans, e => /^rapidfldriver\d{2}$/.test(e.id));
    console.log('endpoint:', scans);

    console.log('endpoint:', response.data.lpr);

    const lprHits = response.data.lpr || {};
    const directHits = response.data.direct_hits || {};
    const lprKeys = lprHits ? keys(lprHits) : [];
    const directKeys = directHits ? keys(directHits) : [];
    const cameraHits = {};
    lprKeys.map((lprKey) => {
      cameraHits[toLower(lprKey)] = {
        ...cameraHits[toLower(lprKey)],
        lprVins: JSON.stringify(lprHits[lprKey]),
        lpr: lprHits[lprKey].length,
      };
    });
    directKeys.map((directKey) => {
      cameraHits[toLower(directKey)] = {
        ...cameraHits[toLower(directKey)],
        directHitsVins: JSON.stringify(directHits[directKey]),
        direct: directHits[directKey].length,
      };
    });

    let hits = [];
    for (const [key] of Object.entries(cameraHits)) {
      const lpr = cameraHits[key]['lpr'] || 0;
      const direct = cameraHits[key]['direct'] || 0;
      hits.push({
        id: key,
        lpr: lpr,
        direct: direct,
        count: lpr + direct,
        lprVins: cameraHits[key]['lprVins'] || null,
        directHitsVins: cameraHits[key]['directHitsVins'] || null,
      });
    }

    // hits = filter(hits, e => /^rapidfldriver\d{2}$/.test(e.id));
    if (response.data && response.data.error_message) {
      return response.data;
    }
    const drnDetails = {
      scans: scans || [],
      hits: hits,
    };

    console.log('endpoint:response.data.lpr:', response.data.lpr);
    return drnDetails;
  }
  {
    return {
      scans: [],
      hits: [],
    };
  }
};

module.exports = {
  getCameraScansAndHits,
};
