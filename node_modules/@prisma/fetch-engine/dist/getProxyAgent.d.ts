import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
export declare function getProxyAgent(url: string): HttpProxyAgent.HttpProxyAgent | HttpsProxyAgent.HttpsProxyAgent | undefined;
