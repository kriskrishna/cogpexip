"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify-clients");
;
/**
 * Service token wrapper that helps on validating and accessing
 * the token value and timeout
 */
class InfServiceToken {
    constructor(jsonToken) {
        this.token = jsonToken;
        //Stores the time where the token will espire so we don't need to perform this operation on every call
        this.expireTime = new Date().getTime() + (jsonToken.expires_in * 1000);
    }
    /**
     * Returns true if the token has not yet expire.
     */
    get isValid() {
        let today = new Date();
        return this.expireTime > today.getTime();
    }
    /**
     * Returns current token value.
     */
    get value() {
        return this.token.access_token;
    }
}
/**
 * Used to get data from the information service
 */
class PexipNodesInfoServiceClient {
    //private https : any | undefined;
    /**
     * Client constructor, should be called as few times as possible
     * (eg: with a singleton)
     * @param serviceURL Service address, without any entry point information
     * @param usr User allowed to get the client_credentiasl token
     * @param pwd User's password
     */
    constructor(serviceURL, usr, pwd) {
        this.serviceURL = serviceURL;
        this.username = usr;
        this.password = pwd;
        //this.https = https;
    }
    /**
     * Returns a valid acces token from the cache (field).
     * If the token is no longer valid it wil get a new one.
     */
    getToken() {
        return new Promise((resolve, reject) => {
            // if current stored token is valid return it
            if (this.currentToken != null && this.currentToken.isValid) {
                console.log("Reusing the token. Expires in: " + (this.currentToken.expireTime - (new Date()).getTime()) / 1000);
                resolve(this.currentToken);
                return;
            }
            //if current token is null or invalid we need to get a new one.
            //Prepare service call
            let client = restify.createJsonClient({
                url: this.serviceURL,
            });
            //Set auth parameters
            client.basicAuth(this.username, this.password);
            //Call the rest service
            //(note grant_type needs to be part og the query string, Tried placing it in headers and body and it didn't work.)
            client.post('/oauth/token?grant_type=client_credentials', (err, _req, _res, obj) => {
                if (err) {
                    //Any error will be returned as is.
                    //TODO: Create an error message and logg the error here. We still need to reject it to prevent cascading the error
                    reject(err);
                }
                else {
                    //Use returned service token to create a local token object
                    this.currentToken = new InfServiceToken(obj);
                    console.log(JSON.stringify(obj, null, 2));
                    console.log("New token expires in: " + (this.currentToken.expireTime - (new Date()).getTime()) / 1000);
                    resolve(this.currentToken);
                }
            });
        });
    }
    /**
     * Generic method to get objects out of the information service
     * @param path full path for the request  URL+Entrypoint+Parameters
     */
    getInfo(path, maxRetries) {
        //Before calling the service we need to get current token
        return this.getToken()
            .then(token => {
            //Use current token to get the required information.
            let acc_tok = "Bearer " + token.value;
            //Prepare the service call
            let client = restify.createJsonClient({
                url: this.serviceURL,
                headers: {
                    authorization: acc_tok
                }
            });
            //Call the service and return the error or the requested object
            return new Promise((resolve, reject) => {
                client.get(path, (err, _req, _res, obj) => {
                    if (err) {
                        //if an error is found it will retry to get it.
                        if (maxRetries > 0) {
                            console.log("Error getting information. Retrying operation:  " + err);
                            this.getInfo(path, maxRetries - 1)
                                //just bubble up on error or success
                                .then(retVal => resolve(retVal))
                                .catch(retVal => reject(retVal));
                        }
                        else {
                            reject(err);
                        }
                    }
                    else {
                        resolve(obj);
                    }
                });
            });
        })
            .catch(reason => {
            if (maxRetries > 0) {
                return this.getInfo(path, maxRetries - 1);
            }
            return reason;
        });
    }
    getInfoBasicAuth(path) {
        return new Promise((resolve, reject) => {
            let client = restify.createJsonClient({
                url: this.serviceURL + path,
                rejectUnauthorized: false,
                headers: {
                    Accept: "application/json"
                }
            });
            client.basicAuth(this.username, this.password);
            client.get("", (err, _req, _res, obj) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(obj);
                }
            });
        });
    }
}
exports.PexipNodesInfoServiceClient = PexipNodesInfoServiceClient;
//# sourceMappingURL=PexipNodesInfoServiceClient.js.map