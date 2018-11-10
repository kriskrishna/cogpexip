import * as util from "util";
import * as fs from "fs";
import * as Buffer from "buffer";
import * as child from "child_process";
import {isNullOrUndefined} from "util";
import * as lodash from "lodash";
import * as sleep from "system-sleep";
import * as newman from "newman";
import {Request, Response} from "restify";
import {PexipManagerService} from "./services/PexipManagerService";


function deleteandReturnPexipLicenses() {

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

    let mgrPubIp = terraformEnv.modules[0].outputs["pexip_mgr_pubip"].value
    let mgrPrivateIp = terraformEnv.modules[0].outputs["pexip_mgr_privateip"].value

    var pMgmSvc = new PexipManagerService("https://" + mgrPrivateIp + "/", "admin", "XGb/9XTjyjzV0TZASDY3B5KmZ+XcBZmHvLmvI7xlsrg=");

    pMgmSvc.findLicenses().then(o => {
        Object.keys(o).forEach(key => {
            if (key == "objects" && o[key].length > 0) {
                fs.writeFileSync(postmanenvjson, JSON.stringify(postmanEnv));

                newman.run({
                    collection: './pexip-gcp-return-license.postman_collection.json',
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
                        process.abort()
                        throw err
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
                if (key == "objects") {
                    console.info('No licence found');
                }
            }
        })
    }).catch( error => {
        console.error(error)
        process.abort()
    })

}

deleteandReturnPexipLicenses();