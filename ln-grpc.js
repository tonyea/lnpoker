var grpc = require("grpc");
var fs = require("fs");
require("dotenv").config();

// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handhsake
// error when we communicate with the lnd rpc server.
// process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

var m = fs.readFileSync(process.env.LNPOKER_MACAROON);
var macaroon = m.toString("hex");

// build meta data credentials
var metadata = new grpc.Metadata();
metadata.add("macaroon", macaroon);
var macaroonCreds = grpc.credentials.createFromMetadataGenerator(
  (_args, callback) => {
    callback(null, metadata);
  }
);

// build ssl credentials using the cert the same as before
var lndCert = fs.readFileSync(process.env.LNPOKER_TLS);
// var lndKey = fs.readFileSync("/home/augustus/.lnd/tls.key");
var sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
var credentials = grpc.credentials.combineChannelCredentials(
  sslCreds,
  macaroonCreds
);

var PROTO_PATH = "rpc.proto";

var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;

// Pass the crendentials when creating a channel
// var lnrpcDescriptor = grpc.load("rpc.proto");
// var lnrpc = lnrpcDescriptor.lnrpc;
var client = new lnrpc.Lightning(process.env.LNPOKER_HOST, credentials);

// client.getInfo({}, (err, res) => {
//   console.log(res);
// });

// let call = client.subscribeInvoices({});
// call
//   .on("data", function(invoice) {
//     console.log(invoice);
//   })
//   .on("end", function() {
//     // The server has finished sending
//   })
//   .on("status", function(status) {
//     // Process status
//     console.log("Current status" + status);
//   });

module.exports = client;
