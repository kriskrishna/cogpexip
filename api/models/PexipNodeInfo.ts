/**
 * Defines PexipNodeInfo.
 */
export interface PexipNodeInfo {
    /*
     *  The meeting URL from VMG API.
	*/
    Url:String;
    /*
     *  The meeting URI from VMG API. sent as remote_alias in response.
	*/
    Uri:String;
    /*
     *  The meeting Passcode from VMG API. sent as local_alias(conference code or pass code) in response.
	*/
    Passcode:String;
    /*
     *  The meeting Start time from VMG API.
	*/
    StartGMT:Date;
    /*
     *  The HostSMTP from VMG API.
	*/
    HostSMTP:String;
    /*
     *  The  HostSIP from VMG API.
	*/
    HostSIP:String;
    /*
     *  The created date of meeting from VMG API.
	*/
    DateCreated:Date;
    /*
     *  The last modified date of meeting from VMG API.
	*/
    LastModified:Date;
    /*
    *  The EventID of meeting from VMG API.
   */
    EventID:String;
    /*
    *  The Subject contains of meeting name or decription from VMG API.
   */
    Subject:String;
}