"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const labels_controller_1 = require("./labels.controller");
const labels_service_1 = require("./labels.service");
const entities_1 = require("../../database/entities");
const common_module_1 = require("../../common/common.module");
let LabelsModule = class LabelsModule {
};
exports.LabelsModule = LabelsModule;
exports.LabelsModule = LabelsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([entities_1.Label, entities_1.Board, entities_1.Card]), common_module_1.CommonModule],
        controllers: [labels_controller_1.LabelsController],
        providers: [labels_service_1.LabelsService],
        exports: [labels_service_1.LabelsService],
    })
], LabelsModule);
//# sourceMappingURL=labels.module.js.map