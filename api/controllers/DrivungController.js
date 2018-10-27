/**
 * DrivungController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var NodeGeocoder = require('node-geocoder');
var geolib = require('geolib')
var options = {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyDiDBZ-YPu00RYCdkK4K_YFcYZTQPkaiRE', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);


module.exports = {
    saveaddress: async (req, res) => {
        let address = req.param('address');
        console.log(address);

        let drivung = await Drivung.create({ address, driverstried: 0 }).fetch();

        address = address + " Tuzla, Bosnia and Herzegovina"

        geocoder.geocode(address, async function (err, response) {
            let latlngobj = {
                latitude: response[0].latitude,
                longitude: response[0].longitude
            }

            let vehiceles = await Vehicle.find();

            for (let index = 0; index < vehiceles.length; index++) {
                const element = vehiceles[index];
                let distance = geolib.getDistance(
                    latlngobj,
                    { latitude: element.location.coordinates[0], longitude: element.location.coordinates[1] }
                );
                vehiceles[index].distance = distance;
            }

            vehiceles.sort((a, b) => { return a.distance > b.distance });

            drivung = await Drivung.update({ id: drivung.id }, { location: latlngobj, trying: vehiceles[0].id }).fetch();

            return res.json(drivung[0]);
        });

    },
    assign: async (req, res) => {
        let latlngobj = {
            latitude: response[0].latitude,
            longitude: response[0].longitude
        }

        let vehiceles = await Vehicle.find();

        for (let index = 0; index < vehiceles.length; index++) {
            const element = vehiceles[index];
            let distance = geolib.getDistance(
                latlngobj,
                { latitude: element.location.coordinates[0], longitude: element.location.coordinates[1] }
            );
            vehiceles[index].distance = distance;
        }

        vehiceles.sort((a, b) => { return a.distance > b.distance });

        return res.json(drivung);
    },
    getRides: async (req, res) => {
        let id = req.param('id');
        let rides = await Drivung.find({ trying: id });
        return res.json(rides[0]);
    },
    acceptRide: async (req, res) => {
        let id = req.param('id');
        let rides = await Drivung.update({ trying: id }, { trying: null, vehicle: id }).fetch();

        return res.json(rides[0]);
    },
    denyRide: async (req, res) => {
        let id = req.param('id');
        let rides = await Drivung.find({ trying: id });
        let ride = rides[0];
        let vehiceles = await Vehicle.find();

        for (let index = 0; index < vehiceles.length; index++) {
            const element = vehiceles[index];
            let distance = geolib.getDistance(
                ride.location,
                { latitude: element.location.coordinates[0], longitude: element.location.coordinates[1] }
            );
            vehiceles[index].distance = distance;
        }

        vehiceles.sort((a, b) => { return a.distance > b.distance });

        let nextDriver = ride.driverstried + 1;

        await Drivung.update({ trying: id }, { trying: vehiceles[nextDriver].id, driverstried: nextDriver });

        return res.json({});
    }

};

