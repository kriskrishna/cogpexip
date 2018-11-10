"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const fs = require("fs");
const Buffer = require("buffer");
const util_1 = require("util");
const lodash = require("lodash");
const sleep = require("system-sleep");
const newman = require("newman");
const PexipManagerService_1 = require("./services/PexipManagerService");
const INFRACONIG = require("./config/infraconfig.json");
function configurepexipNodes() {
    let postmanenvjson = null;
    let terraFormState = null;
    let subnetworkState = null;
    let arg = null;
    /* pMgmSvc.findManagementVM().then(o => {
         console.log("findManagementVM " + JSON.stringify(o));
         Object.keys(o).forEach(key => {
             console.log(key);
             console.log(o[key]);
         });
     }).catch(r => {
         console.log("findManagementVM Error " +  r);
     });*/
    process.argv.forEach(function (args) {
        if (args.indexOf("postmanenvfile") >= 1) {
            postmanenvjson = arg.split("=")[1];
        }
        if (args.indexOf("terraformenvfile") >= 1) {
            terraFormState = arg.split("=")[1];
        }
        if (args.indexOf("subnetworkstateenvfile") >= 1) {
            subnetworkState = arg.split("=")[1];
        }
    });
    postmanenvjson = util.isNullOrUndefined(postmanenvjson) ? "pexip-gcp-test.postman_environment.json" : postmanenvjson;
    terraFormState = util.isNullOrUndefined(terraFormState) ? "terraform.tfstate" : terraFormState;
    subnetworkState = util.isNullOrUndefined(subnetworkState) ? "subnetwork.tfstate" : subnetworkState;
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
    let fdsubnetworkStateEnvFile = fs.openSync(subnetworkState, "r");
    let nsubnetworkStateFileSize = 10 * 1 * 1024 * 1024;
    let readsubnetworkStateBuffer = new Buffer.Buffer(nsubnetworkStateFileSize);
    let nsubnetworkStateBytesRead = fs.readSync(fdsubnetworkStateEnvFile, readsubnetworkStateBuffer, 0, nsubnetworkStateFileSize, 0);
    let subnetworkStateEnv = JSON.parse(readsubnetworkStateBuffer.toString('utf8', 0, nsubnetworkStateBytesRead));
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
    var pMgmSvc = new PexipManagerService_1.PexipManagerService("https://" + mgrPrivateIp + "/", "admin", "XGb/9XTjyjzV0TZASDY3B5KmZ+XcBZmHvLmvI7xlsrg=");
    let nodeStack = [];
    pMgmSvc.findWorkerVM().then(o => {
        // for each system location
        INFRACONIG.forEach(function (system_location) {
            let nodeConfiguredStack = [];
            console.info(system_location.system_location);
            Object.keys(terraformEnv.modules[0].outputs).forEach((pexConfNodeKey) => {
                //finding nodes in a zone
                var zoneFromtfState = pexConfNodeKey.split("pexip_conf_");
                // if the zone found is same as from system_location zone ...then take that zone
                var zone = lodash.filter(system_location.zones, x => x.name === zoneFromtfState[1]);
                if (zoneFromtfState.length > 1 && zone.length > 0) {
                    //number of nodes in that zone
                    let pexConfNodes = terraformEnv.modules[0].outputs[pexConfNodeKey].value; //access_config[0], [1]
                    if (!util_1.isNullOrUndefined(pexConfNodes)) {
                        var configItem = null;
                        var zoneCount = Math.min(pexConfNodes.length, zone[0].count); //whichever is minimum: inventory or config count
                        for (let i = 0; i < zoneCount; i++) {
                            configItem = pexConfNodes[i];
                            let pexipConfNodeAddress = configItem[0].address;
                            let pexipConfNodeStaticNatAddress = configItem[0].access_config[0].nat_ip;
                            let nodeAlreadyConfigured = false;
                            Object.keys(o).forEach(key => {
                                if (key == "objects") {
                                    for (let entry of o[key]) {
                                        if (entry.address == pexipConfNodeAddress) {
                                            nodeAlreadyConfigured = true;
                                            nodeConfiguredStack.push(pexipConfNodeAddress);
                                            break;
                                        }
                                        nodeStack.push(entry.name);
                                    }
                                }
                            });
                            if (nodeConfiguredStack.length > 0) {
                                var nodeexist = lodash.filter(nodeConfiguredStack, x => x === pexipConfNodeAddress);
                                if (nodeexist.length > 0) {
                                    nodeAlreadyConfigured = true;
                                }
                            }
                            if (nodeAlreadyConfigured && zoneCount < pexConfNodes.length) {
                                zoneCount++;
                            }
                            if (nodeAlreadyConfigured == false) {
                                let nodeType = zone[0].type;
                                var index = 0;
                                var latestPexipName;
                                nodeConfiguredStack.push(pexipConfNodeAddress);
                                postmanEnv.values.forEach(function (item) {
                                    if (item.key == "pexip_location_name") {
                                        if (!util_1.isNullOrUndefined(system_location.system_location)) {
                                            item.value = system_location.system_location;
                                        }
                                    }
                                    if (item.key == "pexip_confnode_hostname") {
                                        //configuration name ..in zone NA ...pexconf_101, 100 zone, 200 zone
                                        // item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_hostname"].value;
                                        if (zone[0].name.indexOf("us-central1") >= 0) {
                                            let lastItem = nodeStack[nodeStack.length - 1];
                                            if (!util_1.isNullOrUndefined(lastItem)) {
                                                let serial = lastItem.split("pexip")[1];
                                                let serialNumber = Number(serial) + 1;
                                                latestPexipName = "pexip" + serialNumber;
                                                nodeStack.push(latestPexipName);
                                            }
                                            else {
                                                latestPexipName = "pexip102";
                                                nodeStack.push("pexip102");
                                            }
                                        }
                                        item.value = latestPexipName;
                                    }
                                    if (item.key == "pexip_confnode_name") {
                                        //item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_name"].value;
                                        if (!util_1.isNullOrUndefined(latestPexipName)) {
                                            item.value = latestPexipName;
                                        }
                                    }
                                    if (item.key == "pexip_node_type") {
                                        // item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_type"].value;
                                        // item.value = zone[0].node_type
                                        item.value = nodeType;
                                    }
                                    if (item.key == "pexip_confnode_address") {
                                        item.value = pexipConfNodeAddress;
                                    }
                                    if (item.key == "pexip_confnode_gateway") {
                                        item.value = subnetworkStateEnv.modules[0].resources["google_compute_subnetwork.default"].primary.attributes.gateway_address;
                                        // item.value = terraformEnv.modules[0].outputs["pexip_na_gateway"].value;
                                    }
                                    if (item.key == "pexip_confnode_netmask") {
                                        item.value = "255.255.255.255";
                                    }
                                    if (item.key == "pexip_confnode_static_nat_address") {
                                        item.value = pexipConfNodeStaticNatAddress;
                                    }
                                });
                                fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));
                                sleep(20 * 1000);
                                newman.run({
                                    collection: './pexip-gcp-config-node.postman_collection.json',
                                    reporters: ['cli'],
                                    insecure: true,
                                    environment: './pexip-gcp-test.postman_environment.json'
                                }, function (err, summary) {
                                    if (err || summary.error) {
                                        console.info('collection run error out - ' + summary.error);
                                        throw err;
                                    }
                                    console.info('collection run complete! iteration - ' + summary.collection);
                                }).on('request', function (err, summary) {
                                    if (err || summary.error) {
                                        console.info('collection run error! request - ' + summary.error);
                                        throw err;
                                    }
                                    console.info('collection run complete! request - ' + summary.response.code);
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
                            else {
                                console.info('Conf Node already configured ' + pexipConfNodeAddress + " " + pexipConfNodeStaticNatAddress);
                            }
                        }
                    }
                }
            });
        });
    }).catch(error => {
        console.error(error);
        process.abort();
    });
}
configurepexipNodes();
//XGb/9XTjyjzV0TZASDY3B5KmZ+XcBZmHvLmvI7xlsrg=
//# sourceMappingURL=configurePexipNodes.js.map