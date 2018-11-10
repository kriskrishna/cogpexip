"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PexipNodesInfoServiceClient_1 = require("./PexipNodesInfoServiceClient");
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
class PexipManagerService {
    constructor(serviceURL, userName, pass) {
        console.info("ServiceURL: " + serviceURL);
        this.serviceURL = serviceURL;
        this.svcClient = new PexipNodesInfoServiceClient_1.PexipNodesInfoServiceClient(serviceURL, userName, pass);
    }
    findSystemLocation() {
        var path = "api/admin/configuration/v1/system_location/";
        return this.svcClient.getInfoBasicAuth(path);
    }
    findWorkerVM() {
        var path = "api/admin/configuration/v1/worker_vm/";
        return this.svcClient.getInfoBasicAuth(path);
    }
    findSysLocation() {
        var path = "api/admin/configuration/v1/system_location/";
        return this.svcClient.getInfoBasicAuth(path);
    }
    findManagementVM() {
        var path = "api/admin/configuration/v1/management_vm/";
        return this.svcClient.getInfoBasicAuth(path);
    }
    findTLSCerts() {
        var path = "api/admin/configuration/v1/tls_certificate/";
        return this.svcClient.getInfoBasicAuth(path);
    }
    findLicenses() {
        var path = "api/admin/configuration/v1/licence//";
        return this.svcClient.getInfoBasicAuth(path);
    }
}
exports.PexipManagerService = PexipManagerService;
//# sourceMappingURL=PexipManagerService.js.map