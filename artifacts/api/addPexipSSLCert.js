"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const fs = require("fs");
const Buffer = require("buffer");
const sleep = require("system-sleep");
const newman = require("newman");
const PexipManagerService_1 = require("./services/PexipManagerService");
function addPexipSSLCert() {
    let postmanenvjson = null;
    let terraFormState = null;
    let arg = null;
    process.argv.forEach(function (args) {
        if (args.indexOf("postmanenvfile") >= 1) {
            postmanenvjson = arg.split("=")[1];
        }
        if (args.indexOf("terraformenvfile") >= 1) {
            terraFormState = arg.split("=")[1];
        }
    });
    postmanenvjson = util.isNullOrUndefined(postmanenvjson) ? "pexip-gcp-test.postman_environment.json" : postmanenvjson;
    terraFormState = util.isNullOrUndefined(terraFormState) ? "terraform.tfstate" : terraFormState;
    let fdPostmanEnvFile = fs.openSync(postmanenvjson, "r");
    let nFileSize = 10 * 1 * 1024 * 1024;
    let readBuffer = new Buffer.Buffer(nFileSize);
    let nBytesRead = fs.readSync(fdPostmanEnvFile, readBuffer, 0, nFileSize, 0);
    let postmanEnv = JSON.parse(readBuffer.toString('utf8', 0, nBytesRead));
    let fdterraformEnvFile = fs.openSync(terraFormState, "r");
    let nterraformFileSize = 10 * 1 * 1024 * 1024;
    let readterraformBuffer = new Buffer.Buffer(nterraformFileSize);
    let nterraformBytesRead = fs.readSync(fdterraformEnvFile, readterraformBuffer, 0, nterraformFileSize, 0);
    let terraformEnv = JSON.parse(readterraformBuffer.toString('utf8', 0, nterraformBytesRead));
    /*
     has to be passed in using credhub
     postmanEnv.values.forEach(function (item) {
         if (item.key == "entitlement_id") {

         }
     });
     */
    let pexipDomain = terraformEnv.modules[0].outputs["pexip_domain"].value;
    let mgrPubIp = terraformEnv.modules[0].outputs["pexip_mgr_pubip"].value;
    let mgrPrivateIp = terraformEnv.modules[0].outputs["pexip_mgr_privateip"].value;
    let mgrUserName = terraformEnv.modules[0].outputs["pexip_mgr_username"].value;
    let mgrPassword = terraformEnv.modules[0].outputs["pexip_mgr_password"].value;
    var pMgmSvc = new PexipManagerService_1.PexipManagerService("https://" + mgrPrivateIp + "/", "admin", "XGb/9XTjyjzV0TZASDY3B5KmZ+XcBZmHvLmvI7xlsrg=");
    postmanEnv.values.forEach(function (item) {
        if (item.key == "pexip_mgr_url") {
            item.value = "https://" + mgrPrivateIp;
        }
        if (item.key == "pexip_mgr_username") {
            item.value = mgrUserName;
        }
        if (item.key == "pexip_mgr_password") {
            item.value = mgrPassword;
        }
        if (item.key == "pexip_domain") {
            item.value = pexipDomain;
        }
    });
    fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));
    newman.run({
        collection: './pexip-gcp-cert.postman_collection.json',
        reporters: ['cli'],
        insecure: true,
        environment: './pexip-gcp-test.postman_environment.json',
        bail: true
    }, function (err, summary) {
        if (err || summary.error) {
            console.info('TLS Cert Upload collection run error out!' + summary.error);
            throw err;
        }
        console.info('TLS Cert Upload collection run complete!' + summary.collection);
    }).on('request', function (err, summary) {
        if (err || summary.error) {
            console.info('TLS Cert Upload collection run error!' + summary.error);
            throw err;
        }
        console.info('TLS Cert Upload collection run complete! reponse code: ' + summary.response.code);
        console.info('TLS Cert Upload collection run complete! reponse body ' + summary.response.text());
    }).on('assertion', function (err, summary) {
        if (err || summary.error) {
            console.info('TLS Cert Upload collection run error! ' + summary.error.name + " " + summary.error.message);
            throw new Error(summary.error.name + " " + summary.error.message);
        }
        console.info('TLS Cert Upload collection run complete!' + summary.collection);
    }).on('done', function (err, summary) {
        if (err || summary.error) {
            console.info('TLS Cert Upload collection run error! ' + summary.error);
            throw err;
        }
        else {
            pMgmSvc.findTLSCerts().then(o => {
                Object.keys(o).forEach(key => {
                    if (key == "objects") {
                        for (let entry of o[key]) {
                            postmanEnv.values.forEach(function (item) {
                                if (item.key == "pexip_tls_url") {
                                    item.value = entry.resource_uri;
                                }
                            });
                            pMgmSvc.findWorkerVM().then(o => {
                                Object.keys(o).forEach(key => {
                                    if (key == "objects") {
                                        for (let entry of o[key]) {
                                            postmanEnv.values.forEach(function (item) {
                                                if (item.key == "pexip_current_node") {
                                                    console.log("replacing current node " + entry.id);
                                                    item.value = entry.id;
                                                }
                                            });
                                            fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));
                                            newman.run({
                                                collection: './pexip-gcp-node-cert.postman_collection.json',
                                                reporters: ['cli'],
                                                insecure: true,
                                                environment: './pexip-gcp-test.postman_environment.json'
                                            }, function (err, summary) {
                                                if (err || summary.error) {
                                                    console.info('collection run error ' + summary.error);
                                                    throw err;
                                                }
                                                console.info('collection run complete! ' + summary.collection);
                                            }).on('request', function (err, summary) {
                                                if (err || summary.error) {
                                                    console.info('collection run error! ' + summary.error);
                                                    throw err;
                                                }
                                                console.info('collection run complete! ' + summary.response.code);
                                            }).on('assertion', function (err, summary) {
                                                if (err || summary.error) {
                                                    console.info('collection run error! ' + summary.error.name + " " + summary.error.message);
                                                    throw new Error(summary.error.name + " " + summary.error.message);
                                                }
                                                console.info('collection run complete! ' + summary.collection);
                                            }).on('done', function (err, summary) {
                                                if (err || summary.error) {
                                                    console.info('collection run error! ' + summary.error);
                                                    throw err;
                                                }
                                                console.info('collection run complete! ' + summary.collection);
                                            }); // 1, "string", false
                                            sleep(20 * 1000);
                                        }
                                    }
                                });
                            }).catch(r => {
                                console.log("findWorkerVM Error " + r);
                            });
                        }
                    }
                });
            }).catch(r => {
                console.error(r);
                process.abort();
            });
        }
        console.info('cert upload and assign cert to nodes: collection run complete! done - ' + summary.collection);
    });
}
addPexipSSLCert();
//# sourceMappingURL=addPexipSSLCert.js.map