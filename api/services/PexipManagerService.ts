import * as restify from "restify-clients";
import {PexipInfo} from "../models/PexipInfo";
import {PexipNodesInfoServiceClient} from "./PexipNodesInfoServiceClient";

/**
 * @description Implements PexipMgr Service using restify client and get the Meeting info.
 * @export
 * @class PexipMgrService
 * @implements {PexipMgrService}
 *
 * //sslRootCAs.addFile("/Users/m_697556/workspace/cogpexip/api/pexip101.mc.iconf.net.pem");
 //var https = require('https');
 //https.globalAgent.options.ca=sslRootCAs;
 */
export class PexipManagerService {
    private serviceURL:string;
    private svcClient : PexipNodesInfoServiceClient;

    constructor(serviceURL:string, userName: string, pass : string) {
        console.info("ServiceURL: " + serviceURL)
        this.serviceURL = serviceURL;
        this.svcClient = new PexipNodesInfoServiceClient(serviceURL, userName, pass);
    }

    public findSystemLocation() {
        var path = "api/admin/configuration/v1/system_location/";
        return this.svcClient.getInfoBasicAuth(path);
    }

    public findWorkerVM() {
        var path = "api/admin/configuration/v1/worker_vm/";
        return this.svcClient.getInfoBasicAuth(path);
    }


    public findSysLocation() {
        var path = "api/admin/configuration/v1/system_location/";
        return this.svcClient.getInfoBasicAuth(path);
    }


    public findManagementVM() {
        var path = "api/admin/configuration/v1/management_vm/";

        return this.svcClient.getInfoBasicAuth(path);
    }

    public findTLSCerts() {
        var path = "api/admin/configuration/v1/tls_certificate/";

        return this.svcClient.getInfoBasicAuth(path);
    }


    public findLicenses() {
        var path = "api/admin/configuration/v1/licence//";

        return this.svcClient.getInfoBasicAuth(path);
    }



}
