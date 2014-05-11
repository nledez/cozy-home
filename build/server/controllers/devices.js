// Generated by CoffeeScript 1.7.1
var Client, Device, ds, fs, _ref;

Client = require("request-json").JsonClient;

fs = require('fs');

Device = require('../models/device');

ds = new Client("http://localhost:9101/");

if ((_ref = process.env.NODE_ENV) === 'test' || _ref === 'production') {
  ds.setBasicAuth(process.env.NAME, process.env.TOKEN);
}

module.exports = {
  devices: function(req, res, next) {
    return Device.all(function(err, devices) {
      if (err) {
        return next(err);
      } else {
        return res.send({
          rows: devices
        });
      }
    });
  },
  remove: function(req, res, next) {
    var id;
    id = req.params.id;
    return Device.find(id, function(err, device) {
      if (err != null) {
        return next(err);
      } else {
        return ds.del("device/" + id + "/", function(err, res, body) {
          err = err || body.error;
          if (err != null) {
            return next(err);
          } else {
            return res.send(200, {
              success: true
            });
          }
        });
      }
    });
  }
};
