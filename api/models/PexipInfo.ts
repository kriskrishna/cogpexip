/**
 * Defines PexipInfo.
 */
export interface PexipInfo {
    /*
     *  The meeting URL from VMG API.
	*/
    meta:JSON;
    /*
     *  The meeting URI from VMG API. sent as remote_alias in response.
	*/
    objects:JSON[];

}