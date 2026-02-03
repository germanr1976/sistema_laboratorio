"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnalysisRequest = validateAnalysisRequest;
const joi_1 = __importDefault(require("joi"));
const analysesSchema = joi_1.default.object({
    id: joi_1.default.number().integer().positive()
});
function validateAnalysisRequest(data) {
    return analysesSchema.validate(data);
}
//# sourceMappingURL=analysis.validator.js.map