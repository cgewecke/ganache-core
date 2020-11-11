var Sublevel = require("level-sublevel");
var async = require("async");

let id = 0;
function LevelUpObjectAdapter(name, db, valueserializer, keyserializer, options) {
  this.db = Sublevel(db, options);
  this.db = this.db.sublevel(name);
  this.name = name;
  this.valueserializer = valueserializer || {
    encode: function(val, callback) {
      callback(null, val);
    },
    decode: function(val, callback) {
      callback(null, val);
    }
  };
  this.keyserializer = keyserializer || {
    encode: function(val, callback) {
      callback(null, val);
    },
    decode: function(val, callback) {
      callback(null, val);
    }
  };
}

LevelUpObjectAdapter.prototype.get = async function(key, options = {}) {
  // console.log("LevelUpObjectAdapter:get");
  var self = this;

  return new Promise((resolve, reject) => {
    self.keyserializer.encode(key, function(err, encodedKey) {
      // console.log("LevelUpObjectAdapter:get post keyserializer");
      if (err) {
        return reject(err);
      }

      self.db.get(encodedKey, function(err, val) {
        // console.log("LevelUpObjectAdapter:get post db.get");
        if (err) {
          return reject(err);
        }

        self.valueserializer.decode(val, function(err, decodedValue) {
          // console.log("LevelUpObjectAdapter:get post valueserializer");
          if (err) {
            return reject(err);
          }

          resolve(decodedValue);
        });
      });
    });
  });
};

LevelUpObjectAdapter.prototype.put = function(key, value, options = {}) {
  console.log("LevelUpObjectAdapter:put");
  var self = this;

  return new Promise(function(resolve, reject){
    id++;
    self.keyserializer.encode(key, function(err, encodedKey) {
      console.log("LevelUpObjectAdapter:put post keyserializer: id: " + id);
      if (err) {
        console.log('rejecting @keyserializer')
        return reject(err);
      }

      self.valueserializer.encode(value, function(err, encoded) {
        console.log("LevelUpObjectAdapter:put post valueserializer id: " + id);

        if (err) {
          console.log('rejecting @valueserializer')
          return reject(err);
        }

        console.log("LevelUpObjectAdapter:put pre encode: id: " + typeof encodedKey + ' : ' + typeof encoded );
        self.db.put(encodedKey, encoded, function(err, res) {
          console.log("LevelUpObjectAdapter:put post encode: id: " + id);
          if (err) {
            console.log('rejecting @db.put')
            return reject(err);
          }
          return resolve(res);
        });
      });
    });
  });
};

LevelUpObjectAdapter.prototype.set = LevelUpObjectAdapter.prototype.put;

LevelUpObjectAdapter.prototype.del = async function(key) {
  var self = this;

  return new Promise((resolve, reject) => {
    self.keyserializer.encode(key, function(err, encodedKey) {
      if (err) {
        return reject(err);
      }

      self.db.del(encodedKey, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};

LevelUpObjectAdapter.prototype.batch = async function(array, options) {
  var self = this;

  return new Promise(async(resolve, reject) => {
    for (const item of array) {
      if (item.type === "put") {
        try {
          await self.put(item.key, item.value, options);
        } catch (err) {
          return reject(err);
        }
        resolve();
      } else if (item.type === "del") {
        try {
          await self.del(item.key);
        } catch (err) {
          return reject(err);
        }
        resolve();
      } else {
        reject(new Error("Unknown batch type", item.type));
      }
    }
    resolve();
  });
};

LevelUpObjectAdapter.prototype.isOpen = function() {
  return true;
};

module.exports = LevelUpObjectAdapter;
