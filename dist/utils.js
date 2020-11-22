"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://github.com/berstend/puppeteer-extra/blob/master/packages/puppeteer-extra-plugin-stealth/evasions/_utils/index.js
/**
 * A set of shared utility functions specifically for the purpose of modifying native browser APIs without leaving traces.
 *
 * Meant to be passed down in puppeteer and used in the context of the page (everything in here runs in NodeJS as well as a browser).
 *
 * Note: If for whatever reason you need to use this outside of `puppeteer-extra`:
 * Just remove the `module.exports` statement at the very bottom, the rest can be copy pasted into any browser context.
 *
 * Alternatively take a look at the `extract-stealth-evasions` package to create a finished bundle which includes these utilities.
 *
 */
const utils = {};
/**
 * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
 *
 * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
 *
 * @param {object} handler - The JS Proxy handler to wrap
 */
utils.stripProxyFromErrors = (handler = {}) => {
    const newHandler = {};
    // We wrap each trap in the handler in a try/catch and modify the error stack if they throw
    const traps = Object.getOwnPropertyNames(handler);
    traps.forEach((trap) => {
        newHandler[trap] = function () {
            try {
                // Forward the call to the defined proxy handler
                return handler[trap].apply(this, arguments || []);
            }
            catch (err) {
                // Stack traces differ per browser, we only support chromium based ones currently
                if (!err || !err.stack || !err.stack.includes(`at `)) {
                    throw err;
                }
                // When something throws within one of our traps the Proxy will show up in error stacks
                // An earlier implementation of this code would simply strip lines with a blacklist,
                // but it makes sense to be more surgical here and only remove lines related to our Proxy.
                // We try to use a known "anchor" line for that and strip it with everything above it.
                // If the anchor line cannot be found for some reason we fall back to our blacklist approach.
                const stripWithBlacklist = (_stack) => {
                    const blacklist = [
                        `at Reflect.${trap} `,
                        `at Object.${trap} `,
                        `at Object.newHandler.<computed> [as ${trap}] `,
                    ];
                    return (err.stack
                        .split("\n")
                        // Always remove the first (file) line in the stack (guaranteed to be our proxy)
                        .filter((_line, index) => index !== 1)
                        // Check if the line starts with one of our blacklisted strings
                        .filter((line) => !blacklist.some((bl) => line.trim().startsWith(bl)))
                        .join("\n"));
                };
                const stripWithAnchor = (stack) => {
                    const stackArr = stack.split("\n");
                    const anchor = `at Object.newHandler.<computed> [as ${trap}] `; // Known first Proxy line in chromium
                    const anchorIndex = stackArr.findIndex((line) => line.trim().startsWith(anchor));
                    if (anchorIndex === -1) {
                        return false; // 404, anchor not found
                    }
                    // Strip everything from the top until we reach the anchor line
                    // Note: We're keeping the 1st line (zero index) as it's unrelated (e.g. `TypeError`)
                    stackArr.splice(1, anchorIndex);
                    return stackArr.join("\n");
                };
                // Try using the anchor method, fallback to blacklist if necessary
                err.stack =
                    stripWithAnchor(err.stack) || stripWithBlacklist(err.stack);
                throw err; // Re-throw our now sanitized error
            }
        };
    });
    return newHandler;
};
/**
 * Strip error lines from stack traces until (and including) a known line the stack.
 *
 * @param {object} err - The error to sanitize
 * @param {string} anchor - The string the anchor line starts with
 */
utils.stripErrorWithAnchor = (err, anchor) => {
    const stackArr = err.stack.split("\n");
    const anchorIndex = stackArr.findIndex((line) => line.trim().startsWith(anchor));
    if (anchorIndex === -1) {
        return err; // 404, anchor not found
    }
    // Strip everything from the top until we reach the anchor line (remove anchor line as well)
    // Note: We're keeping the 1st line (zero index) as it's unrelated (e.g. `TypeError`)
    stackArr.splice(1, anchorIndex);
    err.stack = stackArr.join("\n");
    return err;
};
/**
 * Replace the property of an object in a stealthy way.
 *
 * Note: You also want to work on the prototype of an object most often,
 * as you'd otherwise leave traces (e.g. showing up in Object.getOwnPropertyNames(obj)).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
 *
 * @example
 * replaceProperty(WebGLRenderingContext.prototype, 'getParameter', { value: "alice" })
 * // or
 * replaceProperty(Object.getPrototypeOf(navigator), 'languages', { get: () => ['en-US', 'en'] })
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The property name to replace
 * @param {object} descriptorOverrides - e.g. { value: "alice" }
 */
utils.replaceProperty = (obj, propName, descriptorOverrides = {}) => {
    return Object.defineProperty(obj, propName, Object.assign(Object.assign({}, (Object.getOwnPropertyDescriptor(obj, propName) || {})), descriptorOverrides));
};
/**
 * Preload a cache of function copies and data.
 *
 * For a determined enough observer it would be possible to overwrite and sniff usage of functions
 * we use in our internal Proxies, to combat that we use a cached copy of those functions.
 *
 * This is evaluated once per execution context (e.g. window)
 */
utils.preloadCache = () => {
    if (utils.cache) {
        return;
    }
    utils.cache = {
        // Used in our proxies
        Reflect: {
            get: Reflect.get.bind(Reflect),
            apply: Reflect.apply.bind(Reflect),
        },
        // Used in `makeNativeString`
        nativeToStringStr: Function.toString + "",
    };
};
/**
 * Utility function to generate a cross-browser `toString` result representing native code.
 *
 * There's small differences: Chromium uses a single line, whereas FF & Webkit uses multiline strings.
 * To future-proof this we use an existing native toString result as the basis.
 *
 * The only advantage we have over the other team is that our JS runs first, hence we cache the result
 * of the native toString result once, so they cannot spoof it afterwards and reveal that we're using it.
 *
 * Note: Whenever we add a `Function.prototype.toString` proxy we should preload the cache before,
 * by executing `utils.preloadCache()` before the proxy is applied (so we don't cause recursive lookups).
 *
 * @example
 * makeNativeString('foobar') // => `function foobar() { [native code] }`
 *
 * @param {string} [name] - Optional function name
 */
utils.makeNativeString = (name = "") => {
    // Cache (per-window) the original native toString or use that if available
    utils.preloadCache();
    return utils.cache.nativeToStringStr.replace("toString", name || "");
};
/**
 * Helper function to modify the `toString()` result of the provided object.
 *
 * Note: Use `utils.redirectToString` instead when possible.
 *
 * There's a quirk in JS Proxies that will cause the `toString()` result to differ from the vanilla Object.
 * If no string is provided we will generate a `[native code]` thing based on the name of the property object.
 *
 * @example
 * patchToString(WebGLRenderingContext.prototype.getParameter, 'function getParameter() { [native code] }')
 *
 * @param {object} obj - The object for which to modify the `toString()` representation
 * @param {string} str - Optional string used as a return value
 */
utils.patchToString = (obj, str = "") => {
    utils.preloadCache();
    const toStringProxy = new Proxy(Function.prototype.toString, {
        apply: function (target, ctx) {
            // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
            if (ctx === Function.prototype.toString) {
                return utils.makeNativeString("toString");
            }
            // `toString` targeted at our proxied Object detected
            if (ctx === obj) {
                // We either return the optional string verbatim or derive the most desired result automatically
                return str || utils.makeNativeString(obj.name);
            }
            // Check if the toString protype of the context is the same as the global prototype,
            // if not indicates that we are doing a check across different windows., e.g. the iframeWithdirect` test case
            const hasSameProto = Object.getPrototypeOf(Function.prototype.toString).isPrototypeOf(ctx.toString); // eslint-disable-line no-prototype-builtins
            if (!hasSameProto) {
                // Pass the call on to the local Function.prototype.toString instead
                return ctx.toString();
            }
            return target.call(ctx);
        },
    });
    utils.replaceProperty(Function.prototype, "toString", {
        value: toStringProxy,
    });
};
/**
 * Make all nested functions of an object native.
 *
 * @param {object} obj
 */
utils.patchToStringNested = (obj = {}) => {
    return utils.execRecursively(obj, ["function"], utils.patchToString);
};
/**
 * Redirect toString requests from one object to another.
 *
 * @param {object} proxyObj - The object that toString will be called on
 * @param {object} originalObj - The object which toString result we wan to return
 */
utils.redirectToString = (proxyObj, originalObj) => {
    utils.preloadCache();
    const toStringProxy = new Proxy(Function.prototype.toString, {
        apply: function (target, ctx) {
            // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
            if (ctx === Function.prototype.toString) {
                return utils.makeNativeString("toString");
            }
            // `toString` targeted at our proxied Object detected
            if (ctx === proxyObj) {
                const fallback = () => originalObj && originalObj.name
                    ? utils.makeNativeString(originalObj.name)
                    : utils.makeNativeString(proxyObj.name);
                // Return the toString representation of our original object if possible
                return originalObj + "" || fallback();
            }
            // Check if the toString protype of the context is the same as the global prototype,
            // if not indicates that we are doing a check across different windows., e.g. the iframeWithdirect` test case
            const hasSameProto = Object.getPrototypeOf(Function.prototype.toString).isPrototypeOf(ctx.toString); // eslint-disable-line no-prototype-builtins
            if (!hasSameProto) {
                // Pass the call on to the local Function.prototype.toString instead
                return ctx.toString();
            }
            return target.call(ctx);
        },
    });
    utils.replaceProperty(Function.prototype, "toString", {
        value: toStringProxy,
    });
};
/**
 * All-in-one method to replace a property with a JS Proxy using the provided Proxy handler with traps.
 *
 * Will stealthify these aspects (strip error stack traces, redirect toString, etc).
 * Note: This is meant to modify native Browser APIs and works best with prototype objects.
 *
 * @example
 * replaceWithProxy(WebGLRenderingContext.prototype, 'getParameter', proxyHandler)
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The name of the property to replace
 * @param {object} handler - The JS Proxy handler to use
 */
utils.replaceWithProxy = (obj, propName, handler) => {
    utils.preloadCache();
    const originalObj = obj[propName];
    const proxyObj = new Proxy(obj[propName], utils.stripProxyFromErrors(handler));
    utils.replaceProperty(obj, propName, { value: proxyObj });
    utils.redirectToString(proxyObj, originalObj);
    return true;
};
/**
 * All-in-one method to mock a non-existing property with a JS Proxy using the provided Proxy handler with traps.
 *
 * Will stealthify these aspects (strip error stack traces, redirect toString, etc).
 *
 * @example
 * mockWithProxy(chrome.runtime, 'sendMessage', function sendMessage() {}, proxyHandler)
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The name of the property to replace or create
 * @param {object} pseudoTarget - The JS Proxy target to use as a basis
 * @param {object} handler - The JS Proxy handler to use
 */
utils.mockWithProxy = (obj, propName, pseudoTarget, handler) => {
    utils.preloadCache();
    const proxyObj = new Proxy(pseudoTarget, utils.stripProxyFromErrors(handler));
    utils.replaceProperty(obj, propName, { value: proxyObj });
    utils.patchToString(proxyObj);
    return true;
};
/**
 * All-in-one method to create a new JS Proxy with stealth tweaks.
 *
 * This is meant to be used whenever we need a JS Proxy but don't want to replace or mock an existing known property.
 *
 * Will stealthify certain aspects of the Proxy (strip error stack traces, redirect toString, etc).
 *
 * @example
 * createProxy(navigator.mimeTypes.__proto__.namedItem, proxyHandler) // => Proxy
 *
 * @param {object} pseudoTarget - The JS Proxy target to use as a basis
 * @param {object} handler - The JS Proxy handler to use
 */
utils.createProxy = (pseudoTarget, handler) => {
    utils.preloadCache();
    const proxyObj = new Proxy(pseudoTarget, utils.stripProxyFromErrors(handler));
    utils.patchToString(proxyObj);
    return proxyObj;
};
/**
 * Helper function to split a full path to an Object into the first part and property.
 *
 * @example
 * splitObjPath(`HTMLMediaElement.prototype.canPlayType`)
 * // => {objName: "HTMLMediaElement.prototype", propName: "canPlayType"}
 *
 * @param {string} objPath - The full path to an object as dot notation string
 */
utils.splitObjPath = (objPath) => ({
    // Remove last dot entry (property) ==> `HTMLMediaElement.prototype`
    objName: objPath.split(".").slice(0, -1).join("."),
    // Extract last dot entry ==> `canPlayType`
    propName: objPath.split(".").slice(-1)[0],
});
/**
 * Convenience method to replace a property with a JS Proxy using the provided objPath.
 *
 * Supports a full path (dot notation) to the object as string here, in case that makes it easier.
 *
 * @example
 * replaceObjPathWithProxy('WebGLRenderingContext.prototype.getParameter', proxyHandler)
 *
 * @param {string} objPath - The full path to an object (dot notation string) to replace
 * @param {object} handler - The JS Proxy handler to use
 */
utils.replaceObjPathWithProxy = (objPath, handler) => {
    const { objName, propName } = utils.splitObjPath(objPath);
    const obj = eval(objName); // eslint-disable-line no-eval
    return utils.replaceWithProxy(obj, propName, handler);
};
/**
 * Traverse nested properties of an object recursively and apply the given function on a whitelist of value types.
 *
 * @param {object} obj
 * @param {array} typeFilter - e.g. `['function']`
 * @param {Function} fn - e.g. `utils.patchToString`
 */
utils.execRecursively = (obj = {}, typeFilter = [], fn) => {
    function recurse(obj) {
        for (const key in obj) {
            if (obj[key] === undefined) {
                continue;
            }
            if (obj[key] && typeof obj[key] === "object") {
                recurse(obj[key]);
            }
            else {
                if (obj[key] && typeFilter.includes(typeof obj[key])) {
                    fn.call(this, obj[key]);
                }
            }
        }
    }
    recurse(obj);
    return obj;
};
/**
 * Everything we run through e.g. `page.evaluate` runs in the browser context, not the NodeJS one.
 * That means we cannot just use reference variables and functions from outside code, we need to pass everything as a parameter.
 *
 * Unfortunately the data we can pass is only allowed to be of primitive types, regular functions don't survive the built-in serialization process.
 * This utility function will take an object with functions and stringify them, so we can pass them down unharmed as strings.
 *
 * We use this to pass down our utility functions as well as any other functions (to be able to split up code better).
 *
 * @see utils.materializeFns
 *
 * @param {object} fnObj - An object containing functions as properties
 */
utils.stringifyFns = (fnObj = { hello: () => "world" }) => {
    // Object.fromEntries() ponyfill (in 6 lines) - supported only in Node v12+, modern browsers are fine
    // https://github.com/feross/fromentries
    function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj;
        }, {});
    }
    //@ts-ignore
    return (Object.fromEntries || fromEntries)(Object.entries(fnObj)
        .filter(([_key, value]) => typeof value === "function")
        .map(([key, value]) => [key, value.toString()]));
};
/**
 * Utility function to reverse the process of `utils.stringifyFns`.
 * Will materialize an object with stringified functions (supports classic and fat arrow functions).
 *
 * @param {object} fnStrObj - An object containing stringified functions as properties
 */
utils.materializeFns = (fnStrObj = { hello: "() => 'world'" }) => {
    //@ts-ignore
    return Object.fromEntries(Object.entries(fnStrObj).map(([key, value]) => {
        if (value.startsWith("function")) {
            // some trickery is needed to make oldschool functions work :-)
            return [key, eval(`() => ${value}`)()]; // eslint-disable-line no-eval
        }
        else {
            // arrow functions just work
            return [key, eval(value)]; // eslint-disable-line no-eval
        }
    }));
};
exports.default = utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwySEFBMkg7QUFDM0g7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQTtBQUVyQjs7Ozs7O0dBTUc7QUFDSCxLQUFLLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxVQUFlLEVBQUUsRUFBRSxFQUFFO0lBQy9DLE1BQU0sVUFBVSxHQUFRLEVBQUUsQ0FBQTtJQUMxQiwyRkFBMkY7SUFDM0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNuQixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUc7WUFDZixJQUFJO2dCQUNBLGdEQUFnRDtnQkFDaEQsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLElBQUksRUFBRSxDQUFDLENBQUE7YUFDcEQ7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDVixpRkFBaUY7Z0JBQ2pGLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ2xELE1BQU0sR0FBRyxDQUFBO2lCQUNaO2dCQUVELHVGQUF1RjtnQkFDdkYsb0ZBQW9GO2dCQUNwRiwwRkFBMEY7Z0JBQzFGLHNGQUFzRjtnQkFDdEYsNkZBQTZGO2dCQUU3RixNQUFNLGtCQUFrQixHQUFHLENBQUMsTUFBVyxFQUFFLEVBQUU7b0JBQ3ZDLE1BQU0sU0FBUyxHQUFHO3dCQUNkLGNBQWMsSUFBSSxHQUFHO3dCQUNyQixhQUFhLElBQUksR0FBRzt3QkFDcEIsdUNBQXVDLElBQUksSUFBSTtxQkFDbEQsQ0FBQTtv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