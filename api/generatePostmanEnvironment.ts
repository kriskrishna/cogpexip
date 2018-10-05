import * as util from "util";
import * as fs from "fs";
import * as Buffer from "buffer";
import * as child from "child_process";
import {isNullOrUndefined} from "util";
import * as lodash from "lodash";
import * as sleep from "system-sleep";
import * as newman from "newman";


const INFRACONIG = require("./config/infraconfig.json");

function generatePostManJSON() {
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

    postmanenvjson = util.isNullOrUndefined(postmanenvjson) ? "Pexip-GCP-TEST.postman_environment.json" : postmanenvjson;
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

    let pexipDomain = terraformEnv.modules[0].outputs["pexip_domain"].value
    let mgrPubIp = terraformEnv.modules[0].outputs["pexip_mgr_pubip"].value
    let mgrUserName = terraformEnv.modules[0].outputs["pexip_mgr_username"].value
    let mgrPassword = terraformEnv.modules[0].outputs["pexip_mgr_password"].value

    postmanEnv.values.forEach(function (item) {
        if (item.key == "pexip_mgr_url") {
            item.value = "https://" + mgrPubIp;
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

    // for each system location
    INFRACONIG.forEach(function (system_location) {
        Object.keys(terraformEnv.modules[0].outputs).forEach((pexConfNodeKey) => { // pexConfNodeKey: deployment-prefix, pexip_conf_us-central1-a
            var zoneFromtfState = pexConfNodeKey.split("pexip_conf_")
            var zone = lodash.filter(system_location.zones, x => x.name === zoneFromtfState[1])
            if (zoneFromtfState.length > 1 && zone.length > 0) {

                let pexConfNodes = terraformEnv.modules[0].outputs[pexConfNodeKey].value; //access_config[0], [1]

                if (!isNullOrUndefined(pexConfNodes)) {
                    var configItem = null;
                    var zoneCount = Math.min(pexConfNodes.length, zone[0].count) //whichever is mimumum: inventory or config count
                    for (let i = 0; i < zoneCount ; i++) {
                        configItem = pexConfNodes[i];
                        var pexipConfNodeAddress = configItem[0].address
                        var pexipConfNodeStaticNatAddress = configItem[0].access_config[0].nat_ip
                        var index = 0;

                        postmanEnv.values.forEach(function (item) {
                            if (item.key == "pexip_confnode_hostname") {
                                //configuration name ..in zone NA ...pexconf_101, 100 zone, 200 zone
                                item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_hostname"].value;
                            }
                            if (item.key == "pexip_confnode_name") {
                                item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_name"].value;
                            }
                            if (item.key == "pexip_node_type") {
                                item.value = terraformEnv.modules[0].outputs["pexip_confnode_" + (i + 1) + "_type"].value;
                            }
                            if (item.key == "pexip_confnode_address") {
                                item.value = pexipConfNodeAddress;
                            }
                            if (item.key == "pexip_confnode_gateway") {
                                item.value = terraformEnv.modules[0].outputs["pexip_na_gateway"].value;
                            }
                            if (item.key == "pexip_confnode_netmask") {
                                item.value = "255.255.255.255"
                            }
                            if (item.key == "pexip_confnode_static_nat_address") {
                                item.value = pexipConfNodeStaticNatAddress
                            }
                        });

                        fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));

                        newman.run({
                            collection: './Pexip-GCP.postman_collection.json',
                            reporters: 'text',
                            reporter: {
                                'text': {
                                    // Take output and save it to file
                                    export: `./report.txt`,
                                    // Output to rolling file based on current day
                                    rolling: 'true',
                                    // Output the results to stdout
                                    cli: 'true'
                                }
                            },
                            environment: './Pexip-GCP.postman_collection.json'
                        }, function (err, summary) {
                            if (err) { throw err; }
                            console.info('collection run complete! iteration - ' + summary + i);
                        });

                        sleep(20 * 1000);

                    }
                }
            }
        });
    });
}

generatePostManJSON();