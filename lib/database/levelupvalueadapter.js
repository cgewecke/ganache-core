// Warning: Wrote this because I wanted it, then didn't need it.
// May come in handy later. You've been warned. This might be bad/dead code.
var Sublevel = require("level-sublevel");

function LevelUpValueAdapter(name, db, serializer) {
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
  this.value_key = "value";
}

LevelUpValueAdapter.prototype.get = async function() {
  var self = this;

  return new Promise((resolve, reject) => {
    self.db.get(this.value_key, function(err, val) {
      if (err) {
        if (err.notFound) {
          return resolve(null);
        } else {
          return reject(err);
        }
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

LevelUpValueAdapter.prototype.set = async function(value) {
  var self = this;

  return new Promise((resolve, reject) => {
    self.serializer.encode(value, function(err, encoded) {
      if (err) {
        return reject(err);
      }
      self.db.put(self.value_key, encoded, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};

LevelUpValueAdapter.prototype.del = async function() {
  const self = this;

  return new Promise((resolve, reject) => {
    self.db.del(this.value_key, function(err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
};

module.exports = LevelUpValueAdapter;
