"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_typescript_mapper_1 = require("json-typescript-mapper");
class PexipInfo {
    constructor() {
        this.env = undefined;
    }
}
__decorate([
    json_typescript_mapper_1.JsonProperty('deployment-prefix'),
    __metadata("design:type", String)
], PexipInfo.prototype, "env", void 0);
__decorate([
    json_typescript_mapper_1.JsonProperty('pexip_conf_us-central1-a'),
    __metadata("design:type", String)
], PexipInfo.prototype, "pexipConfUSCentral1a", void 0);
__decorate([
    json_typescript_mapper_1.JsonProperty('pexip_conf_us-central1-b'),
    __metadata("design:type", String)
], PexipInfo.prototype, "pexipConfUSCentral1b", void 0);
__decorate([
    json_typescript_mapper_1.JsonProperty('pexip_conf_us-central1-c'),
    __metadata("design:type", String)
], PexipInfo.prototype, "pexipConfUSCentral1c", void 0);
__decorate([
    json_typescript_mapper_1.JsonProperty('pexip_domain'),
    __metadata("design:type", String)
], PexipInfo.prototype, "pexipDomain", void 0);
__decorate([
    json_typescript_mapper_1.JsonProperty('pexip_inventory_per_region'),
    __metadata("design:type", String)
], PexipInfo.prototype, "pexipInventory", void 0);
exports.PexipInfo = PexipInfo;
//# sourceMappingURL=PexipInfo.js.map