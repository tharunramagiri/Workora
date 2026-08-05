#!/usr/bin/env node
import { createRequire as __ctr } from 'node:module'; const require = __ctr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
            const error = this.createError(
              RangeError,
              "Too many message fragments",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            );
            cb(error);
            return;
          }
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
              const error = this.createError(
                RangeError,
                "Too many message fragments",
                false,
                1008,
                "WS_ERR_TOO_MANY_BUFFERED_PARTS"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 1024 * 1024,
        maxFragments: 128 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open3() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open3() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=1048576] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=131072] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 1024 * 1024,
          maxFragments: 128 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/isexe/windows.js
var require_windows = __commonJS({
  "node_modules/isexe/windows.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs6 = __require("fs");
    function checkPathExt(path21, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path21.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat3, path21, options) {
      if (!stat3.isSymbolicLink() && !stat3.isFile()) {
        return false;
      }
      return checkPathExt(path21, options);
    }
    function isexe(path21, options, cb) {
      fs6.stat(path21, function(er, stat3) {
        cb(er, er ? false : checkStat(stat3, path21, options));
      });
    }
    function sync(path21, options) {
      return checkStat(fs6.statSync(path21), path21, options);
    }
  }
});

// node_modules/isexe/mode.js
var require_mode = __commonJS({
  "node_modules/isexe/mode.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs6 = __require("fs");
    function isexe(path21, options, cb) {
      fs6.stat(path21, function(er, stat3) {
        cb(er, er ? false : checkStat(stat3, options));
      });
    }
    function sync(path21, options) {
      return checkStat(fs6.statSync(path21), options);
    }
    function checkStat(stat3, options) {
      return stat3.isFile() && checkMode(stat3, options);
    }
    function checkMode(stat3, options) {
      var mod = stat3.mode;
      var uid = stat3.uid;
      var gid = stat3.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// node_modules/isexe/index.js
var require_isexe = __commonJS({
  "node_modules/isexe/index.js"(exports, module) {
    var fs6 = __require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module.exports = isexe;
    isexe.sync = sync;
    function isexe(path21, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path21, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path21, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path21, options) {
      try {
        return core.sync(path21, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// node_modules/which/which.js
var require_which = __commonJS({
  "node_modules/which/which.js"(exports, module) {
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path21 = __require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i) => new Promise((resolve, reject) => {
        if (i === pathEnv.length)
          return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path21.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        resolve(subStep(p, i, 0));
      });
      const subStep = (p, i, ii) => new Promise((resolve, reject) => {
        if (ii === pathExt.length)
          return resolve(step(i + 1));
        const ext = pathExt[ii];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve(p + ext);
          }
          return resolve(subStep(p, i, ii + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path21.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    };
    module.exports = which;
    which.sync = whichSync;
  }
});

// node_modules/path-key/index.js
var require_path_key = __commonJS({
  "node_modules/path-key/index.js"(exports, module) {
    "use strict";
    var pathKey = (options = {}) => {
      const environment = options.env || process.env;
      const platform2 = options.platform || process.platform;
      if (platform2 !== "win32") {
        return "PATH";
      }
      return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
    };
    module.exports = pathKey;
    module.exports.default = pathKey;
  }
});

// node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS({
  "node_modules/cross-spawn/lib/util/resolveCommand.js"(exports, module) {
    "use strict";
    var path21 = __require("path");
    var which = require_which();
    var getPathKey = require_path_key();
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env[getPathKey({ env })],
          pathExt: withoutPathExt ? path21.delimiter : void 0
        });
      } catch (e) {
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      if (resolved) {
        resolved = path21.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module.exports = resolveCommand;
  }
});

// node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS({
  "node_modules/cross-spawn/lib/util/escape.js"(exports, module) {
    "use strict";
    var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      arg = `${arg}`;
      arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
      arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
      arg = `"${arg}"`;
      arg = arg.replace(metaCharsRegExp, "^$1");
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module.exports.command = escapeCommand;
    module.exports.argument = escapeArgument;
  }
});

// node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS({
  "node_modules/shebang-regex/index.js"(exports, module) {
    "use strict";
    module.exports = /^#!(.*)/;
  }
});

// node_modules/shebang-command/index.js
var require_shebang_command = __commonJS({
  "node_modules/shebang-command/index.js"(exports, module) {
    "use strict";
    var shebangRegex = require_shebang_regex();
    module.exports = (string = "") => {
      const match = string.match(shebangRegex);
      if (!match) {
        return null;
      }
      const [path21, argument] = match[0].replace(/#! ?/, "").split(" ");
      const binary = path21.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  }
});

// node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS({
  "node_modules/cross-spawn/lib/util/readShebang.js"(exports, module) {
    "use strict";
    var fs6 = __require("fs");
    var shebangCommand = require_shebang_command();
    function readShebang(command) {
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs6.openSync(command, "r");
        fs6.readSync(fd, buffer, 0, size, 0);
        fs6.closeSync(fd);
      } catch (e) {
      }
      return shebangCommand(buffer.toString());
    }
    module.exports = readShebang;
  }
});

// node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS({
  "node_modules/cross-spawn/lib/parse.js"(exports, module) {
    "use strict";
    var path21 = __require("path");
    var resolveCommand = require_resolveCommand();
    var escape = require_escape();
    var readShebang = require_readShebang();
    var isWin = process.platform === "win32";
    var isExecutableRegExp = /\.(?:com|exe)$/i;
    var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (!isWin) {
        return parsed;
      }
      const commandFile = detectShebang(parsed);
      const needsShell = !isExecutableRegExp.test(commandFile);
      if (parsed.options.forceShell || needsShell) {
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
        parsed.command = path21.normalize(parsed.command);
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
        const shellCommand = [parsed.command].concat(parsed.args).join(" ");
        parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
        parsed.command = process.env.comspec || "cmd.exe";
        parsed.options.windowsVerbatimArguments = true;
      }
      return parsed;
    }
    function parse(command, args2, options) {
      if (args2 && !Array.isArray(args2)) {
        options = args2;
        args2 = null;
      }
      args2 = args2 ? args2.slice(0) : [];
      options = Object.assign({}, options);
      const parsed = {
        command,
        args: args2,
        options,
        file: void 0,
        original: {
          command,
          args: args2
        }
      };
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module.exports = parse;
  }
});

// node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS({
  "node_modules/cross-spawn/lib/enoent.js"(exports, module) {
    "use strict";
    var isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args
      });
    }
    function hookChildProcess(cp, parsed) {
      if (!isWin) {
        return;
      }
      const originalEmit = cp.emit;
      cp.emit = function(name, arg1) {
        if (name === "exit") {
          const err = verifyENOENT(arg1, parsed);
          if (err) {
            return originalEmit.call(cp, "error", err);
          }
        }
        return originalEmit.apply(cp, arguments);
      };
    }
    function verifyENOENT(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawn");
      }
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawnSync");
      }
      return null;
    }
    module.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError
    };
  }
});

// node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS({
  "node_modules/cross-spawn/index.js"(exports, module) {
    "use strict";
    var cp = __require("child_process");
    var parse = require_parse();
    var enoent = require_enoent();
    function spawn2(command, args2, options) {
      const parsed = parse(command, args2, options);
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync(command, args2, options) {
      const parsed = parse(command, args2, options);
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module.exports = spawn2;
    module.exports.spawn = spawn2;
    module.exports.sync = spawnSync;
    module.exports._parse = parse;
    module.exports._enoent = enoent;
  }
});

// src/env.ts
var envFile = process.env.ENV_FILE || ".env";
try {
  process.loadEnvFile?.(envFile);
} catch {
}

// src/daemon/index.ts
import os7 from "node:os";
import fs5 from "node:fs";
import path20 from "node:path";

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);
var wrapper_default = import_websocket.default;

// src/log.ts
import fs from "node:fs";
import path2 from "node:path";

// src/paths.ts
import os from "node:os";
import path from "node:path";
var workoraHome = () => process.env.OPEN_WORKORA_HOME ?? path.join(os.homedir(), ".Workora");
var agentsDir = () => path.join(workoraHome(), "agents");
var binDir = () => path.join(workoraHome(), "bin");
var machineIdFile = () => path.join(workoraHome(), "machine-id");
var logsDir = () => process.env.OPEN_WORKORA_LOG_DIR ?? path.join(workoraHome(), "logs");

// src/log.ts
var LOG_DIR = logsDir();
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
}
var order = { debug: 10, info: 20, warn: 30, error: 40 };
var MIN = order[process.env.OPEN_WORKORA_LOG_LEVEL ?? "debug"] ?? 10;
function createLogger(component) {
  const file = path2.join(LOG_DIR, `${component.split(":")[0]}.log`);
  function write(level, msg, fields) {
    if (order[level] < MIN) return;
    const rec = { t: (/* @__PURE__ */ new Date()).toISOString(), level, comp: component, msg, ...fields ?? {} };
    try {
      fs.appendFileSync(file, JSON.stringify(rec) + "\n");
    } catch {
    }
    const extra = fields && Object.keys(fields).length ? " " + safeJson(fields) : "";
    const line = `${rec.t} ${level.toUpperCase().padEnd(5)} [${component}] ${msg}${extra}`;
    const stream = consoleStream(component, level);
    try {
      stream.write(line + "\n");
    } catch {
    }
  }
  return {
    debug: (m, f) => write("debug", m, f),
    info: (m, f) => write("info", m, f),
    warn: (m, f) => write("warn", m, f),
    error: (m, f) => write("error", m, f),
    child: (sub) => createLogger(`${component}:${sub}`)
  };
}
function consoleStream(component, level) {
  if (level === "error" || component === "cli" || component.startsWith("cli:")) return process.stderr;
  return process.stdout;
}
function safeJson(o) {
  try {
    return JSON.stringify(o, (_k, v) => typeof v === "string" && v.length > 300 ? v.slice(0, 300) + "\u2026" : v);
  } catch {
    return "[unserializable]";
  }
}

// src/daemonProtocol.ts
var MACHINE_REJECTED_CODE = 4001;
var DELIVERY_ADMISSION_CAPABILITY = "delivery-admission-v2";
var AGENT_CONTROL_ACK_CAPABILITY = "agent-control-ack-v1";
var PROJECT_DIRECTORY_CAPABILITY = "project-directory-v2";
var PROJECT_BROWSER_CAPABILITY = "project-browser-v1";

// src/daemon/connection.ts
var INITIAL_BACKOFF_MS = 1e3;
var MAX_BACKOFF_MS = 3e4;
var SERVER_STALE_MS = Number(process.env.OPEN_WORKORA_DAEMON_SERVER_STALE_MS ?? 9e4);
var Connection = class {
  constructor(url, key, onMsg, onOpen, mkWs = (u) => new wrapper_default(u)) {
    this.url = url;
    this.key = key;
    this.onMsg = onMsg;
    this.onOpen = onOpen;
    this.mkWs = mkWs;
  }
  url;
  key;
  onMsg;
  onOpen;
  mkWs;
  ws = null;
  delay = INITIAL_BACKOFF_MS;
  timer = null;
  watchdog = null;
  should = true;
  accepted = false;
  // per-attempt: flips true once the server sends any frame (proof it accepted us, not rejected)
  lastServerFrameAt = 0;
  log = createLogger("daemon:conn");
  connect() {
    this.should = true;
    this.doConnect();
  }
  send(m) {
    if (this.ws?.readyState === wrapper_default.OPEN) this.ws.send(JSON.stringify(m));
  }
  close() {
    this.should = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    this.ws?.close();
  }
  doConnect() {
    if (!this.should) return;
    const wsUrl = this.url.replace(/^http/, "ws") + `/daemon/connect?key=${encodeURIComponent(this.key)}`;
    this.log.info("connecting", { url: this.url });
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    this.accepted = false;
    this.lastServerFrameAt = 0;
    this.ws = this.mkWs(wsUrl);
    this.ws.on("open", () => {
      this.log.info("connected");
      this.onOpen();
    });
    this.ws.on("message", (d) => {
      if (!this.accepted) {
        this.accepted = true;
        this.delay = INITIAL_BACKOFF_MS;
      }
      this.lastServerFrameAt = Date.now();
      this.armWatchdog();
      let m;
      try {
        m = JSON.parse(d.toString());
      } catch {
        return;
      }
      this.onMsg(m);
    });
    this.ws.on("close", (code, reason) => {
      if (this.watchdog) {
        clearTimeout(this.watchdog);
        this.watchdog = null;
      }
      if (code === MACHINE_REJECTED_CODE) {
        this.delay = MAX_BACKOFF_MS;
        this.log.error(
          "server rejected this machine: its connection key is unknown or was removed. Re-issue the connect command (workspace \u2192 Computers \u2192 this machine \u2192 Reconnect), then restart the daemon with the new key.",
          { code, reason: reason?.toString?.() ?? String(reason ?? "") }
        );
      } else {
        this.log.warn("disconnected", { code });
      }
      this.scheduleReconnect();
    });
    this.ws.on("error", (e) => this.log.error("ws error", { detail: String(e?.message ?? e) }));
  }
  armWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      if (!this.accepted || !this.lastServerFrameAt || this.ws?.readyState !== wrapper_default.OPEN) return;
      this.log.warn("server heartbeat stale; closing socket to reconnect", { staleMs: Date.now() - this.lastServerFrameAt });
      try {
        this.ws.close();
      } catch {
      }
    }, SERVER_STALE_MS + 1);
    this.watchdog.unref?.();
  }
  scheduleReconnect() {
    if (!this.should || this.timer) return;
    this.log.info("reconnecting", { ms: this.delay });
    this.timer = setTimeout(() => {
      this.timer = null;
      this.doConnect();
    }, this.delay);
    this.delay = Math.min(this.delay * 2, MAX_BACKOFF_MS);
  }
};

// src/daemon/agentManager.ts
import { mkdir as mkdir3, rm as rm2 } from "node:fs/promises";
import path15 from "node:path";
import os4 from "node:os";

// src/daemon/prompt.ts
function buildSystemPrompt(c) {
  return `You are "${c.displayName}", an AI agent in Workora \u2014 a collaborative workspace where humans and AI agents (possibly on different machines) work together over a shared message bus. You are a persistent colleague: started, slept when idle, woken when messaged. Your Workora state and MEMORY.md persist across turns.

## Current Runtime Context
This is authoritative context injected by Workora. Do NOT infer identity from hostname or cwd.
- Agent ID: ${c.agentId}
- Server ID: ${c.serverId}
- Hostname: ${c.hostname}
- OS: ${c.os}
- Project directory (cwd): ${c.projectDir}
- Agent state directory: ${c.stateDir}
- Memory file: ${c.stateDir}/MEMORY.md
- Your @handle: @${c.name}

## Communication \u2014 the \`Workora\` CLI ONLY
A local \`Workora\` command is on your PATH. Use ONLY it to communicate, via your shell/bash tool, ONE command per call:
- \`Workora message check\` \u2014 non-blocking: read new messages addressed to you. Run it at the start and after notifications.
- \`Workora message decide --message-id <id> --decision <no_action|request_reply|accept|delegate|abstain>\` \u2014 record one judgment per distinct canonical trigger; several messages in one sender burst may share it. A reply request also needs \`--reason <ownership|better_fit|handoff|correction|blocker|new_evidence|unique_expertise>\`; delegation needs \`--to @agent\`.
- \`Workora message send --reply-to <id> --target <t>\` \u2014 publish only after the decision response/header shows a grant; the BODY is read from STDIN (use a heredoc).
- \`Workora message read --channel <t> [--limit N]\` \u2014 read history.
- \`Workora server info\` \u2014 list channels / agents / humans.
- \`Workora channel join --target "#name"\` \u2014 join a public channel.
- \`Workora task list --channel <t>\` \xB7 \`Workora task claim --message-id <id>\` \xB7 \`Workora task assign --message-id <id> --to @agent\`(handoff to another agent) \xB7 \`Workora task update --message-id <id> --status <todo|in_progress|in_review|done>\` \xB7 \`Workora task create --channel <t> --title <t>\`(delegate a task)
- **Threads (no dedicated thread command \u2014 use a thread target)**: reply to / open a thread = \`Workora message send --target "#channel:shortid"\` or the stable \`thread:shortid\` form (where \`shortid\` is the 8-char parent message id from the message header; if the thread does not exist yet, the target creates it automatically when the parent channel is accessible); read a thread = \`Workora message read --channel "thread:shortid"\`; stop receiving deliveries for a thread = \`Workora thread unfollow --target "thread:shortid"\` (or the older \`#channel:shortid\` form) when work there is clearly done or irrelevant. Threads cannot be nested.
- \`Workora message react --message-id <id> --emoji <e> [--remove]\`(emoji reaction) \xB7 \`Workora message search --query <q>\`(search channels you are in)
- \`Workora attachment upload --file <path> --channel <t>\`(upload a file, returns an id; then use \`message send --attach <id>\`) \xB7 \`Workora attachment view --id <id>\`(downloads the attachment to the local \`attachments/\` directory and prints its local path for inspection \u2014 this command only handles the download and path; how you open it is up to your local tools)
- \`Workora message resolve --id <id>\`(verify that a cited message id is real \u2014 always resolve before referencing, never invent ids from memory) \xB7 \`Workora channel members --channel <t>\` \xB7 \`Workora channel leave --target "#name"\` \xB7 \`Workora task unclaim --message-id <id>\`
- \`Workora profile show [--handle @name]\`(view your own or another person's profile) \xB7 \`Workora profile update [--display-name <n>] [--description <t>] [--avatar-url pixel:random:<seed>]\`(update your own profile)
- \`Workora reminder schedule --content <t> --in <seconds> [--anchor <msgId>] [--recurring <seconds>]\`(schedule a future wakeup for yourself \u2014 at the scheduled time the system will @-mention you to wake you up) \xB7 \`Workora reminder list/cancel/snooze\`. For anything that depends on a future state, use a reminder instead of busy-waiting.
- \`Workora action prepare --target <t>\` \u2014 prepare an action card for a human to commit (B-mode quick-commit). You do NOT have permission to create channels/agents yourself; instead pipe the action JSON on STDIN and post a card the human clicks to execute under their own identity. Variants: \`channel:create\` (\`{"type":"channel:create","name":"x","description":"...","visibility":"public"}\`), \`agent:create\` (\`{"type":"agent:create","name":"y","description":"..."}\`). Use when a human asks you to set up a channel/agent \u2014 propose it as a card, don't ask them to do it manually.

Targets: \`#channel\`, \`dm:@name\`, thread \`#channel:shortid\` or \`thread:shortid\`. Prefer \`thread:shortid\` when reusing a thread target across different agents, private channels, or DMs because it is stable across actor viewpoints. Send the body via stdin heredoc:
\`\`\`bash
Workora message send --reply-to 1234abcd --target "#all" <<'MSG'
Your reply. Quotes, $vars, \`backticks\`, code blocks are all safe here.
MSG
\`\`\`
CRITICAL: Text you print outside a \`Workora\` command is NOT delivered to anyone. Only \`Workora message send\` reaches people. Do not use curl/echo to talk \u2014 only the \`Workora\` CLI.

REPLY COORDINATION: every checked message includes \`attention=\`, \`decision=\`, \`grant=\`, and a canonical \`trigger=\`. A short burst from one sender may contain several messages with the same trigger; read all of them as one Conversation Turn, decide that distinct trigger once, and publish at most once for it. Reading is not permission to speak. \`attention=assigned\` means the server selected you as the accountable owner of an unmentioned human Turn: handle it even though nobody typed your name, then answer, delegate, or abstain based on the actual content. The first explicit mention owns \`grant=primary\`: accept, delegate to a teammate who first requested \`better_fit\`/handoff, or abstain. Another explicit mention owns \`grant=directed\`: accept and answer only the distinct slice assigned to you, or choose \`no_action\` when you were merely copied or your contribution would duplicate the others. An ambient observer should normally choose \`no_action\`; request a reply only with a concrete correction, blocker, new evidence, or unique expertise. Send only when \`grant=primary|directed|supplemental\`, always pass the canonical trigger as \`--reply-to <trigger>\`. If a request is pending or denied, stay silent. For a coordinated Task, the recorded \`accept\` decision is the acknowledgement: never spend its one-shot public grant on an acknowledgement, plan, intent, or progress update. Finish your assigned slice first, then use the single authorized public reply for a concrete result, evidence, or blocker. A suspected mistaken @mention is handled by \`better_fit\` request plus delegation/abstention, never by both agents replying to the same assigned slice.

A private \`[coordination ... requester=@agent reason=...]\` line means a teammate requested the reply while you still own the primary grant. It is not a channel message. Decide the same trigger again: use \`delegate --to @agent\` when the request is better, or \`accept\` to keep ownership. A private line with \`grant=primary\` means ownership was transferred to you; publish one reply or abstain if context changed. Do not publish before the applicable decision or grant is recorded.

FRESHNESS HOLD (secondary collaboration safety): if new messages arrived in that target since you last read it, \`send\` does NOT post \u2014 it saves your text as a draft and shows you the newer messages. Review the bounded context, then either revise or use \`--send-draft\` with the same \`--reply-to\`. Draft submission never bypasses reply authorization.

## Received message format
\`[target=<id> msg=<shortid> attention=direct|dm|assigned|ambient decision=<state> grant=primary|directed|supplemental|none trigger=<shortid> time=<iso> type=human|agent|system] @sender: content\`
Reuse the \`target=\` value when replying so it lands in the right channel/DM/thread. @mention people by their @handle. \`msg=\` is the 8-char short id \u2014 use it as a thread suffix (\`#channel:shortid\`) or as the stable form \`thread:shortid\` to start/reply in a thread, and pass it to \`Workora message resolve\` to verify a cited id is real. \`type=system\` messages announce state changes (task events, reminders) \u2014 don't reply unless they clearly ask you to act.

### Formatting \u2014 so refs/links render
Workora auto-renders these **bare-text** tokens into clickable refs; write them as plain words, NOT wrapped in backticks (code spans are literal, won't render):
- \`@handle\` \u2192 user/agent \xB7 \`#channel\` \u2192 channel \xB7 \`#channel:shortid\` or \`thread:shortid\` \u2192 thread \xB7 \`task #N\` \u2192 task (write "task #N", not bare "#N").
- **URL next to CJK/non-ASCII punctuation**: wrap it in \`<url>\` or \`[text](url)\`, else the punctuation gets swallowed into the link. Wrong: \`env:http://x:3000,see\` \u2192 Right: \`env:<http://x:3000>,see\`.

### Citing prior discussion
When someone refers to earlier discussion you don't have in context, first \`Workora message search --query <q>\` + \`Workora message read\` (use \`--around <id>\` to jump to a message's surrounding context) to find the original thread/decision before answering \u2014 then summarize it **with the source**, or say explicitly you couldn't find it. Don't invent prior context.

## Channels & people
Run \`Workora server info\` to see every channel in this server (with its description and whether you've joined), plus the other agents and humans \u2014 this is how you learn where you are and who you can talk to. Don't assume which channels or teammates exist; check it.
- A public channel may show \`joined: false\`. You can still inspect it with \`Workora message read --channel "#name"\` and \`Workora channel members --channel "#name"\`, but you cannot post there or receive ordinary delivery until you join with \`Workora channel join --target "#name"\`. Leave a joined channel with \`Workora channel leave --target "#name"\`.

### Channel awareness
Each channel has a **name** and optionally a **description** that define its purpose (both shown by \`Workora server info\`). Respect them:
- **Reply in context** \u2014 answer in the channel/thread the message came from (reuse its \`target=\`).
- **Stay on topic** \u2014 when proactively posting results or updates, use the channel most relevant to the work; don't scatter across unrelated channels.
- **If you're unsure what a channel is for or where something belongs, run \`Workora server info\` to review channel descriptions before posting.**
- **Private channels are confidential** \u2014 if a channel is private, treat its name / members / content as private to that channel; never disclose it in other channels, DMs, summaries, or task reports unless a human explicitly asks within that authorized context.

## Tasks
When a message asks you to DO something (fix a bug, write code, investigate) \u2014 that's work. A task has one accountable coordinator. If its header shows \`grant=primary\`, claim it before starting; \`TASK_RESERVED_FOR_PRIMARY\` means another named coordinator owns it, so do not retry or steal it. If the task header shows \`grant=directed\`, you are a named contributor: accept the reply grant, do only your assigned slice, and publish it to the supplied task-thread \`target=\` without claiming the parent task. For either Task grant, \`accept\` records that work started without consuming the public reply: do not send "received", "I will", a plan, or an interim status. Complete the slice first and publish one result with concrete findings, evidence, delivered artifacts, or a specific blocker. Just answering a non-task question needs no claim. Status flow: \`todo \u2192 in_progress \u2192 in_review \u2192 done\`. The coordinator moves completed work to \`in_review\` only after the requested results are present so a human can validate; after approval set \`done\`. Reuse existing tasks/threads instead of creating duplicates \u2014 only \`task create\` for genuinely independent work with its own owner/status. Task replies belong in the task's thread; reuse the checked message's \`target=\` exactly.
When splitting a big task into subtasks, structure them for **parallel** work: group by phase with clear labels ("Phase 1: \u2026") when there are real dependencies; prefer independent subtasks that don't block each other; avoid sequential chains that force agents to work one-at-a-time.

## Etiquette & safety
- **Respect ongoing conversations.** If two people are going back-and-forth, their follow-ups are for each other. Observe the message, record \`no_action\`, and stay silent unless you have a granted, specific correction/blocker/new evidence.
- **Only the person who did the work reports on it.** Don't echo or summarize someone else's task/PR.
- **Before stopping, clear blockers you own** \u2014 if you owe a specific reply/handoff/decision blocking someone, send one minimal message first. Otherwise skip idle narration (don't broadcast that you're waiting/idle).
- **Credential hygiene (CRITICAL):** NEVER paste credentials (\`sk_agent_*\`, \`sk_machine_*\`, JWTs, \`.env\`, tokens) into public channels. DMs/private channels only for authorized secret handoff. If a tool output contains credential-shaped strings, redact to \`sk_agent_<redacted>\` before posting publicly.

## Startup sequence
1. Run \`Workora message check\` to see anything waiting.
2. Open \`${c.stateDir}/MEMORY.md\` for your role and context.
3. For each distinct \`trigger=\`, record one reply decision. Messages sharing a trigger are one sender's Conversation Turn. Handle every assigned/direct/DM trigger and send only when the server grants a slot. For a task, only the primary coordinator claims the parent; a directed contributor works its scoped slice and replies in the task thread without claiming.
4. Finish ALL the work, then report the result. For a coordinated Task, do not publish an acknowledgement or progress update before that result. New messages are delivered into your session automatically \u2014 you do not need to poll.
5. **Before you stop, update your memory if you learned anything durable** \u2014 a decision you made, a fact about the project/people, what you were mid-way through. Write it into \`${c.stateDir}/MEMORY.md\` (keep the index current) or \`${c.stateDir}/notes/\` (details). This is the ONLY thing that survives context compaction; if you skip it, after a compaction you'll wake up as a blank slate. Skip only for trivial one-off replies that taught you nothing.

## Communication style
People can't see your reasoning, so make public messages useful and concise. For ordinary conversation or work without a one-shot coordination grant, share context when it helps. For a coordinated Task, do not publish acknowledgement, plan, intent, or progress messages: the recorded \`accept\` decision is the acknowledgement, and the single public reply is reserved for the completed result or a concrete blocker.

## Project directory & memory
Your cwd is the operator-selected project directory. Respect its existing instructions and configuration; it may be shared with humans or other agents. Do not store Workora identity or memory by overwriting or appending project instruction files.

Your Workora-owned persistent state directory is \`${c.stateDir}\`. It survives sleep, restart, and context compaction. Store your own durable memory there, not in the project root.

\`${c.stateDir}/MEMORY.md\` is your memory index \u2014 the FIRST file you read on every startup (including after compaction). Keep it as a self-sufficient table of contents, e.g.:
\`\`\`markdown
# ${c.displayName}
## Role
<your role, evolved over time>
## Key knowledge
- notes/user-preferences.md \u2014 how the user likes things done, conventions
- notes/channels.md \u2014 what each channel is about + ongoing work per channel
- notes/work-log.md \u2014 decisions made and why, problems solved
- notes/<domain>.md \u2014 domain-specific knowledge
## Active context
- Currently working on: <brief>
- Last interaction: <brief>
\`\`\`
Put detailed knowledge in \`${c.stateDir}/notes/\`; write it proactively when you learn something (don't wait to be asked), and keep the MEMORY.md index current.

## Compaction safety (CRITICAL)
Your context is periodically compressed to stay within limits \u2014 you lose in-context conversation history, but your memory file is always re-read. Therefore:
- \`${c.stateDir}/MEMORY.md\` must be self-sufficient as a recovery point: after reading it you know who you are, what you know, and what you were doing.
- Before a long task, jot an "Active context" note in that memory file so you can resume if interrupted mid-task.
- After finishing work, update \`${c.stateDir}/notes/\` and the memory index so nothing is lost.
- NEVER let compaction make you forget: which channel is about what, what tasks are in progress, or what the user asked.

## Message notifications
While you're busy, the daemon writes a batched, content-free \`[inbox notice: \u2026]\` into your turn \u2014 it gives metadata (count / target / latest sender) but NOT message bodies (withheld to avoid flooding, not absent). Treat it as a non-urgent signal: don't interrupt your current step; at a natural breakpoint run \`Workora message check\` to pull the pending messages. Never derive "no work" from a content-free notice alone \u2014 if you choose to defer reading, report the deferral honestly.
${c.description ? `
## Your role
${c.description}. This may evolve.` : ""}`;
}
var STARTUP_NUDGE = "You just started because Conversation Turns need judgment. FIRST run `Workora message check`, handle every assigned/direct/DM trigger, record one `Workora message decide` result per distinct trigger, and only send a reply with `--reply-to` when the server grants that trigger a slot. Otherwise stay silent, then stop.";
var RESUME_NUDGE = "You were woken because Conversation Turns need judgment. Run `Workora message check`, handle every assigned/direct/DM trigger, decide each distinct trigger once, and only send with `--reply-to` when that trigger is granted. Otherwise stay silent, then stop.";
var ONE_SHOT_WAKE_NUDGE = "You were woken by new Workora Conversation Turns. FIRST run `Workora message check`, handle every assigned/direct/DM trigger, record one decision per distinct trigger, and send at most one reply per granted trigger with `Workora message send --reply-to`. A no-action or denied trigger must end silently.";
function inboxNotice(o) {
  const plural = (n) => n === 1 ? "" : "s";
  const changed = o.changedTargets ?? 1;
  const first = o.firstShort ? ` \xB7 first msg=${o.firstShort}` : "";
  const latest = o.latestShort ? ` \xB7 latest msg=${o.latestShort}` : "";
  const suffix = `${o.isTask ? " \xB7 task" : ""}${o.isDm ? " \xB7 dm" : ""} \xB7 attention=${o.attention ?? (o.mentioned || o.isDm || o.isTask ? "direct" : "ambient")}`;
  return `[inbox notice:
Inbox update: ${o.count} pending item${plural(o.count)}; ${changed} changed target${plural(changed)}
${o.targetName}  pending: ${o.count} item${plural(o.count)}${first} \xB7 latest @${o.from}${latest}${suffix}
]
Content-free signal \u2014 this may represent a sender-scoped Conversation Turn or a private reply-coordination update. Finish your current step, then run \`Workora message check\` and record one decision per distinct trigger. Handle every assigned/direct/DM trigger. Reply at most once per granted trigger; no-action and denied triggers end silently. Never conclude "no work" from this notice alone.`;
}

// src/daemon/memory.ts
function seedMemory(displayName, description) {
  return `# ${displayName}

## Role
${ROLE_START}
${roleBody(description)}
${ROLE_END}

## Key Knowledge
- None yet

## Active Context
- First startup
`;
}
function seedPersonality(displayName, role) {
  return `# ${displayName} \u2014 soul

## Who I am
${role?.trim() || "A Workora teammate: persistent, self-hosted, and accountable for results. I collaborate with humans and other agents in channels, threads, and DMs."}

## Voice
- Direct and concise. Report outcomes, not intentions.
- Ask for clarification when a task is ambiguous instead of guessing.
- Explain the reasoning behind non-obvious decisions.

## Values
- Ship real, verifiable work over plausible-sounding answers.
- Keep the human in control: prepare actions, never silently execute privileged ones.
- Preserve durable knowledge for the team (write to the knowledge base + MEMORY.md).

## Boundaries
- I never commit secrets, credentials, or personal data.
- I never overwrite project instruction files (AGENTS.md etc.) with Workora identity.
- I ask before destructive or irreversible operations.

## Work style
- Read memory + knowledge base before starting a task.
- Keep MEMORY.md current as a self-sufficient index; put details in notes/.
- Before stopping, persist anything durable I learned.
`;
}
function roleBody(description) {
  return (description ?? "").trim() || "Undefined";
}
var ROLE_START = "<!-- role:start -->";
var ROLE_END = "<!-- role:end -->";
function applyProfileToMemory(content, displayName, description) {
  const role = roleBody(description);
  const lines = content.split("\n");
  const h1 = lines.findIndex((l) => /^#\s+/.test(l));
  if (h1 === -1) {
    return `# ${displayName}

## Role
${ROLE_START}
${role}
${ROLE_END}

${content}`;
  }
  lines[h1] = `# ${displayName}`;
  const roleIdx = lines.findIndex((l, i) => i > h1 && /^##\s+Role\s*$/i.test(l));
  if (roleIdx === -1) {
    const head2 = lines.slice(0, h1 + 1);
    const restStart = lines[h1 + 1] === "" ? h1 + 2 : h1 + 1;
    return [...head2, "", "## Role", ROLE_START, role, ROLE_END, "", ...lines.slice(restStart)].join("\n");
  }
  const startMarker = lines.indexOf(ROLE_START, roleIdx + 1);
  const endMarker = lines.indexOf(ROLE_END, startMarker + 1);
  if (startMarker !== -1 && endMarker !== -1) {
    const head2 = lines.slice(0, startMarker);
    const tail2 = lines.slice(endMarker + 1);
    const joined = [...head2, ROLE_START, role, ROLE_END, ...tail2].join("\n");
    return joined === content ? content : joined;
  }
  let next = lines.length;
  for (let i = roleIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      next = i;
      break;
    }
  }
  const head = lines.slice(0, roleIdx + 1);
  const tail = lines.slice(next);
  const body = tail.length ? [ROLE_START, role, ROLE_END, ""] : [ROLE_START, role, ROLE_END];
  return [...head, ...body, ...tail].join("\n");
}

// src/daemon/workoraBin.ts
import fs2 from "node:fs";
import path3 from "node:path";
import { fileURLToPath } from "node:url";
function ensureWorkoraBin() {
  const dir = binDir();
  fs2.mkdirSync(dir, { recursive: true });
  const here = path3.dirname(fileURLToPath(import.meta.url));
  const bundledCli = path3.join(here, "agent-cli.mjs");
  let runner, cliPath;
  if (fs2.existsSync(bundledCli)) {
    runner = ["node"];
    cliPath = bundledCli;
  } else {
    cliPath = path3.resolve(here, "../cli/index.ts");
    const projectRoot = path3.resolve(here, "../..");
    const tsxBin = path3.join(projectRoot, "node_modules", ".bin", "tsx");
    runner = fs2.existsSync(tsxBin) ? [tsxBin] : ["npx", "tsx"];
  }
  const q = (s) => JSON.stringify(s);
  const invocation = [...runner, cliPath].map(q).join(" ");
  const wrapper = path3.join(dir, "Workora");
  const sh = `#!/bin/sh
# Workora agent CLI wrapper (auto-generated by daemon)
exec ${invocation} "$@"
`;
  fs2.writeFileSync(wrapper, sh);
  fs2.chmodSync(wrapper, 493);
  if (process.platform === "win32") {
    const cmdWrapper = path3.join(dir, "Workora.cmd");
    const cmdContent = `@echo off\r
REM Workora agent CLI wrapper (auto-generated by daemon)\r
${invocation} %*\r
`;
    fs2.writeFileSync(cmdWrapper, cmdContent);
  }
  return dir;
}

// src/daemon/runtimes.ts
import { execSync as execSync3 } from "node:child_process";

// src/daemon/spawnSafe.ts
var import_cross_spawn = __toESM(require_cross_spawn(), 1);
import { statSync } from "node:fs";
import path5 from "node:path";
import { spawn as nodeSpawn } from "node:child_process";

// src/daemon/resourceLimit.ts
import fs3 from "node:fs";
import { execSync } from "node:child_process";
import path4 from "node:path";
import { createRequire } from "node:module";
var _require = /* @__PURE__ */ createRequire(import.meta.url);
var koffi;
try {
  koffi = _require("koffi");
} catch {
}
var log = createLogger("daemon:limit");
var platform = process.platform;
function applyResourceLimits(child) {
  if (child.pid === void 0) return;
  try {
    switch (platform) {
      case "win32":
        return setupWin32Job(child);
      case "linux":
        return setupLinuxCgroup(child);
      default:
        log.debug("unsupported platform, skipping", { platform });
        return;
    }
  } catch (err) {
    log.error("applyResourceLimits failed", { pid: child.pid, error: String(err), platform });
  }
}
var JOB_OBJECT_LIMIT_PROCESS_MEMORY = 256;
var PROCESS_SET_QUOTA = 256;
var PROCESS_TERMINATE = 1;
var JobObjectExtendedLimitInformation = 9;
var winApi = null;
function initWinApi() {
  const lib = koffi.load("kernel32.dll");
  const BasicLimitInfo = koffi.struct({
    PerProcessUserTimeLimit: "int64",
    PerJobUserTimeLimit: "int64",
    LimitFlags: "uint32",
    MinimumWorkingSetSize: "int64",
    MaximumWorkingSetSize: "int64",
    ActiveProcessLimit: "uint32",
    Affinity: "int64",
    PriorityClass: "uint32",
    SchedulingClass: "uint32"
  });
  const IoCounters = koffi.struct({
    ReadOperationCount: "int64",
    WriteOperationCount: "int64",
    OtherOperationCount: "int64",
    ReadTransferCount: "int64",
    WriteTransferCount: "int64",
    OtherTransferCount: "int64"
  });
  const ExtendedLimitInfo = koffi.struct({
    BasicLimitInformation: BasicLimitInfo,
    IoInfo: IoCounters,
    ProcessMemoryLimit: "int64",
    JobMemoryLimit: "int64",
    PeakProcessMemoryUsed: "int64",
    PeakJobMemoryUsed: "int64"
  });
  const CpuRateControlInfo = koffi.struct({
    ControlFlags: "uint32",
    CpuRate: "uint32"
  });
  return {
    CreateJobObjectW: lib.func("CreateJobObjectW", "void*", ["void*", "void*"]),
    SetExtendedLimitInfo: lib.func(
      "SetInformationJobObject",
      "bool",
      ["void*", "int", koffi.pointer(ExtendedLimitInfo), "uint32"]
    ),
    SetCpuRateInfo: lib.func(
      "SetInformationJobObject",
      "bool",
      ["void*", "int", koffi.pointer(CpuRateControlInfo), "uint32"]
    ),
    OpenProcess: lib.func("OpenProcess", "void*", ["uint32", "int", "uint32"]),
    AssignProcessToJobObject: lib.func(
      "AssignProcessToJobObject",
      "bool",
      ["void*", "void*"]
    ),
    SetProcessWorkingSetSizeEx: lib.func("SetProcessWorkingSetSizeEx", "bool", ["void*", "int64", "int64", "uint32"]),
    CloseHandle: lib.func("CloseHandle", "bool", ["void*"]),
    ExtendedLimitInfo,
    CpuRateControlInfo
  };
}
var jobHandles = /* @__PURE__ */ new Map();
function setupWin32Job(child) {
  const pid = child.pid;
  const a = winApi ??= initWinApi();
  const jobHandle = a.CreateJobObjectW(null, null);
  if (typeof jobHandle !== "bigint" || jobHandle === 0n) {
    log.error("CreateJobObjectW failed", { pid });
    return;
  }
  const procHandle = a.OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, 0, pid);
  if (typeof procHandle === "bigint" && procHandle !== 0n) {
    const assigned = a.AssignProcessToJobObject(jobHandle, procHandle);
    if (assigned) {
      log.debug("assigned to Job Object (pressure-ready)", { pid });
    } else {
      log.error("AssignProcessToJobObject failed", { pid });
    }
    a.CloseHandle(procHandle);
  } else {
    log.error("OpenProcess failed", { pid });
  }
  jobHandles.set(pid, jobHandle);
  child.once("exit", () => {
    const h = jobHandles.get(child.pid);
    if (h) {
      a.CloseHandle(h);
      jobHandles.delete(child.pid);
      log.debug("Job Object closed", { pid: child.pid });
    }
  });
}
var CG_ROOT = "/sys/fs/cgroup";
function setupLinuxCgroup(child) {
  const pid = child.pid;
  const cgName = `Workora-agent-${pid}`;
  const cgDir = path4.join(CG_ROOT, cgName);
  try {
    try {
      fs3.mkdirSync(cgDir, { recursive: true });
    } catch {
      log.debug("cgroup setup skipped (no permission)", { pid });
      return;
    }
    fs3.writeFileSync(path4.join(cgDir, "cgroup.procs"), String(pid));
    log.debug("assigned to cgroup (pressure-ready)", { pid });
    child.once("exit", () => {
      try {
        fs3.rmdirSync(cgDir);
      } catch {
      }
    });
  } catch (err) {
    log.debug("cgroup setup failed", { pid, error: String(err) });
  }
}
function readProcessMemoryMB(pid) {
  if (pid <= 0) return 0;
  try {
    if (platform === "win32") return readWin32ProcessMemoryMB(pid);
    if (platform === "linux") return readLinuxProcessMemoryMB(pid);
    if (platform === "darwin") return readDarwinProcessMemoryMB(pid);
  } catch {
  }
  return 0;
}
function readDarwinProcessMemoryMB(pid) {
  const out = execSync(`ps -o rss= -p ${pid}`, { encoding: "utf8", timeout: 2e3 }).trim();
  return out ? Math.round(Number(out) / 1024) : 0;
}
function readWin32ProcessMemoryMB(pid) {
  const a = winApi ??= initWinApi();
  const PROCESS_QUERY_INFORMATION = 1024;
  const PROCESS_VM_READ = 16;
  const hProcess = a.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
  if (typeof hProcess !== "bigint" || hProcess === 0n) return 0;
  try {
    const PSAPI = koffi.load("psapi.dll");
    const PMC = koffi.struct("PMC", {
      cb: "uint32",
      PageFaultCount: "uint32",
      PeakWorkingSetSize: "uint64",
      WorkingSetSize: "uint64",
      QuotaPeakPagedPoolUsage: "uint64",
      QuotaPagedPoolUsage: "uint64",
      QuotaPeakNonPagedPoolUsage: "uint64",
      QuotaNonPagedPoolUsage: "uint64",
      PagefileUsage: "uint64",
      PeakPagefileUsage: "uint64"
    });
    const getMem = PSAPI.func("GetProcessMemoryInfo", "bool", ["void*", koffi.pointer(PMC), "uint32"]);
    const pmc = {};
    const ok = getMem(hProcess, pmc, koffi.sizeof(PMC));
    if (!ok) return 0;
    return Math.round(Number(pmc.WorkingSetSize) / (1024 * 1024));
  } finally {
    a.CloseHandle(hProcess);
  }
}
function readLinuxProcessMemoryMB(pid) {
  const st = fs3.readFileSync(`/proc/${pid}/status`, "utf8");
  const m = st.match(/^VmRSS:\s+(\d+)\s+kB/m);
  return m ? Math.round(Number(m[1]) / 1024) : 0;
}
function applyMemoryPressure(pid, currentMB, marginMB = 200) {
  if (pid <= 0) return;
  try {
    if (platform === "win32") applyWin32Pressure(pid, currentMB, marginMB);
    if (platform === "linux") applyLinuxPressure(pid, currentMB, marginMB);
  } catch {
  }
}
function applyWin32Pressure(pid, currentMB, marginMB) {
  const a = winApi ??= initWinApi();
  const handle = jobHandles.get(pid);
  if (!handle) {
    log.debug("pressure: no job handle", { pid });
    return;
  }
  const newCapBytes = BigInt(Math.max(currentMB + marginMB, 1)) * 1024n * 1024n;
  const z = 0n;
  const extInfo = {
    BasicLimitInformation: {
      PerProcessUserTimeLimit: z,
      PerJobUserTimeLimit: z,
      LimitFlags: JOB_OBJECT_LIMIT_PROCESS_MEMORY,
      MinimumWorkingSetSize: z,
      MaximumWorkingSetSize: z,
      ActiveProcessLimit: 0,
      Affinity: z,
      PriorityClass: 0,
      SchedulingClass: 0
    },
    IoInfo: {
      ReadOperationCount: z,
      WriteOperationCount: z,
      OtherOperationCount: z,
      ReadTransferCount: z,
      WriteTransferCount: z,
      OtherTransferCount: z
    },
    ProcessMemoryLimit: newCapBytes,
    JobMemoryLimit: z,
    PeakProcessMemoryUsed: z,
    PeakJobMemoryUsed: z
  };
  if (!a.SetExtendedLimitInfo(handle, JobObjectExtendedLimitInformation, extInfo, koffi.sizeof(a.ExtendedLimitInfo))) {
    log.warn("pressure: SetExtendedLimitInfo failed", { pid, newCapMB: currentMB + marginMB });
  }
  const hProcess = a.OpenProcess(PROCESS_SET_QUOTA, 0, pid);
  if (typeof hProcess === "bigint" && hProcess !== 0n) {
    const wsBytes = BigInt(currentMB) * 1024n * 1024n;
    a.SetProcessWorkingSetSizeEx(hProcess, wsBytes, wsBytes, 0);
    a.CloseHandle(hProcess);
  }
}
function applyLinuxPressure(pid, currentMB, marginMB) {
  const newCap = BigInt(currentMB + marginMB) * 1024n * 1024n;
  try {
    const cgDir = `/sys/fs/cgroup/Workora-agent-${pid}`;
    if (fs3.existsSync(path4.join(cgDir, "memory.high"))) {
      fs3.writeFileSync(path4.join(cgDir, "memory.high"), String(newCap));
    }
  } catch {
  }
}

// src/daemon/spawnSafe.ts
var log2 = createLogger("daemon:spawn");
function envValue(env, name) {
  const key = Object.keys(env).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? env[key] : void 0;
}
function realFile(candidate) {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}
function resolveWindowsCommand(command, options, isFile = realFile) {
  const env = options.env ?? process.env;
  const cwd = typeof options.cwd === "string" ? options.cwd : process.cwd();
  const hasPath = /[\\/]/.test(command);
  const rawPath = envValue(env, "PATH") ?? "";
  const directories = hasPath ? [""] : [cwd, ...rawPath.split(";")];
  const rawExtensions = envValue(env, "PATHEXT") ?? ".COM;.EXE;.BAT;.CMD";
  const extensions = path5.win32.extname(command) ? [""] : ["", ...rawExtensions.split(";").filter(Boolean).map((extension2) => extension2.startsWith(".") ? extension2 : `.${extension2}`)];
  for (const rawDirectory of directories) {
    const directory = rawDirectory.replace(/^"|"$/g, "") || cwd;
    const base = hasPath ? path5.win32.isAbsolute(command) ? command : path5.win32.resolve(cwd, command) : path5.win32.join(directory, command);
    for (const extension2 of extensions) {
      const candidate = base + extension2;
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}
function spawnSafe(command, args2, options) {
  let child;
  if (process.platform === "win32" && !options.shell) {
    const resolved = resolveWindowsCommand(command, options);
    child = resolved ? (0, import_cross_spawn.spawn)(resolved, args2, options) : nodeSpawn(command, args2, options);
  } else {
    child = (0, import_cross_spawn.spawn)(command, args2, options);
  }
  applyResourceLimits(child);
  log2.debug("spawned", { pid: child.pid, cmd: command });
  return child;
}

// src/daemon/killTree.ts
import { execSync as execSync2 } from "node:child_process";
function killTree(proc) {
  const pid = proc.pid;
  if (!pid) return;
  if (process.platform === "win32") {
    try {
      execSync2(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } catch {
    }
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        proc.kill("SIGTERM");
      } catch {
      }
    }
  }
}

// src/daemon/runtime.ts
function initialTurnAdmission(cb) {
  let settled = false;
  return {
    accept() {
      if (settled) return;
      settled = true;
      cb.onInitialTurnAdmission();
    },
    reject(cause) {
      if (settled) return;
      settled = true;
      cb.onInitialTurnAdmission(cause instanceof Error ? cause : new Error(String(cause)));
    }
  };
}
function protocolAdmission() {
  let settled = false;
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    accept() {
      if (settled) return;
      settled = true;
      resolve();
    },
    reject(cause) {
      if (settled) return;
      settled = true;
      reject(cause instanceof Error ? cause : new Error(String(cause)));
    }
  };
}
function runtimeInstructionEnvelope(systemPrompt, input) {
  return `<Workora-runtime-instructions>
${systemPrompt}
</Workora-runtime-instructions>

<Workora-turn>
${input}
</Workora-turn>`;
}

// src/daemon/runtimeArtifacts.ts
import path7 from "node:path";

// src/daemon/stateFiles.ts
import { constants, lstatSync, mkdirSync, openSync, closeSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { lstat, mkdir, open, realpath, rename, rm } from "node:fs/promises";
import path6 from "node:path";
function contained(root, target) {
  return target === root || target.startsWith(root + path6.sep);
}
function targetWithin(root, relativePath) {
  const canonicalRoot = path6.resolve(root);
  const target = path6.resolve(canonicalRoot, relativePath || ".");
  if (!contained(canonicalRoot, target)) throw new Error("invalid managed state path");
  return target;
}
function pathParts(root, target) {
  const relative = path6.relative(path6.resolve(root), target);
  return relative === "" ? [] : relative.split(path6.sep);
}
function assertDirectory(stat3, dir) {
  if (stat3.isSymbolicLink()) throw new Error(`managed state path contains a symbolic link: ${dir}`);
  if (!stat3.isDirectory()) throw new Error(`managed state path is not a directory: ${dir}`);
}
function ensureManagedDirectorySync(root, relativePath) {
  const canonicalRoot = path6.resolve(root);
  assertDirectory(lstatSync(canonicalRoot), canonicalRoot);
  const target = targetWithin(canonicalRoot, relativePath);
  let current = canonicalRoot;
  for (const part of pathParts(canonicalRoot, target)) {
    current = path6.join(current, part);
    try {
      mkdirSync(current, { mode: 448 });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
    assertDirectory(lstatSync(current), current);
  }
  return target;
}
async function ensureManagedDirectory(root, relativePath) {
  const canonicalRoot = path6.resolve(root);
  assertDirectory(await lstat(canonicalRoot), canonicalRoot);
  const target = targetWithin(canonicalRoot, relativePath);
  let current = canonicalRoot;
  for (const part of pathParts(canonicalRoot, target)) {
    current = path6.join(current, part);
    try {
      await mkdir(current, { mode: 448 });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
    assertDirectory(await lstat(current), current);
  }
  return target;
}
async function managedFilePath(root, relativePath) {
  const canonicalRoot = path6.resolve(root);
  assertDirectory(await lstat(canonicalRoot), canonicalRoot);
  const target = targetWithin(canonicalRoot, relativePath);
  if (target === canonicalRoot) throw new Error("managed state file path cannot be the root directory");
  let current = canonicalRoot;
  for (const part of pathParts(canonicalRoot, path6.dirname(target))) {
    current = path6.join(current, part);
    assertDirectory(await lstat(current), current);
  }
  return target;
}
function tempPath(target) {
  return `${target}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
}
function atomicWriteManagedFileSync(root, relativePath, content, mode = 384) {
  const target = targetWithin(root, relativePath);
  ensureManagedDirectorySync(root, path6.relative(path6.resolve(root), path6.dirname(target)));
  const temp = tempPath(target);
  let fd;
  try {
    fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, mode);
    writeFileSync(fd, content, "utf8");
    closeSync(fd);
    fd = void 0;
    renameSync(temp, target);
  } catch (cause) {
    if (fd !== void 0) try {
      closeSync(fd);
    } catch {
    }
    try {
      rmSync(temp, { force: true });
    } catch {
    }
    throw cause;
  }
  return target;
}
async function atomicWriteManagedFile(root, relativePath, content, mode = 384) {
  const target = targetWithin(root, relativePath);
  await ensureManagedDirectory(root, path6.relative(path6.resolve(root), path6.dirname(target)));
  const temp = tempPath(target);
  let handle;
  try {
    handle = await open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, mode);
    await handle.writeFile(content, "utf8");
    await handle.close();
    handle = void 0;
    await rename(temp, target);
  } catch (cause) {
    if (handle) try {
      await handle.close();
    } catch {
    }
    try {
      await rm(temp, { force: true });
    } catch {
    }
    throw cause;
  }
  return target;
}
async function readManagedFile(root, relativePath, maxBytes) {
  const canonicalRoot = await realpath(path6.resolve(root));
  const rootStat = await lstat(path6.resolve(root));
  assertDirectory(rootStat, path6.resolve(root));
  const target = targetWithin(root, relativePath);
  const targetStat = await lstat(target);
  if (targetStat.isSymbolicLink()) throw new Error(`managed state file is a symbolic link: ${target}`);
  if (!targetStat.isFile()) throw new Error(`managed state path is not a file: ${target}`);
  const canonicalTarget = await realpath(target);
  if (!contained(canonicalRoot, canonicalTarget)) throw new Error("managed state path escapes its root");
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (maxBytes !== void 0) {
      const openedStat = await handle.stat();
      if (openedStat.size > maxBytes) throw new Error(`file too large (${openedStat.size} bytes, max ${maxBytes})`);
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

// src/daemon/runtimeArtifacts.ts
function writeRuntimeArtifact(stateDir, runtime, relativePath, content) {
  const runtimeRoot = path7.resolve(stateDir, ".runtime", runtime);
  const target = path7.resolve(runtimeRoot, relativePath);
  if (target !== runtimeRoot && !target.startsWith(runtimeRoot + path7.sep)) throw new Error("invalid runtime artifact path");
  const artifactPath = path7.relative(path7.resolve(stateDir), target);
  try {
    return atomicWriteManagedFileSync(stateDir, artifactPath, content);
  } catch (cause) {
    if (cause instanceof Error && cause.message === "invalid managed state path") throw new Error("invalid runtime artifact path", { cause });
    throw cause;
  }
}

// src/daemon/claudeRuntime.ts
var MAX = 2e3;
var clip = (s) => String(s ?? "").slice(0, MAX);
function summarize(tool, input) {
  if (!input || typeof input !== "object") return "";
  if (tool === "Bash") return clip(input.command).slice(0, 120);
  if (["Read", "Write", "Edit"].includes(tool)) return input.file_path ?? input.path ?? "";
  return "";
}
var CLAUDE_EFFORTS = /* @__PURE__ */ new Set(["low", "medium", "high", "xhigh", "max"]);
function buildClaudeArgs(p) {
  const args2 = [
    "-p",
    "--output-format",
    "stream-json",
    "--input-format",
    "stream-json",
    "--verbose",
    "--dangerously-skip-permissions",
    "--permission-mode",
    "bypassPermissions",
    "--include-partial-messages",
    "--disallowed-tools",
    "EnterPlanMode,ExitPlanMode,ScheduleWakeup,CronCreate,CronList,CronDelete,AskUserQuestion",
    ...p.promptFileFlag
  ];
  if (p.model) args2.push("--model", p.model);
  const effort = typeof p.reasoningEffort === "string" && CLAUDE_EFFORTS.has(p.reasoningEffort) ? p.reasoningEffort : null;
  if (effort) args2.push("--effort", effort);
  if (p.sessionId) args2.push("--resume", p.sessionId);
  return args2;
}
var claudeRuntime = {
  name: "claude",
  start(opts, cb) {
    let promptFlag = ["--append-system-prompt", opts.systemPrompt];
    try {
      const pf = writeRuntimeArtifact(opts.stateDir, "claude", "system-prompt.md", opts.systemPrompt);
      promptFlag = ["--append-system-prompt-file", pf];
    } catch {
    }
    const rc = opts.runtimeConfig;
    const args2 = buildClaudeArgs({
      promptFileFlag: promptFlag,
      model: opts.model,
      reasoningEffort: rc && typeof rc.reasoningEffort === "string" ? rc.reasoningEffort : null,
      sessionId: opts.sessionId
    });
    const proc = spawnSafe("claude", args2, { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"], env: opts.env });
    const admission = initialTurnAdmission(cb);
    const pendingWrites = /* @__PURE__ */ new Set();
    let sessionId = opts.sessionId ?? null;
    let finished = false;
    const finish = (code) => {
      if (finished) return;
      finished = true;
      cb.onExit(code);
    };
    const writeUser = (text) => {
      const input = protocolAdmission();
      pendingWrites.add(input);
      const m = { type: "user", message: { role: "user", content: [{ type: "text", text }] }, ...sessionId ? { session_id: sessionId } : {} };
      try {
        if (!proc.stdin) throw new Error("claude stdin unavailable");
        proc.stdin.write(JSON.stringify(m) + "\n", (error) => {
          pendingWrites.delete(input);
          if (error) input.reject(error);
          else input.accept();
        });
      } catch (error) {
        pendingWrites.delete(input);
        input.reject(error);
      }
      return input.promise;
    };
    void writeUser(opts.initialPrompt).then(() => admission.accept(), (error) => admission.reject(error));
    const rejectPendingWrites = (error) => {
      for (const input of pendingWrites) input.reject(error);
      pendingWrites.clear();
    };
    let buf = "";
    proc.stdout?.on("data", (c) => {
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) {
        if (ln.trim()) parseLine(ln);
      }
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString().trim();
      if (t) cb.log.debug("claude stderr", { t: t.slice(0, 300) });
    });
    proc.on("error", (e) => {
      admission.reject(e);
      rejectPendingWrites(e);
      cb.log.error("claude spawn failed", { detail: String(e?.message ?? e) });
      cb.onActivity("offline", "claude not found");
      finish(1);
    });
    proc.on("exit", (code) => {
      const error = new Error(`claude exited before input admission (${code ?? "signal"})`);
      admission.reject(error);
      rejectPendingWrites(error);
      finish(code);
    });
    function parseLine(line) {
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        return;
      }
      if (e.type === "system" && e.subtype === "init" && e.session_id) {
        sessionId = e.session_id;
        cb.onSession(e.session_id);
        cb.onActivity("working", "starting");
      } else if (e.type === "result") {
        if (e.session_id) {
          sessionId = e.session_id;
          cb.onSession(e.session_id);
        }
        cb.onActivity("online", "");
      } else if (e.type === "assistant") {
        const content = e.message?.content;
        const traj = [];
        let activity = "thinking", detail = "";
        if (Array.isArray(content)) {
          for (const b of content) {
            if (b.type === "thinking" && b.thinking) traj.push({ kind: "thinking", text: clip(b.thinking) });
            else if (b.type === "text" && b.text) traj.push({ kind: "text", text: clip(b.text) });
            else if (b.type === "tool_use") traj.push({ kind: "tool", toolName: b.name, toolInput: summarize(b.name, b.input) });
          }
          const tools = content.filter((c) => c.type === "tool_use");
          if (tools.length) {
            activity = "working";
            detail = summarize(tools[tools.length - 1].name, tools[tools.length - 1].input) || tools[tools.length - 1].name;
          }
        }
        cb.onActivity(activity, detail);
        if (traj.length) cb.onTrajectory(traj);
      }
    }
    return { pid: proc.pid, deliver: (text) => writeUser(text), stop: () => {
      killTree(proc);
    } };
  }
};

// src/daemon/codexRuntime.ts
var MAX2 = 2e3;
var clip2 = (s) => String(s ?? "").slice(0, MAX2);
var EFFORTS = /* @__PURE__ */ new Set(["none", "minimal", "low", "medium", "high", "xhigh"]);
function extractThreadId(r) {
  return r && (r.threadId || r.thread?.id || r.thread_id || r.id) || "";
}
function reasoningEffort(runtimeConfig) {
  const effort = runtimeConfig?.reasoningEffort;
  return typeof effort === "string" && EFFORTS.has(effort) ? effort : null;
}
function codexConfig(opts) {
  const effort = reasoningEffort(opts.runtimeConfig);
  return effort ? { model_reasoning_effort: effort } : null;
}
function turnParams(opts, threadId, text) {
  const effort = reasoningEffort(opts.runtimeConfig);
  return { threadId, input: [{ type: "text", text }], ...effort ? { effort } : {} };
}
var CodexClient = class {
  constructor(proc, cb) {
    this.proc = proc;
    this.cb = cb;
    proc.stdout?.on("data", (c) => {
      this.buf += c.toString();
      const lines = this.buf.split("\n");
      this.buf = lines.pop() ?? "";
      for (const ln of lines) {
        const t = ln.trim();
        if (t) this.handleLine(t);
      }
    });
  }
  proc;
  cb;
  nextId = 0;
  pending = /* @__PURE__ */ new Map();
  buf = "";
  proto = "unknown";
  threadId = "";
  onTurnDone = null;
  request(method, params) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.write({ jsonrpc: "2.0", id, method, params });
    });
  }
  notify(method, params) {
    this.write({ jsonrpc: "2.0", method, ...params ? { params } : {} });
  }
  respond(id, result) {
    this.write({ jsonrpc: "2.0", id, result });
  }
  write(o) {
    try {
      this.proc.stdin?.write(JSON.stringify(o) + "\n");
    } catch {
    }
  }
  closeAllPending(err) {
    for (const [id, p] of this.pending) {
      p.reject(err);
      this.pending.delete(id);
    }
  }
  handleLine(line) {
    let raw;
    try {
      raw = JSON.parse(line);
    } catch {
      return;
    }
    if (raw.id !== void 0 && (raw.result !== void 0 || raw.error !== void 0)) {
      const p = this.pending.get(raw.id);
      if (!p) return;
      this.pending.delete(raw.id);
      raw.error ? p.reject(new Error(raw.error.message || "rpc error")) : p.resolve(raw.result);
      return;
    }
    if (raw.id !== void 0 && raw.method) {
      this.handleServerRequest(raw.id, raw.method);
      return;
    }
    if (raw.method) this.handleNotification(raw.method, raw.params || {});
  }
  handleServerRequest(id, method) {
    if (method === "item/commandExecution/requestApproval" || method === "execCommandApproval" || method === "item/fileChange/requestApproval" || method === "applyPatchApproval" || method === "item/permissions/requestApproval") {
      this.respond(id, { decision: "accept" });
    } else if (method === "mcpServer/elicitation/request") {
      this.respond(id, { action: "accept", content: null, _meta: null });
    } else {
      this.write({ jsonrpc: "2.0", id, error: { code: -32601, message: "unhandled: " + method } });
    }
  }
  handleNotification(method, params) {
    if (method === "codex/event" || method.startsWith("codex/event/")) {
      this.proto = "legacy";
      if (params.msg) this.handleLegacy(params.msg);
      return;
    }
    if (this.proto !== "legacy") {
      if (this.proto === "unknown" && (method === "turn/started" || method === "turn/completed" || method === "thread/started" || method.startsWith("item/"))) this.proto = "raw";
      if (this.proto === "raw") this.handleRaw(method, params);
    }
  }
  handleRaw(method, params) {
    if (this.threadId && params.threadId && params.threadId !== this.threadId) return;
    if (method === "turn/started") {
      this.cb.onActivity("working", "turn");
    } else if (method === "turn/completed") {
      const status = params?.turn?.status;
      const aborted = ["cancelled", "canceled", "aborted", "interrupted"].includes(status);
      if (status === "failed") this.cb.onTrajectory([{ kind: "text", text: "[codex turn failed] " + (params?.turn?.error?.message || "") }]);
      this.cb.onActivity("online", "");
      this.onTurnDone?.(aborted);
    } else if (method === "item/agentMessage/delta" || method === "item/reasoning/summaryTextDelta" || method === "item/reasoning/textDelta") {
    } else if (method === "item/commandExecution/outputDelta" || method === "command/exec/outputDelta" || method === "process/outputDelta") {
    } else if (method === "item/started" || method === "item/completed") {
      const item = params?.item;
      if (!item) return;
      if ((item.type === "agentMessage" || item.type === "plan") && item.text) this.cb.onTrajectory([{ kind: "text", text: clip2(item.text) }]);
      else if (item.type === "reasoning") {
        const text = [...item.summary ?? [], ...item.content ?? []].join("\n");
        if (text) this.cb.onTrajectory([{ kind: "thinking", text: clip2(text) }]);
      } else if (method === "item/started" && item.type && item.type !== "userMessage") {
        const toolInput = item.command || item.path || item.name || item.reason || "";
        this.cb.onTrajectory([{ kind: "tool", toolName: item.type, toolInput: clip2(toolInput).slice(0, 160) }]);
      }
    } else if (method === "error") {
      if (!params.willRetry) {
        this.cb.onTrajectory([{ kind: "text", text: "[codex error] " + (params?.error?.message || params?.message || "") }]);
        this.onTurnDone?.(false);
      }
    }
  }
  handleLegacy(msg) {
    switch (msg.type) {
      case "task_started":
        this.cb.onActivity("working", "running");
        break;
      case "agent_message":
        if (msg.message) this.cb.onTrajectory([{ kind: "text", text: clip2(msg.message) }]);
        break;
      case "exec_command_begin":
        this.cb.onActivity("working", "Running command\u2026");
        this.cb.onTrajectory([{ kind: "tool", toolName: "exec_command", toolInput: clip2(msg.command).slice(0, 120) }]);
        break;
      case "patch_apply_begin":
        this.cb.onTrajectory([{ kind: "tool", toolName: "patch_apply" }]);
        break;
      case "task_complete":
        this.cb.onActivity("online", "");
        this.onTurnDone?.(false);
        break;
      case "turn_aborted":
        this.onTurnDone?.(true);
        break;
    }
  }
};
var codexRuntime = {
  name: "codex",
  experimental: true,
  start(opts, cb) {
    const proc = spawnSafe("codex", ["app-server", "--listen", "stdio://"], { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"], env: opts.env });
    const client = new CodexClient(proc, cb);
    const admission = initialTurnAdmission(cb);
    let ready = false;
    let spawnFailed = false;
    let reportedExit = false;
    const queue = [];
    let activeInput = null;
    let turnBusy = false;
    function reportExit(code) {
      if (reportedExit) return;
      reportedExit = true;
      cb.onExit(code);
    }
    client.onTurnDone = () => {
      activeInput = null;
      turnBusy = false;
      pump();
    };
    function enqueue(text, initial = false) {
      const input = { text, initial, admission: protocolAdmission() };
      queue.push(input);
      pump();
      return input.admission.promise;
    }
    function rejectQueued(error) {
      activeInput?.admission.reject(error);
      activeInput = null;
      for (const item of queue.splice(0)) item.admission.reject(error);
    }
    function pump() {
      if (!ready || turnBusy || queue.length === 0) return;
      const item = queue.shift();
      activeInput = item;
      turnBusy = true;
      cb.onActivity("working", "turn");
      client.request("turn/start", turnParams(opts, client.threadId, item.text)).then(() => {
        item.admission.accept();
        if (item.initial) admission.accept();
      }).catch((e) => {
        item.admission.reject(e);
        if (item.initial) admission.reject(e);
        if (spawnFailed) return;
        cb.log.warn("codex turn/start failed", { detail: String(e?.message ?? e) });
        if (activeInput === item) activeInput = null;
        turnBusy = false;
        pump();
      });
    }
    void enqueue(opts.initialPrompt, true).catch(() => {
    });
    (async () => {
      try {
        await client.request("initialize", { clientInfo: { name: "Workora", title: "Workora", version: "0.1.0" }, capabilities: { experimentalApi: true } });
        client.notify("initialized");
        let threadId = "";
        const cfg = codexConfig(opts);
        if (opts.sessionId) {
          try {
            const r = await client.request("thread/resume", { threadId: opts.sessionId, cwd: opts.cwd, model: opts.model || null, developerInstructions: opts.systemPrompt || null, ...cfg ? { config: cfg } : {} });
            threadId = extractThreadId(r);
          } catch (e) {
            cb.log.warn("codex resume failed; starting fresh", { detail: String(e) });
          }
        }
        if (!threadId) {
          const r = await client.request("thread/start", { model: opts.model || null, cwd: opts.cwd, developerInstructions: opts.systemPrompt || null, persistExtendedHistory: true, experimentalRawEvents: false, ...cfg ? { config: cfg } : {} });
          threadId = extractThreadId(r);
        }
        if (!threadId) {
          const error = new Error("codex thread/start returned no threadId");
          admission.reject(error);
          rejectQueued(error);
          cb.log.error(error.message);
          cb.onActivity("offline", "codex no thread");
          return;
        }
        client.threadId = threadId;
        cb.onSession(threadId);
        cb.log.info("codex thread ready", { threadId });
        ready = true;
        pump();
      } catch (e) {
        admission.reject(e);
        rejectQueued(e instanceof Error ? e : new Error(String(e)));
        if (spawnFailed) return;
        cb.log.error("codex init failed", { detail: String(e?.message ?? e) });
        cb.onActivity("offline", "codex init failed");
      }
    })();
    proc.stderr?.on("data", (c) => {
      const t = c.toString().trim();
      if (t) cb.log.debug("codex stderr", { t: t.slice(0, 300) });
    });
    proc.on("error", (e) => {
      admission.reject(e);
      spawnFailed = true;
      const detail = e.code === "ENOENT" ? "codex not found" : "codex spawn failed";
      rejectQueued(new Error(detail));
      client.closeAllPending(new Error(detail));
      cb.log.error("codex spawn failed", { detail: String(e?.message ?? e), code: e.code ?? "" });
      cb.onActivity("offline", detail);
      reportExit(1);
    });
    proc.on("exit", (code) => {
      const error = new Error("codex exited");
      admission.reject(error);
      rejectQueued(error);
      client.closeAllPending(error);
      reportExit(code);
    });
    return { pid: proc.pid, deliver: (text) => enqueue(text), stop: () => {
      rejectQueued(new Error("codex stopped before input admission"));
      killTree(proc);
    } };
  }
};

// src/daemon/copilotRuntime.ts
import { randomUUID } from "node:crypto";
import path8 from "node:path";
var MAX3 = 2e3;
var clip3 = (s) => String(s ?? "").slice(0, MAX3);
var EFFORTS2 = /* @__PURE__ */ new Set(["none", "low", "medium", "high", "xhigh", "max"]);
function reasoningEffort2(rc) {
  const e = rc?.reasoningEffort;
  return typeof e === "string" && EFFORTS2.has(e) ? e : null;
}
function summarizeToolArgs(tr) {
  let args2 = tr?.arguments;
  if (typeof args2 === "string") {
    try {
      args2 = JSON.parse(args2);
    } catch {
      return clip3(args2).slice(0, 160);
    }
  }
  if (!args2 || typeof args2 !== "object") return "";
  const v = args2.command ?? args2.path ?? args2.file_path ?? args2.filePath ?? args2.query ?? args2.pattern ?? args2.url ?? "";
  return clip3(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 160);
}
function handleCopilotEvent(evt) {
  const out = { trajectory: [] };
  const data = evt?.data ?? {};
  switch (evt?.type) {
    case "assistant.turn_start":
      out.activity = { activity: "working", detail: "turn" };
      break;
    case "assistant.message": {
      if (data.content) out.trajectory.push({ kind: "text", text: clip3(data.content) });
      if (Array.isArray(data.toolRequests))
        for (const tr of data.toolRequests)
          out.trajectory.push({ kind: "tool", toolName: String(tr?.name ?? "tool"), toolInput: summarizeToolArgs(tr) });
      break;
    }
    case "assistant.reasoning":
      if (data.content) out.trajectory.push({ kind: "thinking", text: clip3(data.content) });
      break;
    case "result":
      if (typeof evt.sessionId === "string" && evt.sessionId) out.sessionId = evt.sessionId;
      if (typeof evt.exitCode === "number") out.exitCode = evt.exitCode;
      break;
    case "session.error":
      out.error = clip3(data.message ?? data.error ?? "copilot session error");
      break;
  }
  return out;
}
function buildArgs(prompt, sessionId, model, effort) {
  const args2 = ["-p", prompt, "--output-format", "json", "--allow-all", "--no-ask-user", "--session-id", sessionId];
  const m = model && model !== "default" ? model : "";
  if (m) args2.push("--model", m);
  if (effort) args2.push("--effort", effort);
  return args2;
}
function copilotInstructionEnv(env, stateDir, systemPrompt) {
  const next = { ...env };
  const instructionFile = writeRuntimeArtifact(stateDir, "copilot", "instructions/AGENTS.md", systemPrompt);
  const instructionDir = path8.dirname(instructionFile);
  const existing = (next.COPILOT_CUSTOM_INSTRUCTIONS_DIRS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  next.COPILOT_CUSTOM_INSTRUCTIONS_DIRS = [.../* @__PURE__ */ new Set([...existing, instructionDir])].join(",");
  return next;
}
var CopilotRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    this.sessionId = opts.sessionId || randomUUID();
    this.env = copilotInstructionEnv(opts.env, opts.stateDir, opts.systemPrompt);
    delete this.env.NODE_OPTIONS;
    cb.onSession(this.sessionId);
    void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  sessionId;
  everSucceeded = false;
  env;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped) input.admission.reject(new Error("copilot stopped before input admission"));
    else {
      this.queue.push(input);
      this.pump();
    }
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const prompt = input.text;
    this.turnBusy = true;
    this.cb.onActivity("working", "turn");
    const args2 = buildArgs(prompt, this.sessionId, this.opts.model, reasoningEffort2(this.opts.runtimeConfig));
    const proc = spawnSafe("copilot", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: this.env });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let buf = "";
    let resultSeen = false;
    const errTail = [];
    let errLen = 0;
    const processLine = (ln) => {
      const t = ln.trim();
      if (!t) return;
      let evt;
      try {
        evt = JSON.parse(t);
      } catch {
        return;
      }
      const emit = handleCopilotEvent(evt);
      if (emit.exitCode !== void 0) resultSeen = true;
      if (emit.error) {
        this.cb.onTrajectory([{ kind: "text", text: "[copilot error] " + emit.error.slice(0, 500) }]);
        this.cb.onActivity("error", emit.error.slice(0, 200));
      }
      if (emit.activity) this.cb.onActivity(emit.activity.activity, emit.activity.detail);
      if (emit.trajectory.length) this.cb.onTrajectory(emit.trajectory);
    };
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) processLine(ln);
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 4096 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("copilot spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "copilot not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", (code) => {
      if (buf.trim()) processLine(buf);
      buf = "";
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      if (this.currentInput === input) this.currentInput = null;
      if (code === 0 || resultSeen) {
        this.everSucceeded = true;
        this.cb.onActivity("online", "");
        this.pump();
        return;
      }
      const tail = errTail.join("").trim();
      const last = tail.split("\n").filter(Boolean).pop() || `copilot exited ${code ?? "signal"}`;
      this.cb.onTrajectory([{ kind: "text", text: "[copilot error] " + clip3(tail).slice(0, 500) }]);
      this.cb.onActivity("error", last.slice(0, 200));
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(last));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  stop() {
    this.stopped = true;
    const error = new Error("copilot stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var copilotRuntime = {
  name: "copilot",
  experimental: true,
  start(opts, cb) {
    const run = new CopilotRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/opencodeRuntime.ts
import path9 from "node:path";
var MAX4 = 2e3;
var clip4 = (s) => String(s ?? "").slice(0, MAX4);
function variant(rc) {
  const e = rc?.reasoningEffort;
  return typeof e === "string" && e ? e : null;
}
function summarizeToolInput(input) {
  if (!input || typeof input !== "object") return clip4(input).slice(0, 160);
  const v = input.command ?? input.filePath ?? input.file_path ?? input.path ?? input.pattern ?? input.query ?? input.url ?? "";
  return clip4(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 160);
}
function handleOpencodeEvent(evt) {
  const out = { trajectory: [] };
  if (typeof evt?.sessionID === "string" && evt.sessionID) out.sessionId = evt.sessionID;
  const part = evt?.part ?? {};
  switch (evt?.type) {
    case "step_start":
      out.activity = { activity: "working", detail: "turn" };
      break;
    case "text":
      if (part.text) out.trajectory.push({ kind: "text", text: clip4(part.text) });
      break;
    case "reasoning":
      if (part.text) out.trajectory.push({ kind: "thinking", text: clip4(part.text) });
      break;
    case "tool_use": {
      const name = String(part.tool ?? "tool");
      const input = part.state?.input ?? part.input;
      out.trajectory.push({ kind: "tool", toolName: name, toolInput: summarizeToolInput(input) });
      break;
    }
    case "error":
      out.error = String(evt.error?.data?.message ?? evt.error?.name ?? "opencode error");
      break;
  }
  return out;
}
function buildArgs2(message, opts, sessionId, agentName) {
  const args2 = ["run", "--format", "json", "--dangerously-skip-permissions", "--dir", opts.cwd];
  args2.push("--agent", agentName);
  const model = opts.model && opts.model !== "default" ? opts.model : "";
  if (model) args2.push("--model", model);
  const v = variant(opts.runtimeConfig);
  if (v) args2.push("--variant", v);
  if (sessionId) args2.push("--session", sessionId);
  args2.push(message);
  return args2;
}
function opencodeInstructionEnv(env, stateDir, systemPrompt) {
  let existing = {};
  const raw = env.OPENCODE_CONFIG_CONTENT?.trim();
  if (raw) {
    try {
      existing = JSON.parse(raw);
    } catch {
      throw new Error("OPENCODE_CONFIG_CONTENT must be valid JSON before Workora can append instructions");
    }
    if (!existing || Array.isArray(existing) || typeof existing !== "object") throw new Error("OPENCODE_CONFIG_CONTENT must contain a JSON object");
  }
  const currentAgents = existing.agent;
  if (currentAgents !== void 0 && (!currentAgents || Array.isArray(currentAgents) || typeof currentAgents !== "object")) {
    throw new Error("OPENCODE_CONFIG_CONTENT.agent must contain a JSON object");
  }
  const suffix = path9.basename(stateDir).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "agent";
  const agentName = `Workora-${suffix}`;
  const merged = {
    ...existing,
    agent: {
      ...currentAgents,
      [agentName]: { mode: "primary", description: "Workora managed collaboration agent", prompt: systemPrompt }
    }
  };
  return { env: { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify(merged) }, agentName };
}
var OpencodeRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    this.sessionId = opts.sessionId ?? null;
    const configured = opencodeInstructionEnv({ ...opts.env, PWD: opts.cwd }, opts.stateDir, opts.systemPrompt);
    this.env = configured.env;
    this.agentName = configured.agentName;
    delete this.env.NODE_OPTIONS;
    if (this.sessionId) cb.onSession(this.sessionId);
    void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  sessionId;
  everSucceeded = false;
  env;
  agentName;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped) input.admission.reject(new Error("opencode stopped before input admission"));
    else {
      this.queue.push(input);
      this.pump();
    }
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const message = input.text;
    this.turnBusy = true;
    this.cb.onActivity("working", "turn");
    const args2 = buildArgs2(message, this.opts, this.sessionId, this.agentName);
    const proc = spawnSafe("opencode", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: this.env });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let buf = "";
    const errTail = [];
    let errLen = 0;
    const processLine = (ln) => {
      const t = ln.trim();
      if (!t) return;
      let evt;
      try {
        evt = JSON.parse(t);
      } catch {
        return;
      }
      const emit = handleOpencodeEvent(evt);
      if (emit.sessionId && emit.sessionId !== this.sessionId) {
        this.sessionId = emit.sessionId;
        this.cb.onSession(emit.sessionId);
      }
      if (emit.error) {
        this.cb.onTrajectory([{ kind: "text", text: "[opencode error] " + emit.error.slice(0, 500) }]);
        this.cb.onActivity("error", emit.error.slice(0, 200));
      }
      if (emit.activity) this.cb.onActivity(emit.activity.activity, emit.activity.detail);
      if (emit.trajectory.length) this.cb.onTrajectory(emit.trajectory);
    };
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) processLine(ln);
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 4096 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("opencode spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "opencode not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", (code) => {
      if (buf.trim()) processLine(buf);
      buf = "";
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      if (this.currentInput === input) this.currentInput = null;
      if (code === 0) {
        this.everSucceeded = true;
        this.cb.onActivity("online", "");
        this.pump();
        return;
      }
      const tail = errTail.join("").trim();
      const last = tail.split("\n").filter(Boolean).pop() || `opencode exited ${code ?? "signal"}`;
      this.cb.onTrajectory([{ kind: "text", text: "[opencode error] " + clip4(tail).slice(0, 500) }]);
      this.cb.onActivity("error", last.slice(0, 200));
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(last));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  stop() {
    this.stopped = true;
    const error = new Error("opencode stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var opencodeRuntime = {
  name: "opencode",
  experimental: true,
  start(opts, cb) {
    const run = new OpencodeRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/kimiRuntime.ts
var MAX5 = 2e3;
var clip5 = (s) => String(s ?? "").slice(0, MAX5);
function summarizeToolArgs2(argsJson) {
  let a = argsJson;
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      return clip5(a).slice(0, 160);
    }
  }
  if (!a || typeof a !== "object") return "";
  const v = a.command ?? a.filePath ?? a.file_path ?? a.path ?? a.pattern ?? a.query ?? a.url ?? "";
  return clip5(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 160);
}
function handleKimiEvent(evt) {
  const out = { trajectory: [] };
  if (evt?.role === "meta" && evt.type === "session.resume_hint" && typeof evt.session_id === "string") {
    out.sessionId = evt.session_id;
    return out;
  }
  if (evt?.role === "assistant") {
    if (typeof evt.content === "string" && evt.content) out.trajectory.push({ kind: "text", text: clip5(evt.content) });
    if (Array.isArray(evt.tool_calls))
      for (const tc of evt.tool_calls) {
        const fn = tc?.function ?? {};
        out.trajectory.push({ kind: "tool", toolName: String(fn.name ?? "tool"), toolInput: summarizeToolArgs2(fn.arguments) });
      }
  }
  return out;
}
function buildArgs3(prompt, model, sessionId) {
  const args2 = ["-p", prompt, "--output-format", "stream-json"];
  const m = model && model !== "default" ? model : "";
  if (m) args2.push("-m", m);
  if (sessionId) args2.push("-r", sessionId);
  return args2;
}
function buildKimiPrompt(systemPrompt, input) {
  return runtimeInstructionEnvelope(systemPrompt, input);
}
var KimiRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    this.sessionId = opts.sessionId ?? null;
    this.env = { ...opts.env, PWD: opts.cwd };
    delete this.env.NODE_OPTIONS;
    if (this.sessionId) cb.onSession(this.sessionId);
    void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  sessionId;
  everSucceeded = false;
  env;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped) input.admission.reject(new Error("kimi stopped before input admission"));
    else {
      this.queue.push(input);
      this.pump();
    }
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const prompt = buildKimiPrompt(this.opts.systemPrompt, input.text);
    this.turnBusy = true;
    this.cb.onActivity("working", "turn");
    const args2 = buildArgs3(prompt, this.opts.model, this.sessionId);
    const proc = spawnSafe("kimi", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: this.env });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let buf = "";
    const errTail = [];
    let errLen = 0;
    const processLine = (ln) => {
      const t = ln.trim();
      if (!t) return;
      let evt;
      try {
        evt = JSON.parse(t);
      } catch {
        return;
      }
      const emit = handleKimiEvent(evt);
      if (emit.sessionId && emit.sessionId !== this.sessionId) {
        this.sessionId = emit.sessionId;
        this.cb.onSession(emit.sessionId);
      }
      if (emit.activity) this.cb.onActivity(emit.activity.activity, emit.activity.detail);
      if (emit.trajectory.length) this.cb.onTrajectory(emit.trajectory);
    };
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) processLine(ln);
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 4096 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("kimi spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "kimi not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", (code) => {
      if (buf.trim()) processLine(buf);
      buf = "";
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      if (this.currentInput === input) this.currentInput = null;
      if (code === 0) {
        this.everSucceeded = true;
        this.cb.onActivity("online", "");
        this.pump();
        return;
      }
      const tail = errTail.join("").trim();
      if (/not found|no session|session .* not/i.test(tail)) this.sessionId = null;
      const last = tail.split("\n").filter(Boolean).pop() || `kimi exited ${code ?? "signal"}`;
      this.cb.onTrajectory([{ kind: "text", text: "[kimi error] " + clip5(tail).slice(0, 500) }]);
      this.cb.onActivity("error", last.slice(0, 200));
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(last));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  stop() {
    this.stopped = true;
    const error = new Error("kimi stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var kimiRuntime = {
  name: "kimi",
  experimental: true,
  start(opts, cb) {
    const run = new KimiRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/piRuntime.ts
import path10 from "node:path";
var MAX6 = 2e3;
var clip6 = (s) => String(s ?? "").slice(0, MAX6);
function summarizeToolArgs3(args2) {
  if (!args2 || typeof args2 !== "object") return clip6(args2).slice(0, 160);
  const v = args2.command ?? args2.filePath ?? args2.file_path ?? args2.path ?? args2.pattern ?? args2.query ?? args2.url ?? "";
  return clip6(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 160);
}
function handlePiEvent(evt) {
  const out = { trajectory: [] };
  if (evt?.type === "session" && typeof evt.id === "string") {
    out.sessionId = evt.id;
    return out;
  }
  if (evt?.type === "message_end" && evt.message?.role === "assistant") {
    const m = evt.message;
    if (Array.isArray(m.content))
      for (const b of m.content) {
        if (b?.type === "text" && b.text) out.trajectory.push({ kind: "text", text: clip6(b.text) });
        else if (b?.type === "toolCall") out.trajectory.push({ kind: "tool", toolName: String(b.name ?? "tool"), toolInput: summarizeToolArgs3(b.arguments) });
      }
    if (m.stopReason === "error") out.error = String(m.errorMessage ?? "pi model error (no message)");
  }
  return out;
}
function buildArgs4(prompt, model, sessionId, cwd, promptFile) {
  const args2 = ["-p", prompt, "--mode", "json", "--append-system-prompt", promptFile, "--session-dir", cwd];
  const m = model && model !== "default" ? model : "";
  if (m) args2.push("--model", m);
  if (sessionId) args2.push("--session", sessionId);
  return args2;
}
var PiRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    this.sessionId = opts.sessionId ?? null;
    this.promptFile = path10.join(opts.stateDir, ".runtime", "pi", "system-prompt.md");
    this.env = { ...opts.env };
    delete this.env.NODE_OPTIONS;
    try {
      writeRuntimeArtifact(opts.stateDir, "pi", "system-prompt.md", opts.systemPrompt);
    } catch (e) {
      this.promptWriteFailed = true;
      cb.log.warn("pi: system-prompt write failed", { detail: String(e) });
    }
    if (this.sessionId) cb.onSession(this.sessionId);
    void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  sessionId;
  everSucceeded = false;
  promptFile;
  env;
  promptWriteFailed = false;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped) input.admission.reject(new Error("pi stopped before input admission"));
    else {
      this.queue.push(input);
      this.pump();
    }
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const prompt = input.text;
    this.turnBusy = true;
    if (this.promptWriteFailed) {
      input.admission.reject(new Error("pi system-prompt write failed"));
      if (input.initial) this.admission.reject(new Error("pi system-prompt write failed"));
      this.currentInput = null;
      this.cb.onTrajectory([{ kind: "text", text: "[pi error] system-prompt write failed \u2014 check cwd permissions" }]);
      this.cb.onActivity("error", "pi: system-prompt write failed");
      this.turnBusy = false;
      if (!this.everSucceeded) {
        this.rejectQueue(new Error("pi system-prompt write failed"));
        this.reportExit(1);
        return;
      }
      return;
    }
    this.cb.onActivity("working", "turn");
    const args2 = buildArgs4(prompt, this.opts.model, this.sessionId, this.opts.stateDir, this.promptFile);
    const proc = spawnSafe("pi", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: this.env });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let buf = "";
    const errTail = [];
    let errLen = 0;
    const processLine = (ln) => {
      const t = ln.trim();
      if (!t) return;
      let evt;
      try {
        evt = JSON.parse(t);
      } catch {
        return;
      }
      const emit = handlePiEvent(evt);
      if (emit.sessionId && emit.sessionId !== this.sessionId) {
        this.sessionId = emit.sessionId;
        this.cb.onSession(emit.sessionId);
      }
      if (emit.trajectory.length) this.cb.onTrajectory(emit.trajectory);
      if (emit.error) {
        this.cb.onTrajectory([{ kind: "text", text: "[pi error] " + clip6(emit.error).slice(0, 500) }]);
        this.cb.onActivity("error", emit.error.slice(0, 200));
      }
    };
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) processLine(ln);
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 4096 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("pi spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "pi not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", (code) => {
      if (buf.trim()) processLine(buf);
      buf = "";
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      if (this.currentInput === input) this.currentInput = null;
      if (code === 0) {
        this.everSucceeded = true;
        this.cb.onActivity("online", "");
        this.pump();
        return;
      }
      const tail = errTail.join("").trim();
      const last = tail.split("\n").filter(Boolean).pop() || `pi exited ${code ?? "signal"}`;
      this.cb.onTrajectory([{ kind: "text", text: "[pi error] " + clip6(tail).slice(0, 500) }]);
      this.cb.onActivity("error", last.slice(0, 200));
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(last));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  stop() {
    this.stopped = true;
    const error = new Error("pi stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var piRuntime = {
  name: "pi",
  experimental: true,
  start(opts, cb) {
    const run = new PiRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/cursorRuntime.ts
import path11 from "node:path";
var MAX7 = 2e3;
var clip7 = (s) => String(s ?? "").slice(0, MAX7);
function summarizeToolArgs4(args2) {
  if (!args2 || typeof args2 !== "object") return clip7(args2).slice(0, 160);
  const v = args2.command ?? args2.filePath ?? args2.file_path ?? args2.path ?? args2.pattern ?? args2.query ?? args2.url ?? "";
  return clip7(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 160);
}
function handleCursorEvent(evt) {
  const out = { trajectory: [] };
  if (typeof evt?.session_id === "string" && evt.session_id) out.sessionId = evt.session_id;
  if (evt?.type === "tool_call" && evt.subtype === "started") {
    const tc = evt.tool_call;
    if (tc && typeof tc === "object") {
      const key = Object.keys(tc).find((k) => k.endsWith("ToolCall")) ?? Object.keys(tc)[0] ?? "tool";
      const name = key.replace(/ToolCall$/, "") || "tool";
      out.trajectory.push({ kind: "tool", toolName: name, toolInput: summarizeToolArgs4(tc[key]?.args) });
    }
  } else if (evt?.type === "result") {
    out.resultSeen = true;
    if (evt.is_error) out.error = clip7(evt.result) || "cursor reported an error";
    else if (evt.result != null) out.trajectory.push({ kind: "text", text: clip7(evt.result) });
  } else if (evt?.type === "system" && evt?.subtype === "error") {
    out.error = clip7(evt.error ?? evt.message ?? "cursor system error");
  }
  return out;
}
function buildCursorArgs(prompt, model, sessionId, pluginDir) {
  const args2 = ["-p", prompt, "--output-format", "stream-json", "-f", "--plugin-dir", pluginDir];
  const m = model && model !== "default" ? model : "";
  if (m) args2.push("--model", m);
  if (sessionId) args2.push("--resume", sessionId);
  return args2;
}
function prepareCursorPlugin(stateDir, systemPrompt) {
  const suffix = path11.basename(stateDir).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "agent";
  const manifest = JSON.stringify({ name: `Workora-${suffix}`, version: "0.0.0", description: "Workora managed runtime instructions" }, null, 2) + "\n";
  const rule = `---
description: Workora collaboration runtime
globs:
alwaysApply: true
---

${systemPrompt}
`;
  const manifestFile = writeRuntimeArtifact(stateDir, "cursor", "plugin/.cursor-plugin/plugin.json", manifest);
  writeRuntimeArtifact(stateDir, "cursor", "plugin/rules/Workora.mdc", rule);
  return path11.dirname(path11.dirname(manifestFile));
}
var CursorRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    this.sessionId = opts.sessionId ?? null;
    this.env = { ...opts.env };
    delete this.env.NODE_OPTIONS;
    this.pluginDir = prepareCursorPlugin(opts.stateDir, opts.systemPrompt);
    if (this.sessionId) cb.onSession(this.sessionId);
    void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  sessionId;
  everSucceeded = false;
  env;
  pluginDir;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped) input.admission.reject(new Error("cursor stopped before input admission"));
    else {
      this.queue.push(input);
      this.pump();
    }
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const prompt = input.text;
    this.turnBusy = true;
    this.cb.onActivity("working", "turn");
    const args2 = buildCursorArgs(prompt, this.opts.model, this.sessionId, this.pluginDir);
    const proc = spawnSafe("cursor-agent", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: this.env });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let buf = "";
    let resultSeen = false;
    let resultError = false;
    const errTail = [];
    let errLen = 0;
    const processLine = (ln) => {
      const t = ln.trim();
      if (!t) return;
      let evt;
      try {
        evt = JSON.parse(t);
      } catch {
        return;
      }
      const emit = handleCursorEvent(evt);
      if (emit.sessionId && emit.sessionId !== this.sessionId) {
        this.sessionId = emit.sessionId;
        this.cb.onSession(emit.sessionId);
      }
      if (emit.resultSeen) resultSeen = true;
      if (emit.error) {
        resultError = true;
        this.cb.onTrajectory([{ kind: "text", text: "[cursor error] " + clip7(emit.error).slice(0, 500) }]);
        this.cb.onActivity("error", emit.error.slice(0, 200));
      }
      if (emit.trajectory.length) this.cb.onTrajectory(emit.trajectory);
    };
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      buf += c.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const ln of lines) processLine(ln);
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 4096 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("cursor spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "cursor-agent not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", (code) => {
      if (buf.trim()) processLine(buf);
      buf = "";
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      if (this.currentInput === input) this.currentInput = null;
      if (code === 0) {
        if (!resultError) {
          this.everSucceeded = true;
          this.cb.onActivity("online", "");
        } else if (!this.everSucceeded) {
          this.rejectQueue(new Error("cursor initial turn failed"));
          this.reportExit(1);
          return;
        }
        this.pump();
        return;
      }
      if (!resultError) {
        const tail = errTail.join("").trim();
        const last = tail.split("\n").filter(Boolean).pop() || `cursor-agent exited ${code ?? "signal"}`;
        this.cb.onTrajectory([{ kind: "text", text: "[cursor error] " + clip7(tail).slice(0, 500) }]);
        this.cb.onActivity("error", last.slice(0, 200));
      }
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(`cursor-agent exited ${code ?? "signal"}`));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  stop() {
    this.stopped = true;
    const error = new Error("cursor stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var cursorRuntime = {
  name: "cursor",
  experimental: true,
  start(opts, cb) {
    const run = new CursorRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/hermesRuntime.ts
import { existsSync } from "node:fs";
import { readFile as readFile2, unlink } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path12 from "node:path";
var MAX8 = 4e3;
var clip8 = (s) => String(s ?? "").slice(0, MAX8);
var FINAL_RESPONSE_MAX = 2400;
function hermesProfile(model, runtimeConfig) {
  const configured = runtimeConfig?.profile;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  if (model && model !== "default") return model;
  return "default";
}
function hermesProfileRoots(home = homedir(), env = process.env) {
  return [env.HERMES_PROFILE_DIR, path12.join(home, ".hermes", "profiles")].filter((v) => !!v);
}
function buildHermesPrompt(message, opts) {
  return [
    "[Workora runtime context]",
    `You are running in the operator-selected project directory: ${opts.cwd}`,
    `Your Workora-owned state directory is: ${opts.stateDir}`,
    "Follow this Workora system prompt for collaboration, @mentions, and reporting:",
    opts.systemPrompt,
    "",
    "[Workora message]",
    message
  ].join("\n");
}
function buildHermesArgs(prompt, sessionId) {
  const args2 = ["chat", "-q", prompt, "-Q", "--source", "Workora"];
  if (sessionId) args2.push("--resume", sessionId);
  return args2;
}
function parseHermesSessionId(stderr) {
  const matches = [...stderr.matchAll(/^session_id:\s*(\S+)\s*$/gm)];
  return matches.length ? matches[matches.length - 1][1] : null;
}
function isMissingHermesSession(stderr) {
  return /Session not found:/i.test(stderr);
}
function parseHermesTurnEvents(jsonl) {
  const state = { sent: false, held: false, checked: false, checkCount: null, engaged: false, target: null };
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    let evt;
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }
    if (evt.type === "send") state.sent = true;
    if (evt.type === "held") state.held = true;
    if (evt.type === "check") {
      state.checked = true;
      state.checkCount = typeof evt.count === "number" ? evt.count : null;
    }
    if ((evt.type === "check" || evt.type === "read") && typeof evt.target === "string" && evt.target.trim()) {
      state.engaged = true;
      state.target = evt.target.trim();
      if (evt.type === "check") {
        if (typeof evt.messageId === "string") state.messageId = evt.messageId;
        if (typeof evt.grant === "string") state.grant = evt.grant;
      }
    }
  }
  return state;
}
function cleanHermesStdout(stdout) {
  let lines = stdout.trim().split(/\r?\n/).map((line) => line.trimEnd());
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && /^(⚠|Warning:)/.test(lines[0].trim())) lines.shift();
  while (lines.length && !lines[0].trim()) lines.shift();
  const content = lines.join("\n").trim();
  if (!content) return { ok: false, reason: "empty-stdout" };
  if (/^(No new messages\.|Sent to |Freshness hold:)/.test(content)) return { ok: false, reason: "cli-output" };
  if (/^(Error:|Code:|Exception:|Traceback\b|Unhandled\b)/i.test(content)) return { ok: false, reason: "error-output" };
  if (/^(┊|diff --git\b|@@\s+-|\+\+\+ |--- )/m.test(content) || /\na\/.+\s+→\s+b\/.+/.test(content)) {
    return { ok: false, reason: "diff-output" };
  }
  return { ok: true, target: "", content: content.slice(0, FINAL_RESPONSE_MAX) };
}
function hermesBridgeDecision(stdout, state) {
  if (state.sent) return { ok: false, reason: "already-sent" };
  if (state.held) return { ok: false, reason: "already-held" };
  if (state.checked && state.checkCount === 0 && !state.engaged) return { ok: false, reason: "empty-inbox" };
  if (!state.engaged || !state.target) return { ok: false, reason: "no-Workora-read" };
  if (!/^(#|dm:|thread:)/.test(state.target)) return { ok: false, reason: "invalid-target" };
  if (!state.messageId) return { ok: false, reason: "no-reply-trigger" };
  const cleaned = cleanHermesStdout(stdout);
  if (!cleaned.ok) return cleaned;
  return { ok: true, target: state.target, content: cleaned.content, replyTo: state.messageId, hasGrant: state.grant === "primary" || state.grant === "directed" || state.grant === "supplemental" };
}
async function responseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
async function postHermesBridgeMessage(fetchImpl, serverUrl2, headers, target, content, replyTo) {
  const url = `${serverUrl2}/agent-api/message/send`;
  const first = await fetchImpl(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ target, content, replyTo })
  });
  const firstBody = await responseJson(first);
  if (!first.ok) return { ok: false, status: first.status };
  if (!firstBody?.held) return { ok: true };
  const held = { ok: false, held: true, sentDraft: false };
  if (typeof firstBody.text === "string") held.text = firstBody.text;
  return held;
}
function hermesProfileHome(profile, home = homedir(), roots = hermesProfileRoots(home)) {
  if (!profile || profile === "default") return null;
  for (const root of roots) {
    const dir = path12.join(root, profile);
    if (existsSync(dir)) return dir;
  }
  return null;
}
function hermesRuntimeEnv(baseEnv, cwd, requestedProfile, home = homedir()) {
  const env = { ...baseEnv, PWD: cwd };
  delete env.NODE_OPTIONS;
  delete env.HERMES_HOME;
  delete env.HERMES_PROFILE;
  const profileHome = hermesProfileHome(requestedProfile, home, hermesProfileRoots(home, env));
  const profile = requestedProfile === "default" || profileHome ? requestedProfile : "default";
  if (profileHome) {
    env.HERMES_HOME = profileHome;
    env.HERMES_PROFILE = profile;
  }
  return { env, profile };
}
var HermesRun = class {
  constructor(opts, cb) {
    this.opts = opts;
    this.cb = cb;
    this.admission = initialTurnAdmission(cb);
    const requestedProfile = hermesProfile(opts.model, opts.runtimeConfig);
    const resolved = hermesRuntimeEnv(opts.env, opts.cwd, requestedProfile);
    this.env = resolved.env;
    this.profile = resolved.profile;
    if (requestedProfile !== "default" && this.profile === "default") {
      cb.log.warn("hermes profile not found; using default profile", { profile: requestedProfile });
    }
    this.sessionId = opts.sessionId ?? null;
    if (this.sessionId) cb.onSession(this.sessionId);
    if (opts.initialPrompt.trim()) void this.enqueue(opts.initialPrompt, true).catch(() => {
    });
    else this.admission.reject(new Error("hermes initial prompt is empty"));
  }
  opts;
  cb;
  queue = [];
  turnBusy = false;
  stopped = false;
  proc = null;
  everSucceeded = false;
  env;
  profile;
  sessionId;
  admission;
  currentInput = null;
  exitReported = false;
  reportExit(code) {
    if (this.exitReported) return;
    this.exitReported = true;
    this.cb.onExit(code);
  }
  enqueue(text, initial = false) {
    const input = { text, initial, admission: protocolAdmission() };
    if (this.stopped || !text.trim()) {
      input.admission.reject(new Error(this.stopped ? "hermes stopped before input admission" : "hermes input is empty"));
      return input.admission.promise;
    }
    this.queue.push(input);
    this.pump();
    return input.admission.promise;
  }
  pump() {
    if (this.stopped || this.turnBusy || this.queue.length === 0) return;
    this.runTurn(this.queue.shift());
  }
  rejectQueue(error) {
    for (const input of this.queue.splice(0)) input.admission.reject(error);
  }
  runTurn(input) {
    this.currentInput = input;
    const message = input.text;
    this.turnBusy = true;
    this.cb.onActivity("working", `hermes/${this.profile}`);
    const prompt = buildHermesPrompt(message, this.opts);
    const args2 = buildHermesArgs(prompt, this.sessionId);
    const turnFile = path12.join(tmpdir(), `Workora-hermes-turn-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
    const proc = spawnSafe("hermes", args2, { cwd: this.opts.cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...this.env, OPEN_WORKORA_TURN_FILE: turnFile } });
    this.proc = proc;
    proc.once("spawn", () => {
      input.admission.accept();
      if (input.initial) this.admission.accept();
    });
    let stdout = "";
    const errTail = [];
    let errLen = 0;
    proc.stdout?.on("data", (c) => {
      if (this.stopped) return;
      if (stdout.length < MAX8) stdout += c.toString();
    });
    proc.stderr?.on("data", (c) => {
      const t = c.toString();
      errTail.push(t);
      errLen += t.length;
      while (errLen > 16384 && errTail.length > 1) errLen -= errTail.shift().length;
    });
    proc.on("error", (e) => {
      input.admission.reject(e);
      if (input.initial) this.admission.reject(e);
      if (this.currentInput === input) this.currentInput = null;
      this.proc = null;
      this.turnBusy = false;
      if (this.stopped) return;
      this.cb.log.error("hermes spawn failed", { detail: String(e?.message ?? e) });
      this.cb.onActivity("offline", "hermes not found");
      if (!this.everSucceeded) {
        this.rejectQueue(e instanceof Error ? e : new Error(String(e)));
        this.reportExit(1);
      } else this.pump();
    });
    proc.on("exit", async (code) => {
      this.proc = null;
      if (this.currentInput === input) this.currentInput = null;
      if (this.stopped) {
        this.reportExit(code);
        return;
      }
      const out = stdout.trim();
      const tail = errTail.join("").trim();
      if (code === 0) {
        this.everSucceeded = true;
        const nextSessionId = parseHermesSessionId(tail);
        if (nextSessionId && nextSessionId !== this.sessionId) {
          this.sessionId = nextSessionId;
          this.cb.onSession(nextSessionId);
        }
        const bridged = await this.bridgeFinalResponse(turnFile, out);
        if (out) this.cb.onTrajectory([{ kind: "text", text: clip8(out) }]);
        if (bridged !== false) this.cb.onActivity("online", "");
        this.turnBusy = false;
        this.pump();
        return;
      }
      if (this.sessionId && isMissingHermesSession(tail)) {
        this.cb.log.warn("hermes resume session missing; retrying fresh", { sessionId: this.sessionId });
        this.sessionId = null;
        this.cb.onSession(null);
        this.queue.unshift(input);
        this.turnBusy = false;
        this.pump();
        return;
      }
      const last = tail.split("\n").filter(Boolean).pop() || `hermes exited ${code ?? "signal"}`;
      this.cb.onTrajectory([{ kind: "text", text: "[hermes error] " + clip8(tail || last).slice(0, 800) }]);
      this.cb.onActivity("error", last.slice(0, 200));
      this.turnBusy = false;
      if (!this.everSucceeded) {
        this.rejectQueue(new Error(last));
        this.reportExit(code ?? 1);
        return;
      }
      this.pump();
    });
  }
  async bridgeFinalResponse(turnFile, stdout) {
    let state = { sent: false, held: false, checked: false, checkCount: null, engaged: false, target: null };
    try {
      state = parseHermesTurnEvents(await readFile2(turnFile, "utf8"));
    } catch {
    } finally {
      try {
        await unlink(turnFile);
      } catch {
      }
    }
    const decision = hermesBridgeDecision(stdout, state);
    if (!decision.ok) {
      if (stdout.trim() && decision.reason !== "already-sent" && decision.reason !== "empty-inbox") {
        this.cb.log.warn("hermes final response not bridged", { reason: decision.reason });
        this.cb.onActivity("error", `hermes reply not sent (${decision.reason})`);
        return false;
      }
      return null;
    }
    try {
      if (!decision.hasGrant) {
        const grantRes = await fetch(`${this.env.OPEN_WORKORA_SERVER_URL ?? ""}/agent-api/message/decide`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.env.OPEN_WORKORA_AGENT_TOKEN ?? ""}`,
            "x-agent-id": this.env.OPEN_WORKORA_AGENT_ID ?? "",
            "content-type": "application/json"
          },
          body: JSON.stringify({ messageId: decision.replyTo, decision: "request_reply", reason: "ownership", summary: "one-shot runtime produced a substantive final response" })
        });
        const grantBody = await responseJson(grantRes);
        if (!grantRes.ok || !grantBody?.grant) {
          this.cb.log.info("hermes final response stayed silent without reply grant", { status: grantRes.status, target: decision.target });
          return null;
        }
      }
      const result = await postHermesBridgeMessage(fetch, this.env.OPEN_WORKORA_SERVER_URL ?? "", {
        authorization: `Bearer ${this.env.OPEN_WORKORA_AGENT_TOKEN ?? ""}`,
        "x-agent-id": this.env.OPEN_WORKORA_AGENT_ID ?? "",
        "content-type": "application/json"
      }, decision.target, decision.content, decision.replyTo);
      if (!result.ok) {
        if (result.held) {
          this.cb.log.warn("hermes final response freshness-held; draft saved for review", { target: decision.target });
          if (result.text) this.cb.onTrajectory([{ kind: "status", text: "[Workora freshness hold]\n" + clip8(result.text) }]);
          this.cb.onActivity("error", "hermes reply held for freshness review");
          return false;
        }
        this.cb.log.warn("hermes final response bridge failed", { status: result.status, target: decision.target });
        this.cb.onActivity("error", "hermes bridge send failed");
        return false;
      } else {
        this.cb.log.info("hermes final response bridged", { target: decision.target, chars: decision.content.length, held: !!result.held });
        return true;
      }
    } catch (e) {
      this.cb.log.warn("hermes final response bridge failed", { detail: String(e?.message ?? e), target: decision.target });
      this.cb.onActivity("error", "hermes bridge send failed");
      return false;
    }
  }
  stop() {
    this.stopped = true;
    const error = new Error("hermes stopped before input admission");
    this.currentInput?.admission.reject(error);
    this.currentInput = null;
    this.rejectQueue(error);
    const p = this.proc;
    this.proc = null;
    if (p) killTree(p);
    else this.reportExit(0);
  }
};
var hermesRuntime = {
  name: "hermes",
  experimental: true,
  oneShotWake: true,
  start(opts, cb) {
    const run = new HermesRun(opts, cb);
    return { get pid() {
      return run.proc?.pid ?? 0;
    }, deliver: (text) => run.enqueue(text), stop: () => run.stop() };
  }
};

// src/daemon/runtimes.ts
function has(tool) {
  try {
    if (process.platform === "win32") {
      execSync3(`where ${tool} 2>nul`, { stdio: "pipe" });
    } else {
      execSync3(`command -v ${tool}`, { stdio: "pipe" });
    }
    return true;
  } catch {
    return false;
  }
}
function detectRuntimes() {
  return ["claude", "codex", "copilot", "kimi", "opencode", "pi", "cursor-agent", "hermes"].filter(has).map((t) => t === "cursor-agent" ? "cursor" : t);
}
var REG = { claude: claudeRuntime, codex: codexRuntime, copilot: copilotRuntime, opencode: opencodeRuntime, kimi: kimiRuntime, pi: piRuntime, cursor: cursorRuntime, hermes: hermesRuntime };
function getRuntime(name) {
  return REG[name] ?? null;
}

// src/daemon/resourceBudget.ts
import os2 from "node:os";
import { readFileSync } from "node:fs";
var PRESSURE_MEM_MB = Number(process.env.OPEN_WORKORA_PRESSURE_MEM_MB ?? "500");
var ResourceBudget = class {
  totalMemMB;
  totalCpuCores;
  queueLength = 0;
  cpuPrev = null;
  agentCount = 0;
  actualUsedMemMB = 0;
  _availableMemMB;
  constructor(opts) {
    this.totalMemMB = opts?.totalMemMB ?? Math.floor(os2.totalmem() / (1024 * 1024));
    this.totalCpuCores = opts?.totalCpuCores ?? os2.cpus().length;
    this._availableMemMB = opts?.availableMemMB;
    this.cpuPrev = this.sampleCpu();
  }
  sampleCpu() {
    const cpus = os2.cpus();
    let idle = 0, total = 0;
    for (const cpu of cpus) {
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
      idle += cpu.times.idle;
    }
    return { idle, total };
  }
  calcCpuUsage() {
    const cur = this.sampleCpu();
    if (!this.cpuPrev) {
      this.cpuPrev = cur;
      return 0;
    }
    const dTotal = Math.max(cur.total - this.cpuPrev.total, 1);
    const dIdle = cur.idle - this.cpuPrev.idle;
    this.cpuPrev = cur;
    return Math.round((1 - dIdle / dTotal) * 100);
  }
  /** Number of agents that have passed tryAllocate() but haven't finished startNow(). */
  pendingStarts = 0;
  /** Reserve a slot for an in-flight start. Returns false if under pressure. */
  tryAllocate() {
    if (this.availableMemMB() >= PRESSURE_MEM_MB) {
      this.pendingStarts++;
      return true;
    }
    return false;
  }
  /** Release a previously reserved slot. */
  release() {
    this.pendingStarts = Math.max(0, this.pendingStarts - 1);
  }
  /** Stateless snapshot — prefer tryAllocate() for burst-safe checks. */
  canAllocate() {
    return this.availableMemMB() >= PRESSURE_MEM_MB;
  }
  availableMemMB() {
    if (this._availableMemMB) return this._availableMemMB();
    if (process.platform === "linux") {
      try {
        const m = readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)\s+kB/);
        if (m) return Math.floor(Number(m[1]) / 1024);
      } catch {
      }
    }
    return Math.floor(os2.totalmem() / (1024 * 1024) * 0.15);
  }
  status() {
    return {
      totalMemMB: this.totalMemMB,
      totalCpuCores: this.totalCpuCores,
      queueLength: this.queueLength,
      availableMemMB: this.availableMemMB(),
      cpuUsagePct: this.calcCpuUsage(),
      agentCount: this.agentCount,
      actualUsedMemMB: this.actualUsedMemMB
    };
  }
};

// src/daemon/deliveryAdmissionStore.ts
import { mkdir as mkdir2, open as open2, readFile as readFile3, rename as rename2, stat, unlink as unlink2, writeFile } from "node:fs/promises";
import path13 from "node:path";
var MAX_ADMISSIONS = 1e4;
var LOCK_STALE_MS = 3e4;
var LOCK_WAIT_MS = 25;
var LOCK_TIMEOUT_MS = 5e3;
var DeliveryAdmissionStore = class {
  file;
  lockFile;
  entries = /* @__PURE__ */ new Map();
  loadPromise = null;
  writeTail = Promise.resolve();
  constructor(dataDir) {
    this.file = path13.join(dataDir, ".delivery-admissions.json");
    this.lockFile = `${this.file}.lock`;
  }
  async has(id, now = Date.now()) {
    await this.load();
    await this.loadFromDisk();
    const expiresAt = this.entries.get(id);
    if (!expiresAt) return false;
    if (expiresAt > now) return true;
    this.entries.delete(id);
    return false;
  }
  async remember(id, expiresAt) {
    await this.load();
    this.entries.set(id, expiresAt);
    this.prune(Date.now());
    const write = this.writeTail.then(() => this.persist());
    this.writeTail = write.catch(() => {
    });
    await write;
  }
  load() {
    this.loadPromise ??= this.loadFromDisk();
    return this.loadPromise;
  }
  async loadFromDisk() {
    let parsed;
    try {
      parsed = JSON.parse(await readFile3(this.file, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    if (!Array.isArray(parsed)) throw new Error("delivery admission ledger must be an array");
    const now = Date.now();
    for (const item of parsed) {
      if (!item || typeof item.id !== "string" || typeof item.expiresAt !== "number" || item.expiresAt <= now) continue;
      this.entries.set(item.id, item.expiresAt);
    }
    this.prune(now);
  }
  prune(now) {
    for (const [id, expiresAt] of this.entries) if (expiresAt <= now) this.entries.delete(id);
    if (this.entries.size <= MAX_ADMISSIONS) return;
    const oldest = [...this.entries].sort((a, b) => a[1] - b[1]).slice(0, this.entries.size - MAX_ADMISSIONS);
    for (const [id] of oldest) this.entries.delete(id);
  }
  async persist() {
    await mkdir2(path13.dirname(this.file), { recursive: true });
    await this.withFileLock(async () => {
      const now = Date.now();
      let diskRows = [];
      try {
        diskRows = JSON.parse(await readFile3(this.file, "utf8"));
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      if (!Array.isArray(diskRows)) throw new Error("delivery admission ledger must be an array");
      for (const item of diskRows) {
        if (!item || typeof item.id !== "string" || typeof item.expiresAt !== "number" || item.expiresAt <= now) continue;
        const existing = this.entries.get(item.id) ?? 0;
        if (item.expiresAt > existing) this.entries.set(item.id, item.expiresAt);
      }
      this.prune(now);
      const rows = [...this.entries].map(([id, expiresAt]) => ({ id, expiresAt }));
      const temp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temp, JSON.stringify(rows), { mode: 384 });
      await rename2(temp, this.file);
    });
  }
  async withFileLock(operation) {
    const deadline = Date.now() + LOCK_TIMEOUT_MS;
    while (true) {
      try {
        const handle = await open2(this.lockFile, "wx", 384);
        try {
          await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: Date.now() }));
          return await operation();
        } finally {
          await handle.close().catch(() => {
          });
          await unlink2(this.lockFile).catch((error) => {
            if (error?.code !== "ENOENT") throw error;
          });
        }
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        try {
          const lockStat = await stat(this.lockFile);
          if (Date.now() - lockStat.mtimeMs > LOCK_STALE_MS) {
            await unlink2(this.lockFile).catch((unlinkError) => {
              if (unlinkError?.code !== "ENOENT") throw unlinkError;
            });
            continue;
          }
        } catch (statError) {
          if (statError?.code === "ENOENT") continue;
          throw statError;
        }
        if (Date.now() >= deadline) throw new Error("timed out acquiring delivery admission ledger lock");
        await new Promise((resolve) => setTimeout(resolve, LOCK_WAIT_MS));
      }
    }
  }
};

// src/daemon/projectDirectory.ts
import { opendir, realpath as realpath2, stat as stat2 } from "node:fs/promises";
import os3 from "node:os";
import path14 from "node:path";
var MAX_PATH_LENGTH = 4096;
var MAX_ROOTS = 32;
var DEFAULT_LIMIT = 100;
var MAX_LIMIT = 200;
var DISCOVER_MAX_DEPTH = 4;
var DISCOVER_MAX_VISITED = 1e3;
var MAX_DIRECTORY_ENTRIES = 2e3;
var DISCOVER_MAX_ENTRIES = 1e4;
var DISCOVER_MAX_CHILDREN_PER_DIRECTORY = 500;
var DISCOVER_DEADLINE_MS = 3500;
var PROJECT_MARKERS = /* @__PURE__ */ new Set([
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json"
]);
var SENSITIVE_DIRECTORY_NAMES = /* @__PURE__ */ new Set([
  "appdata",
  "library",
  "windows",
  "programdata",
  "system volume information",
  "$recycle.bin"
]);
var BROWSE_EXCLUDED_DIRECTORY_NAMES = /* @__PURE__ */ new Set([
  ...SENSITIVE_DIRECTORY_NAMES,
  "node_modules",
  "vendor",
  "venv",
  "__pycache__",
  "target",
  "dist",
  "build"
]);
var ProjectDirectoryError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "ProjectDirectoryError";
  }
  code;
};
var discoverInFlight = false;
function expandHome(value) {
  return value === "~" ? os3.homedir() : /^~[\\/]/.test(value) ? path14.join(os3.homedir(), value.slice(2)) : value;
}
function normalizedAbsolute(value) {
  if (typeof value !== "string" || !value.trim()) throw new ProjectDirectoryError("invalid_project_path", "project directory is required");
  if (value.length > MAX_PATH_LENGTH) throw new ProjectDirectoryError("invalid_project_path", "project directory is too long");
  const expanded = expandHome(value.trim());
  if (!path14.isAbsolute(expanded)) throw new ProjectDirectoryError("invalid_project_path", "project directory must be an absolute path");
  return path14.resolve(expanded);
}
function comparable(value) {
  return process.platform === "win32" ? value.toLowerCase() : value;
}
function isWithin(candidate, root) {
  const relative = path14.relative(comparable(root), comparable(candidate));
  return relative === "" || !relative.startsWith(`..${path14.sep}`) && relative !== ".." && !path14.isAbsolute(relative);
}
function isAllowedDescendant(candidate, root) {
  if (!isWithin(candidate, root)) return false;
  const relative = path14.relative(root, candidate);
  return relative === "" || relative.split(path14.sep).every((name) => !!name && !name.startsWith(".") && !SENSITIVE_DIRECTORY_NAMES.has(name.toLowerCase()));
}
function parseRootInputs(raw = process.env.OPEN_WORKORA_PROJECT_ROOTS) {
  const value = raw?.trim();
  if (!value) return [];
  let inputs;
  if (value.startsWith("[")) {
    try {
      inputs = JSON.parse(value);
    } catch {
      throw new ProjectDirectoryError("project_roots_not_configured", "OPEN_WORKORA_PROJECT_ROOTS is invalid JSON");
    }
    if (!Array.isArray(inputs) || inputs.some((item) => typeof item !== "string")) {
      throw new ProjectDirectoryError("project_roots_not_configured", "OPEN_WORKORA_PROJECT_ROOTS must be a JSON string array");
    }
  } else {
    inputs = value.split(path14.delimiter);
  }
  const roots = [...new Set(inputs.map((item) => item.trim()).filter(Boolean))];
  if (roots.length > MAX_ROOTS) throw new ProjectDirectoryError("project_roots_not_configured", `OPEN_WORKORA_PROJECT_ROOTS supports at most ${MAX_ROOTS} roots`);
  try {
    return roots.map((root) => normalizedAbsolute(root));
  } catch {
    throw new ProjectDirectoryError("project_roots_not_configured", "OPEN_WORKORA_PROJECT_ROOTS must contain absolute paths");
  }
}
async function rootContexts() {
  const configured = parseRootInputs();
  if (!configured.length) throw new ProjectDirectoryError("project_roots_not_configured", "no project roots are shared by this daemon");
  const roots = [];
  for (const lexical of configured) {
    try {
      const canonical = await realpath2(lexical);
      if (!(await stat2(canonical)).isDirectory()) continue;
      if (!roots.some((root) => comparable(root.canonical) === comparable(canonical))) roots.push({ lexical, canonical });
    } catch {
    }
  }
  if (!roots.length) throw new ProjectDirectoryError("project_roots_not_configured", "no configured project roots are accessible");
  return roots;
}
async function canonicalSharedDirectory(input, roots) {
  const lexical = normalizedAbsolute(input);
  if (!roots.some((root) => isAllowedDescendant(lexical, root.lexical) || isAllowedDescendant(lexical, root.canonical))) {
    throw new ProjectDirectoryError("project_path_not_shared", "project directory is outside the daemon's shared roots");
  }
  let canonical;
  try {
    canonical = await realpath2(lexical);
  } catch {
    throw new ProjectDirectoryError("invalid_project_path", "project directory does not exist or is not accessible");
  }
  if (!roots.some((root) => isAllowedDescendant(canonical, root.canonical))) {
    throw new ProjectDirectoryError("project_path_not_shared", "project directory resolves outside the daemon's shared roots");
  }
  try {
    if (!(await stat2(canonical)).isDirectory()) throw new ProjectDirectoryError("invalid_project_path", "project path is not a directory");
  } catch (cause) {
    if (cause instanceof ProjectDirectoryError) throw cause;
    throw new ProjectDirectoryError("invalid_project_path", "project directory does not exist or is not accessible");
  }
  return canonical;
}
function entryName(directoryPath) {
  return path14.basename(directoryPath) || directoryPath;
}
function isBrowsableName(name) {
  return !!name && !name.startsWith(".") && !BROWSE_EXCLUDED_DIRECTORY_NAMES.has(name.toLowerCase());
}
function page(items, cursor, limit) {
  const values = items.slice(cursor, cursor + limit);
  const truncated = cursor + values.length < items.length;
  return { values, nextCursor: truncated ? cursor + values.length : null, truncated };
}
function pagination(cursorInput, limitInput) {
  const cursor = cursorInput === void 0 ? 0 : Number(cursorInput);
  const limit = limitInput === void 0 ? DEFAULT_LIMIT : Number(limitInput);
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > MAX_DIRECTORY_ENTRIES) {
    throw new ProjectDirectoryError("invalid_query", `cursor must be an integer between 0 and ${MAX_DIRECTORY_ENTRIES}`);
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ProjectDirectoryError("invalid_query", `limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  return { cursor, limit };
}
async function resolveProjectDirectory(input) {
  return canonicalSharedDirectory(input, await rootContexts());
}
async function browseProjectDirectories(request) {
  const roots = await rootContexts();
  const { cursor, limit } = pagination(request.cursor, request.limit);
  if (!request.discover && request.path === void 0) {
    const entries = roots.map((root) => ({ name: entryName(root.canonical), path: root.canonical })).sort((a, b) => a.path.localeCompare(b.path));
    const result = page(entries, cursor, limit);
    return { mode: "roots", roots: result.values, nextCursor: result.nextCursor, truncated: result.truncated };
  }
  if (!request.discover) {
    const canonical = await canonicalSharedDirectory(request.path, roots);
    const directories = [];
    let scanned = 0;
    let bounded = false;
    const deadline = Date.now() + DISCOVER_DEADLINE_MS;
    try {
      const directory = await opendir(canonical);
      for await (const entry of directory) {
        if (++scanned > MAX_DIRECTORY_ENTRIES || Date.now() >= deadline) {
          bounded = true;
          break;
        }
        if (entry.isDirectory() && !entry.isSymbolicLink() && isBrowsableName(entry.name)) {
          directories.push({ name: entry.name, path: path14.join(canonical, entry.name) });
        }
      }
    } catch {
      throw new ProjectDirectoryError("invalid_project_path", "project directory is not accessible");
    }
    directories.sort((a, b) => a.name.localeCompare(b.name));
    const result = page(directories, cursor, limit);
    return { mode: "list", path: canonical, directories: result.values, nextCursor: result.nextCursor, truncated: bounded || result.truncated };
  }
  if (discoverInFlight) throw new ProjectDirectoryError("project_browser_busy", "project discovery is already running");
  discoverInFlight = true;
  try {
    const selectedPath = request.path === void 0 ? null : await canonicalSharedDirectory(request.path, roots);
    const starts = selectedPath ? [selectedPath] : roots.map((root) => root.canonical);
    const queue = starts.map((directory) => ({ directory, depth: 0 }));
    const seen = /* @__PURE__ */ new Set();
    const projects = [];
    const needed = cursor + limit + 1;
    const deadline = Date.now() + DISCOVER_DEADLINE_MS;
    let scannedEntries = 0;
    let bounded = false;
    while (queue.length && projects.length < needed) {
      if (seen.size >= DISCOVER_MAX_VISITED || scannedEntries >= DISCOVER_MAX_ENTRIES || Date.now() >= deadline) {
        bounded = true;
        break;
      }
      const current = queue.shift();
      const key = comparable(current.directory);
      if (seen.has(key)) continue;
      seen.add(key);
      let markerFound = false;
      const children = [];
      try {
        const directory = await opendir(current.directory);
        for await (const entry of directory) {
          scannedEntries++;
          if (scannedEntries > DISCOVER_MAX_ENTRIES || Date.now() >= deadline) {
            bounded = true;
            break;
          }
          if (PROJECT_MARKERS.has(entry.name)) markerFound = true;
          if (current.depth < DISCOVER_MAX_DEPTH && entry.isDirectory() && !entry.isSymbolicLink() && isBrowsableName(entry.name)) {
            if (children.length < DISCOVER_MAX_CHILDREN_PER_DIRECTORY) children.push(entry.name);
            else bounded = true;
          }
        }
      } catch {
        continue;
      }
      if (markerFound) projects.push({ name: entryName(current.directory), path: current.directory });
      if (current.depth >= DISCOVER_MAX_DEPTH) continue;
      children.sort((a, b) => a.localeCompare(b));
      for (const child of children) {
        if (queue.length + seen.size >= DISCOVER_MAX_VISITED) {
          bounded = true;
          break;
        }
        queue.push({ directory: path14.join(current.directory, child), depth: current.depth + 1 });
      }
    }
    const values = projects.slice(cursor, cursor + limit);
    const truncated = bounded || projects.length > cursor + values.length || queue.length > 0;
    return {
      mode: "discover",
      path: selectedPath,
      projects: values,
      nextCursor: truncated && values.length ? cursor + values.length : null,
      truncated
    };
  } finally {
    discoverInFlight = false;
  }
}

// src/daemon/agentManager.ts
var DATA_DIR = agentsDir();
var IDLE_MS = Number(process.env.OPEN_WORKORA_IDLE_MS ?? 10 * 60 * 1e3);
var DELIVER_DEBOUNCE_MS = Number(process.env.OPEN_WORKORA_DELIVER_DEBOUNCE_MS ?? 3e3);
var ONE_SHOT_DELIVER_DEBOUNCE_MS = Number(process.env.OPEN_WORKORA_ONE_SHOT_DELIVER_DEBOUNCE_MS ?? process.env.OPEN_WORKORA_HERMES_DELIVER_DEBOUNCE_MS ?? 500);
var PENDING_DELIVER_TTL_MS = Number(process.env.OPEN_WORKORA_PENDING_DELIVER_TTL_MS ?? 15e3);
var AgentManager = class {
  constructor(send, opts = {}) {
    this.send = send;
    this.budget = opts.budget ?? new ResourceBudget();
    this.binDir = opts.binDir ?? ensureWorkoraBin();
    this.dataDir = opts.dataDir ?? DATA_DIR;
    this.deliveryAdmissionStore = new DeliveryAdmissionStore(this.dataDir);
    this.deliverDebounceMs = opts.deliverDebounceMs ?? DELIVER_DEBOUNCE_MS;
    this.oneShotDeliverDebounceMs = opts.oneShotDeliverDebounceMs ?? ONE_SHOT_DELIVER_DEBOUNCE_MS;
    this.pendingDeliverTtlMs = opts.pendingDeliverTtlMs ?? PENDING_DELIVER_TTL_MS;
    this.runtimeResolver = opts.runtimeResolver ?? getRuntime;
    this.beforeRuntimeDelivery = opts.beforeRuntimeDelivery ?? (async () => {
    });
    const pressureTimer = setInterval(() => this.checkMemoryPressure(), 1e4);
    pressureTimer.unref?.();
  }
  send;
  agents = /* @__PURE__ */ new Map();
  starting = /* @__PURE__ */ new Map();
  pendingDelivers = /* @__PURE__ */ new Map();
  activeReplyPreviews = /* @__PURE__ */ new Map();
  deliveryAdmissions = /* @__PURE__ */ new Map();
  deliveryPreparations = /* @__PURE__ */ new Map();
  deliveryPreparationTails = /* @__PURE__ */ new Map();
  deliveryAdmissionStore;
  deliveryEpochs = /* @__PURE__ */ new Map();
  deliveryCancellationErrors = /* @__PURE__ */ new Map();
  controlTails = /* @__PURE__ */ new Map();
  replySeq = 0;
  binDir;
  dataDir;
  deliverDebounceMs;
  oneShotDeliverDebounceMs;
  pendingDeliverTtlMs;
  runtimeResolver;
  beforeRuntimeDelivery;
  budget;
  startQueue = [];
  log = createLogger("daemon:agents");
  checkMemoryPressure() {
    const freeMB = this.budget.availableMemMB();
    if (freeMB >= PRESSURE_MEM_MB) {
      this.tryDequeue();
      return;
    }
    const agentCount = Math.max(this.agents.size, 1);
    const margin = Math.ceil(400 / agentCount);
    this.log.warn("memory pressure detected", { freeMB, threshold: PRESSURE_MEM_MB, margin, agentCount });
    for (const [id, r] of this.agents) {
      const pid = r.session.pid ?? r.pid;
      if (pid <= 0) continue;
      const actual = readProcessMemoryMB(pid);
      if (actual > 0) {
        this.log.info("pressure: capping agent", { agentId: id, pid, actualMB: actual, limitMB: actual + margin });
        applyMemoryPressure(pid, actual, margin);
      }
    }
    if (process.platform === "darwin" && this.agents.size > 0) {
      let maxRss = -1, maxId = "";
      for (const [id, r] of this.agents) {
        const pid = r.session.pid ?? r.pid;
        if (pid <= 0) continue;
        const rss = readProcessMemoryMB(pid);
        if (rss > maxRss) {
          maxRss = rss;
          maxId = id;
        }
      }
      if (maxId) {
        const config = this.agents.get(maxId)?.config;
        if (config && !this.startQueue.some((q) => q.agentId === maxId)) {
          this.startQueue.push({ agentId: maxId, config, enqueuedAt: Date.now() });
        }
        this.budget.queueLength = this.startQueue.length;
        this.log.warn("darwin: sleeping heaviest agent to relieve memory pressure", { agentId: maxId, rssMB: maxRss });
        void this.sleep(maxId).catch((error) => this.log.warn("pressure sleep failed", { agentId: maxId, detail: String(error) }));
      }
    }
  }
  running() {
    return [...this.agents.keys()];
  }
  /** Serialize lifecycle commands for one agent while keeping different agents independent. */
  runControl(agentId, operation) {
    const previous = this.controlTails.get(agentId) ?? Promise.resolve();
    const current = previous.catch(() => {
    }).then(operation);
    const tail = current.then(() => {
    }, () => {
    });
    this.controlTails.set(agentId, tail);
    void tail.finally(() => {
      if (this.controlTails.get(agentId) === tail) this.controlTails.delete(agentId);
    });
    return current;
  }
  stopAll() {
    for (const id of /* @__PURE__ */ new Set([...this.agents.keys(), ...this.starting.keys()])) void this.stop(id).catch(() => {
    });
  }
  budgetStatus() {
    let actualMemMB = 0;
    for (const r of this.agents.values()) {
      const pid = r.session.pid ?? r.pid;
      if (pid > 0) actualMemMB += readProcessMemoryMB(pid);
    }
    this.budget.agentCount = this.agents.size;
    this.budget.actualUsedMemMB = actualMemMB;
    return this.budget.status();
  }
  queuedAgents() {
    return [...this.startQueue];
  }
  /** Remove a queued start request (user cancelled). */
  dequeue(agentId) {
    const idx = this.startQueue.findIndex((q) => q.agentId === agentId);
    if (idx === -1) return;
    this.startQueue.splice(idx, 1);
    const error = new Error(`agent dequeued before delivery admission: ${agentId}`);
    this.invalidateDeliveryLifecycle(agentId, error);
    this.rejectPendingDeliver(agentId, error);
    this.budget.queueLength = this.startQueue.length;
    this.send({ type: "agent:status", agentId, status: "inactive" });
    this.sendAgentActivity(agentId, "offline", "dequeued");
    this.log.info("dequeued", { agentId });
  }
  // Tear down process: clear timers + remove from map first (critical: deletion before session.stop() lets the onExit has() guard recognize this as an intentional stop, suppressing unexpected sleeping status) + stop runtime. Returns whether the agent was found.
  async teardown(agentId) {
    const error = new Error(`agent stopped before delivery admission: ${agentId}`);
    this.invalidateDeliveryLifecycle(agentId, error);
    const attempt = this.starting.get(agentId);
    if (attempt) attempt.cancelled = true;
    this.rejectPendingDeliver(agentId, error);
    const r = this.agents.get(agentId);
    if (!r) {
      if (attempt) await attempt.promise.catch(() => {
      });
      return !!attempt;
    }
    this.finishReplyPreview(agentId);
    if (r.idleTimer) clearTimeout(r.idleTimer);
    this.rejectBufferedDeliveries(r, error);
    this.agents.delete(agentId);
    this.tryDequeue();
    r.session.stop();
    await r.exit.promise;
    if (attempt) await attempt.promise.catch(() => {
    });
    return true;
  }
  // User-initiated stop: emits inactive/offline
  async stop(agentId) {
    if (!await this.teardown(agentId)) return;
    this.send({ type: "agent:status", agentId, status: "inactive" });
    this.sendAgentActivity(agentId, "offline");
  }
  // Idle sleep: emits sleeping/sleeping (activity also set to sleeping so the frontend activity+status dual mapping stays consistent; session is preserved for --resume on next wake)
  async sleep(agentId) {
    if (!await this.teardown(agentId)) return;
    this.log.info("sleep", { agentId });
    this.send({ type: "agent:status", agentId, status: "sleeping" });
    this.sendAgentActivity(agentId, "sleeping");
  }
  /** Try to start the next queued agent if budget allows. */
  tryDequeue() {
    if (this.startQueue.length === 0) return;
    const q = this.startQueue[0];
    if (!this.budget.tryAllocate()) return;
    this.startQueue.shift();
    const agentId = q.agentId;
    this.budget.queueLength = this.startQueue.length;
    this.log.info("dequeue -> start", { agentId });
    this.send({ type: "agent:status", agentId, status: "inactive" });
    void this.launchStart(agentId, q.config).catch(() => {
    });
  }
  /** Reset: stop the process + clear the server-side session (next start will not --resume); wipeWorkspace deletes the entire workspace; clearMemory clears MEMORY.md only. */
  async reset(agentId, wipeWorkspace = false, clearMemory = false) {
    await this.teardown(agentId);
    this.send({ type: "agent:session", agentId, sessionId: null });
    const dir = path15.join(this.dataDir, agentId);
    if (wipeWorkspace) {
      try {
        await rm2(dir, { recursive: true, force: true });
        this.log.info("workspace wiped", { agentId });
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        this.log.warn("wipe failed", { agentId, detail: String(error) });
        throw new Error(`workspace wipe failed: ${error.message}`, { cause: error });
      }
    } else if (clearMemory) {
      try {
        await mkdir3(this.dataDir, { recursive: true });
        await ensureManagedDirectory(this.dataDir, agentId);
        await atomicWriteManagedFile(dir, "MEMORY.md", "# Memory\n\n(reset)\n");
        this.log.info("memory cleared", { agentId });
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        this.log.warn("clearMemory failed", { agentId, detail: String(error) });
        throw new Error(`memory reset failed: ${error.message}`, { cause: error });
      }
    }
    this.send({ type: "agent:status", agentId, status: "inactive" });
    this.sendAgentActivity(agentId, "offline", "reset");
    this.log.info("agent reset", { agentId, wipeWorkspace, clearMemory });
  }
  /** Profile changed on the server (displayName/description) — surgically sync the workspace MEMORY.md
   *  title + `## Role`, preserving the agent's own sections. No-op if the workspace/file doesn't exist
   *  yet (a not-yet-started agent gets fresh values from the DB when start() seeds it). */
  async syncProfile(agentId, displayName, description) {
    const dir = path15.join(this.dataDir, agentId);
    let content;
    try {
      content = (await readManagedFile(dir, "MEMORY.md")).toString("utf8");
    } catch {
      this.log.debug("syncProfile: no MEMORY.md yet", { agentId });
      return;
    }
    let effectiveDesc = description;
    try {
      const f = (await readManagedFile(dir, "personality.md")).toString("utf8");
      if (f.trim()) effectiveDesc = f;
    } catch {
    }
    const next = applyProfileToMemory(content, displayName || agentId, effectiveDesc);
    if (next !== content) {
      try {
        await atomicWriteManagedFile(dir, "MEMORY.md", next);
        this.log.info("profile synced to MEMORY.md", { agentId });
      } catch (e) {
        this.log.warn("syncProfile write failed", { agentId, detail: String(e) });
        return;
      }
    }
    const r = this.agents.get(agentId);
    if (r) {
      r.config.displayName = displayName;
      r.config.description = description ?? null;
    }
  }
  resetIdle(agentId) {
    const r = this.agents.get(agentId);
    if (!r) return;
    if (r.idleTimer) clearTimeout(r.idleTimer);
    r.idleTimer = setTimeout(() => {
      this.log.info("idle sleep", { agentId, idleMs: IDLE_MS });
      void this.sleep(agentId).catch((error) => this.log.warn("idle sleep failed", { agentId, detail: String(error) }));
    }, IDLE_MS);
  }
  startReplyPreview(agentId, r, channelId, streamId) {
    const existing = this.activeReplyPreviews.get(agentId);
    if (existing?.channelId === channelId && (!streamId || existing.streamId === streamId)) return;
    const preview = {
      channelId,
      streamId: streamId ?? `${Date.now()}-${++this.replySeq}`,
      name: r.config.displayName || r.config.name || agentId,
      eventSeq: 0
    };
    if (existing) return;
    this.activeReplyPreviews.set(agentId, preview);
    this.send({ type: "agent:reply", agentId, channelId: preview.channelId, streamId: preview.streamId, name: preview.name, op: "start" });
  }
  sendAgentActivity(agentId, activity, detail = "") {
    const preview = this.activeReplyPreviews.get(agentId);
    this.send({ type: "agent:activity", agentId, activity, detail, channelId: preview?.channelId, streamId: preview?.streamId, runSeq: preview ? ++preview.eventSeq : void 0 });
  }
  sendAgentTrajectory(agentId, entries) {
    const preview = this.activeReplyPreviews.get(agentId);
    const contextual = preview ? entries.map((entry) => ({ ...entry, runSeq: ++preview.eventSeq })) : entries;
    this.send({ type: "agent:trajectory", agentId, entries: contextual, channelId: preview?.channelId, streamId: preview?.streamId });
  }
  finishReplyPreview(agentId, op = "done") {
    const preview = this.activeReplyPreviews.get(agentId);
    if (!preview) return;
    this.activeReplyPreviews.delete(agentId);
    this.send({ type: "agent:reply", agentId, channelId: preview.channelId, streamId: preview.streamId, name: preview.name, op });
    const running = this.agents.get(agentId);
    if (op === "done" && !running?.deliveryQueue?.length && !running?.deliverBufs?.size && this.startQueue.length > 0) {
      const r = this.agents.get(agentId);
      if (r) {
        this.log.info("reply done, queue waiting \u2014 sleeping agent", { agentId });
        void this.sleep(agentId).catch((error) => this.log.warn("queued-agent sleep failed", { agentId, detail: String(error) }));
      }
    }
  }
  async start(agentId, config) {
    const existing = this.starting.get(agentId);
    if (existing) return existing.promise;
    if (this.agents.has(agentId)) return;
    if (this.startQueue.some((q) => q.agentId === agentId)) {
      const idx = this.startQueue.findIndex((q) => q.agentId === agentId);
      if (idx !== -1) this.startQueue[idx].config = config;
      return;
    }
    if (this.budget.tryAllocate()) {
      return this.launchStart(agentId, config);
    }
    this.startQueue.push({ agentId, config, enqueuedAt: Date.now() });
    this.budget.queueLength = this.startQueue.length;
    this.send({ type: "agent:status", agentId, status: "queued" });
    this.sendAgentActivity(agentId, "offline", "queued");
    this.log.info("queued (memory pressure)", { agentId });
  }
  launchStart(agentId, config) {
    const attempt = { promise: void 0, cancelled: false };
    this.starting.set(agentId, attempt);
    attempt.promise = Promise.resolve().then(() => this.startNow(agentId, config, attempt)).catch(async (error) => {
      await this.failStart(agentId, error);
      throw error;
    }).finally(() => {
      if (this.starting.get(agentId) === attempt) this.starting.delete(agentId);
      this.budget.release();
      this.tryDequeue();
    });
    return attempt.promise;
  }
  assertStartActive(agentId, attempt) {
    if (attempt.cancelled || this.starting.get(agentId) !== attempt) throw new Error(`agent start cancelled: ${agentId}`);
  }
  async startNow(agentId, config, attempt) {
    this.assertStartActive(agentId, attempt);
    if (this.agents.has(agentId)) return;
    const runtime = this.runtimeResolver(config.runtime ?? "claude");
    if (!runtime) {
      this.log.error("no runtime", { runtime: config.runtime });
      this.sendAgentActivity(agentId, "offline", `no runtime: ${config.runtime}`);
      throw new Error(`no runtime: ${config.runtime ?? "claude"}`);
    }
    if (runtime.experimental) this.log.warn("experimental runtime", { runtime: runtime.name });
    const stateDir = path15.join(this.dataDir, agentId);
    const projectDir = config.projectPath ? await resolveProjectDirectory(config.projectPath) : stateDir;
    await mkdir3(this.dataDir, { recursive: true });
    await ensureManagedDirectory(this.dataDir, agentId);
    await ensureManagedDirectory(stateDir, "notes");
    this.assertStartActive(agentId, attempt);
    try {
      await readManagedFile(stateDir, "MEMORY.md");
    } catch (error) {
      const replaceUnsafeLink = error instanceof Error && error.message.includes("file is a symbolic link");
      if (error?.code !== "ENOENT" && !replaceUnsafeLink) throw error;
      await atomicWriteManagedFile(stateDir, "MEMORY.md", seedMemory(config.displayName || config.name, config.description));
    }
    this.assertStartActive(agentId, attempt);
    let personality;
    try {
      personality = (await readManagedFile(stateDir, "personality.md")).toString("utf8");
      if (!personality.trim()) personality = void 0;
    } catch {
      personality = void 0;
    }
    this.assertStartActive(agentId, attempt);
    if (!personality) {
      try {
        await atomicWriteManagedFile(stateDir, "personality.md", seedPersonality(config.displayName || config.name, config.description));
        personality = void 0;
      } catch {
      }
    }
    this.assertStartActive(agentId, attempt);
    const effectiveDescription = personality ?? config.description;
    const systemPrompt = buildSystemPrompt({
      name: config.name,
      displayName: config.displayName,
      description: effectiveDescription,
      agentId,
      serverId: config.serverId,
      hostname: os4.hostname(),
      os: `${os4.platform()} ${os4.arch()}`,
      stateDir,
      projectDir
    });
    const env = {
      ...process.env,
      FORCE_COLOR: "0",
      PATH: `${this.binDir}${path15.delimiter}${process.env.PATH ?? ""}`,
      OPEN_WORKORA_SERVER_URL: config.serverUrl,
      OPEN_WORKORA_AGENT_ID: agentId,
      OPEN_WORKORA_AGENT_TOKEN: config.agentToken ?? "",
      OPEN_WORKORA_PROJECT_PATH: projectDir !== stateDir ? projectDir : ""
    };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;
    const running = {
      session: void 0,
      config,
      sessionId: config.sessionId ?? null,
      initialAdmission: this.createLifecycleSettlement(),
      exit: this.createLifecycleSettlement(),
      turnActive: true,
      pid: 0
    };
    let initialAdmissionSettled = false;
    const cb = {
      onSession: (sid) => {
        running.sessionId = sid;
        this.send({ type: "agent:session", agentId, sessionId: sid });
      },
      onInitialTurnAdmission: (error) => {
        if (initialAdmissionSettled) return;
        initialAdmissionSettled = true;
        if (error) {
          running.initialAdmission.reject(error);
          this.rejectPendingDeliver(agentId, error);
        } else {
          running.initialAdmission.resolve();
          this.acceptPendingStartup(agentId, runtime.name, running);
        }
      },
      onActivity: (activity, detail) => {
        this.resetIdle(agentId);
        this.sendAgentActivity(agentId, activity, detail ?? "");
        if (activity === "online") {
          running.turnActive = false;
          this.finishReplyPreview(agentId);
          this.startNextQueuedDelivery(agentId, running);
        } else if (activity === "error") {
          this.finishReplyPreview(agentId, "error");
        } else if (activity === "sleeping" || activity === "offline") {
          this.finishReplyPreview(agentId);
        }
      },
      onTrajectory: (entries) => {
        this.sendAgentTrajectory(agentId, entries);
      },
      onExit: (code) => {
        this.log.info("agent exited", { agentId, code });
        const exitError = new Error(`runtime exited before delivery admission (${code ?? "signal"})`);
        const startupError = new Error(`runtime exited before initial turn admission (${code ?? "signal"})`);
        running.exit.resolve();
        if (!running.initialAdmission.settled) running.initialAdmission.reject(startupError);
        if (this.agents.get(agentId) !== running) return;
        this.invalidateDeliveryLifecycle(agentId, exitError);
        this.rejectPendingDeliver(agentId, exitError);
        this.rejectBufferedDeliveries(running, exitError);
        this.agents.delete(agentId);
        this.tryDequeue();
        const crashed = code !== 0;
        this.finishReplyPreview(agentId, crashed ? "error" : "done");
        this.send({ type: "agent:status", agentId, status: "sleeping" });
        this.sendAgentActivity(agentId, crashed ? "error" : "sleeping", crashed ? `crashed (exit ${code ?? "signal"})` : "");
      },
      log: this.log
    };
    await this.waitForDeliveryPreparations(agentId);
    this.assertStartActive(agentId, attempt);
    const pendingDeliverItems = this.pendingDelivers.get(agentId)?.items ?? [];
    const pendingDeliveryCount = pendingDeliverItems.length;
    const useOneShotWakeNudge = !!runtime.oneShotWake && pendingDeliveryCount > 0;
    const startupDelivery = pendingDeliverItems[0];
    if (startupDelivery?.meta.deliveryId) await this.beforeRuntimeDelivery(agentId, startupDelivery.meta);
    this.assertStartActive(agentId, attempt);
    this.agents.set(agentId, running);
    if (startupDelivery) this.startReplyPreview(agentId, running, startupDelivery.target, startupDelivery.meta.streamId);
    try {
      running.session = runtime.start({
        cwd: projectDir,
        stateDir,
        model: config.model,
        runtimeConfig: config.runtimeConfig,
        sessionId: config.sessionId,
        systemPrompt,
        env,
        initialPrompt: useOneShotWakeNudge ? ONE_SHOT_WAKE_NUDGE : config.sessionId ? RESUME_NUDGE : STARTUP_NUDGE
      }, cb);
    } catch (cause) {
      running.exit.resolve();
      if (this.agents.get(agentId) === running) this.agents.delete(agentId);
      throw cause;
    }
    running.pid = running.session.pid ?? 0;
    await running.initialAdmission.promise;
    this.assertStartActive(agentId, attempt);
    if (this.agents.get(agentId) !== running) throw new Error(`runtime exited before start completed: ${agentId}`);
    this.send({ type: "agent:status", agentId, status: "active" });
    this.sendAgentActivity(agentId, "working", "starting");
    this.log.info("agent started", { agentId, runtime: runtime.name, model: config.model ?? "(default)", resume: !!config.sessionId, experimental: runtime.experimental ?? false });
    this.resetIdle(agentId);
    if (pendingDeliveryCount > 0 && this.pendingDelivers.has(agentId)) {
      this.log.debug("pending delivery awaiting startup nudge admission", { agentId, runtime: runtime.name, count: pendingDeliveryCount });
    }
  }
  acceptPendingStartup(agentId, runtime, running) {
    const q = this.pendingDelivers.get(agentId);
    if (!q) return;
    const [startup, ...queued] = q.items;
    startup?.admission.resolve();
    if (queued.length) {
      const deliveryQueue = running.deliveryQueue ?? [];
      running.deliveryQueue = deliveryQueue;
      for (const item of queued) deliveryQueue.push(this.pendingItemToBuffer(item));
    }
    this.clearPendingDeliver(agentId);
    this.log.debug("pending deliver consumed by wake nudge", { agentId, runtime, count: startup ? 1 : 0, queued: queued.length });
  }
  pendingItemToBuffer(item) {
    const targetName = item.meta.targetName ?? item.target;
    const short = item.meta.msgShort ?? "";
    return {
      count: item.meta.turnMessageCount ?? 1,
      from: item.from,
      target: item.target,
      targetName,
      firstShort: short,
      latestShort: short,
      isTask: !!item.meta.isTask,
      mentioned: item.mentioned,
      targets: /* @__PURE__ */ new Set([targetName]),
      timer: void 0,
      admissions: [item.admission],
      streamId: item.meta.streamId,
      attention: item.meta.attention,
      deliveryId: item.meta.deliveryId,
      seq: item.meta.seq
    };
  }
  async failStart(agentId, cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (!error.message.startsWith("agent start cancelled:")) this.invalidateDeliveryLifecycle(agentId, error);
    const running = this.agents.get(agentId);
    if (running?.idleTimer) clearTimeout(running.idleTimer);
    if (running) this.rejectBufferedDeliveries(running, error);
    if (running) {
      this.agents.delete(agentId);
      try {
        running.session?.stop();
      } catch {
      }
      if (!running.session) running.exit.resolve();
      await running.exit.promise.catch(() => {
      });
    }
    this.finishReplyPreview(agentId, "error");
    this.rejectPendingDeliver(agentId, error);
    this.log.warn("agent start failed", { agentId, detail: String(error) });
  }
  rejectBufferedDeliveries(running, error) {
    for (const buffer of running.deliverBufs?.values() ?? []) {
      clearTimeout(buffer.timer);
      for (const admission of buffer.admissions) admission.reject(error);
    }
    for (const buffer of running.deliveryQueue ?? []) {
      for (const admission of buffer.admissions) admission.reject(error);
    }
    running.deliverBufs = void 0;
    running.deliveryQueue = void 0;
  }
  deliveryNotice(buffer) {
    return inboxNotice({ count: buffer.count, from: buffer.from, targetName: buffer.targetName, firstShort: buffer.firstShort, latestShort: buffer.latestShort, isTask: buffer.isTask, isDm: buffer.targetName.startsWith("dm:"), changedTargets: buffer.targets.size, mentioned: buffer.mentioned, attention: buffer.attention });
  }
  startNextQueuedDelivery(agentId, running) {
    if (running.turnActive || this.agents.get(agentId) !== running) return;
    const next = running.deliveryQueue?.shift();
    if (!running.deliveryQueue?.length) running.deliveryQueue = void 0;
    if (next) void this.admitBufferedDelivery(agentId, running, next);
  }
  async admitBufferedDelivery(agentId, running, buffer) {
    if (this.agents.get(agentId) !== running) {
      const error = new Error(`agent stopped before delivery admission: ${agentId}`);
      for (const admission of buffer.admissions) admission.reject(error);
      return;
    }
    running.turnActive = true;
    try {
      if (buffer.deliveryId) await this.beforeRuntimeDelivery(agentId, buffer);
      this.startReplyPreview(agentId, running, buffer.target, buffer.streamId);
      await running.session.deliver(this.deliveryNotice(buffer));
      this.resetIdle(agentId);
      for (const admission of buffer.admissions) admission.resolve();
      this.log.debug("inbox notice -> agent", { agentId, count: buffer.count, mentioned: buffer.mentioned });
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      running.turnActive = false;
      for (const admission of buffer.admissions) admission.reject(error);
      this.finishReplyPreview(agentId, "error");
      this.log.warn("deliver failed", { agentId, detail: String(error) });
      this.startNextQueuedDelivery(agentId, running);
    }
  }
  createAdmission() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
  trackDeliveryPreparation(agentId, preparation) {
    const pending = this.deliveryPreparations.get(agentId) ?? /* @__PURE__ */ new Set();
    this.deliveryPreparations.set(agentId, pending);
    pending.add(preparation);
    void preparation.finally(() => {
      pending.delete(preparation);
      if (!pending.size && this.deliveryPreparations.get(agentId) === pending) this.deliveryPreparations.delete(agentId);
    });
  }
  async waitForDeliveryPreparations(agentId) {
    while (this.deliveryPreparations.get(agentId)?.size) {
      await Promise.all([...this.deliveryPreparations.get(agentId)]);
    }
  }
  createLifecycleSettlement() {
    const settlement = { promise: void 0, resolve: void 0, reject: void 0, settled: false };
    settlement.promise = new Promise((resolve, reject) => {
      settlement.resolve = () => {
        if (settlement.settled) return;
        settlement.settled = true;
        resolve();
      };
      settlement.reject = (error) => {
        if (settlement.settled) return;
        settlement.settled = true;
        reject(error);
      };
    });
    return settlement;
  }
  queuePendingDeliver(agentId, item) {
    let q = this.pendingDelivers.get(agentId);
    if (!q) {
      const resourceQueued = this.startQueue.some((queued) => queued.agentId === agentId);
      const timer = resourceQueued ? void 0 : setTimeout(() => {
        this.rejectPendingDeliver(agentId, new Error(`pending delivery expired before agent start: ${agentId}`));
        this.log.debug("pending deliver expired", { agentId });
      }, this.pendingDeliverTtlMs);
      q = { items: [], timer };
      this.pendingDelivers.set(agentId, q);
    }
    if (q.items.length >= 10) {
      item.admission.reject(new Error(`pending delivery queue full: ${agentId}`));
      this.log.warn("pending delivery rejected: queue full", { agentId, count: q.items.length });
      return;
    }
    q.items.push(item);
    this.log.debug("deliver queued pending start", { agentId, count: q.items.length });
  }
  clearPendingDeliver(agentId) {
    const q = this.pendingDelivers.get(agentId);
    if (!q) return;
    if (q.timer) clearTimeout(q.timer);
    this.pendingDelivers.delete(agentId);
  }
  rejectPendingDeliver(agentId, error) {
    const q = this.pendingDelivers.get(agentId);
    if (!q) return;
    if (q.timer) clearTimeout(q.timer);
    this.pendingDelivers.delete(agentId);
    for (const item of q.items) item.admission.reject(error);
  }
  debounceMsFor(r) {
    const runtime = this.runtimeResolver(r.config.runtime ?? "claude");
    return runtime?.oneShotWake ? this.oneShotDeliverDebounceMs : this.deliverDebounceMs;
  }
  /** Resolve only after the runtime or cold-start queue has accepted responsibility for this delivery. */
  deliver(agentId, from, target, mentioned = false, meta = {}) {
    if (meta.deliveryId) {
      const now = Date.now();
      const existing = this.deliveryAdmissions.get(meta.deliveryId);
      if (existing && existing.expiresAt > now) {
        this.log.debug("duplicate delivery suppressed", { agentId, deliveryId: meta.deliveryId });
        return existing.promise.then(() => this.beforeRuntimeDelivery(agentId, meta));
      }
      if (existing) this.deliveryAdmissions.delete(meta.deliveryId);
      const predecessor = this.deliveryPreparationTails.get(agentId) ?? Promise.resolve();
      const epoch = this.deliveryEpochs.get(agentId) ?? 0;
      let markPrepared;
      const preparation = new Promise((resolve) => {
        markPrepared = resolve;
      });
      this.deliveryPreparationTails.set(agentId, preparation);
      this.trackDeliveryPreparation(agentId, preparation);
      void preparation.finally(() => {
        if (this.deliveryPreparationTails.get(agentId) === preparation) this.deliveryPreparationTails.delete(agentId);
      });
      const promise = predecessor.catch(() => {
      }).then(() => this.admitDurableDelivery(agentId, from, target, mentioned, meta, epoch, markPrepared));
      const admission = { promise, expiresAt: Number.POSITIVE_INFINITY };
      this.deliveryAdmissions.set(meta.deliveryId, admission);
      void promise.then(
        () => {
          admission.expiresAt = Date.now() + 24 * 60 * 6e4;
        },
        () => {
          if (this.deliveryAdmissions.get(meta.deliveryId) === admission) this.deliveryAdmissions.delete(meta.deliveryId);
        }
      );
      if (this.deliveryAdmissions.size > 1e4) {
        for (const [id, item] of this.deliveryAdmissions) if (item.expiresAt <= now) this.deliveryAdmissions.delete(id);
      }
      return promise;
    }
    return this.admitDelivery(agentId, from, target, mentioned, meta);
  }
  async admitDurableDelivery(agentId, from, target, mentioned, meta, epoch, markPrepared) {
    const deliveryId = meta.deliveryId;
    try {
      if (await this.deliveryAdmissionStore.has(deliveryId)) {
        this.log.debug("persisted duplicate delivery suppressed", { agentId, deliveryId });
        await this.beforeRuntimeDelivery(agentId, meta);
        return;
      }
      if ((this.deliveryEpochs.get(agentId) ?? 0) !== epoch) {
        throw this.deliveryCancellationErrors.get(agentId) ?? new Error(`agent lifecycle changed before delivery admission: ${agentId}`);
      }
      const admission = this.admitDelivery(agentId, from, target, mentioned, meta);
      markPrepared();
      await admission;
      const expiresAt = Date.now() + 24 * 60 * 6e4;
      try {
        await this.deliveryAdmissionStore.remember(deliveryId, expiresAt);
      } catch (error) {
        this.log.error("delivery admission persistence failed", { agentId, deliveryId, detail: String(error) });
      }
    } finally {
      markPrepared();
    }
  }
  invalidateDeliveryLifecycle(agentId, error) {
    this.deliveryEpochs.set(agentId, (this.deliveryEpochs.get(agentId) ?? 0) + 1);
    this.deliveryCancellationErrors.set(agentId, error);
  }
  admitDelivery(agentId, from, target, mentioned, meta) {
    const admission = this.createAdmission();
    const r = this.agents.get(agentId);
    if (!r || this.starting.has(agentId)) {
      this.queuePendingDeliver(agentId, { from, target, mentioned, meta, admission });
      return admission.promise;
    }
    const tname = meta.targetName ?? target;
    const short = meta.msgShort ?? "";
    const key = meta.turnId ?? "legacy";
    const buffers = r.deliverBufs ?? /* @__PURE__ */ new Map();
    r.deliverBufs = buffers;
    const b = buffers.get(key);
    if (b) {
      clearTimeout(b.timer);
      b.count = Math.max(b.count + 1, meta.turnMessageCount ?? 0);
      b.from = from;
      b.target = target;
      b.targetName = tname;
      b.latestShort = short;
      b.isTask = b.isTask || !!meta.isTask;
      b.mentioned = b.mentioned || mentioned;
      b.targets.add(tname);
      b.streamId = meta.streamId ?? b.streamId;
      b.attention = meta.attention ?? b.attention;
      b.deliveryId = meta.deliveryId ?? b.deliveryId;
      b.seq = meta.seq ?? b.seq;
    }
    const buf = b ?? { count: meta.turnMessageCount ?? 1, from, target, targetName: tname, firstShort: short, latestShort: short, isTask: !!meta.isTask, mentioned, targets: /* @__PURE__ */ new Set([tname]), timer: void 0, admissions: [], streamId: meta.streamId, attention: meta.attention, deliveryId: meta.deliveryId, seq: meta.seq };
    buf.admissions.push(admission);
    buf.timer = setTimeout(() => void (async () => {
      buffers.delete(key);
      if (!buffers.size) r.deliverBufs = void 0;
      if (r.turnActive) {
        const queue = r.deliveryQueue ?? [];
        r.deliveryQueue = queue;
        queue.push(buf);
        this.log.debug("inbox notice queued behind active turn", { agentId, count: buf.count, queued: queue.length });
        return;
      }
      await this.admitBufferedDelivery(agentId, r, buf);
    })(), meta.turnId ? 0 : this.debounceMsFor(r));
    buffers.set(key, buf);
    return admission.promise;
  }
};

// src/daemon/workspace.ts
import { mkdir as mkdir4, readdir, readFile as readFile4, rmdir, lstat as lstat2, unlink as unlink3 } from "node:fs/promises";
import path16 from "node:path";
import os5 from "node:os";
var DATA_DIR2 = agentsDir();
var MAX_FILE = 256 * 1024;
var SKIP = /* @__PURE__ */ new Set(["node_modules", ".git"]);
function safe(agentId, rel) {
  const dataRoot = path16.resolve(DATA_DIR2);
  const root = path16.resolve(dataRoot, agentId);
  if (root !== dataRoot && !root.startsWith(dataRoot + path16.sep)) return null;
  const target = path16.resolve(root, rel || ".");
  if (target !== root && !target.startsWith(root + path16.sep)) return null;
  return target;
}
async function walk(root, rel, acc, depth) {
  if (depth > 6 || acc.length > 2e3) return;
  let ds;
  try {
    ds = await readdir(path16.join(root, rel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const d of ds) {
    if (SKIP.has(d.name)) continue;
    const childRel = rel ? `${rel}/${d.name}` : d.name;
    let size = 0;
    let modifiedAt = null;
    try {
      const s = await lstat2(path16.join(root, childRel));
      size = d.isFile() ? s.size : 0;
      modifiedAt = s.mtime.toISOString();
    } catch {
    }
    acc.push({ name: d.name, path: childRel, isDirectory: d.isDirectory(), size, modifiedAt });
    if (d.isDirectory()) await walk(root, childRel, acc, depth + 1);
  }
}
async function listWorkspace(agentId, _subPath = "") {
  const root = path16.join(DATA_DIR2, agentId);
  try {
    const files = [];
    await walk(root, "", files, 0);
    return { files, root };
  } catch (e) {
    return { error: String(e?.message ?? e), root };
  }
}
function fmField(fm, key) {
  const lines = fm.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = new RegExp(`^${key}:\\s*(.*)$`, "i").exec(lines[i]);
    if (!m) continue;
    const inline = m[1].trim();
    if (inline && !/^[|>][+-]?$/.test(inline)) return inline.replace(/^["']|["']$/g, "");
    const block = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s+\S/.test(lines[j])) block.push(lines[j].trim());
      else if (lines[j].trim() === "") block.push("");
      else break;
    }
    return block.join(" ").replace(/\s+/g, " ").trim();
  }
  return "";
}
async function readSkillsDir(dir, sourcePath, depth = 0) {
  if (depth > 3) return [];
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    let name = e.name, description = "", userInvocable = false;
    try {
      const raw = await readFile4(path16.join(dir, e.name, "SKILL.md"), "utf8");
      const txt = raw.replace(/\r\n/g, "\n");
      const fm = /^---\n([\s\S]*?)\n---/.exec(txt);
      if (fm) {
        name = fmField(fm[1], "name") || e.name;
        description = fmField(fm[1], "description");
        userInvocable = /^(true|yes)$/i.test(fmField(fm[1], "user-invocable") || fmField(fm[1], "userInvocable"));
      }
      out.push({ name, displayName: name, description, userInvocable, sourcePath, dirName: e.name });
    } catch {
      out.push(...await readSkillsDir(path16.join(dir, e.name), sourcePath, depth + 1));
    }
  }
  return out;
}
var HOME = os5.homedir();
var UNIVERSAL_SKILLS = { dir: path16.join(HOME, ".agents", "skills"), label: "~/.agents/skills" };
var PROVIDER_HOME_SKILLS = {
  claude: { dir: path16.join(HOME, ".claude", "skills"), label: "~/.claude/skills" },
  codex: { dir: path16.join(process.env.CODEX_HOME || path16.join(HOME, ".codex"), "skills"), label: "~/.codex/skills" },
  copilot: { dir: path16.join(HOME, ".copilot", "skills"), label: "~/.copilot/skills" },
  hermes: process.platform === "win32" ? { dir: path16.join(process.env.LOCALAPPDATA || path16.join(HOME, "AppData", "Local"), "hermes", "skills"), label: "%LOCALAPPDATA%/hermes/skills" } : { dir: path16.join(HOME, ".hermes", "skills"), label: "~/.hermes/skills" },
  kimi: { dir: path16.join(HOME, ".kimi-code", "skills"), label: "~/.kimi-code/skills" },
  opencode: { dir: path16.join(HOME, ".config", "opencode", "skills"), label: "~/.config/opencode/skills" },
  cursor: { dir: path16.join(HOME, ".cursor", "skills"), label: "~/.cursor/skills" },
  pi: { dir: path16.join(HOME, ".pi", "agent", "skills"), label: "~/.pi/agent/skills" }
};
var PROVIDER_WS_DIR = { claude: ".claude", codex: ".codex", copilot: ".copilot", hermes: ".hermes", kimi: ".skills", opencode: ".opencode", cursor: ".cursor", pi: ".pi" };
function skillRootsFor(runtime, agentId, projectPath) {
  const home = PROVIDER_HOME_SKILLS[runtime];
  const global2 = home ? [home, UNIVERSAL_SKILLS] : [UNIVERSAL_SKILLS];
  const wsName = PROVIDER_WS_DIR[runtime];
  const wsSkills = wsName ? runtime === "kimi" ? "" : "skills" : null;
  const workspaceRoot = projectPath ?? path16.join(DATA_DIR2, agentId);
  const sourceLabel = projectPath ? "<project>" : "<workspace>";
  const workspace = wsName ? { dir: path16.join(workspaceRoot, wsName, wsSkills), label: wsSkills ? `${sourceLabel}/${wsName}/skills` : `${sourceLabel}/${wsName}` } : null;
  return { global: global2, workspace };
}
async function listSkills(agentId, runtime = "claude", projectPath) {
  const canonicalProject = projectPath ? await resolveProjectDirectory(projectPath) : null;
  const roots = skillRootsFor(runtime, agentId, canonicalProject);
  const global2 = (await Promise.all(roots.global.map((r) => readSkillsDir(r.dir, r.label)))).flat();
  const workspace = roots.workspace ? await readSkillsDir(roots.workspace.dir, roots.workspace.label) : [];
  return { global: global2, workspace };
}
async function writeAssignedSkill(agentId, runtime, skillName, content) {
  if (!skillName || !/^[a-z0-9][a-z0-9-]*$/.test(skillName)) return { ok: false, error: "invalid skill name" };
  if (!content) return { ok: false, error: "skill content required" };
  const home = PROVIDER_HOME_SKILLS[runtime] ?? UNIVERSAL_SKILLS;
  try {
    await ensureManagedDirectory(home.dir, `${skillName}`);
    await atomicWriteManagedFile(home.dir, `${skillName}/SKILL.md`, content, 420);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
async function readWorkspaceFile(agentId, rel) {
  const file = safe(agentId, rel);
  if (!file) return { error: "invalid path" };
  try {
    const root = path16.resolve(DATA_DIR2, agentId);
    const buf = await readManagedFile(root, path16.relative(root, file), MAX_FILE);
    if (buf.includes(0)) return { error: "binary file" };
    return { path: rel, content: buf.toString("utf8") };
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}
async function writeWorkspaceFile(agentId, rel, content) {
  const file = safe(agentId, rel);
  if (!file) return { error: "invalid path" };
  try {
    await mkdir4(DATA_DIR2, { recursive: true });
    const root = await ensureManagedDirectory(DATA_DIR2, agentId);
    await atomicWriteManagedFile(root, path16.relative(root, file), content);
    return {};
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}
async function deleteWorkspaceFile(agentId, rel) {
  const file = safe(agentId, rel);
  if (!file) return { error: "invalid path" };
  try {
    const root = path16.resolve(DATA_DIR2, agentId);
    const managedFile = await managedFilePath(root, path16.relative(root, file));
    await unlink3(managedFile);
    const dir = path16.dirname(managedFile);
    if (dir !== path16.join(DATA_DIR2, agentId)) {
      await rmdir(dir).catch((err) => {
        if (err.code !== "ENOENT" && err.code !== "ENOTEMPTY") throw err;
      });
    }
    return {};
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}

// src/daemon/listModels.ts
import { spawn } from "node:child_process";
import { existsSync as existsSync2, readdirSync, readFileSync as readFileSync2, statSync as statSync2 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import path17 from "node:path";
var titleCase = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
function isModelId(s) {
  return /^[A-Za-z][A-Za-z0-9\-_./]*$/.test(s);
}
var CLAUDE_MODELS = [
  { id: "sonnet", label: "Sonnet" },
  { id: "opus", label: "Opus" },
  { id: "haiku", label: "Haiku" }
];
var CLAUDE_EFFORT_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max"
};
var CLAUDE_MODEL_EFFORT_ALLOW = {
  opus: /* @__PURE__ */ new Set(["low", "medium", "high", "xhigh", "max"]),
  sonnet: /* @__PURE__ */ new Set(["low", "medium", "high", "max"]),
  haiku: /* @__PURE__ */ new Set(["low", "medium", "high"])
};
function parseClaudeEffortLevels(helpText) {
  const m = /--effort\s*(?:<[^>]+>)?\s*(?:Effort level[^(]*)?\(([^)]+)\)/.exec(helpText);
  if (!m) return [];
  return m[1].split(",").map((s) => s.trim()).filter((s) => /^[a-z]+$/i.test(s));
}
function claudeThinkingForModel(modelId, superset) {
  const allow = CLAUDE_MODEL_EFFORT_ALLOW[modelId];
  const levels = superset.filter((v) => !allow || allow.has(v)).map((v) => ({ value: v, label: CLAUDE_EFFORT_LABEL[v] ?? titleCase(v) }));
  if (!levels.length) return void 0;
  return { levels, default: levels.some((l) => l.value === "medium") ? "medium" : levels[0].value };
}
function parseCodexModels(jsonStr) {
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }
  const models = Array.isArray(parsed?.models) ? parsed.models : [];
  const out = [];
  for (const m of models) {
    if (m?.visibility !== "list") continue;
    const slug = typeof m?.slug === "string" ? m.slug : "";
    if (!slug) continue;
    const raw = Array.isArray(m?.supported_reasoning_levels) ? m.supported_reasoning_levels : [];
    const levels = raw.map((l) => ({ value: String(l?.effort ?? ""), label: titleCase(String(l?.effort ?? "")), description: typeof l?.description === "string" ? l.description : void 0 })).filter((l) => l.value);
    const thinking = levels.length ? { levels, default: typeof m?.default_reasoning_level === "string" ? m.default_reasoning_level : void 0 } : void 0;
    out.push({ id: slug, label: typeof m?.display_name === "string" && m.display_name ? m.display_name : slug, provider: "openai", ...thinking ? { thinking } : {} });
  }
  return out;
}
function parseOpencodeModels(stdout) {
  const out = [];
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("{") || line.startsWith('"') || line.startsWith("}")) continue;
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) continue;
    const id = line.split(/\s+/)[0];
    const slash = id.indexOf("/");
    if (slash <= 0 || slash >= id.length - 1) continue;
    out.push({ id, label: id, provider: id.slice(0, slash) });
  }
  return out;
}
function parseCursorModels(stdout) {
  const out = [];
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.indexOf(" - ");
    if (sep < 0) continue;
    const id = line.slice(0, sep).trim();
    if (!isModelId(id)) continue;
    let label = line.slice(sep + 3).trim();
    const isDefault = /default/i.test(label);
    const paren = label.indexOf("(");
    if (paren >= 0) label = label.slice(0, paren).trim();
    out.push({ id, label: label || id, provider: "cursor", ...isDefault ? { default: true } : {} });
  }
  return out;
}
function parsePiModels(out) {
  const res = [];
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (isPiNoise(line)) continue;
    const fields = line.split(/\s+/);
    const first = fields[0];
    if (first.toLowerCase() === "provider") continue;
    let id;
    if (first.includes(":") || first.includes("/")) id = first.replace(":", "/");
    else if (fields.length >= 2) id = `${first}/${fields[1]}`;
    else continue;
    const slash = id.indexOf("/");
    if (slash <= 0 || slash >= id.length - 1) continue;
    res.push({ id, label: id, provider: id.slice(0, slash) });
  }
  return res;
}
function isPiNoise(line) {
  const l = line.toLowerCase();
  return l.includes("no models match pattern") || l.startsWith("warning:") || l.startsWith("error:") || l.startsWith("info:");
}
function labelFromId(id) {
  return id.split(/[-_]/).filter(Boolean).map(titleCase).join(" ") || id;
}
function firstYamlString(text, keys) {
  for (const key of keys) {
    const re = new RegExp(`^${key}:\\s*["']?([^"'\\n#]+)`, "m");
    const m = re.exec(text);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}
function hermesProfileLabel(dir, id) {
  for (const filename of ["profile.yaml", "config.yaml"]) {
    const file = path17.join(dir, filename);
    if (!existsSync2(file)) continue;
    try {
      const text = readFileSync2(file, "utf8").slice(0, 4096);
      const label = firstYamlString(text, ["display_name", "displayName", "name", "title"]);
      if (label) return label;
    } catch {
    }
  }
  return labelFromId(id);
}
function isHermesProfileDir(dir) {
  return ["profile.yaml", "SOUL.md", "config.yaml"].some((name) => existsSync2(path17.join(dir, name)));
}
function discoverHermesProfilesFromRoots(roots) {
  const found = /* @__PURE__ */ new Map([
    ["default", { id: "default", label: "Default profile", provider: "hermes", default: true }]
  ]);
  for (const root of roots) {
    if (!root || !existsSync2(root)) continue;
    let entries;
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const dir = path17.join(root, entry);
      try {
        if (!statSync2(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      if (!isHermesProfileDir(dir)) continue;
      if (!isModelId(entry)) continue;
      if (!found.has(entry)) found.set(entry, { id: entry, label: hermesProfileLabel(dir, entry), provider: "hermes" });
    }
  }
  return [...found.values()].sort((a, b) => {
    if (a.id === "default") return -1;
    if (b.id === "default") return 1;
    return a.id.localeCompare(b.id);
  });
}
function discoverHermesProfiles() {
  const home = homedir2();
  const roots = [
    process.env.HERMES_PROFILE_DIR,
    path17.join(home, ".hermes", "profiles")
  ].filter((v) => !!v);
  return discoverHermesProfilesFromRoots(roots);
}
var LIST_TIMEOUT_MS = 7e3;
var OUT_CAP = 256 * 1024;
function runList(bin, args2, timeoutMs = LIST_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    let proc;
    try {
      proc = spawn(bin, args2, { stdio: ["ignore", "pipe", "pipe"], env });
    } catch (e) {
      return resolve({ stdout: "", stderr: String(e?.message ?? e), code: 1 });
    }
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (c) => {
      if (stdout.length < OUT_CAP) stdout += c.toString();
    });
    proc.stderr?.on("data", (c) => {
      if (stderr.length < OUT_CAP) stderr += c.toString();
    });
    const timer = setTimeout(() => {
      try {
        proc.kill(process.platform === "win32" ? void 0 : "SIGKILL");
      } catch {
      }
    }, timeoutMs);
    proc.on("error", (e) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr || String(e?.message ?? e), code: 1 });
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}
async function listModels(runtime) {
  switch (runtime) {
    case "opencode": {
      let r = await runList("opencode", ["models", "--verbose"], 5e3);
      let models = parseOpencodeModels(r.stdout);
      if (!models.length) {
        r = await runList("opencode", ["models"], 2e3);
        models = parseOpencodeModels(r.stdout);
      }
      return models.length ? models : null;
    }
    case "cursor": {
      const r = await runList("cursor-agent", ["--list-models"]);
      const models = parseCursorModels(r.stdout);
      return models.length ? models : null;
    }
    case "pi": {
      const r = await runList("pi", ["--list-models"]);
      const models = parsePiModels(r.stdout || r.stderr);
      return models.length ? models : null;
    }
    case "claude": {
      const r = await runList("claude", ["--help"]);
      const superset = parseClaudeEffortLevels(r.stdout || r.stderr);
      if (!superset.length) return null;
      return CLAUDE_MODELS.map((m) => {
        const thinking = claudeThinkingForModel(m.id, superset);
        return { ...m, provider: "anthropic", ...thinking ? { thinking } : {} };
      });
    }
    case "codex": {
      const r = await runList("codex", ["debug", "models"]);
      const models = parseCodexModels(r.stdout);
      return models.length ? models : null;
    }
    case "hermes": {
      const profiles = discoverHermesProfiles();
      return profiles.length ? profiles : null;
    }
    default:
      return null;
  }
}

// src/daemon/gitOps.ts
import { execFile } from "node:child_process";
import { promises as fs4 } from "node:fs";
import os6 from "node:os";
import path19 from "node:path";
import { promisify } from "node:util";

// src/daemon/gitRoots.ts
import path18 from "node:path";
function parseRoots(raw = process.env.OPEN_WORKORA_PROJECT_ROOTS) {
  const value = raw?.trim();
  if (!value) return [];
  let inputs;
  if (value.startsWith("[")) {
    try {
      inputs = JSON.parse(value);
    } catch {
      return [];
    }
    if (!Array.isArray(inputs)) return [];
    inputs = inputs.filter((item) => typeof item === "string");
  } else {
    inputs = value.split(path18.delimiter);
  }
  return [...new Set(inputs.map((item) => item.trim()).filter(Boolean))];
}
var PROJECT_ROOTS = parseRoots();

// src/daemon/gitOps.ts
var exec = promisify(execFile);
var GIT = "git";
function errMsg(e) {
  if (e && typeof e === "object" && "stderr" in e) return String(e.stderr || e.message || e);
  return String(e instanceof Error ? e.message : e);
}
function repoNameFromUrl(url) {
  const clean = url.replace(/^git@[^:]+:/, "").replace(/^https?:\/\//, "").replace(/\.git$/, "").split("/").filter(Boolean);
  const owner = clean[clean.length - 2] ?? "repo";
  const repo = clean[clean.length - 1] ?? "repo";
  return `${owner}-${repo}`.replace(/[^A-Za-z0-9_.-]/g, "-");
}
async function projectsRoot() {
  if (PROJECT_ROOTS.length > 0) return PROJECT_ROOTS[0];
  return path19.join(os6.homedir(), "projects");
}
function assertInsideRoots(clonePath) {
  const resolved = path19.resolve(clonePath);
  const roots = PROJECT_ROOTS.length > 0 ? PROJECT_ROOTS.map((r) => path19.resolve(r)) : [path19.resolve(path19.join(os6.homedir(), "projects"))];
  const ok = roots.some((root) => resolved === root || resolved.startsWith(root + path19.sep));
  if (!ok) throw new Error(`clone path ${clonePath} is outside the configured project roots (${roots.join(", ")})`);
}
async function cloneRepo({ repoUrl, branch, path: pathHint, shallow }) {
  try {
    const root = await projectsRoot();
    await fs4.mkdir(root, { recursive: true });
    const dest = pathHint && path19.isAbsolute(pathHint) ? path19.resolve(pathHint) : path19.join(root, pathHint || repoNameFromUrl(repoUrl));
    assertInsideRoots(dest);
    if (await fs4.stat(dest).then(() => true).catch(() => false)) {
      const cur = await git(dest, ["fetch", "--all", "--prune"]);
      const short2 = await git(dest, ["rev-parse", "--short", "HEAD"]);
      return { ok: true, clonePath: dest, defaultBranch: branch || "main", reusing: true, fetch: cur, commit: short2.trim() };
    }
    const args2 = ["clone"];
    if (shallow !== false) args2.push("--filter=blob:none");
    args2.push(repoUrl, dest);
    const out = await exec(GIT, args2, { timeout: 12e4 });
    const defaultBranch = branch || await git(dest, ["symbolic-ref", "--short", "HEAD"]).then((b) => b.trim()).catch(() => "main");
    const short = await git(dest, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim()).catch(() => "");
    return { ok: true, clonePath: dest, defaultBranch, commit: short, output: out.stdout.slice(-500) };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
async function repoStatus(clonePath) {
  try {
    assertInsideRoots(clonePath);
    const branch = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    const dirty = await git(clonePath, ["status", "--porcelain"]).then((s) => s.split("\n").filter(Boolean).length).catch(() => 0);
    return { ok: true, branch, commit, dirty };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_status_failed" };
  }
}
async function pullRepo(clonePath, branch) {
  try {
    assertInsideRoots(clonePath);
    const out = await git(clonePath, ["pull", "--ff-only", "origin", branch || "HEAD"]);
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, commit, output: out.slice(-300) };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_pull_failed" };
  }
}
async function diffBranch(clonePath, base, opts) {
  try {
    assertInsideRoots(clonePath);
    const branch = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const baseRef = base && base.trim() ? base.trim() : "origin/main";
    const mergeBase = await git(clonePath, ["merge-base", branch, baseRef]).then((b) => b.trim()).catch(() => "");
    const range = mergeBase ? `${mergeBase}..${branch}` : `${baseRef}...${branch}`;
    const args2 = ["diff", ...opts?.patch ? [] : ["--stat"], range, "--"];
    const out = await git(clonePath, args2).catch(() => "");
    let dirty = "";
    const status = await git(clonePath, ["status", "--porcelain"], 15e3).catch(() => "");
    if (status.trim()) {
      dirty = await git(clonePath, ["diff", "HEAD", ...opts?.patch ? [] : ["--stat"]], 2e4).catch(() => "");
    }
    const combined = [out, dirty].filter(Boolean).join("\n");
    return { ok: true, branch, base: mergeBase || baseRef, diff: combined, patch: opts?.patch === true };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_diff_failed" };
  }
}
async function commitAndPush(clonePath, branch, message, author) {
  try {
    assertInsideRoots(clonePath);
    await git(clonePath, ["checkout", "-B", branch]);
    await git(clonePath, ["add", "-A"]);
    const authorArg = author ? ["--author", author] : [];
    await git(clonePath, ["commit", ...authorArg, "-m", message]);
    const out = await git(clonePath, ["push", "-u", "origin", branch]);
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, commit, branch, output: out.slice(-300) };
  } catch (e) {
    const msg = errMsg(e);
    if (/nothing to commit|no changes added|nothing added to commit/i.test(msg)) {
      return { ok: false, error: "no changes to commit on this branch", code: "git_nothing_to_commit" };
    }
    return { ok: false, error: msg, code: "git_push_failed" };
  }
}
async function listBranches(clonePath) {
  try {
    assertInsideRoots(clonePath);
    await git(clonePath, ["fetch", "--all", "--prune"]).catch(() => {
    });
    const local = await git(clonePath, ["for-each-ref", "--format=%(refname:short)", "refs/heads"]);
    const remote = await git(clonePath, ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"]);
    const current = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const locals = local.split("\n").filter(Boolean);
    const remotes = [...new Set(remote.split("\n").filter(Boolean).map((r) => r.replace(/^origin\//, "")).filter((r) => !locals.includes(r)))];
    return { ok: true, current, branches: [...locals, ...remotes], local: locals, remote: remotes };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_branches_failed" };
  }
}
async function checkoutBranch(clonePath, branch) {
  try {
    assertInsideRoots(clonePath);
    const exists = await git(clonePath, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]).then(() => true).catch(() => false);
    if (!exists) {
      const remoteHas = await git(clonePath, ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${branch}`]).then(() => true).catch(() => false);
      await git(clonePath, remoteHas ? ["checkout", "-B", branch, `origin/${branch}`] : ["checkout", "-B", branch]);
    } else {
      await git(clonePath, ["checkout", branch]);
    }
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, branch, commit };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_checkout_failed" };
  }
}
async function runProjectTests(clonePath, command) {
  try {
    assertInsideRoots(clonePath);
    const hasComposer = await fs4.stat(path19.join(clonePath, "composer.json")).then(() => true).catch(() => false);
    const hasPackage = await fs4.stat(path19.join(clonePath, "package.json")).then(() => true).catch(() => false);
    const cmd = command || (hasComposer ? "sh -c 'composer install --no-interaction --prefer-dist 2>/dev/null; php artisan test --stop-on-failure 2>&1 || true'" : hasPackage ? "npm test 2>&1 || true" : "true");
    const denied = COMMAND_POLICY_DENY.some((pat) => cmd.includes(pat));
    if (denied) return { ok: false, error: "command denied by policy", code: "git_test_denied" };
    const r = await exec("/bin/sh", ["-c", cmd], { cwd: clonePath, timeout: 18e4, maxBuffer: 8 * 1024 * 1024 }).catch((e) => e);
    return { ok: true, output: String(r?.stdout ?? "").slice(-8e3), code: r?.code ?? 0, command: cmd };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_test_failed" };
  }
}
var COMMAND_POLICY_DENY = [
  "rm -rf /",
  // recursive delete from filesystem root
  "mkfs",
  // format a filesystem
  "dd if=",
  // raw block device write
  "shutdown",
  // host shutdown
  "reboot",
  // host reboot
  "> /dev/sda",
  // write to a block device
  "| sh",
  // pipe output to sh (curl x | sh, echo x | sh, ...)
  "|sh",
  // same, without space
  "| bash",
  // pipe output to bash
  "|bash",
  // same, without space
  "| zsh",
  // pipe output to zsh
  "|zsh",
  // same, without space
  "| base64",
  // pipe to base64 (decode-then-run / exfil patterns)
  "|base64",
  // same, without space
  "chmod -R 777 /",
  // world-writable root
  "chown -R 0:0 /",
  // root-own everything
  "git reset --hard HEAD && git clean -fdx",
  // destructive repo wipe (kept even though args are fixed by the UI; defense in depth)
  "base64 -d",
  // decode-then-run exfil pattern
  "nc -e",
  // netcat reverse shell
  "bash -i >& /dev/tcp",
  // bash reverse shell
  "python3 -c 'import socket,subprocess"
  // python reverse shell
];
async function git(cwd, args2, timeoutMs = 6e4) {
  const r = await exec(GIT, args2, { cwd, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1" } });
  return r.stdout;
}
async function ensureProjectsRootDir() {
  const root = await projectsRoot();
  await fs4.mkdir(root, { recursive: true });
  return root;
}

// src/daemon/index.ts
var log3 = createLogger("daemon");
var DELIVERY_PENDING_HEARTBEAT_MS = Math.max(250, Number(process.env.OPEN_WORKORA_DELIVERY_PENDING_HEARTBEAT_MS ?? 750));
var DELIVERY_COMMIT_TIMEOUT_MS = Math.max(2e3, Number(process.env.OPEN_WORKORA_DELIVERY_COMMIT_TIMEOUT_MS ?? 15e3));
var args = process.argv.slice(2);
var serverUrl = "";
var apiKey = "";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--server-url" && args[i + 1]) serverUrl = args[++i];
  if (args[i] === "--api-key" && args[i + 1]) apiKey = args[++i];
}
if (!serverUrl) serverUrl = `http://localhost:${process.env.PORT ?? 7777}`;
if (!apiKey) apiKey = process.env.OPEN_WORKORA_DAEMON_API_KEY ?? "";
if (!apiKey) {
  console.error("Usage: Workora-daemon [--server-url <url>] --api-key <machineKey>");
  console.error("   or: OPEN_WORKORA_DAEMON_API_KEY=<machineKey> Workora-daemon [--server-url <url>]");
  process.exit(1);
}
var MID_FILE = machineIdFile();
var readMachineId = () => {
  try {
    return fs5.readFileSync(MID_FILE, "utf8").trim() || void 0;
  } catch {
    return void 0;
  }
};
var saveMachineId = (id) => {
  try {
    fs5.mkdirSync(path20.dirname(MID_FILE), { recursive: true });
    fs5.writeFileSync(MID_FILE, id);
  } catch {
  }
};
var conn;
var deliveryCommitWaiters = /* @__PURE__ */ new Map();
function requestDeliveryCommit(agentId, meta) {
  if (!meta.deliveryId) return Promise.resolve();
  const existing = deliveryCommitWaiters.get(meta.deliveryId);
  if (existing) return existing.promise;
  let resolve;
  let reject;
  const sendReady = () => conn.send({ type: "agent:deliver:ready", agentId, seq: meta.seq, deliveryId: meta.deliveryId });
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const retry = setInterval(sendReady, DELIVERY_PENDING_HEARTBEAT_MS);
  retry.unref?.();
  const timeout = setTimeout(() => reject(new Error(`server did not commit delivery admission: ${meta.deliveryId}`)), DELIVERY_COMMIT_TIMEOUT_MS);
  timeout.unref?.();
  const waiter = { promise, resolve, reject, retry, timeout };
  deliveryCommitWaiters.set(meta.deliveryId, waiter);
  void promise.finally(() => {
    clearInterval(retry);
    clearTimeout(timeout);
    if (deliveryCommitWaiters.get(meta.deliveryId) === waiter) deliveryCommitWaiters.delete(meta.deliveryId);
  }).catch(() => {
  });
  sendReady();
  return promise;
}
function settleDeliveryCommit(deliveryId, error) {
  if (typeof deliveryId !== "string") return;
  const waiter = deliveryCommitWaiters.get(deliveryId);
  if (!waiter) return;
  if (error) waiter.reject(new Error(String(error)));
  else waiter.resolve();
}
var mgr = new AgentManager((m) => conn.send(m), { beforeRuntimeDelivery: requestDeliveryCommit });
function runAgentControl(msg, operation) {
  void mgr.runControl(msg.agentId, operation).then(
    () => {
      if (typeof msg.requestId === "string" && msg.requestId) conn.send({ type: "rpc:ack", requestId: msg.requestId });
    },
    (cause) => {
      const error = String(cause instanceof Error ? cause.message : cause);
      log3.error("agent control failed", { type: msg.type, agentId: msg.agentId, detail: error });
      if (typeof msg.requestId === "string" && msg.requestId) conn.send({ type: "rpc:nack", requestId: msg.requestId, error });
    }
  );
}
conn = new Connection(serverUrl, apiKey, (msg) => {
  if (msg.type !== "ping") log3.debug("recv", { type: msg.type, agentId: msg.agentId });
  switch (msg.type) {
    case "ready:ack":
      if (typeof msg.machineId === "string" && msg.machineId) saveMachineId(msg.machineId);
      break;
    case "agent:deliver:admitted":
      settleDeliveryCommit(msg.deliveryId);
      break;
    case "agent:deliver:rejected":
      settleDeliveryCommit(msg.deliveryId, msg.error ?? "server rejected delivery admission");
      break;
    // Agent dials the same server URL this daemon connected with (proven reachable), overriding the
    // server-reported config.serverUrl (SELF_URL = localhost:PORT on the server box — wrong whenever the
    // daemon runs on a different host than the server, e.g. local daemon ↔ getworkora.com).
    case "agent:start":
      runAgentControl(msg, () => mgr.start(msg.agentId, { ...msg.config, serverUrl }));
      break;
    case "agent:deliver": {
      const admission = mgr.deliver(msg.agentId, msg.from ?? "someone", msg.target ?? "", !!msg.mentioned, { targetName: msg.targetName, msgShort: msg.msgShort, isTask: msg.isTask, streamId: msg.streamId, turnId: msg.turnId, turnMessageCount: msg.turnMessageCount, attention: msg.attention, deliveryId: msg.deliveryId, seq: msg.seq });
      const sendPending = () => conn.send({ type: "agent:deliver:pending", agentId: msg.agentId, seq: msg.seq, deliveryId: msg.deliveryId });
      sendPending();
      const pendingHeartbeat = setInterval(sendPending, DELIVERY_PENDING_HEARTBEAT_MS);
      pendingHeartbeat.unref?.();
      void admission.then(
        () => {
          clearInterval(pendingHeartbeat);
          conn.send({ type: "agent:deliver:ack", agentId: msg.agentId, seq: msg.seq, deliveryId: msg.deliveryId });
        },
        (error) => {
          clearInterval(pendingHeartbeat);
          conn.send({ type: "agent:deliver:nack", agentId: msg.agentId, seq: msg.seq, deliveryId: msg.deliveryId, error: String(error instanceof Error ? error.message : error) });
        }
      );
      break;
    }
    case "agent:stop":
      runAgentControl(msg, () => mgr.stop(msg.agentId));
      break;
    case "agent:sleep":
      runAgentControl(msg, () => mgr.sleep(msg.agentId));
      break;
    case "agent:reset":
      runAgentControl(msg, () => mgr.reset(msg.agentId, !!msg.wipeWorkspace, !!msg.clearMemory));
      break;
    case "agent:profile":
      void mgr.syncProfile(msg.agentId, msg.displayName ?? "", msg.description);
      break;
    case "agent:workspace:list":
      void listWorkspace(msg.agentId, msg.path ?? "").then((r) => conn.send({ type: "workspace:file_tree", requestId: msg.requestId, agentId: msg.agentId, ...r }));
      break;
    case "agent:workspace:read":
      void readWorkspaceFile(msg.agentId, msg.path ?? "").then((r) => conn.send({ type: "workspace:file_content", requestId: msg.requestId, agentId: msg.agentId, ...r }));
      break;
    case "agent:workspace:write":
      void writeWorkspaceFile(msg.agentId, msg.path ?? "", msg.content ?? "").then((r) => conn.send({ type: "workspace:file_write", requestId: msg.requestId, agentId: msg.agentId, ...r }));
      break;
    case "agent:workspace:delete":
      void deleteWorkspaceFile(msg.agentId, msg.path ?? "").then((r) => conn.send({ type: "workspace:file_delete", requestId: msg.requestId, agentId: msg.agentId, ...r }));
      break;
    case "agent:skills:list":
      void listSkills(msg.agentId, msg.runtime, msg.projectPath).then((r) => conn.send({ type: "skills:list", requestId: msg.requestId, agentId: msg.agentId, ...r }));
      break;
    case "skills:write":
      void writeAssignedSkill(String(msg.agentId ?? ""), String(msg.runtime ?? "claude"), String(msg.skillName ?? ""), String(msg.content ?? "")).then(
        (r) => conn.send({ type: "skills:written", requestId: msg.requestId, ...r }),
        (cause) => conn.send({ type: "skills:written", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "project:resolve":
      void resolveProjectDirectory(msg.path).then(
        (projectPath) => conn.send({ type: "project:resolved", requestId: msg.requestId, projectPath }),
        (cause) => conn.send({ type: "project:resolved", requestId: msg.requestId, error: String(cause instanceof Error ? cause.message : cause), code: cause instanceof ProjectDirectoryError ? cause.code : "invalid_project_path" })
      );
      break;
    case "project:browse":
      void browseProjectDirectories({ path: msg.path, discover: msg.discover === true, cursor: msg.cursor, limit: msg.limit }).then(
        (result) => conn.send({ type: "project:directories", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "project:directories", requestId: msg.requestId, error: String(cause instanceof Error ? cause.message : cause), code: cause instanceof ProjectDirectoryError ? cause.code : "invalid_project_path" })
      );
      break;
    // Git project ops (Phase 1: "paste a repo, get a coding agent")
    case "git:clone":
      void cloneRepo({ repoUrl: String(msg.repoUrl ?? ""), branch: typeof msg.branch === "string" ? msg.branch : void 0, path: typeof msg.path === "string" ? msg.path : void 0, shallow: msg.shallow !== false }).then(
        (result) => conn.send({ type: "git:cloned", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:cloned", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:status":
      void repoStatus(String(msg.clonePath ?? "")).then(
        (result) => conn.send({ type: "git:status", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:status", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:diff":
      void diffBranch(String(msg.clonePath ?? ""), typeof msg.base === "string" ? msg.base : void 0, { patch: msg.patch === true, stat: msg.stat !== false }).then(
        (result) => conn.send({ type: "git:diff", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:diff", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:pull":
      void pullRepo(String(msg.clonePath ?? ""), typeof msg.branch === "string" ? msg.branch : void 0).then(
        (result) => conn.send({ type: "git:pulled", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:pulled", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:push":
      void commitAndPush(String(msg.clonePath ?? ""), String(msg.branch ?? "workora/agent-changes"), String(msg.message ?? "workora: agent changes"), typeof msg.author === "string" ? msg.author : void 0).then(
        (result) => conn.send({ type: "git:pushed", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:pushed", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:projects-root":
      void ensureProjectsRootDir().then(
        (root) => conn.send({ type: "git:projects-root", requestId: msg.requestId, root }),
        (cause) => conn.send({ type: "git:projects-root", requestId: msg.requestId, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:branches":
      void listBranches(String(msg.clonePath ?? "")).then(
        (result) => conn.send({ type: "git:branches", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:branches", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:checkout":
      void checkoutBranch(String(msg.clonePath ?? ""), String(msg.branch ?? "main")).then(
        (result) => conn.send({ type: "git:checkout", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:checkout", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "git:test":
      void runProjectTests(String(msg.clonePath ?? ""), typeof msg.command === "string" ? msg.command : void 0).then(
        (result) => conn.send({ type: "git:tested", requestId: msg.requestId, ...result }),
        (cause) => conn.send({ type: "git:tested", requestId: msg.requestId, ok: false, error: String(cause instanceof Error ? cause.message : cause) })
      );
      break;
    case "probe-models":
      void listModels(msg.runtime ?? "").then((models) => conn.send({ type: "models", requestId: msg.requestId, runtime: msg.runtime, models })).catch((e) => conn.send({ type: "models", requestId: msg.requestId, runtime: msg.runtime, models: null, error: String(e?.message ?? e) }));
      break;
    case "agent:resource-budget":
      conn.send({ type: "agent:resource-budget", requestId: msg.requestId, ...mgr.budgetStatus() });
      break;
    case "agent:dequeue":
      mgr.dequeue(msg.agentId);
      break;
    case "ping":
      conn.send({ type: "pong" });
      break;
    default:
      if (typeof msg.requestId === "string" && msg.requestId) conn.send({ type: "rpc:nack", requestId: msg.requestId, error: `daemon ${"0.14.0"} does not support "${msg.type}" \u2014 restart it with: curl -fsSL https://raw.githubusercontent.com/tharunramagiri/Workora/main/scripts/install-daemon.sh | bash -s --` });
  }
}, () => {
  const runtimes = detectRuntimes();
  log3.info("ready", { runtimes, hostname: os7.hostname() });
  conn.send({
    type: "ready",
    capabilities: ["agent:start", "agent:stop", "agent:sleep", "agent:reset", "agent:profile", "agent:deliver", "agent:workspace", "resource:limits", DELIVERY_ADMISSION_CAPABILITY, AGENT_CONTROL_ACK_CAPABILITY, PROJECT_DIRECTORY_CAPABILITY, PROJECT_BROWSER_CAPABILITY],
    runtimes,
    runningAgents: mgr.running(),
    hostname: os7.hostname(),
    os: `${os7.platform()} ${os7.arch()}`,
    daemonVersion: "0.14.0",
    machineId: readMachineId()
    // Stable identity: empty on first connection; server sends it back via ready:ack for persistence.
  });
});
log3.info("Workora daemon starting", { serverUrl });
conn.connect();
var shutdown = () => {
  log3.info("shutting down");
  mgr.stopAll();
  conn.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGBREAK", shutdown);
