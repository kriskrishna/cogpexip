import {JsonProperty} from "json-typescript-mapper";


export class PexipInfo {

    @JsonProperty('deployment-prefix')
    env:string;

    @JsonProperty('pexip_conf_us-central1-a')
    pexipConfUSCentral1a:string;

    @JsonProperty('pexip_conf_us-central1-b')
    pexipConfUSCentral1b:string;

    @JsonProperty('pexip_conf_us-central1-c')
    pexipConfUSCentral1c:string;

    @JsonProperty('pexip_domain')
    pexipDomain:string;

    @JsonProperty('pexip_inventory_per_region')
    pexipInventory:string;


    constructor() {
        this.env = undefined;
    }
}