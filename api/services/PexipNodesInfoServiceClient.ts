
import restify = require('restify-clients');

//Interface to "parse" the information service token
interface IToken {
    "expires_in": number, //Number of secconds before this token expires
    "access_token": string  //Actual token value
};

/**
 * Service token wrapper that helps on validating and accessing
 * the token value and timeout
 */
class InfServiceToken {
    token: IToken
    expireTime: number
    constructor(jsonToken: IToken) {
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
export class PexipNodesInfoServiceClient {
    private serviceURL: string;
    private username: string;
    private password: string;
    private currentToken: InfServiceToken | undefined;

    /**
     * Client constructor, should be called as few times as possible 
     * (eg: with a singleton)
     * @param serviceURL Service address, without any entry point information
     * @param usr User allowed to get the client_credentiasl token
     * @param pwd User's password
     */
    constructor(serviceURL: string, usr: string, pwd: string) {
        this.serviceURL = serviceURL;
        this.username = usr;
        this.password = pwd;
    }

    /**
     * Returns a valid acces token from the cache (field).
     * If the token is no longer valid it wil get a new one. 
     */
    public getToken(): Promise<InfServiceToken> {
        return new Promise<InfServiceToken>((resolve, reject) => {
            // if current stored token is valid return it
            if (this.currentToken != null && this.currentToken.isValid) {
                console.log("Reusing the token. Expires in: " + (this.currentToken.expireTime - (new Date()).getTime()) / 1000);
                resolve(this.currentToken);
                return;
            }
            //if current token is null or invalid we need to get a new one.

            //Prepare service call
            let client = restify.createJsonClient({
                url: this.serviceURL
            });
            //Set auth parameters
            client.basicAuth(this.username, this.password);

            //Call the rest service 
            //(note grant_type needs to be part og the query string, Tried placing it in headers and body and it didn't work.)
            client.post('/oauth/token?grant_type=client_credentials',
                (err: Object, _req: Object, _res: Object, obj: IToken) => {
                    if (err) {
                        //Any error will be returned as is.
                        //TODO: Create an error message and logg the error here. We still need to reject it to prevent cascading the error
                        reject(err);
                    } else {
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
     * Entry point to get bridge information (sp_vidyo_get_bridge_g1_0)
     * @param cc Conference code / acces code used to get the bridge (Vydio) information
     */
    public getBridgeInfo(cc: string, maxRetries: number): Promise<Object> {
        return this.getInfo('/bridgeinfo/v1/' + cc, maxRetries);
    }

    /**
     * Entry point to get owner's information (sp_pxp_get_ownerinfo_g2_0)
     * @param cc Conference code / acces code used to get the owner information
     * @param softphoneType
     */
    public getOwnerInfo(cc: string, softphoneType: string, maxRetries: number): Promise<Object> {

        return this.getInfo('/ownerinfo/v1/' + cc + "/" + softphoneType, maxRetries);

    }


    /**
     * Generic method to get objects out of the information service
     * @param path full path for the request  URL+Entrypoint+Parameters
     */
    private getInfo(path: String, maxRetries: number): Promise<Object> {
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
                return new Promise<Object>((resolve, reject) => {
                    client.get(path,
                        (err: Object, _req: Object, _res: Object, obj: Object) => {
                            if (err) {
                                //if an error is found it will retry to get it. 
                                if (maxRetries > 0) {
                                    console.log("Error getting information. Retrying operation:  "+ err)
                                    this.getInfo(path, maxRetries - 1)
                                    //just bubble up on error or success
                                    .then(retVal => resolve(retVal))
                                    .catch(retVal => reject(retVal));
                                }
                                else {
                                    reject(err);
                                }
                            } else {
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
}