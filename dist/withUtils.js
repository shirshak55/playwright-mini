"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUtilsInitScript = exports.withUtilsEvaluate = void 0;
const utils_1 = __importDefault(require("./utils"));
// https://github.com/berstend/puppeteer-extra/blob/master/packages/puppeteer-extra-plugin-stealth/evasions/_utils/withUtils.js
function withUtilsEvaluate(page, mainFunction, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return page.evaluate(({ _utilsFns, _mainFunction, _args, }) => {
            // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
            //@ts-ignore
            const utils = Object.fromEntries(Object.entries(_utilsFns).map(([key, value]) => [
                key,
                eval(value),
            ]));
            utils.preloadCache();
            return eval(_mainFunction)(utils, ..._args);
        }, {
            _utilsFns: utils_1.default.stringifyFns(utils_1.default),
            _mainFunction: mainFunction.toString(),
            _args: args || [],
        });
    });
}
exports.withUtilsEvaluate = withUtilsEvaluate;
function withUtilsInitScript(context, mainFunction, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return context.addInitScript(({ _utilsFns, _mainFunction, _args, }) => {
            // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
            // @ts-ignore
            const utils = Object.fromEntries(Object.entries(_utilsFns).map(([key, value]) => [
                key,
                eval(value),
            ]));
            utils.preloadCache();
            return eval(_mainFunction)(utils, ..._args);
        }, {
            _utilsFns: utils_1.default.stringifyFns(utils_1.default),
            _mainFunction: mainFunction.toString(),
            _args: args || [],
        });
    });
}
exports.withUtilsInitScript = withUtilsInitScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aFV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dpdGhVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBMkI7QUFFM0IsK0hBQStIO0FBRS9ILFNBQXNCLGlCQUFpQixDQUNuQyxJQUFVLEVBQ1YsWUFBaUIsRUFDakIsR0FBRyxJQUFXOztRQUVkLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQyxFQUNHLFNBQVMsRUFDVCxhQUFhLEVBQ2IsS0FBSyxHQUtSLEVBQUUsRUFBRTtZQUNELGlIQUFpSDtZQUNqSCxZQUFZO1lBQ1osTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLEdBQUc7Z0JBQ0gsSUFBSSxDQUFDLEtBQWUsQ0FBQzthQUN4QixDQUFDLENBQ0wsQ0FBQTtZQUNELEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUNwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxDQUFDLEVBQ0Q7WUFDSSxTQUFTLEVBQUUsZUFBSyxDQUFDLFlBQVksQ0FBQyxlQUFLLENBQUM7WUFDcEMsYUFBYSxFQUFFLFlBQVksQ0FBQyxRQUFRLEVBQUU7WUFDdEMsS0FBSyxFQUFFLElBQUksSUFBSSxFQUFFO1NBQ3BCLENBQ0osQ0FBQTtJQUNMLENBQUM7Q0FBQTtBQWhDRCw4Q0FnQ0M7QUFFRCxTQUFzQixtQkFBbUIsQ0FDckMsT0FBdUIsRUFDdkIsWUFBaUIsRUFDakIsR0FBRyxJQUFXOztRQUVkLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FDeEIsQ0FBQyxFQUNHLFNBQVMsRUFDVCxhQUFhLEVBQ2IsS0FBSyxHQUtSLEVBQUUsRUFBRTtZQUNELGlIQUFpSDtZQUNqSCxhQUFhO1lBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLEdBQUc7Z0JBQ0gsSUFBSSxDQUFDLEtBQWUsQ0FBQzthQUN4QixDQUFDLENBQ0wsQ0FBQTtZQUNELEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUNwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxDQUFDLEVBQ0Q7WUFDSSxTQUFTLEVBQUUsZUFBSyxDQUFDLFlBQVksQ0FBQyxlQUFLLENBQUM7WUFDcEMsYUFBYSxFQUFFLFlBQVksQ0FBQyxRQUFRLEVBQUU7WUFDdEMsS0FBSyxFQUFFLElBQUksSUFBSSxFQUFFO1NBQ3BCLENBQ0osQ0FBQTtJQUNMLENBQUM7Q0FBQTtBQWhDRCxrREFnQ0MifQ==