var Sublevel = require("level-sublevel");
const { LevelUpOutOfRangeError, BlockOutOfRangeError } = require("../utils/errorhelper");

// Level up adapter that looks like an array. Doesn't support inserts.

function LevelUpArrayAdapter(name, db, serializer) {
  this.db = Sublevel(db);
  this.db = this.db.sublevel(name);
  this.name = name;
  this.serializer = serializer || {
    encode: function(val, callback) {
      callback(null, val);
    },
    decode: function(val, callback) {
      callback(null, val);
    }
  };
}

LevelUpArrayAdapter.prototype.length = async function() {
  const self = this;
  return new Promise((resolve, reject) => {
    self.db.get("length", function(err, result) {
      if (err) {
        if (err.notFound) {
          return resolve(0);
        } else {
          return reject(err);
        }
      }

      resolve(result);
    });
  });
};

LevelUpArrayAdapter.prototype._get = async function(key) {
  var self = this;
  return new Promise((resolve, reject) => {
    self.db.get(key, function(err, val) {
      if (err) {
        return reject(err);
      }
      self.serializer.decode(val, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};

LevelUpArrayAdapter.prototype._put = async function(key, value) {
  // console.log("LevelUpArrayAdapter:put");
  var self = this;
  return new Promise((resolve, reject) => {
    self.serializer.encode(value, function(err, encoded) {
      if (err) {
        return reject(err);
      }
      self.db.put(key, encoded, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};

LevelUpArrayAdapter.prototype.get = async function(index) {
  var self = this;

  return new Promise(async(resolve, reject) => {
    let length;
    try {
      length = await self.length();
    } catch (err) {
      return reject(err);
    }

    if (index >= length) {
      // index out of range
      const RangeError =
        self.name === "blocks"
          ? new BlockOutOfRangeError(index, length)
          : new LevelUpOutOfRangeError(self.name, index, length);
      return reject(RangeError);
    }
    const val = await self._get(index);
    resolve(val);
  });
};

LevelUpArrayAdapter.prototype.push = async function(val) {
  var self = this;
  return new Promise(async(resolve, reject) => {
    let length;
    try {
      length = await self.length();
    } catch (err) {
      return reject(err);
    }

    // TODO: Do this in atomic batch.
    try {
      await self._put(length + "", val);
    } catch (err) {
      return reject(err);
    }

    self.db.put("length", length + 1, function(err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
};

LevelUpArrayAdapter.prototype.pop = async function() {
  var self = this;

  return new Promise(async(resolve, reject) => {
    let length;
    try {
      length = await self.length();
    } catch (err) {
      return reject(err);
    }

    var newLength = length - 1;

    // TODO: Do this in atomic batch.
    let val;
    try {
      val = await self._get(newLength + "");
    } catch (err) {
      return reject(err);
    }

    self.db.del(newLength + "", function(err) {
      if (err) {
        return reject(err);
      }

      self.db.put("length", newLength, function(err) {
        if (err) {
          return reject(err);
        }
        resolve(val);
      });
    });
  });
};

LevelUpArrayAdapter.prototype.last = async function() {
  var self = this;
  return new Promise(async(resolve, reject) => {
    let length;
    try {
      length = await self.length();
    } catch (err) {
      return reject(err);
    }

    if (length === 0) {
      return resolve(null);
    }

    const val = await self._get(length - 1 + "");
    resolve(val);
  });
};

LevelUpArrayAdapter.prototype.first = async function() {
  const self = this;
  return new Promise(async(resolve, reject) => {
    const val = await self._get("0");
    resolve(val);
  });
};

module.exports = LevelUpArrayAdapter;
