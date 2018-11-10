"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const fs = require("fs");
const Buffer = require("buffer");
const util_1 = require("util");
const sleep = require("system-sleep");
const newman = require("newman");
function addPexipDNS() {
    const INFRACONIG = require("./config/infraconfig.json");
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
    INFRACONIG.forEach(function (dnsList) {
        if (!util_1.isNullOrUndefined(dnsList.dns_servers)) {
            console.info(dnsList);
            var dns_servers = dnsList.dns_servers;
            for (let i = 0; i < dns_servers.length; i++) {
                postmanEnv.values.forEach(function (item) {
                    if (item.key == "dns_server_address") {
                        item.value = dns_servers[i].ip;
                    }
                    if (item.key == "dns_descripton") {
                        item.value = dns_servers[i].description;
                    }
                });
                fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));
                sleep(20 * 1000);
                newman.run({
                    collection: './pexip_dns_server.postman_collection.json',
                    reporters: ['cli'],
                    insecure: true,
                    environment: './pexip-gcp-test.postman_environment.json'
                }, function (err, summary) {
                    if (err || summary.error) {
                        console.error('collection run encountered error');
                        throw err;
                    }
                    console.info('collection run complete! iteration - ' + summary.collection);
                }).on('request', function (err, summary) {
                    if (err || summary.error) {
                        console.info('collection run error! request - ' + summary.error);
                        throw err;
                    }
                    console.info('collection  request - ' + summary);
                    console.info('collection run complete! request - ' + summary.response.code);
                    console.info('Add Pexip DNS collection run complete! reponse body ' + summary.response.text());
                }).on('assertion', function (err, summary) {
                    if (err || summary.error) {
                        console.info('collection run error! assertion - ' + summary.error.name + " " + summary.error.message);
                        // process.abort()
                        // throw err
                        throw new Error(summary.error.name + " " + summary.error.message);
                    }
                    console.info('collection run complete! assertion - ' + summary.collection);
                }).on('done', function (err, summary) {
                    if (err || summary.error) {
                        console.info('collection run error! done - ' + summary.error);
                        throw err;
                    }
                    console.info('collection run complete! done - ' + summary.collection);
                });
                sleep(30 * 1000);
            }
        }
    }).catch(error => {
        console.error(error);
        process.abort();
    });
}
addPexipDNS();
//# sourceMappingURL=addPexipDNS.js.map