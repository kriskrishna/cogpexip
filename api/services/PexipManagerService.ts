import * as restify from "restify-clients";
import * as queryString from "querystring";
import {PexipNodeInfo} from "../models/PexipNodeInfo";

/**
 * @description Implements PexipMgr Service using restify client and get the Meeting info.
 * @export
 * @class PexipMgrService
 * @implements {PexipMgrService}
 */
export class PexipManagerService {
    private serviceURL:String;

    constructor(serviceURL:String) {
        this.serviceURL = serviceURL;
    }

    /*** Gets the configuration properties from the cloud config server.
     * @param {String} conferenceCode The conferenceCode String from the Request
     * @param {Date} startTime The startTime Date from the current date
     * @param {Date} endTime The endTime Date from the current date
     */
    public findNodeConfInfo(conferenceCode:String, startTime:Date, endTime:Date) {

        let path = "/intercallrestapi/api/intercallMeetings/GetMeetings";
        let queryStr = `startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}&passCode=${conferenceCode}`
        let queryObj = queryString.parse(queryStr);
        return this.getNodeConfInfo(path, queryObj);

    }

    /*** Gets the configuration properties from the cloud config server.
     * @param {String} path The path String path for the Request
     */
    private getNodeConfInfo(path:String, query:any): Promise<Array<PexipNodeInfo>> {

        return new Promise<Array<PexipNodeInfo>>((resolve, reject) => {
            let client = restify.createJsonClient({
                url: this.serviceURL,
                query: query,
                headers: {
                    Accept: "application/json"
                }
            });
            client.get(path,
                (err:Object, _req:Object, _res:Object, obj:Array<PexipNodeInfo>) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(obj);
                    }
                });
        });

    }
}
