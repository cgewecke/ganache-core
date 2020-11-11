var Receipt = require("../utils/receipt");
var async = require("async");

function ReceiptSerializer(database) {
  this.database = database;
}

ReceiptSerializer.prototype.encode = function(receipt, done) {
  done(null, receipt.toJSON());
};

ReceiptSerializer.prototype.decode = async function(json, done) {
  var self = this;
  // Make sure we can handle mixed/upper-case transaction hashes
  // it doesn't seem possible to record a transaction hash that isn't
  // already lower case, as that's the way ganache generates them, however
  // I don't think it will hurt anything to normalize here anyway.
  // If you can figure out how to test this please feel free to add a test!
  var txHash = json.transactionHash.toLowerCase();

  let tx;
  try {
    tx = await this.database.transactions.get(json.transactionHash);
  } catch (err) {
    return done(err);
  }

  let blockIndex;
  try {
    blockIndex = await self.database.blockHashes.get(json.blockHash);
  } catch (err) {
    return done(err);
  }

  let block;
  try {
    block = await self.database.blocks.get(blockIndex);
  } catch (err) {
    return done(err);
  }

  let logs;
  try {
    logs = await self.database.blockLogs.get(blockIndex);
  } catch (err) {
    return done(err);
  }

  done(
    null,
    new Receipt(
      tx,
      block,
      logs.filter((log) => log.transactionHash.toLowerCase() === txHash),
      json.gasUsed,
      json.cumulativeGasUsed,
      json.contractAddress,
      json.status,
      json.logsBloom
    )
  );
};

module.exports = ReceiptSerializer;
