const apisauce = require("apisauce");
const { isEqual, keys } = require("lodash");
const convert = require("xml-js");

const { beautify } = require("./util");
const { cronRDNLogger } = require("../config/logger");
const { rdnApiUrl, rdnApiKey } = require("../config/vars");

const xmlEnvelope = (payload, page = 1) => {
  const Pager_PerPage = 100;

  return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="https://api.recoverydatabase.net/2.0/">
      <soapenv:Header>
        <ns:apiKey>
          <api_key>${rdnApiKey}</api_key>
        </ns:apiKey>
        <ns:pager>
          <page>${page}</page>
          <per_page>${Pager_PerPage}</per_page>
        </ns:pager>
      </soapenv:Header>
      <soapenv:Body>
        ${payload}
      </soapenv:Body>
    </soapenv:Envelope>
  `;
};

const xmlEnvelopeForDynamicRdnKey = (payload, rdnKey, page = 1) => {
  const Pager_PerPage = 100;

  return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="https://api.recoverydatabase.net/2.0/">
      <soapenv:Header>
        <ns:apiKey>
          <api_key>${rdnKey}</api_key>
        </ns:apiKey>
        <ns:pager>
          <page>${page}</page>
          <per_page>${Pager_PerPage}</per_page>
        </ns:pager>
      </soapenv:Header>
      <soapenv:Body>
        ${payload}
      </soapenv:Body>
    </soapenv:Envelope>
  `;
};

const naviMonitor = response => {
  if (isEqual(response.status, 401)) {
    console.log("Your token has been expired.");
  }
};

const responseTransformer = async response => {
  const json = JSON.parse(
    convert.xml2json(response.data, { compact: true, spaces: 2 })
  );
  let header, body;
  try {
    header = json["SOAP-ENV:Envelope"]["SOAP-ENV:Header"];
    if (header && header["ns1:pager"]) {
      response.header = await beautify(header["ns1:pager"], "number");
    }
  } catch (error) {
    cronRDNLogger.log({
      message: "RDN API ResponseTransformer header parser",
      error: error.message,
      level: "error",
      operationName: "responseTransformer"
    });
  }
  try {
    body = json["SOAP-ENV:Envelope"]["SOAP-ENV:Body"];
    if (body) {
      response.data = body[keys(body)[0]]["return"];
    }
  } catch (error) {
    cronRDNLogger.log({
      message: "RDN API ResponseTransformer body parser",
      error: error.message,
      level: "error",
      operationName: "responseTransformer"
    });
  }
};

const create = () => {
  const baseURL = rdnApiUrl;
  const RDNAPI = apisauce.create({
    baseURL,
    headers: {
      "Content-Type": "text/xml"
    },
    // 50 second timeout...
    timeout: 9999999
  });

  RDNAPI.addMonitor(naviMonitor);
  RDNAPI.addResponseTransform(responseTransformer);

  //////////////////////////////////////////// RDN
  const postRND = (payload, page) =>
    RDNAPI.post("", xmlEnvelope(payload, page));

  const postRNDWithDynamicKey = (payload, rdnKey, page) =>
    RDNAPI.post("", xmlEnvelopeForDynamicRdnKey(payload, rdnKey, page));

  return {
    //////// RDN
    postRND,
    postRNDWithDynamicKey
  };
};

module.exports = {
  create
};
