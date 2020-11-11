var utils = require("ethereumjs-util");
var to = require("../utils/to");

module.exports = {
  encode: function(val, cb) {
    if (cb) {
      return cb(null, to.hex(val));
    }
    return to.hex(val);
  },
  decode: function(json, cb) {
    if (cb) {
      return cb(null, utils.toBuffer(json));
    }
    return utils.toBuffer(json);
  }
};
