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
exports.pageStealth = void 0;
const withUtils_1 = require("./withUtils");
const utils_1 = __importDefault(require("./utils"));
function pageStealth(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield chrome_app(page);
        yield chrome_csi(page);
        yield chrome_loadTimes(page);
        yield chrome_runtime(page);
        yield iframe_contentWindow(page);
        yield media_codecs(page);
        yield navigator_language(page);
        yield navigator_permissions(page);
        yield navigor_plugins(page);
        yield navigator_vendor(page);
        yield navigator_webdriver(page);
        yield source_url(page);
        // not needed since we patch in fast page
        // await user_agent_override(page)
        yield webgl_vendor(page);
        yield window_outerdimensions(page);
    });
}
exports.pageStealth = pageStealth;
function chrome_app(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield withUtils_1.withUtilsInitScript(page.context(), () => {
            if (!window.chrome) {
                // Use the exact property descriptor found in headful Chrome
                // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
                Object.defineProperty(window, "chrome", {
                    writable: true,
                    enumerable: true,
                    configurable: false,
                    value: {},
                });
            }
            // That means we're running headful and don't need to mock anything
            if ("app" in window.chrome) {
                return; // Nothing to do here
            }
            const makeError = {
                ErrorInInvocation: (fn) => {
                    const err = new TypeError(`Error in invocation of app.${fn}()`);
                    return utils_1.default.stripErrorWithAnchor(err, `at ${fn} (eval at <anonymous>`);
                },
            };
            // There's a some static data in that property which doesn't seem to change,
            // we should periodically check for updates: `JSON.stringify(window.app, null, 2)`
            const STATIC_DATA = JSON.parse(`{
            "isInstalled": false,
            "InstallState": {
              "DISABLED": "disabled",
              "INSTALLED": "installed",
              "NOT_INSTALLED": "not_installed"
            },
            "RunningState": {
              "CANNOT_RUN": "cannot_run",
              "READY_TO_RUN": "ready_to_run",
              "RUNNING": "running"
            }
            }`.trim());
            window.chrome.app = Object.assign(Object.assign({}, STATIC_DATA), { get isInstalled() {
                    return false;
                }, getDetails: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`getDetails`);
                    }
                    return null;
                }, getIsInstalled: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`getIsInstalled`);
                    }
                    return false;
                }, runningState: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`runningState`);
                    }
                    return "cannot_run";
                } });
        });
    });
}
function chrome_csi(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield withUtils_1.withUtilsInitScript(page.context(), () => {
            if (!window.chrome) {
                // Use the exact property descriptor found in headful Chrome
                // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
                Object.defineProperty(window, "chrome", {
                    writable: true,
                    enumerable: true,
                    configurable: false,
                    value: {},
                });
            }
            // That means we're running headful and don't need to mock anything
            if ("csi" in window.chrome) {
                return; // Nothing to do here
            }
            // Check that the Navigation Timing API v1 is available, we need that
            if (!window.performance || !window.performance.timing) {
                return;
            }
            const { timing } = window.performance;
            window.chrome.csi = function () {
                return {
                    onloadT: timing.domContentLoadedEventEnd,
                    startE: timing.navigationStart,
                    pageT: Date.now() - timing.navigationStart,
                    tran: 15,
                };
            };
            utils_1.default.patchToString(window.chrome.csi);
        });
    });
}
function chrome_loadTimes(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils) {
            if (!window.chrome) {
                // Use the exact property descriptor found in headful Chrome
                // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
                Object.defineProperty(window, "chrome", {
                    writable: true,
                    enumerable: true,
                    configurable: false,
                    value: {},
                });
            }
            // That means we're running headful and don't need to mock anything
            if ("loadTimes" in window.chrome) {
                return; // Nothing to do here
            }
            // Check that the Navigation Timing API v1 + v2 is available, we need that
            if (!window.performance ||
                !window.performance.timing ||
                !window.PerformancePaintTiming) {
                return;
            }
            const { performance } = window;
            // Some stuff is not available on about:blank as it requires a navigation to occur,
            // let's harden the code to not fail then:
            const ntEntryFallback = {
                nextHopProtocol: "h2",
                type: "other",
            };
            // The API exposes some funky info regarding the connection
            const protocolInfo = {
                get connectionInfo() {
                    const ntEntry = performance.getEntriesByType("navigation")[0] ||
                        ntEntryFallback;
                    return ntEntry.nextHopProtocol;
                },
                get npnNegotiatedProtocol() {
                    // NPN is deprecated in favor of ALPN, but this implementation returns the
                    // HTTP/2 or HTTP2+QUIC/39 requests negotiated via ALPN.
                    const ntEntry = performance.getEntriesByType("navigation")[0] ||
                        ntEntryFallback;
                    return ["h2", "hq"].includes(ntEntry.nextHopProtocol)
                        ? ntEntry.nextHopProtocol
                        : "unknown";
                },
                get navigationType() {
                    const ntEntry = performance.getEntriesByType("navigation")[0] ||
                        ntEntryFallback;
                    return ntEntry.type;
                },
                get wasAlternateProtocolAvailable() {
                    // The Alternate-Protocol header is deprecated in favor of Alt-Svc
                    // (https://www.mnot.net/blog/2016/03/09/alt-svc), so technically this
                    // should always return false.
                    return false;
                },
                get wasFetchedViaSpdy() {
                    // SPDY is deprecated in favor of HTTP/2, but this implementation returns
                    // true for HTTP/2 or HTTP2+QUIC/39 as well.
                    const ntEntry = performance.getEntriesByType("navigation")[0] ||
                        ntEntryFallback;
                    return ["h2", "hq"].includes(ntEntry.nextHopProtocol);
                },
                get wasNpnNegotiated() {
                    // NPN is deprecated in favor of ALPN, but this implementation returns true
                    // for HTTP/2 or HTTP2+QUIC/39 requests negotiated via ALPN.
                    const ntEntry = performance.getEntriesByType("navigation")[0] ||
                        ntEntryFallback;
                    return ["h2", "hq"].includes(ntEntry.nextHopProtocol);
                },
            };
            const { timing } = window.performance;
            // Truncate number to specific number of decimals, most of the `loadTimes` stuff has 3
            function toFixed(num, fixed) {
                var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
                return num.toString().match(re)[0];
            }
            const timingInfo = {
                get firstPaintAfterLoadTime() {
                    // This was never actually implemented and always returns 0.
                    return 0;
                },
                get requestTime() {
                    return timing.navigationStart / 1000;
                },
                get startLoadTime() {
                    return timing.navigationStart / 1000;
                },
                get commitLoadTime() {
                    return timing.responseStart / 1000;
                },
                get finishDocumentLoadTime() {
                    return timing.domContentLoadedEventEnd / 1000;
                },
                get finishLoadTime() {
                    return timing.loadEventEnd / 1000;
                },
                get firstPaintTime() {
                    const fpEntry = performance.getEntriesByType("paint")[0] || {
                        startTime: timing.loadEventEnd / 1000,
                    };
                    return toFixed((fpEntry.startTime + performance.timeOrigin) / 1000, 3);
                },
            };
            window.chrome.loadTimes = function () {
                return Object.assign(Object.assign({}, protocolInfo), timingInfo);
            };
            utils.patchToString(window.chrome.loadTimes);
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function chrome_runtime(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils, { opts, STATIC_DATA }) {
            if (!window.chrome) {
                // Use the exact property descriptor found in headful Chrome
                // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
                Object.defineProperty(window, "chrome", {
                    writable: true,
                    enumerable: true,
                    configurable: false,
                    value: {},
                });
            }
            // That means we're running headful and don't need to mock anything
            const existsAlready = "runtime" in window.chrome;
            // `chrome.runtime` is only exposed on secure origins
            const isNotSecure = !window.location.protocol.startsWith("https");
            if (existsAlready || (isNotSecure && !opts.runOnInsecureOrigins)) {
                return; // Nothing to do here
            }
            window.chrome.runtime = Object.assign(Object.assign({}, STATIC_DATA), { 
                // `chrome.runtime.id` is extension related and returns undefined in Chrome
                get id() {
                    return undefined;
                }, 
                // These two require more sophisticated mocks
                connect: null, sendMessage: null });
            const makeCustomRuntimeErrors = (preamble, method, extensionId) => ({
                NoMatchingSignature: new TypeError(preamble + `No matching signature.`),
                MustSpecifyExtensionID: new TypeError(preamble +
                    `${method} called from a webpage must specify an Extension ID (string) for its first argument.`),
                InvalidExtensionID: new TypeError(preamble + `Invalid extension id: '${extensionId}'`),
            });
            // Valid Extension IDs are 32 characters in length and use the letter `a` to `p`:
            // https://source.chromium.org/chromium/chromium/src/+/master:components/crx_file/id_util.cc;drc=14a055ccb17e8c8d5d437fe080faba4c6f07beac;l=90
            const isValidExtensionID = (str) => str.length === 32 && str.toLowerCase().match(/^[a-p]+$/);
            /** Mock `chrome.runtime.sendMessage` */
            const sendMessageHandler = {
                apply: function (_target, _ctx, args) {
                    const [extensionId, options, responseCallback] = args || [];
                    // Define custom errors
                    const errorPreamble = `Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function responseCallback): `;
                    const Errors = makeCustomRuntimeErrors(errorPreamble, `chrome.runtime.sendMessage()`, extensionId);
                    // Check if the call signature looks ok
                    const noArguments = args.length === 0;
                    const tooManyArguments = args.length > 4;
                    const incorrectOptions = options && typeof options !== "object";
                    const incorrectResponseCallback = responseCallback && typeof responseCallback !== "function";
                    if (noArguments ||
                        tooManyArguments ||
                        incorrectOptions ||
                        incorrectResponseCallback) {
                        throw Errors.NoMatchingSignature;
                    }
                    // At least 2 arguments are required before we even validate the extension ID
                    if (args.length < 2) {
                        throw Errors.MustSpecifyExtensionID;
                    }
                    // Now let's make sure we got a string as extension ID
                    if (typeof extensionId !== "string") {
                        throw Errors.NoMatchingSignature;
                    }
                    if (!isValidExtensionID(extensionId)) {
                        throw Errors.InvalidExtensionID;
                    }
                    return undefined; // Normal behavior
                },
            };
            utils.mockWithProxy(window.chrome.runtime, "sendMessage", function sendMessage() { }, sendMessageHandler);
            /**
             * Mock `chrome.runtime.connect`
             *
             * @see https://developer.chrome.com/apps/runtime#method-connect
             */
            const connectHandler = {
                apply: function (_target, _ctx, args) {
                    const [extensionId, connectInfo] = args || [];
                    // Define custom errors
                    const errorPreamble = `Error in invocation of runtime.connect(optional string extensionId, optional object connectInfo): `;
                    const Errors = makeCustomRuntimeErrors(errorPreamble, `chrome.runtime.connect()`, extensionId);
                    // Behavior differs a bit from sendMessage:
                    const noArguments = args.length === 0;
                    const emptyStringArgument = args.length === 1 && extensionId === "";
                    if (noArguments || emptyStringArgument) {
                        throw Errors.MustSpecifyExtensionID;
                    }
                    const tooManyArguments = args.length > 2;
                    const incorrectConnectInfoType = connectInfo && typeof connectInfo !== "object";
                    if (tooManyArguments || incorrectConnectInfoType) {
                        throw Errors.NoMatchingSignature;
                    }
                    const extensionIdIsString = typeof extensionId === "string";
                    if (extensionIdIsString && extensionId === "") {
                        throw Errors.MustSpecifyExtensionID;
                    }
                    if (extensionIdIsString && !isValidExtensionID(extensionId)) {
                        throw Errors.InvalidExtensionID;
                    }
                    // There's another edge-case here: extensionId is optional so we might find a connectInfo object as first param, which we need to validate
                    const validateConnectInfo = (ci) => {
                        // More than a first param connectInfo as been provided
                        if (args.length > 1) {
                            throw Errors.NoMatchingSignature;
                        }
                        // An empty connectInfo has been provided
                        if (Object.keys(ci).length === 0) {
                            throw Errors.MustSpecifyExtensionID;
                        }
                        // Loop over all connectInfo props an check them
                        Object.entries(ci).forEach(([k, v]) => {
                            const isExpected = [
                                "name",
                                "includeTlsChannelId",
                            ].includes(k);
                            if (!isExpected) {
                                throw new TypeError(errorPreamble + `Unexpected property: '${k}'.`);
                            }
                            const MismatchError = (propName, expected, found) => TypeError(errorPreamble +
                                `Error at property '${propName}': Invalid type: expected ${expected}, found ${found}.`);
                            if (k === "name" && typeof v !== "string") {
                                throw MismatchError(k, "string", typeof v);
                            }
                            if (k === "includeTlsChannelId" &&
                                typeof v !== "boolean") {
                                throw MismatchError(k, "boolean", typeof v);
                            }
                        });
                    };
                    if (typeof extensionId === "object") {
                        validateConnectInfo(extensionId);
                        throw Errors.MustSpecifyExtensionID;
                    }
                    // Unfortunately even when the connect fails Chrome will return an object with methods we need to mock as well
                    return utils.patchToStringNested(makeConnectResponse());
                },
            };
            utils.mockWithProxy(window.chrome.runtime, "connect", function connect() { }, connectHandler);
            function makeConnectResponse() {
                const onSomething = () => ({
                    addListener: function addListener() { },
                    dispatch: function dispatch() { },
                    hasListener: function hasListener() { },
                    hasListeners: function hasListeners() {
                        return false;
                    },
                    removeListener: function removeListener() { },
                });
                const response = {
                    name: "",
                    sender: undefined,
                    disconnect: function disconnect() { },
                    onDisconnect: onSomething(),
                    onMessage: onSomething(),
                    postMessage: function postMessage() {
                        if (!arguments.length) {
                            throw new TypeError(`Insufficient number of arguments.`);
                        }
                        throw new Error(`Attempting to use a disconnected port object`);
                    },
                };
                return response;
            }
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, {
            opts: {},
            STATIC_DATA: JSON.parse(`{
      "OnInstalledReason": {
        "CHROME_UPDATE": "chrome_update",
        "INSTALL": "install",
        "SHARED_MODULE_UPDATE": "shared_module_update",
        "UPDATE": "update"
      },
      "OnRestartRequiredReason": {
        "APP_UPDATE": "app_update",
        "OS_UPDATE": "os_update",
        "PERIODIC": "periodic"
      },
      "PlatformArch": {
        "ARM": "arm",
        "ARM64": "arm64",
        "MIPS": "mips",
        "MIPS64": "mips64",
        "X86_32": "x86-32",
        "X86_64": "x86-64"
      },
      "PlatformNaclArch": {
        "ARM": "arm",
        "MIPS": "mips",
        "MIPS64": "mips64",
        "X86_32": "x86-32",
        "X86_64": "x86-64"
      },
      "PlatformOs": {
        "ANDROID": "android",
        "CROS": "cros",
        "LINUX": "linux",
        "MAC": "mac",
        "OPENBSD": "openbsd",
        "WIN": "win"
      },
      "RequestUpdateCheckStatus": {
        "NO_UPDATE": "no_update",
        "THROTTLED": "throttled",
        "UPDATE_AVAILABLE": "update_available"
      }
    }`),
        });
    });
}
function iframe_contentWindow(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) {
            try {
                // Adds a contentWindow proxy to the provided iframe element
                const addContentWindowProxy = (iframe) => {
                    const contentWindowProxy = {
                        get(target, key) {
                            // Now to the interesting part:
                            // We actually make this thing behave like a regular iframe window,
                            // by intercepting calls to e.g. `.self` and redirect it to the correct thing. :)
                            // That makes it possible for these assertions to be correct:
                            // iframe.contentWindow.self === window.top // must be false
                            if (key === "self") {
                                return this;
                            }
                            // iframe.contentWindow.frameElement === iframe // must be true
                            if (key === "frameElement") {
                                return iframe;
                            }
                            return Reflect.get(target, key);
                        },
                    };
                    if (!iframe.contentWindow) {
                        const proxy = new Proxy(window, contentWindowProxy);
                        Object.defineProperty(iframe, "contentWindow", {
                            get() {
                                return proxy;
                            },
                            set(newValue) {
                                return newValue; // contentWindow is immutable
                            },
                            enumerable: true,
                            configurable: false,
                        });
                    }
                };
                // Handles iframe element creation, augments `srcdoc` property so we can intercept further
                const handleIframeCreation = (target, thisArg, args) => {
                    const iframe = target.apply(thisArg, args);
                    // We need to keep the originals around
                    const _iframe = iframe;
                    const _srcdoc = _iframe.srcdoc;
                    // Add hook for the srcdoc property
                    // We need to be very surgical here to not break other iframes by accident
                    Object.defineProperty(iframe, "srcdoc", {
                        configurable: true,
                        get: function () {
                            return _iframe.srcdoc;
                        },
                        set: function (newValue) {
                            addContentWindowProxy(this);
                            // Reset property, the hook is only needed once
                            Object.defineProperty(iframe, "srcdoc", {
                                configurable: false,
                                writable: false,
                                value: _srcdoc,
                            });
                            _iframe.srcdoc = newValue;
                        },
                    });
                    return iframe;
                };
                // Adds a hook to intercept iframe creation events
                const addIframeCreationSniffer = () => {
                    /* global document */
                    const createElement = {
                        // Make toString() native
                        get(target, key) {
                            return Reflect.get(target, key);
                        },
                        apply: function (target, thisArg, args) {
                            const isIframe = args &&
                                args.length &&
                                `${args[0]}`.toLowerCase() === "iframe";
                            if (!isIframe) {
                                // Everything as usual
                                return target.apply(thisArg, args);
                            }
                            else {
                                return handleIframeCreation(target, thisArg, args);
                            }
                        },
                    };
                    // All this just due to iframes with srcdoc bug
                    document.createElement = new Proxy(document.createElement, createElement);
                };
                // Let's go
                addIframeCreationSniffer();
            }
            catch (err) {
                // console.warn(err)
            }
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function media_codecs(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils) {
            /**
             * Input might look funky, we need to normalize it so e.g. whitespace isn't an issue for our spoofing.
             *
             * @example
             * video/webm; codecs="vp8, vorbis"
             * video/mp4; codecs="avc1.42E01E"
             * audio/x-m4a;
             * audio/ogg; codecs="vorbis"
             * @param {String} arg
             */
            const parseInput = (arg) => {
                const [mime, codecStr] = arg.trim().split(";");
                let codecs = [];
                if (codecStr && codecStr.includes('codecs="')) {
                    codecs = codecStr
                        .trim()
                        .replace(`codecs="`, "")
                        .replace(`"`, "")
                        .trim()
                        .split(",")
                        .filter((x) => !!x)
                        .map((x) => x.trim());
                }
                return {
                    mime,
                    codecStr,
                    codecs,
                };
            };
            const canPlayType = {
                // Intercept certain requests
                apply: function (target, ctx, args) {
                    if (!args || !args.length) {
                        return target.apply(ctx, args);
                    }
                    const { mime, codecs } = parseInput(args[0]);
                    // This specific mp4 codec is missing in Chromium
                    if (mime === "video/mp4") {
                        if (codecs.includes("avc1.42E01E")) {
                            return "probably";
                        }
                    }
                    // This mimetype is only supported if no codecs are specified
                    if (mime === "audio/x-m4a" && !codecs.length) {
                        return "maybe";
                    }
                    // This mimetype is only supported if no codecs are specified
                    if (mime === "audio/aac" && !codecs.length) {
                        return "probably";
                    }
                    // Everything else as usual
                    return target.apply(ctx, args);
                },
            };
            /* global HTMLMediaElement */
            utils.replaceWithProxy(HTMLMediaElement.prototype, "canPlayType", canPlayType);
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function navigator_language(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) {
            Object.defineProperty(Object.getPrototypeOf(navigator), "languages", {
                get: () => ["en-US", "en"],
            });
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function navigator_permissions(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils) {
            const handler = {
                apply: function (_target, _ctx, args) {
                    const param = (args || [])[0];
                    if (param && param.name && param.name === "notifications") {
                        const result = { state: Notification.permission };
                        Object.setPrototypeOf(result, PermissionStatus.prototype);
                        return Promise.resolve(result);
                    }
                    return utils.cache.Reflect.apply(...arguments);
                },
            };
            utils.replaceWithProxy(window.navigator.permissions.__proto__, // eslint-disable-line no-proto
            "query", handler);
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function navigor_plugins(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils, { fns, data }) {
            fns = utils.materializeFns(fns);
            // That means we're running headful
            const hasPlugins = "plugins" in navigator && navigator.plugins.length;
            if (hasPlugins) {
                return; // nothing to do here
            }
            const mimeTypes = fns.generateMimeTypeArray(utils, fns)(data.mimeTypes);
            const plugins = fns.generatePluginArray(utils, fns)(data.plugins);
            // Plugin and MimeType cross-reference each other, let's do that now
            // Note: We're looping through `data.plugins` here, not the generated `plugins`
            for (const pluginData of data.plugins) {
                pluginData.__mimeTypes.forEach((type, index) => {
                    plugins[pluginData.name][index] = mimeTypes[type];
                    Object.defineProperty(plugins[pluginData.name], type, {
                        value: mimeTypes[type],
                        writable: false,
                        enumerable: false,
                        configurable: true,
                    });
                    Object.defineProperty(mimeTypes[type], "enabledPlugin", {
                        value: new Proxy(plugins[pluginData.name], {}),
                        writable: false,
                        enumerable: false,
                        configurable: true,
                    });
                });
            }
            const patchNavigator = (name, value) => utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
                get() {
                    return value;
                },
            });
            patchNavigator("mimeTypes", mimeTypes);
            patchNavigator("plugins", plugins);
        }
        let generateMagicArray = (utils, fns) => function (dataArray = [], proto = MimeTypeArray.prototype, itemProto = MimeType.prototype, itemMainProp = "type") {
            // Quick helper to set props with the same descriptors vanilla is using
            const defineProp = (obj, prop, value) => Object.defineProperty(obj, prop, {
                value,
                writable: false,
                enumerable: false,
                configurable: true,
            });
            // Loop over our fake data and construct items
            const makeItem = (data) => {
                const item = {};
                for (const prop of Object.keys(data)) {
                    if (prop.startsWith("__")) {
                        continue;
                    }
                    defineProp(item, prop, data[prop]);
                }
                return patchItem(item, data);
            };
            const patchItem = (item, data) => {
                let descriptor = Object.getOwnPropertyDescriptors(item);
                // Special case: Plugins have a magic length property which is not enumerable
                // e.g. `navigator.plugins[i].length` should always be the length of the assigned mimeTypes
                if (itemProto === Plugin.prototype) {
                    descriptor = Object.assign(Object.assign({}, descriptor), { length: {
                            value: data.__mimeTypes.length,
                            writable: false,
                            enumerable: false,
                            configurable: true,
                        } });
                }
                // We need to spoof a specific `MimeType` or `Plugin` object
                const obj = Object.create(itemProto, descriptor);
                // Virtually all property keys are not enumerable in vanilla
                const blacklist = [
                    ...Object.keys(data),
                    "length",
                    "enabledPlugin",
                ];
                return new Proxy(obj, {
                    ownKeys(target) {
                        return Reflect.ownKeys(target).filter((k) => !blacklist.includes(k));
                    },
                    getOwnPropertyDescriptor(target, prop) {
                        if (blacklist.includes(prop)) {
                            return undefined;
                        }
                        return Reflect.getOwnPropertyDescriptor(target, prop);
                    },
                });
            };
            const magicArray = [];
            // Loop through our fake data and use that to create convincing entities
            dataArray.forEach((data) => {
                magicArray.push(makeItem(data));
            });
            // Add direct property access  based on types (e.g. `obj['application/pdf']`) afterwards
            magicArray.forEach((entry) => {
                defineProp(magicArray, entry[itemMainProp], entry);
            });
            // This is the best way to fake the type to make sure this is false: `Array.isArray(navigator.mimeTypes)`
            let tt = Object.assign(Object.assign({}, Object.getOwnPropertyDescriptors(magicArray)), { 
                // There's one ugly quirk we unfortunately need to take care of:
                // The `MimeTypeArray` prototype has an enumerable `length` property,
                // but headful Chrome will still skip it when running `Object.getOwnPropertyNames(navigator.mimeTypes)`.
                // To strip it we need to make it first `configurable` and can then overlay a Proxy with an `ownKeys` trap.
                length: {
                    value: magicArray.length,
                    writable: false,
                    enumerable: false,
                    configurable: true,
                } });
            const magicArrayObj = Object.create(proto, tt);
            // Generate our functional function mocks :-)
            const functionMocks = fns.generateFunctionMocks(utils)(proto, itemMainProp, magicArray);
            // We need to overlay our custom object with a JS Proxy
            const magicArrayObjProxy = new Proxy(magicArrayObj, {
                get(_target, key = "") {
                    // Redirect function calls to our custom proxied versions mocking the vanilla behavior
                    if (key === "item") {
                        return functionMocks.item;
                    }
                    if (key === "namedItem") {
                        return functionMocks.namedItem;
                    }
                    if (proto === PluginArray.prototype &&
                        key === "refresh") {
                        return functionMocks.refresh;
                    }
                    // Everything else can pass through as normal
                    return utils.cache.Reflect.get(...arguments);
                },
                ownKeys(_target) {
                    // There are a couple of quirks where the original property demonstrates "magical" behavior that makes no sense
                    // This can be witnessed when calling `Object.getOwnPropertyNames(navigator.mimeTypes)` and the absense of `length`
                    // My guess is that it has to do with the recent change of not allowing data enumeration and this being implemented weirdly
                    // For that reason we just completely fake the available property names based on our data to match what regular Chrome is doing
                    // Specific issues when not patching this: `length` property is available, direct `types` props (e.g. `obj['application/pdf']`) are missing
                    const keys = [];
                    const typeProps = magicArray.map((mt) => mt[itemMainProp]);
                    typeProps.forEach((_, i) => keys.push(`${i}`));
                    typeProps.forEach((propName) => keys.push(propName));
                    return keys;
                },
                getOwnPropertyDescriptor(target, prop) {
                    if (prop === "length") {
                        return undefined;
                    }
                    return Reflect.getOwnPropertyDescriptor(target, prop);
                },
            });
            return magicArrayObjProxy;
        };
        let generateFunctionMocks = (utils) => (proto, itemMainProp, dataArray) => ({
            /** Returns the MimeType object with the specified index. */
            item: utils.createProxy(proto.item, {
                apply(_target, _ctx, args) {
                    if (!args.length) {
                        throw new TypeError(`Failed to execute 'item' on '${proto[Symbol.toStringTag]}': 1 argument required, but only 0 present.`);
                    }
                    // Special behavior alert:
                    // - Vanilla tries to cast strings to Numbers (only integers!) and use them as property index lookup
                    // - If anything else than an integer (including as string) is provided it will return the first entry
                    const isInteger = args[0] && Number.isInteger(Number(args[0])); // Cast potential string to number first, then check for integer
                    // Note: Vanilla never returns `undefined`
                    return ((isInteger ? dataArray[Number(args[0])] : dataArray[0]) ||
                        null);
                },
            }),
            /** Returns the MimeType object with the specified name. */
            namedItem: utils.createProxy(proto.namedItem, {
                apply(_target, _ctx, args) {
                    if (!args.length) {
                        throw new TypeError(`Failed to execute 'namedItem' on '${proto[Symbol.toStringTag]}': 1 argument required, but only 0 present.`);
                    }
                    return (dataArray.find((mt) => mt[itemMainProp] === args[0]) ||
                        null); // Not `undefined`!
                },
            }),
            /** Does nothing and shall return nothing */
            refresh: proto.refresh
                ? utils.createProxy(proto.refresh, {
                    apply(_target, _ctx, _args) {
                        return undefined;
                    },
                })
                : undefined,
        });
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default, {
            // We pass some functions to evaluate to structure the code more nicely
            fns: utils_1.default.stringifyFns({
                generateMimeTypeArray: (utils, fns) => (mimeTypesData) => {
                    return fns.generateMagicArray(utils, fns)(mimeTypesData, MimeTypeArray.prototype, MimeType.prototype, "type");
                },
                generatePluginArray: (utils, fns) => (pluginsData) => {
                    return fns.generateMagicArray(utils, fns)(pluginsData, PluginArray.prototype, Plugin.prototype, "name");
                },
                generateMagicArray,
                generateFunctionMocks,
            }),
            data: JSON.parse(`{
      "mimeTypes": [
        {
          "type": "application/pdf",
          "suffixes": "pdf",
          "description": "",
          "__pluginName": "Chrome PDF Viewer"
        },
        {
          "type": "application/x-google-chrome-pdf",
          "suffixes": "pdf",
          "description": "Portable Document Format",
          "__pluginName": "Chrome PDF Plugin"
        },
        {
          "type": "application/x-nacl",
          "suffixes": "",
          "description": "Native Client Executable",
          "__pluginName": "Native Client"
        },
        {
          "type": "application/x-pnacl",
          "suffixes": "",
          "description": "Portable Native Client Executable",
          "__pluginName": "Native Client"
        }
      ],
      "plugins": [
        {
          "name": "Chrome PDF Plugin",
          "filename": "internal-pdf-viewer",
          "description": "Portable Document Format",
          "__mimeTypes": ["application/x-google-chrome-pdf"]
        },
        {
          "name": "Chrome PDF Viewer",
          "filename": "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          "description": "",
          "__mimeTypes": ["application/pdf"]
        },
        {
          "name": "Native Client",
          "filename": "internal-nacl-plugin",
          "description": "",
          "__mimeTypes": ["application/x-nacl", "application/x-pnacl"]
        }
      ]
    }`),
        });
    });
}
function navigator_vendor(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) {
            Object.defineProperty(Object.getPrototypeOf(navigator), "vendor", {
                get: () => "Google Inc.",
            });
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function navigator_webdriver(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) {
            delete Object.getPrototypeOf(navigator).webdriver;
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function source_url(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) { }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function webgl_vendor(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(utils) {
            const getParameterProxyHandler = {
                apply: function (target, ctx, args) {
                    const param = (args || [])[0];
                    // UNMASKED_VENDOR_WEBGL
                    if (param === 37445) {
                        return "Intel Inc."; // default in headless: Google Inc.
                    }
                    // UNMASKED_RENDERER_WEBGL
                    if (param === 37446) {
                        return "Intel Iris OpenGL Engine"; // default in headless: Google SwiftShader
                    }
                    return utils.cache.Reflect.apply(target, ctx, args);
                },
            };
            const addProxy = (obj, propName) => {
                utils.replaceWithProxy(obj, propName, getParameterProxyHandler);
            };
            // For whatever weird reason loops don't play nice with Object.defineProperty, here's the next best thing:
            addProxy(WebGLRenderingContext.prototype, "getParameter");
            addProxy(WebGL2RenderingContext.prototype, "getParameter");
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
function window_outerdimensions(page) {
    return __awaiter(this, void 0, void 0, function* () {
        function fun(_utils) {
            try {
                if (window.outerWidth && window.outerHeight) {
                    return; // nothing to do here
                }
                const windowFrame = 85; // probably OS and WM dependent
                window.outerWidth = window.innerWidth;
                window.outerHeight = window.innerHeight + windowFrame;
            }
            catch (err) { }
        }
        yield withUtils_1.withUtilsInitScript(page.context(), fun, utils_1.default);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZVN0ZWFsdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGFnZVN0ZWFsdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsMkNBQWlEO0FBQ2pELG9EQUEyQjtBQUkzQixTQUFzQixXQUFXLENBQUMsSUFBVTs7UUFDeEMsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdEIsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdEIsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1QixNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMxQixNQUFNLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2hDLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3hCLE1BQU0sa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDOUIsTUFBTSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNqQyxNQUFNLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMzQixNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzVCLE1BQU0sbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDL0IsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdEIseUNBQXlDO1FBQ3pDLGtDQUFrQztRQUNsQyxNQUFNLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QixNQUFNLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3RDLENBQUM7Q0FBQTtBQWxCRCxrQ0FrQkM7QUFFRCxTQUFlLFVBQVUsQ0FBQyxJQUFVOztRQUNoQyxNQUFNLCtCQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUU7WUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLDREQUE0RDtnQkFDNUQsbUVBQW1FO2dCQUNuRSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7b0JBQ3BDLFFBQVEsRUFBRSxJQUFJO29CQUNkLFVBQVUsRUFBRSxJQUFJO29CQUNoQixZQUFZLEVBQUUsS0FBSztvQkFDbkIsS0FBSyxFQUFFLEVBQUU7aUJBQ1osQ0FBQyxDQUFBO2FBQ0w7WUFFRCxtRUFBbUU7WUFDbkUsSUFBSSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDeEIsT0FBTSxDQUFDLHFCQUFxQjthQUMvQjtZQUVELE1BQU0sU0FBUyxHQUFHO2dCQUNkLGlCQUFpQixFQUFFLENBQUMsRUFBTyxFQUFFLEVBQUU7b0JBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLDhCQUE4QixFQUFFLElBQUksQ0FBQyxDQUFBO29CQUMvRCxPQUFPLGVBQUssQ0FBQyxvQkFBb0IsQ0FDN0IsR0FBRyxFQUNILE1BQU0sRUFBRSx1QkFBdUIsQ0FDbEMsQ0FBQTtnQkFDTCxDQUFDO2FBQ0osQ0FBQTtZQUVELDRFQUE0RTtZQUM1RSxrRkFBa0Y7WUFDbEYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FDMUI7Ozs7Ozs7Ozs7OztjQVlFLENBQUMsSUFBSSxFQUFFLENBQ1osQ0FBQTtZQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxtQ0FDVixXQUFXLEtBRWQsSUFBSSxXQUFXO29CQUNYLE9BQU8sS0FBSyxDQUFBO2dCQUNoQixDQUFDLEVBRUQsVUFBVSxFQUFFLFNBQVMsVUFBVTtvQkFDM0IsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUNsQixNQUFNLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQTtxQkFDbEQ7b0JBQ0QsT0FBTyxJQUFJLENBQUE7Z0JBQ2YsQ0FBQyxFQUNELGNBQWMsRUFBRSxTQUFTLFVBQVU7b0JBQy9CLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRTt3QkFDbEIsTUFBTSxTQUFTLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtxQkFDdEQ7b0JBQ0QsT0FBTyxLQUFLLENBQUE7Z0JBQ2hCLENBQUMsRUFDRCxZQUFZLEVBQUUsU0FBUyxVQUFVO29CQUM3QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7d0JBQ2xCLE1BQU0sU0FBUyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFBO3FCQUNwRDtvQkFDRCxPQUFPLFlBQVksQ0FBQTtnQkFDdkIsQ0FBQyxHQUNKLENBQUE7UUFDTCxDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7Q0FBQTtBQUVELFNBQWUsVUFBVSxDQUFDLElBQVU7O1FBQ2hDLE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsNERBQTREO2dCQUM1RCxtRUFBbUU7Z0JBQ25FLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTtvQkFDcEMsUUFBUSxFQUFFLElBQUk7b0JBQ2QsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFlBQVksRUFBRSxLQUFLO29CQUNuQixLQUFLLEVBQUUsRUFBRTtpQkFDWixDQUFDLENBQUE7YUFDTDtZQUVELG1FQUFtRTtZQUNuRSxJQUFJLEtBQUssSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUN4QixPQUFNLENBQUMscUJBQXFCO2FBQy9CO1lBRUQscUVBQXFFO1lBQ3JFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25ELE9BQU07YUFDVDtZQUVELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFBO1lBRXJDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHO2dCQUNoQixPQUFPO29CQUNILE9BQU8sRUFBRSxNQUFNLENBQUMsd0JBQXdCO29CQUN4QyxNQUFNLEVBQUUsTUFBTSxDQUFDLGVBQWU7b0JBQzlCLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLGVBQWU7b0JBQzFDLElBQUksRUFBRSxFQUFFO2lCQUNYLENBQUE7WUFDTCxDQUFDLENBQUE7WUFDRCxlQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDMUMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0NBQUE7QUFFRCxTQUFlLGdCQUFnQixDQUFDLElBQVU7O1FBQ3RDLFNBQVMsR0FBRyxDQUFDLEtBQVU7WUFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLDREQUE0RDtnQkFDNUQsbUVBQW1FO2dCQUNuRSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7b0JBQ3BDLFFBQVEsRUFBRSxJQUFJO29CQUNkLFVBQVUsRUFBRSxJQUFJO29CQUNoQixZQUFZLEVBQUUsS0FBSztvQkFDbkIsS0FBSyxFQUFFLEVBQUU7aUJBQ1osQ0FBQyxDQUFBO2FBQ0w7WUFFRCxtRUFBbUU7WUFDbkUsSUFBSSxXQUFXLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDOUIsT0FBTSxDQUFDLHFCQUFxQjthQUMvQjtZQUVELDBFQUEwRTtZQUMxRSxJQUNJLENBQUMsTUFBTSxDQUFDLFdBQVc7Z0JBQ25CLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNO2dCQUMxQixDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFDaEM7Z0JBQ0UsT0FBTTthQUNUO1lBRUQsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBQTtZQUU5QixtRkFBbUY7WUFDbkYsMENBQTBDO1lBQzFDLE1BQU0sZUFBZSxHQUFHO2dCQUNwQixlQUFlLEVBQUUsSUFBSTtnQkFDckIsSUFBSSxFQUFFLE9BQU87YUFDaEIsQ0FBQTtZQUVELDJEQUEyRDtZQUMzRCxNQUFNLFlBQVksR0FBRztnQkFDakIsSUFBSSxjQUFjO29CQUNkLE1BQU0sT0FBTyxHQUNULFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdDLGVBQWUsQ0FBQTtvQkFDbkIsT0FBTyxPQUFPLENBQUMsZUFBZSxDQUFBO2dCQUNsQyxDQUFDO2dCQUNELElBQUkscUJBQXFCO29CQUNyQiwwRUFBMEU7b0JBQzFFLHdEQUF3RDtvQkFDeEQsTUFBTSxPQUFPLEdBQ1QsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0MsZUFBZSxDQUFBO29CQUNuQixPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDO3dCQUNqRCxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWU7d0JBQ3pCLENBQUMsQ0FBQyxTQUFTLENBQUE7Z0JBQ25CLENBQUM7Z0JBQ0QsSUFBSSxjQUFjO29CQUNkLE1BQU0sT0FBTyxHQUNULFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdDLGVBQWUsQ0FBQTtvQkFDbkIsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFBO2dCQUN2QixDQUFDO2dCQUNELElBQUksNkJBQTZCO29CQUM3QixrRUFBa0U7b0JBQ2xFLHNFQUFzRTtvQkFDdEUsOEJBQThCO29CQUM5QixPQUFPLEtBQUssQ0FBQTtnQkFDaEIsQ0FBQztnQkFDRCxJQUFJLGlCQUFpQjtvQkFDakIseUVBQXlFO29CQUN6RSw0Q0FBNEM7b0JBQzVDLE1BQU0sT0FBTyxHQUNULFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdDLGVBQWUsQ0FBQTtvQkFDbkIsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO2dCQUN6RCxDQUFDO2dCQUNELElBQUksZ0JBQWdCO29CQUNoQiwyRUFBMkU7b0JBQzNFLDREQUE0RDtvQkFDNUQsTUFBTSxPQUFPLEdBQ1QsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0MsZUFBZSxDQUFBO29CQUNuQixPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUE7Z0JBQ3pELENBQUM7YUFDSixDQUFBO1lBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUE7WUFFckMsc0ZBQXNGO1lBQ3RGLFNBQVMsT0FBTyxDQUFDLEdBQVEsRUFBRSxLQUFVO2dCQUNqQyxJQUFJLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO2dCQUNoRSxPQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdEMsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHO2dCQUNmLElBQUksdUJBQXVCO29CQUN2Qiw0REFBNEQ7b0JBQzVELE9BQU8sQ0FBQyxDQUFBO2dCQUNaLENBQUM7Z0JBQ0QsSUFBSSxXQUFXO29CQUNYLE9BQU8sTUFBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7Z0JBQ3hDLENBQUM7Z0JBQ0QsSUFBSSxhQUFhO29CQUNiLE9BQU8sTUFBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7Z0JBQ3hDLENBQUM7Z0JBQ0QsSUFBSSxjQUFjO29CQUNkLE9BQU8sTUFBTSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7Z0JBQ3RDLENBQUM7Z0JBQ0QsSUFBSSxzQkFBc0I7b0JBQ3RCLE9BQU8sTUFBTSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQTtnQkFDakQsQ0FBQztnQkFDRCxJQUFJLGNBQWM7b0JBQ2QsT0FBTyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtnQkFDckMsQ0FBQztnQkFDRCxJQUFJLGNBQWM7b0JBQ2QsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO3dCQUN4RCxTQUFTLEVBQUUsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJO3FCQUN4QyxDQUFBO29CQUNELE9BQU8sT0FBTyxDQUNWLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxFQUNuRCxDQUFDLENBQ0osQ0FBQTtnQkFDTCxDQUFDO2FBQ0osQ0FBQTtZQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHO2dCQUN0Qix1Q0FDTyxZQUFZLEdBQ1osVUFBVSxFQUNoQjtZQUNMLENBQUMsQ0FBQTtZQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDO1FBQ0QsTUFBTSwrQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLGVBQUssQ0FBQyxDQUFBO0lBQ3pELENBQUM7Q0FBQTtBQUVELFNBQWUsY0FBYyxDQUFDLElBQVU7O1FBQ3BDLFNBQVMsR0FBRyxDQUNSLEtBQVUsRUFDVixFQUFFLElBQUksRUFBRSxXQUFXLEVBQW1DO1lBRXRELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNoQiw0REFBNEQ7Z0JBQzVELG1FQUFtRTtnQkFDbkUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO29CQUNwQyxRQUFRLEVBQUUsSUFBSTtvQkFDZCxVQUFVLEVBQUUsSUFBSTtvQkFDaEIsWUFBWSxFQUFFLEtBQUs7b0JBQ25CLEtBQUssRUFBRSxFQUFFO2lCQUNaLENBQUMsQ0FBQTthQUNMO1lBRUQsbUVBQW1FO1lBQ25FLE1BQU0sYUFBYSxHQUFHLFNBQVMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFBO1lBQ2hELHFEQUFxRDtZQUNyRCxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNqRSxJQUFJLGFBQWEsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO2dCQUM5RCxPQUFNLENBQUMscUJBQXFCO2FBQy9CO1lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLG1DQUdkLFdBQVc7Z0JBQ2QsMkVBQTJFO2dCQUMzRSxJQUFJLEVBQUU7b0JBQ0YsT0FBTyxTQUFTLENBQUE7Z0JBQ3BCLENBQUM7Z0JBQ0QsNkNBQTZDO2dCQUM3QyxPQUFPLEVBQUUsSUFBSSxFQUNiLFdBQVcsRUFBRSxJQUFJLEdBQ3BCLENBQUE7WUFFRCxNQUFNLHVCQUF1QixHQUFHLENBQzVCLFFBQWEsRUFDYixNQUFXLEVBQ1gsV0FBZ0IsRUFDbEIsRUFBRSxDQUFDLENBQUM7Z0JBQ0YsbUJBQW1CLEVBQUUsSUFBSSxTQUFTLENBQzlCLFFBQVEsR0FBRyx3QkFBd0IsQ0FDdEM7Z0JBQ0Qsc0JBQXNCLEVBQUUsSUFBSSxTQUFTLENBQ2pDLFFBQVE7b0JBQ0osR0FBRyxNQUFNLHNGQUFzRixDQUN0RztnQkFDRCxrQkFBa0IsRUFBRSxJQUFJLFNBQVMsQ0FDN0IsUUFBUSxHQUFHLDBCQUEwQixXQUFXLEdBQUcsQ0FDdEQ7YUFDSixDQUFDLENBQUE7WUFFRixpRkFBaUY7WUFDakYsOElBQThJO1lBQzlJLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUFRLEVBQUUsRUFBRSxDQUNwQyxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBRTVELHdDQUF3QztZQUN4QyxNQUFNLGtCQUFrQixHQUFHO2dCQUN2QixLQUFLLEVBQUUsVUFBVSxPQUFZLEVBQUUsSUFBUyxFQUFFLElBQVM7b0JBQy9DLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtvQkFFM0QsdUJBQXVCO29CQUN2QixNQUFNLGFBQWEsR0FBRyxxSkFBcUosQ0FBQTtvQkFDM0ssTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQ2xDLGFBQWEsRUFDYiw4QkFBOEIsRUFDOUIsV0FBVyxDQUNkLENBQUE7b0JBRUQsdUNBQXVDO29CQUN2QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQTtvQkFDckMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtvQkFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFBO29CQUMvRCxNQUFNLHlCQUF5QixHQUMzQixnQkFBZ0IsSUFBSSxPQUFPLGdCQUFnQixLQUFLLFVBQVUsQ0FBQTtvQkFDOUQsSUFDSSxXQUFXO3dCQUNYLGdCQUFnQjt3QkFDaEIsZ0JBQWdCO3dCQUNoQix5QkFBeUIsRUFDM0I7d0JBQ0UsTUFBTSxNQUFNLENBQUMsbUJBQW1CLENBQUE7cUJBQ25DO29CQUVELDZFQUE2RTtvQkFDN0UsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDakIsTUFBTSxNQUFNLENBQUMsc0JBQXNCLENBQUE7cUJBQ3RDO29CQUVELHNEQUFzRDtvQkFDdEQsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7d0JBQ2pDLE1BQU0sTUFBTSxDQUFDLG1CQUFtQixDQUFBO3FCQUNuQztvQkFFRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLEVBQUU7d0JBQ2xDLE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFBO3FCQUNsQztvQkFFRCxPQUFPLFNBQVMsQ0FBQSxDQUFDLGtCQUFrQjtnQkFDdkMsQ0FBQzthQUNKLENBQUE7WUFDRCxLQUFLLENBQUMsYUFBYSxDQUNmLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUNyQixhQUFhLEVBQ2IsU0FBUyxXQUFXLEtBQUksQ0FBQyxFQUN6QixrQkFBa0IsQ0FDckIsQ0FBQTtZQUVEOzs7O2VBSUc7WUFDSCxNQUFNLGNBQWMsR0FBRztnQkFDbkIsS0FBSyxFQUFFLFVBQVUsT0FBWSxFQUFFLElBQVMsRUFBRSxJQUFTO29CQUMvQyxNQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUE7b0JBRTdDLHVCQUF1QjtvQkFDdkIsTUFBTSxhQUFhLEdBQUcsb0dBQW9HLENBQUE7b0JBQzFILE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUNsQyxhQUFhLEVBQ2IsMEJBQTBCLEVBQzFCLFdBQVcsQ0FDZCxDQUFBO29CQUVELDJDQUEyQztvQkFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUE7b0JBQ3JDLE1BQU0sbUJBQW1CLEdBQ3JCLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLFdBQVcsS0FBSyxFQUFFLENBQUE7b0JBQzNDLElBQUksV0FBVyxJQUFJLG1CQUFtQixFQUFFO3dCQUNwQyxNQUFNLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQTtxQkFDdEM7b0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtvQkFDeEMsTUFBTSx3QkFBd0IsR0FDMUIsV0FBVyxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsQ0FBQTtvQkFFbEQsSUFBSSxnQkFBZ0IsSUFBSSx3QkFBd0IsRUFBRTt3QkFDOUMsTUFBTSxNQUFNLENBQUMsbUJBQW1CLENBQUE7cUJBQ25DO29CQUVELE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFBO29CQUMzRCxJQUFJLG1CQUFtQixJQUFJLFdBQVcsS0FBSyxFQUFFLEVBQUU7d0JBQzNDLE1BQU0sTUFBTSxDQUFDLHNCQUFzQixDQUFBO3FCQUN0QztvQkFDRCxJQUFJLG1CQUFtQixJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLEVBQUU7d0JBQ3pELE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFBO3FCQUNsQztvQkFFRCwwSUFBMEk7b0JBQzFJLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxFQUFPLEVBQUUsRUFBRTt3QkFDcEMsdURBQXVEO3dCQUN2RCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUNqQixNQUFNLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQTt5QkFDbkM7d0JBQ0QseUNBQXlDO3dCQUN6QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs0QkFDOUIsTUFBTSxNQUFNLENBQUMsc0JBQXNCLENBQUE7eUJBQ3RDO3dCQUNELGdEQUFnRDt3QkFDaEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFOzRCQUNsQyxNQUFNLFVBQVUsR0FBRztnQ0FDZixNQUFNO2dDQUNOLHFCQUFxQjs2QkFDeEIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQ2IsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQ0FDYixNQUFNLElBQUksU0FBUyxDQUNmLGFBQWEsR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLENBQ2pELENBQUE7NkJBQ0o7NEJBQ0QsTUFBTSxhQUFhLEdBQUcsQ0FDbEIsUUFBYSxFQUNiLFFBQWEsRUFDYixLQUFVLEVBQ1osRUFBRSxDQUNBLFNBQVMsQ0FDTCxhQUFhO2dDQUNULHNCQUFzQixRQUFRLDZCQUE2QixRQUFRLFdBQVcsS0FBSyxHQUFHLENBQzdGLENBQUE7NEJBQ0wsSUFBSSxDQUFDLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQ0FDdkMsTUFBTSxhQUFhLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFBOzZCQUM3Qzs0QkFDRCxJQUNJLENBQUMsS0FBSyxxQkFBcUI7Z0NBQzNCLE9BQU8sQ0FBQyxLQUFLLFNBQVMsRUFDeEI7Z0NBQ0UsTUFBTSxhQUFhLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFBOzZCQUM5Qzt3QkFDTCxDQUFDLENBQUMsQ0FBQTtvQkFDTixDQUFDLENBQUE7b0JBQ0QsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7d0JBQ2pDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFBO3dCQUNoQyxNQUFNLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQTtxQkFDdEM7b0JBRUQsOEdBQThHO29CQUM5RyxPQUFPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUE7Z0JBQzNELENBQUM7YUFDSixDQUFBO1lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FDZixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFDckIsU0FBUyxFQUNULFNBQVMsT0FBTyxLQUFJLENBQUMsRUFDckIsY0FBYyxDQUNqQixDQUFBO1lBRUQsU0FBUyxtQkFBbUI7Z0JBQ3hCLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ3ZCLFdBQVcsRUFBRSxTQUFTLFdBQVcsS0FBSSxDQUFDO29CQUN0QyxRQUFRLEVBQUUsU0FBUyxRQUFRLEtBQUksQ0FBQztvQkFDaEMsV0FBVyxFQUFFLFNBQVMsV0FBVyxLQUFJLENBQUM7b0JBQ3RDLFlBQVksRUFBRSxTQUFTLFlBQVk7d0JBQy9CLE9BQU8sS0FBSyxDQUFBO29CQUNoQixDQUFDO29CQUNELGNBQWMsRUFBRSxTQUFTLGNBQWMsS0FBSSxDQUFDO2lCQUMvQyxDQUFDLENBQUE7Z0JBRUYsTUFBTSxRQUFRLEdBQUc7b0JBQ2IsSUFBSSxFQUFFLEVBQUU7b0JBQ1IsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLFVBQVUsRUFBRSxTQUFTLFVBQVUsS0FBSSxDQUFDO29CQUNwQyxZQUFZLEVBQUUsV0FBVyxFQUFFO29CQUMzQixTQUFTLEVBQUUsV0FBVyxFQUFFO29CQUN4QixXQUFXLEVBQUUsU0FBUyxXQUFXO3dCQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTs0QkFDbkIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFBO3lCQUMzRDt3QkFDRCxNQUFNLElBQUksS0FBSyxDQUNYLDhDQUE4QyxDQUNqRCxDQUFBO29CQUNMLENBQUM7aUJBQ0osQ0FBQTtnQkFDRCxPQUFPLFFBQVEsQ0FBQTtZQUNuQixDQUFDO1FBQ0wsQ0FBQztRQUNELE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUMzQyxJQUFJLEVBQUUsRUFBRTtZQUNSLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01Bd0MxQixDQUFDO1NBQ0YsQ0FBQyxDQUFBO0lBQ04sQ0FBQztDQUFBO0FBRUQsU0FBZSxvQkFBb0IsQ0FBQyxJQUFVOztRQUMxQyxTQUFTLEdBQUcsQ0FBQyxNQUFXO1lBQ3BCLElBQUk7Z0JBQ0EsNERBQTREO2dCQUM1RCxNQUFNLHFCQUFxQixHQUFHLENBQUMsTUFBVyxFQUFFLEVBQUU7b0JBQzFDLE1BQU0sa0JBQWtCLEdBQUc7d0JBQ3ZCLEdBQUcsQ0FBQyxNQUFXLEVBQUUsR0FBUTs0QkFDckIsK0JBQStCOzRCQUMvQixtRUFBbUU7NEJBQ25FLGlGQUFpRjs0QkFDakYsNkRBQTZEOzRCQUM3RCw0REFBNEQ7NEJBQzVELElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRTtnQ0FDaEIsT0FBTyxJQUFJLENBQUE7NkJBQ2Q7NEJBQ0QsK0RBQStEOzRCQUMvRCxJQUFJLEdBQUcsS0FBSyxjQUFjLEVBQUU7Z0NBQ3hCLE9BQU8sTUFBTSxDQUFBOzZCQUNoQjs0QkFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFBO3dCQUNuQyxDQUFDO3FCQUNKLENBQUE7b0JBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUU7d0JBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO3dCQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUU7NEJBQzNDLEdBQUc7Z0NBQ0MsT0FBTyxLQUFLLENBQUE7NEJBQ2hCLENBQUM7NEJBQ0QsR0FBRyxDQUFDLFFBQVE7Z0NBQ1IsT0FBTyxRQUFRLENBQUEsQ0FBQyw2QkFBNkI7NEJBQ2pELENBQUM7NEJBQ0QsVUFBVSxFQUFFLElBQUk7NEJBQ2hCLFlBQVksRUFBRSxLQUFLO3lCQUN0QixDQUFDLENBQUE7cUJBQ0w7Z0JBQ0wsQ0FBQyxDQUFBO2dCQUVELDBGQUEwRjtnQkFDMUYsTUFBTSxvQkFBb0IsR0FBRyxDQUN6QixNQUFXLEVBQ1gsT0FBWSxFQUNaLElBQVMsRUFDWCxFQUFFO29CQUNBLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO29CQUUxQyx1Q0FBdUM7b0JBQ3ZDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQTtvQkFDdEIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTtvQkFFOUIsbUNBQW1DO29CQUNuQywwRUFBMEU7b0JBQzFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTt3QkFDcEMsWUFBWSxFQUFFLElBQUk7d0JBQ2xCLEdBQUcsRUFBRTs0QkFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUE7d0JBQ3pCLENBQUM7d0JBQ0QsR0FBRyxFQUFFLFVBQVUsUUFBUTs0QkFDbkIscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUE7NEJBQzNCLCtDQUErQzs0QkFDL0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO2dDQUNwQyxZQUFZLEVBQUUsS0FBSztnQ0FDbkIsUUFBUSxFQUFFLEtBQUs7Z0NBQ2YsS0FBSyxFQUFFLE9BQU87NkJBQ2pCLENBQUMsQ0FBQTs0QkFDRixPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQTt3QkFDN0IsQ0FBQztxQkFDSixDQUFDLENBQUE7b0JBQ0YsT0FBTyxNQUFNLENBQUE7Z0JBQ2pCLENBQUMsQ0FBQTtnQkFFRCxrREFBa0Q7Z0JBQ2xELE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxFQUFFO29CQUNsQyxxQkFBcUI7b0JBQ3JCLE1BQU0sYUFBYSxHQUFHO3dCQUNsQix5QkFBeUI7d0JBQ3pCLEdBQUcsQ0FBQyxNQUFXLEVBQUUsR0FBUTs0QkFDckIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTt3QkFDbkMsQ0FBQzt3QkFDRCxLQUFLLEVBQUUsVUFBVSxNQUFXLEVBQUUsT0FBWSxFQUFFLElBQVM7NEJBQ2pELE1BQU0sUUFBUSxHQUNWLElBQUk7Z0NBQ0osSUFBSSxDQUFDLE1BQU07Z0NBQ1gsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxRQUFRLENBQUE7NEJBQzNDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0NBQ1gsc0JBQXNCO2dDQUN0QixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBOzZCQUNyQztpQ0FBTTtnQ0FDSCxPQUFPLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7NkJBQ3JEO3dCQUNMLENBQUM7cUJBQ0osQ0FBQTtvQkFDRCwrQ0FBK0M7b0JBQy9DLFFBQVEsQ0FBQyxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQzlCLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLGFBQWEsQ0FDaEIsQ0FBQTtnQkFDTCxDQUFDLENBQUE7Z0JBRUQsV0FBVztnQkFDWCx3QkFBd0IsRUFBRSxDQUFBO2FBQzdCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1Ysb0JBQW9CO2FBQ3ZCO1FBQ0wsQ0FBQztRQUNELE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFLLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0NBQUE7QUFFRCxTQUFlLFlBQVksQ0FBQyxJQUFVOztRQUNsQyxTQUFTLEdBQUcsQ0FBQyxLQUFVO1lBQ25COzs7Ozs7Ozs7ZUFTRztZQUNILE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBUSxFQUFFLEVBQUU7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDOUMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFBO2dCQUNmLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQzNDLE1BQU0sR0FBRyxRQUFRO3lCQUNaLElBQUksRUFBRTt5QkFDTixPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQzt5QkFDdkIsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7eUJBQ2hCLElBQUksRUFBRTt5QkFDTixLQUFLLENBQUMsR0FBRyxDQUFDO3lCQUNWLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDdkIsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtpQkFDakM7Z0JBQ0QsT0FBTztvQkFDSCxJQUFJO29CQUNKLFFBQVE7b0JBQ1IsTUFBTTtpQkFDVCxDQUFBO1lBQ0wsQ0FBQyxDQUFBO1lBRUQsTUFBTSxXQUFXLEdBQUc7Z0JBQ2hCLDZCQUE2QjtnQkFDN0IsS0FBSyxFQUFFLFVBQVUsTUFBVyxFQUFFLEdBQVEsRUFBRSxJQUFTO29CQUM3QyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDdkIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtxQkFDakM7b0JBQ0QsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzVDLGlEQUFpRDtvQkFDakQsSUFBSSxJQUFJLEtBQUssV0FBVyxFQUFFO3dCQUN0QixJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUU7NEJBQ2hDLE9BQU8sVUFBVSxDQUFBO3lCQUNwQjtxQkFDSjtvQkFDRCw2REFBNkQ7b0JBQzdELElBQUksSUFBSSxLQUFLLGFBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7d0JBQzFDLE9BQU8sT0FBTyxDQUFBO3FCQUNqQjtvQkFFRCw2REFBNkQ7b0JBQzdELElBQUksSUFBSSxLQUFLLFdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7d0JBQ3hDLE9BQU8sVUFBVSxDQUFBO3FCQUNwQjtvQkFDRCwyQkFBMkI7b0JBQzNCLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ2xDLENBQUM7YUFDSixDQUFBO1lBRUQsNkJBQTZCO1lBQzdCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FDbEIsZ0JBQWdCLENBQUMsU0FBUyxFQUMxQixhQUFhLEVBQ2IsV0FBVyxDQUNkLENBQUE7UUFDTCxDQUFDO1FBQ0QsTUFBTSwrQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLGVBQUssQ0FBQyxDQUFBO0lBQ3pELENBQUM7Q0FBQTtBQUVELFNBQWUsa0JBQWtCLENBQUMsSUFBVTs7UUFDeEMsU0FBUyxHQUFHLENBQUMsTUFBVztZQUNwQixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUUsV0FBVyxFQUFFO2dCQUNqRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDO2FBQzdCLENBQUMsQ0FBQTtRQUNOLENBQUM7UUFDRCxNQUFNLCtCQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBSyxDQUFDLENBQUE7SUFDekQsQ0FBQztDQUFBO0FBRUQsU0FBZSxxQkFBcUIsQ0FBQyxJQUFVOztRQUMzQyxTQUFTLEdBQUcsQ0FBQyxLQUFVO1lBQ25CLE1BQU0sT0FBTyxHQUFHO2dCQUNaLEtBQUssRUFBRSxVQUFVLE9BQVksRUFBRSxJQUFTLEVBQUUsSUFBUztvQkFDL0MsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBRTdCLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxlQUFlLEVBQUU7d0JBQ3ZELE1BQU0sTUFBTSxHQUFHLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQTt3QkFDakQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUE7d0JBQ3pELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtxQkFDakM7b0JBRUQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQTtnQkFDbEQsQ0FBQzthQUNKLENBQUE7WUFFRCxLQUFLLENBQUMsZ0JBQWdCLENBQ2xCLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSwrQkFBK0I7WUFDdkUsT0FBTyxFQUNQLE9BQU8sQ0FDVixDQUFBO1FBQ0wsQ0FBQztRQUNELE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFLLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0NBQUE7QUFFRCxTQUFlLGVBQWUsQ0FBQyxJQUFVOztRQUNyQyxTQUFTLEdBQUcsQ0FBQyxLQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUEyQjtZQUMzRCxHQUFHLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUUvQixtQ0FBbUM7WUFDbkMsTUFBTSxVQUFVLEdBQUcsU0FBUyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtZQUNyRSxJQUFJLFVBQVUsRUFBRTtnQkFDWixPQUFNLENBQUMscUJBQXFCO2FBQy9CO1lBRUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDdkUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFakUsb0VBQW9FO1lBQ3BFLCtFQUErRTtZQUMvRSxLQUFLLE1BQU0sVUFBVSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ25DLFVBQVUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBUyxFQUFFLEtBQVUsRUFBRSxFQUFFO29CQUNyRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQkFFakQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRTt3QkFDbEQsS0FBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUM7d0JBQ3RCLFFBQVEsRUFBRSxLQUFLO3dCQUNmLFVBQVUsRUFBRSxLQUFLO3dCQUNqQixZQUFZLEVBQUUsSUFBSTtxQkFDckIsQ0FBQyxDQUFBO29CQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsRUFBRTt3QkFDcEQsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUM5QyxRQUFRLEVBQUUsS0FBSzt3QkFDZixVQUFVLEVBQUUsS0FBSzt3QkFDakIsWUFBWSxFQUFFLElBQUk7cUJBQ3JCLENBQUMsQ0FBQTtnQkFDTixDQUFDLENBQUMsQ0FBQTthQUNMO1lBRUQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFTLEVBQUUsS0FBVSxFQUFFLEVBQUUsQ0FDN0MsS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDMUQsR0FBRztvQkFDQyxPQUFPLEtBQUssQ0FBQTtnQkFDaEIsQ0FBQzthQUNKLENBQUMsQ0FBQTtZQUVOLGNBQWMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUE7WUFDdEMsY0FBYyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN0QyxDQUFDO1FBRUQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLEtBQVUsRUFBRSxHQUFRLEVBQUUsRUFBRSxDQUM5QyxVQUNJLFNBQVMsR0FBRyxFQUFFLEVBQ2QsS0FBSyxHQUFHLGFBQWEsQ0FBQyxTQUFTLEVBQy9CLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxFQUM5QixZQUFZLEdBQUcsTUFBTTtZQUVyQix1RUFBdUU7WUFDdkUsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFRLEVBQUUsSUFBUyxFQUFFLEtBQVUsRUFBRSxFQUFFLENBQ25ELE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtnQkFDN0IsS0FBSztnQkFDTCxRQUFRLEVBQUUsS0FBSztnQkFDZixVQUFVLEVBQUUsS0FBSztnQkFDakIsWUFBWSxFQUFFLElBQUk7YUFDckIsQ0FBQyxDQUFBO1lBRU4sOENBQThDO1lBQzlDLE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBUyxFQUFFLEVBQUU7Z0JBQzNCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQTtnQkFDZixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2xDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDdkIsU0FBUTtxQkFDWDtvQkFDRCxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtpQkFDckM7Z0JBQ0QsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ2hDLENBQUMsQ0FBQTtZQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBUyxFQUFFLElBQVMsRUFBRSxFQUFFO2dCQUN2QyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBRXZELDZFQUE2RTtnQkFDN0UsMkZBQTJGO2dCQUMzRixJQUFLLFNBQWlCLEtBQU0sTUFBTSxDQUFDLFNBQWlCLEVBQUU7b0JBQ2xELFVBQVUsbUNBQ0gsVUFBVSxLQUNiLE1BQU0sRUFBRTs0QkFDSixLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNOzRCQUM5QixRQUFRLEVBQUUsS0FBSzs0QkFDZixVQUFVLEVBQUUsS0FBSzs0QkFDakIsWUFBWSxFQUFFLElBQUk7eUJBQ3JCLEdBQ0osQ0FBQTtpQkFDSjtnQkFFRCw0REFBNEQ7Z0JBQzVELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFBO2dCQUVoRCw0REFBNEQ7Z0JBQzVELE1BQU0sU0FBUyxHQUFHO29CQUNkLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ3BCLFFBQVE7b0JBQ1IsZUFBZTtpQkFDbEIsQ0FBQTtnQkFDRCxPQUFPLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRTtvQkFDbEIsT0FBTyxDQUFDLE1BQU07d0JBQ1YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FDakMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFRLENBQUMsQ0FDdkMsQ0FBQTtvQkFDTCxDQUFDO29CQUNELHdCQUF3QixDQUFDLE1BQU0sRUFBRSxJQUFJO3dCQUNqQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBVyxDQUFDLEVBQUU7NEJBQ2pDLE9BQU8sU0FBUyxDQUFBO3lCQUNuQjt3QkFDRCxPQUFPLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7b0JBQ3pELENBQUM7aUJBQ0osQ0FBQyxDQUFBO1lBQ04sQ0FBQyxDQUFBO1lBRUQsTUFBTSxVQUFVLEdBQWUsRUFBRSxDQUFBO1lBRWpDLHdFQUF3RTtZQUN4RSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZCLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7WUFDbkMsQ0FBQyxDQUFDLENBQUE7WUFFRix3RkFBd0Y7WUFDeEYsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUN6QixVQUFVLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN0RCxDQUFDLENBQUMsQ0FBQTtZQUVGLHlHQUF5RztZQUN6RyxJQUFJLEVBQUUsbUNBQ0MsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFVBQVUsQ0FBQztnQkFFL0MsZ0VBQWdFO2dCQUNoRSxxRUFBcUU7Z0JBQ3JFLHdHQUF3RztnQkFDeEcsMkdBQTJHO2dCQUMzRyxNQUFNLEVBQUU7b0JBQ0osS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNO29CQUN4QixRQUFRLEVBQUUsS0FBSztvQkFDZixVQUFVLEVBQUUsS0FBSztvQkFDakIsWUFBWSxFQUFFLElBQUk7aUJBQ3JCLEdBQ0osQ0FBQTtZQUNELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBRTlDLDZDQUE2QztZQUM3QyxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQ2xELEtBQUssRUFDTCxZQUFZLEVBQ1osVUFBVSxDQUNiLENBQUE7WUFFRCx1REFBdUQ7WUFDdkQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUU7Z0JBQ2hELEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxHQUFHLEVBQUU7b0JBQ2pCLHNGQUFzRjtvQkFDdEYsSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFO3dCQUNoQixPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUE7cUJBQzVCO29CQUNELElBQUksR0FBRyxLQUFLLFdBQVcsRUFBRTt3QkFDckIsT0FBTyxhQUFhLENBQUMsU0FBUyxDQUFBO3FCQUNqQztvQkFDRCxJQUNLLEtBQWEsS0FBTSxXQUFXLENBQUMsU0FBaUI7d0JBQ2pELEdBQUcsS0FBSyxTQUFTLEVBQ25CO3dCQUNFLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQTtxQkFDL0I7b0JBQ0QsNkNBQTZDO29CQUM3QyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFBO2dCQUNoRCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxPQUFPO29CQUNYLCtHQUErRztvQkFDL0csbUhBQW1IO29CQUNuSCwySEFBMkg7b0JBQzNILCtIQUErSDtvQkFDL0gsMklBQTJJO29CQUMzSSxNQUFNLElBQUksR0FBZSxFQUFFLENBQUE7b0JBQzNCLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFBO29CQUMxRCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDOUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO29CQUNwRCxPQUFPLElBQUksQ0FBQTtnQkFDZixDQUFDO2dCQUNELHdCQUF3QixDQUFDLE1BQU0sRUFBRSxJQUFJO29CQUNqQyxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7d0JBQ25CLE9BQU8sU0FBUyxDQUFBO3FCQUNuQjtvQkFDRCxPQUFPLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ3pELENBQUM7YUFDSixDQUFDLENBQUE7WUFFRixPQUFPLGtCQUFrQixDQUFBO1FBQzdCLENBQUMsQ0FBQTtRQUVMLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLENBQ3hDLEtBQVUsRUFDVixZQUFpQixFQUNqQixTQUFjLEVBQ2hCLEVBQUUsQ0FBQyxDQUFDO1lBQ0YsNERBQTREO1lBQzVELElBQUksRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hDLEtBQUssQ0FBQyxPQUFZLEVBQUUsSUFBUyxFQUFFLElBQVM7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNkLE1BQU0sSUFBSSxTQUFTLENBQ2YsZ0NBQ0ksS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQzVCLDZDQUE2QyxDQUNoRCxDQUFBO3FCQUNKO29CQUNELDBCQUEwQjtvQkFDMUIsb0dBQW9HO29CQUNwRyxzR0FBc0c7b0JBQ3RHLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMsZ0VBQWdFO29CQUMvSCwwQ0FBMEM7b0JBQzFDLE9BQU8sQ0FDSCxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZELElBQUksQ0FDUCxDQUFBO2dCQUNMLENBQUM7YUFDSixDQUFDO1lBQ0YsMkRBQTJEO1lBQzNELFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7Z0JBQzFDLEtBQUssQ0FBQyxPQUFZLEVBQUUsSUFBUyxFQUFFLElBQVM7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNkLE1BQU0sSUFBSSxTQUFTLENBQ2YscUNBQ0ksS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQzVCLDZDQUE2QyxDQUNoRCxDQUFBO3FCQUNKO29CQUNELE9BQU8sQ0FDSCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN6RCxJQUFJLENBQ1AsQ0FBQSxDQUFDLG1CQUFtQjtnQkFDekIsQ0FBQzthQUNKLENBQUM7WUFDRiw0Q0FBNEM7WUFDNUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNsQixDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO29CQUM3QixLQUFLLENBQUMsT0FBWSxFQUFFLElBQVMsRUFBRSxLQUFVO3dCQUNyQyxPQUFPLFNBQVMsQ0FBQTtvQkFDcEIsQ0FBQztpQkFDSixDQUFDO2dCQUNKLENBQUMsQ0FBQyxTQUFTO1NBQ2xCLENBQUMsQ0FBQTtRQUVGLE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFLLEVBQUU7WUFDbEQsdUVBQXVFO1lBQ3ZFLEdBQUcsRUFBRSxlQUFLLENBQUMsWUFBWSxDQUFDO2dCQUNwQixxQkFBcUIsRUFBRSxDQUFDLEtBQVUsRUFBRSxHQUFRLEVBQUUsRUFBRSxDQUFDLENBQzdDLGFBQWtCLEVBQ3BCLEVBQUU7b0JBQ0EsT0FBTyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUNyQyxhQUFhLEVBQ2IsYUFBYSxDQUFDLFNBQVMsRUFDdkIsUUFBUSxDQUFDLFNBQVMsRUFDbEIsTUFBTSxDQUNULENBQUE7Z0JBQ0wsQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSxDQUFDLEtBQVUsRUFBRSxHQUFRLEVBQUUsRUFBRSxDQUFDLENBQzNDLFdBQWdCLEVBQ2xCLEVBQUU7b0JBQ0EsT0FBTyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUNyQyxXQUFXLEVBQ1gsV0FBVyxDQUFDLFNBQVMsRUFDckIsTUFBTSxDQUFDLFNBQVMsRUFDaEIsTUFBTSxDQUNULENBQUE7Z0JBQ0wsQ0FBQztnQkFDRCxrQkFBa0I7Z0JBQ2xCLHFCQUFxQjthQUN4QixDQUFDO1lBQ0YsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BK0NuQixDQUFDO1NBQ0YsQ0FBQyxDQUFBO0lBQ04sQ0FBQztDQUFBO0FBRUQsU0FBZSxnQkFBZ0IsQ0FBQyxJQUFVOztRQUN0QyxTQUFTLEdBQUcsQ0FBQyxNQUFXO1lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUU7Z0JBQzlELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhO2FBQzNCLENBQUMsQ0FBQTtRQUNOLENBQUM7UUFDRCxNQUFNLCtCQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBSyxDQUFDLENBQUE7SUFDekQsQ0FBQztDQUFBO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxJQUFVOztRQUN6QyxTQUFTLEdBQUcsQ0FBQyxNQUFXO1lBQ3BCLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUE7UUFDckQsQ0FBQztRQUNELE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFLLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0NBQUE7QUFFRCxTQUFlLFVBQVUsQ0FBQyxJQUFVOztRQUNoQyxTQUFTLEdBQUcsQ0FBQyxNQUFXLElBQUcsQ0FBQztRQUM1QixNQUFNLCtCQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBSyxDQUFDLENBQUE7SUFDekQsQ0FBQztDQUFBO0FBRUQsU0FBZSxZQUFZLENBQUMsSUFBVTs7UUFDbEMsU0FBUyxHQUFHLENBQUMsS0FBVTtZQUNuQixNQUFNLHdCQUF3QixHQUFHO2dCQUM3QixLQUFLLEVBQUUsVUFBVSxNQUFXLEVBQUUsR0FBUSxFQUFFLElBQVM7b0JBQzdDLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUM3Qix3QkFBd0I7b0JBQ3hCLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTt3QkFDakIsT0FBTyxZQUFZLENBQUEsQ0FBQyxtQ0FBbUM7cUJBQzFEO29CQUNELDBCQUEwQjtvQkFDMUIsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFO3dCQUNqQixPQUFPLDBCQUEwQixDQUFBLENBQUMsMENBQTBDO3FCQUMvRTtvQkFDRCxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO2dCQUN2RCxDQUFDO2FBQ0osQ0FBQTtZQUVELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBUSxFQUFFLFFBQWEsRUFBRSxFQUFFO2dCQUN6QyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO1lBQ25FLENBQUMsQ0FBQTtZQUNELDBHQUEwRztZQUMxRyxRQUFRLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFBO1lBQ3pELFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUE7UUFDOUQsQ0FBQztRQUNELE1BQU0sK0JBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFLLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0NBQUE7QUFFRCxTQUFlLHNCQUFzQixDQUFDLElBQVU7O1FBQzVDLFNBQVMsR0FBRyxDQUFDLE1BQVc7WUFDcEIsSUFBSTtnQkFDQSxJQUFJLE1BQU0sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRTtvQkFDekMsT0FBTSxDQUFDLHFCQUFxQjtpQkFDL0I7Z0JBQ0QsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFBLENBQUMsK0JBQStCO2dCQUN0RCxNQUFNLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUE7Z0JBQ3JDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUE7YUFDeEQ7WUFBQyxPQUFPLEdBQUcsRUFBRSxHQUFFO1FBQ3BCLENBQUM7UUFDRCxNQUFNLCtCQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBSyxDQUFDLENBQUE7SUFDekQsQ0FBQztDQUFBIn0=