var util	= require('util'),
	async	= require('async'),
	eyes	= require('eyes'),
	moment	= require('moment'),
	path	= require('path'),
	mkdirp 	= require('mkdirp'),
	filesize = require('filesize'),
	Hawk	= require('hawk'),
	glob 	= require("glob")
	debug	= require('debug')('products'),
	sys 	= require('sys'),
	exec 	= require('child_process').exec,
	mime	= require('mime-types'),
	osm_geojson		= require("osm-and-geojson/osm_geojson"),
	tokml			= require('tokml'),
	childProcess 	= require('child_process'),
	scene_model		= require('../../models/scene.js'),
	_				= require('underscore'),
	fs				= require('fs');
	
	mime.define( {
		"application/x-osm+xml": [ "osm"],
		"application/json": [ "geojson", "topojson"],
		"application/x-gzip": ["gz"]
	})
	
	
	function InBBOX( lat, lon, bbox) {
		if( (lat > bbox[2]) && (lat< bbox[3]) && (lon > bbox[0]) && (lon < bbox[2]) ) return true;
		return false
	}
	
	
	function sendFile( res, file ) {
		var ext 		= path.extname(file)
		var basename 	= 	path.basename(file)
		var dirname 	= 	path.dirname(file)
		var ext			= 	path.extname(file)
		
		var mime_type = mime.lookup(path.basename(file))
		debug( "sendFile", ext, mime_type)
		
		if( ext == ".topojson") {
			res.header("Content-Type", "application/json")
			res.header("Content-Encoding", "gzip")
			basename += ".gz"
			debug("sending .topojson application/json gzip", basename)
		} else {
			debug("sending ", mime_type, basename, dirname)
			res.header("Content-Type", mime_type, basename)
			debug(ext, mime_type, "no encoding")
		}
		
		res.header("Access-Control-Allow-Origin", "*")
		res.sendfile(basename, {root: dirname})
	}

	function sendLandsat8Products(query, ymds, limit, req, res ) {
		var user			= req.session.user
		var host			= req.protocol + "://" + req.headers.host
		var originalUrl		= host + req.originalUrl
		var results 		= []
		
		if( user == undefined ) {
			user = {
				email: "NA"
			}
		}
		
		// we could filter on ymds here...
		var file = app.root+"/public/data/LC80090472013357LGN00_WATERMAP.tif.hand.tif.pgm.topojson.gz"
				
		var fileName 		= file
		var basename 		= path.basename(fileName)
		
		// add product entry to result
		var stats 			= fs.statSync( fileName )
		
		var duration		= 60 * 30
		var credentials		= req.session.credentials
		
		function Bewit(url) {
			var bewit = Hawk.uri.getBewit(url, { credentials: credentials, ttlSec: duration, ext: user.email })
			url += "?bewit="+bewit
			return url;
		}
		
		var entry = {
			"id": basename,
			"image": [
				{
					"url": host+"/data/LC80090472013357LGN00_watermap_browseimage.thn.png",
					"mediaType": "image/png",
					"rel": "browse"
				}
			],
			"properties": {
				"source": 	"NASA NRT Global Flood Mapping",
				"sensor": 	"LANDSAT-8",
				"date": 	"2012-12-23",
				"bbox": 	[-73.94358, 17.74510, -71.76917, 19.81187],
				"size": 	filesize(stats.size)
			},
			"actions": {
				"download": [
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/LC80090472013357LGN00_WATERMAP.tif.hand.tif.pgm.topojson"),
						"mediaType": 	"application/json",
						"displayName": 	"topojson"
					},
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/LC80090472013357LGN00_WATERMAP.tif.hand.tif.pgm.topojson.gz"),
						"mediaType": 	"application/gzip",
						"displayName": 	"topojson.gz",
						"size": 		filesize(stats.size)
					}
				],
				"view": 	host+"/products/landsat8",
				"share": 	host+"/products/landsat8",
				"map": [
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"landsat8_floodmap_legend",
						"method": 		"GET",
						"url": 			host+"/mapinfo/landsat8/legend",
						"mediaType": 	"text/html",
						"displayName": 	"legend",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"landsat8_floodmap_style",
						"method": 		"GET",
						"url": 			host+"/mapinfo/landsat8/style",
						"mediaType": 	"application/json",
						"displayName": 	"style",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"landsat8_floodmap_credits",
						"method": 		"GET",
						"url": 			host+"/mapinfo/landsat8/credits",
						"mediaType": 	"application/json",
						"displayName": 	"credits",
					}
				]
			}
		}
		return entry
	}

	function sendRadarsat2Products(query, ymds, limit, req, res ) {
		var user			= req.session.user
		var host			= req.protocol + "://" + req.headers.host
		var originalUrl		= host + req.originalUrl
		var results 		= []
		
		if( user == undefined ) {
			user = {
				email: "NA"
			}
		}
		
		// we could filter on ymds here...
		var file = app.root+"/public/data/surface_water.topojson.gz"
				
		var fileName 		= file
		var basename 		= path.basename(fileName)
		
		// add product entry to result
		var stats 			= fs.statSync( fileName )
		
		var duration		= 60 * 30
		var credentials		= req.session.credentials
		
		function Bewit(url) {
			var bewit = Hawk.uri.getBewit(url, { credentials: credentials, ttlSec: duration, ext: user.email })
			url += "?bewit="+bewit
			return url;
		}
		
		var entry = {
			"id": basename,
			"image": [
				{
					"url": host+"/data/LC80090472013357surface_water_osm.png",
					"mediaType": "image/png",
					"rel": "browse"
				}
			],
			"properties": {
				"source": 	"NASA NRT Global Flood Mapping",
				"sensor": 	"Radarsat-2",
				"date": 	"2012-08-25",
				"bbox": 	[-73.94358, 17.74510, -71.76917, 19.81187],
				"size": 	filesize(stats.size)
			},
			"actions": {
				"download": [
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/surface_water.topojson"),
						"mediaType": 	"application/json",
						"displayName": 	"topojson"
					},
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/surface_water.topojson.gz"),
						"mediaType": 	"application/gzip",
						"displayName": 	"topojson.gz",
						"size": 		filesize(stats.size)
					}
				],
				"view": 	host+"/products/radarsat2",
				"share": 	host+"/products/radarsat2",
				"map": [
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"radarsat2_floodmap_legend",
						"method": 		"GET",
						"url": 			host+"/mapinfo/radarsat2/legend",
						"mediaType": 	"text/html",
						"displayName": 	"legend",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"radarsat2_floodmap_style",
						"method": 		"GET",
						"url": 			host+"/mapinfo/radarsat2/style",
						"mediaType": 	"application/json",
						"displayName": 	"style",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"radarsat2_floodmap_credits",
						"method": 		"GET",
						"url": 			host+"/mapinfo/radarsat2/credits",
						"mediaType": 	"application/json",
						"displayName": 	"credits",
					}
				]
			}
		}
		return entry
	}
	
	function sendModisProducts(query, ymds, limit, req, res ) {
		var user			= req.session.user
		var host			= req.protocol + "://" + req.headers.host
		var originalUrl		= host + req.originalUrl
		var results 		= []
		
		if( user == undefined ) {
			user = {
				email: "NA"
			}
		}
		
		// we could filter on ymds here...
		var file = app.root+"/public/data/SWP_2012234_080W020N_2D2OT.topojson.gz"
				
		var fileName 		= file
		var basename 		= path.basename(fileName)
		
		// add product entry to result
		var stats 			= fs.statSync( fileName )
		
		var duration		= 60 * 30
		var credentials		= req.session.credentials
		
		function Bewit(url) {
			var bewit = Hawk.uri.getBewit(url, { credentials: credentials, ttlSec: duration, ext: user.email })
			url += "?bewit="+bewit
			return url;
		}
		
		var entry = {
			"id": basename,
			"image": [
				{
					"url": host+"/data/OSM_SWP_2012234_080W020N.png",
					"mediaType": "image/png",
					"rel": "browse"
				}
			],
			"properties": {
				"source": 	"NASA NRT Global Flood Mapping",
				"sensor": 	"MODIS",
				"date": 	"2012-12-23",
				"bbox": 	[-80, 10, -70.76917, 20],
				"size": 	filesize(stats.size)
			},
			"actions": {
				"download": [
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/SWP_2012234_080W020N_2D2OT.topojson"),
						"mediaType": 	"application/json",
						"displayName": 	"topojson"
					},
					{
						"objectType": 	"HttpActionHandler",
						"method": 		"GET",
						"url": 			Bewit(host+"/data/SWP_2012234_080W020N_2D2OT.topojson.gz"),
						"mediaType": 	"application/gzip",
						"displayName": 	"topojson.gz",
						"size": 		filesize(stats.size)
					}
				],
				"view": 	host+"/products/modis",
				"share": 	host+"/products/modis",
				"map": [
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"modis_floodmap_legend",
						"method": 		"GET",
						"url": 			host+"/mapinfo/modis/legend",
						"mediaType": 	"text/html",
						"displayName": 	"legend",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"modis_floodmap_style",
						"method": 		"GET",
						"url": 			host+"/mapinfo/modis/style",
						"mediaType": 	"application/json",
						"displayName": 	"style",
					},
					{
						"objectType": 	"HttpActionHandler",
						"id": 			"modis_floodmap_credits",
						"method": 		"GET",
						"url": 			host+"/mapinfo/modis/credits",
						"mediaType": 	"application/json",
						"displayName": 	"credits",
					}
				]
			}
		}
		return entry
	}

function render_map(region, topojson, req, res) {
	res.render("products/map", {
		region: region,
		topojson: topojson,
		layout: false
	})
}

function render_mapgl(region, topojson, req, res) {
	res.render("products/mapgl", {
		region: 		region,
		social_envs:	app.social_envs,
		topojson: 		topojson,
		layout: false
	})
}
	
function map_eo1_ali(req, res, map) {
	var host 	= "http://"+req.headers.host
	var scene 	= req.params['scene']
		
	scene_model.getScene('eo1_ali', scene, function(err, record) {
		var date    = record.date
		var host 	= "http://"+req.headers.host
		var short	= record.scene.split('_')[0]
			
		var region 	= {
			name: 	"EO1 ALI Flood Map",
			scene: 	scene,
			bbox: 	scene_model.bboxFromGeom(record.g),
			target: [record.center_lat, record.center_lon],
			min_zoom: 6
		}
		var topojson=	host+"/products/eo1_ali/"+scene+"/"+short+"_WATERMAP.tif.hand.tif.pgm.topojson"
		map(region, topojson, req, res )
	})
}

function map_l8(req, res, map) {
	var host 	= "http://"+req.headers.host
	var scene 	= req.params['scene']
	
	scene_model.getScene('l8', scene, function(err, record) {
		var date    = record.date
		var host 	= "http://"+req.headers.host
		var region 	= {
			name: 	"Landsat-8 Flood Map",
			scene: 	scene,
			bbox: 	scene_model.bboxFromGeom(record.g),
			target: [record.center_lat, record.center_lon],
			min_zoom: 6
		}
		var topojson=	host+"/products/l8/"+scene+"/"+scene+"_WATERMAP.tif.hand.tif.pgm.topojson"
		map(region, topojson, req, res )
	})
}
	
function map_dfo(req, res, map) {
	var host 		= "http://"+req.headers.host
	var scene 		= req.params['scene']
	var arr			= scene.split("_")
	var eventNum	= arr[2]
	var dt			= arr[0]
	
	debug("map_dfo", scene)
	
	scene_model.getScene('dfo', scene, function(err, record) {
		var date    = record.date
		var host 	= "http://"+req.headers.host
		var region 	= {
			name: 	"Dartmouth Flood Observatory",
			scene: 	scene,
			bbox: 	scene_model.bboxFromGeom(record.g),
			target: [record.center_lat, record.center_lon],
			min_zoom: 6
		}
		var topojson=	host+"/products/dfo/"+eventNum+"/"+dt+"/watermap.topojson"
		map(region, topojson, req, res )
	})
}

function map_radarsat2(req, res, map) {
	var scene 	= req.params['scene']
	scene_model.getScene('radarsat2', scene, function(err, record) {
		if( !err && record ) {
			var date    = record.date
			var host 	= "http://"+req.headers.host
			var region 	= {
				name: 	"Radarsat-2 Flood Map",
				scene: 	scene,
				bbox: 	scene_model.bboxFromGeom(record.g),
				target: [record.center_lat, record.center_lon],
				min_zoom: 6
			}
			var topojson=	host+"/products/radarsat2/"+scene+"/surface_water.topojson"
			//var topojson= "https://gist.githubusercontent.com/cappelaere/1033894ac360438bed1b/raw/0e0e57618abb38807833b05e1a5bcd999a3c8c4e/surface_water.topojson"
			map(region, topojson, req, res )
		}
	})
}

function map_modis(req, res,map) {
	var host = "http://"+req.headers.host
	var year 	= req.params['year']
	var doy 	= req.params['doy']
	var tile 	= req.params['tile']
	var id		= year.toString() + doy+"_"+tile
	var date    = moment(year+"-"+doy)
	var lon 	= parseFloat(tile.substring(0,3))
	var ew  	= tile[3]
	var ns 		= tile[7]
	var lat 	= parseFloat(tile.substring(4,7))
	
	if( ew == 'W') lon = -lon
	if( ns == 'S') lat = -lat
	
	var centerlat 	= lat - 5.0
	var centerlon 	= lon + 5.0
	var bbox		= [lon, lat-10.0, lon+10.0,lat]
	
	var region = {
		name: 	"MODIS Flood Map",
		scene: 	tile,
		bbox: 	bbox,
		target: [centerlat, centerlon]
	}
	debug("map_modis", region)
	
	var topojson=	host+"/products/modis/"+year+"/"+doy+"/"+tile+"/SWP_"+id+"_2D2OT.topojson"
	render_map(region, topojson, req, res )
}

module.exports = {
	// http://localhost:7465/products/opensearch?q=surface_water&lat=18&lon=-70&startTime=20140418&endTime=20140421
	
	opensearch: function(req, res) {
		var query 			= req.query.q
		var bbox			= req.query.bbox ? req.query.bbox.split(",").map(parseFloat) : undefined
		var itemsPerPage	= req.query.itemsPerPage || 7
		var startIndex		= req.query.startIndex || 1
		var limit			= req.query.limit || 25
		var startTime		= req.query.startTime ? moment(req.query.startTime, "YYYY-MM-DD") : moment()
		var endTime			= req.query.endTime ? moment(req.query.endTime, "YYYY-MM-DD") : moment()
		var lat				= req.query.lat ? parseFloat(req.query.lat) : undefined
		var lon				= req.query.lon ? parseFloat(req.query.lon) : undefined
		var user			= req.session.user
		var host			= req.protocol + "://" + req.headers.host
		var originalUrl		= host + req.originalUrl
		
		debug("Product opensearch", originalUrl)
		
		if( bbox ) {
			lon = (bbox[0]+bbox[2])/2.0
			lat = (bbox[1]+bbox[3])/2.0
		}
		
		var results = []
		var json = {
			"objectType": 'query',
			"id": "urn:ojo-publisher:"+query,
			"displayName": "OJO Publisher Products",
			"replies": {
				"url": originalUrl,
				"mediaType": "application/activity+json",
				"totalItems": results.length,
				"items": results
			}
		}
		
		// This for products we support
		if( query != "surface_water") {
			debug("Usupported product request", query)
			return res.send(json)
		}
		
		// find region of interest
		var inregion = InBBOX(lat, lon, [-80,10,-70,20])
		if( inregion === undefined ) {
			debug("Not within region for ", lat, lon)
			return res.send( json )
		}
			
		var ymds = []
		while( endTime.isAfter(startTime) || startTime.isSame(endTime)) {
			var ymd = endTime.format("YYYYMMDD")
			ymds.push(ymd)
			endTime.subtract('days', 1);
		}
		
		debug("Searching for", query)
		
		results = []
		
		entry = sendModisProducts(query, ymds, limit, req, res )
		if( entry ) results.push(entry)
		
		entry = sendRadarsat2Products(query, ymds, limit, req, res )
		if( entry ) results.push(entry)

		entry = sendLandsat8Products(query, ymds, limit, req, res )
		if( entry ) results.push(entry)
		
		res.set("Access-Control-Allow-Origin", "*")
		var json = {
			"objectType": 'query',
			"id": "urn:trmm:"+query,
			"displayName": "OJO Publisher Flood Surface Water Products",
			"replies": {
				"url": originalUrl,
				"mediaType": "application/activity+json",
				"totalItems": results.length,
				"items": results
			}
		}
		res.send(json)
	},
	
	index: function(req, res) {
		var user = req.session.user
		res.render("products/index", {user: user})
	},
	
	topojson: function(req,res) {
		var id 			= req.params["id"]
		var file 		= app.root+"/public/data/"+id
		var basename	= path.basename(file)
		var dirname 	= path.dirname(file)
		var ext 		= path.extname(file)
		
		var mime_type 	= mime.lookup(path.basename(file))
		
		debug("topojson", basename)
		
		if( basename.indexOf(".gz") > 0) {
			debug("sending ", mime_type, basename, dirname)
			res.header("Content-Type", mime_type, basename)
			debug(ext, mime_type, "no encoding")
		} else {
			res.header("Content-Type", "application/json")
			res.header("Content-Encoding", "gzip")
			basename += ".gz"
			debug("sending .topojson application/json gzip", basename)
		}
		
		res.header("Access-Control-Allow-Origin", "*")
		res.sendfile(basename, {root: dirname}) 
	},
	
	mapclassic_radarsat2: function(req, res) {
		map_radarsat2(req, res, render_map)
	},
	
	mapgl_radarsat2: function(req, res) {
		map_radarsat2(req, res, render_mapgl)
	},
	
	radarsat2_product: function(req, res) {
		var scene 		= req.params['scene']
		var id 			= req.params['id']
		
		var product	= app.root+"/../data/radarsat2/"+scene+"/"+id
		if( !fs.existsSync(product)) {
			if( fs.existsSync(product+".gz")) {
				debug("sending as topojson gzip encoded")
				sendFile(res, product)				
			} else {
				debug("Product does not exist")
				return res.send(400)
			}
		} else {
			sendFile(res, product)
		}
	},
	
	browse_radarsat2: function(req, res) {
		var scene 	= req.params['scene']
		
		scene_model.getScene('radarsat2', scene, function(err, record) {
			var date    = record.date
			var host = "http://"+req.headers.host
			var region = {
				name: 	"Radarsat-2 Flood Map",
				scene: 	scene,
				bbox: 	scene_model.bboxFromGeom(record.g),
				target: [record.center_lat, record.center_lon]
			}
		
			res.render("products/radarsat2", {
				social_envs: 	app.social_envs,
				description: 	"Radarsat2 Flood Map",
				image: 			host+"/products/radarsat2/"+scene+"/surface_water_osm.png",
				url: 			host+"/products/radarsat2/browse/"+scene,
				date: 			date,
				region: 		region,
				data: 			"http://www.asc-csa.gc.ca/eng/satellites/radarsat2/order-contact.asp",
				topojson: 		host+"/products/radarsat2/"+scene+"/surface_water.topojson.gz",
				layout: 		false
			})
		})
	},
	
	mapclassic_modis: function(req, res) {
		map_modis(req, res,render_map)
	},
	
	mapgl_modis: function(req, res) {
		map_modis(req, res,render_mapgl)
	},
	
	browse_modis: function(req, res) {
		var year 	= req.params['year']
		var doy 	= req.params['doy']
		var tile 	= req.params['tile']
		var id		= year.toString() + doy+"_"+tile
		var date    = moment(year+"-"+doy)
		
		var lon 	= parseFloat(tile.substring(0,3))
		var ew  	= tile[3]
		var ns 		= tile[7]
		var lat 	= parseFloat(tile.substring(4,7))
		
		if( ew == 'W') lon = -lon
		if( ns == 'S') lat = -lat
		
		var centerlat 	= lat - 5.0
		var centerlon 	= lon - 5.0
		var bbox		= [lon, lat-10.0, lon+10.0,lat]
		
		var host = "http://"+req.headers.host
		var region = {
			name: 	"Haiti",
			scene: 	tile,
			bbox: 	bbox,
			target: [centerlat, centerlon]
		}
		
		res.render("products/modis", {
			social_envs:	app.social_envs,
			description: 	"MODIS Flood Map",
			image: 			host+"/products/modis/"+year+"/"+doy+"/"+tile+"/OSM_SWP_"+id+".png",
			url: 			host+"/products/modis",
			date: 			date.format("YYYY-MM-DD"),
			year: 			year,
			doy: 			doy,
			region: 		region,
			data: 			"http://oas.gsfc.nasa.gov/floodmap/getTile.php?location="+tile+"&day="+doy+"&year="+year+"&product=2",
			topojson: 		app.root+"/../data/modis/"+year+"/"+doy+"/"+tile+"/SWP_"+id+"_2D2OT.topojson.gz",
			layout: 		false
		})
		
	},
	process_modis: function(req, res) {
		var year 	= req.params['year']
		var doy 	= req.params['doy']
		var tile 	= req.params['tile']
		
		var cmd = app.root + "/../python/modis.py -p 2 -y "+year+" -d "+doy+" -t "+tile
		debug(cmd)

		var child = childProcess.exec(cmd, function (error, stdout, stderr) {
			if (error) {
		  	   debug(error.stack);
		  	   debug('Error code: '+error.code);
		  	   debug('Signal received: '+error.signal);
		   	}
			debug('Child Process STDOUT: '+stdout);
			debug('Child Process STDERR: '+stderr);
		});

		child.on('exit', function (code) {
			debug('Child process exited with exit code '+code);
		}); 
	},
	modis_product: function(req, res) {
		var year 	= req.params['year']
		var doy 	= req.params['doy']
		var tile 	= req.params['tile']
		var id 		= req.params['id']
		
		var product	= app.root+"/../data/modis/"+year+"/"+doy+"/"+tile+"/"+id
		if( !fs.existsSync(product)) {
			if( fs.existsSync(product+".gz")) {
				debug("sending as topojson gzip encoded")
				sendFile(res, product)				
			} else {
				debug("Product does not exist")
				return res.send(400)
			}
		} else {
			sendFile(res, product)
		}
	},
	
	// Send back an EO-1 Product
	eo1_ali_product: function(req, res) {
		var scene 	= req.params['scene']
		var id 		= req.params['id']
	
		var product	= app.root+"/../data/eo1_ali/"+scene+"/"+id
		if( !fs.existsSync(product)) {
			if( fs.existsSync(product+".gz")) {
				debug("sending as topojson gzip encoded")
				sendFile(res, product)				
			} else {
				debug("EO-1 Product does not exist", product)
				return res.send(400)
			}
		} else {
			sendFile(res, product)
		}
	},

	// Process an EO-1 scene that we know is available but not processed
	process_eo1_ali: function(req, res) {
		var id 	= req.params['id']
		var cmd = app.root + "/../python/download_eo1.py --scene "+id
		debug(cmd)

		var child = childProcess.exec(cmd, function (error, stdout, stderr) {
			if (error) {
		  	   debug(error.stack);
		  	   debug('Error code: '+error.code);
		  	   debug('Signal received: '+error.signal);
		   	}
			debug('Child Process STDOUT: '+stdout);
			debug('Child Process STDERR: '+stderr);
		});

		child.on('exit', function (code) {
			debug('Child process exited with exit code '+code);
		}); 
	},
	browse_eo1_ali: function(req, res) {
		var scene 		= req.params['scene']
		var path		= parseInt(scene.substring(4,7))
		var row			= parseInt(scene.substring(7,10))
		var year		= scene.substring(10,14)	
		
		scene_model.getScene('eo1_ali', scene, function(err, record) {
			var date    = record.date
			var host 	= "http://"+req.headers.host
			var short	= record.scene.split('_')[0]
			
			var region = {
				name: 	"EO-1 ALI Flood Map",
				scene: 	scene,
				bbox: 	scene_model.bboxFromGeom(record.g),
				target: [record.center_lat, record.center_lon]
			}
		
			res.render("products/eo1", {
				social_envs: 	app.social_envs,
				description: 	"EO-1 ALI Flood Map",
				image: 			host+"/products/eo1_ali/"+scene+"/"+ short+"_watermap_browseimage.thn.png",
				url: 			host+"/products/eo1_ali/browse/"+scene,
				date: 			date,
				region: 		region,
				data: 			"http://earthexplorer.usgs.gov/browse/eo-1/ali/"+path+"/"+row+"/"+year+"/"+scene+".jpeg",
				topojson: 		host+"/products/eo1_ali/"+scene+"/"+short+"_WATERMAP.tif.hand.tif.pgm.topojson.gz",
				layout: 		false
			})
		})
	},
	
	mapclassic_eo1_ali: function(req,res) {
		map_eo1_ali(req, res, render_map)
	},
	mapgl_eo1_ali: function(req, res) {
		map_eo1_ali(req, res, render_mapgl)
	},
	
	process_l8: function(req, res) {
		var scene = req.params['scene']
		var cmd = app.root + "/../python/download_landsat8.py --scene "+scene
		debug(cmd)
		var child = childProcess.exec(cmd, function (error, stdout, stderr) {
			if (error) {
		  	   debug(error.stack);
		  	   debug('Error code: '+error.code);
		  	   debug('Signal received: '+error.signal);
		   	}
			debug('Child Process STDOUT: '+stdout);
			debug('Child Process STDERR: '+stderr);
		});

		child.on('exit', function (code) {
			debug('Child process exited with exit code '+code);
		}); 
	},
	
	eo1_ali_list: function(req, res) {
		var user = req.session.user
		var base_dir	= app.root+"/../data/eo1_ali/"
		scene_model.getAllScenes('eo1_ali', function(err, records) {
			var results = _.filter(records, function(r) {
				return fs.existsSync(base_dir+ r.scene)
			})
			debug("eo1_ali_list", records.length, results.length)
			
			res.render("products/list", {
				user: 			user,
				description: 	"EO-1 ALI Scenes",
				base_href: 		"/products/eo1_ali/browse/",
				records: 		results
			})
		})
	},
	
	l8_list: function(req, res) {
		var user 		= req.session.user
		var base_dir	= app.root+"/../data/l8/"
		
		scene_model.getAllScenes('l8', function(err, records) {

			var results = _.filter(records, function(r) {
				return fs.existsSync(base_dir+ r.scene)
			})
			debug("l8_list", records.length, results.length)

			res.render("products/list", {
				user: 			user,
				description: 	"Landsat-8 Scenes",
				base_href: 		"/products/l8/browse/",
				records: 		results
			})
		})
	},
	
	radarsat2_list: function(req, res) {
		var user = req.session.user
		var base_dir	= app.root+"/../data/radarsat2/"
		scene_model.getAllScenes('radarsat2', function(err, records) {
			var results = _.filter(records, function(r) {
				return fs.existsSync(base_dir+ r.scene)
			})
			debug("radarsat2_list", records.length, results.length)

			res.render("products/list", {
				user: user,
				description: 	"Radarsat-2 Scenes",
				base_href: 		"/products/radarsat2/browse/",
				records: records
			})
		})
	},

	dfo_list: function(req, res) {
		var user = req.session.user
		var base_dir	= app.root+"/../data/dfo/"
		scene_model.getAllScenes('dfo', function(err, records) {
			
			res.render("products/list", {
				user: user,
				description: 	"DFO Scenes",
				base_href: 		"/products/dfo/browse/",
				records: records
			})
		})
	},
	
	modis_list: function(req, res) {
		var user 		= req.session.user
		var base_dir	= app.root+"/../data/modis/"
		var pattern		= base_dir+"*/*/*/*.gz"
				
		var records = []

		glob(pattern, function(err, files) {
			
			for( var f in files) {
				var nf 	= files[f].replace(fs.realpathSync(base_dir), '')
				var arr = nf.split('/') 
				var el	= { 	year: arr[1],
								doy: arr[2],
								tile: arr[3],
								scene: path.join(arr[1], arr[2], arr[3]) 
							}
				records.push( el )
			}
			
			res.render("products/list", {
				user: user,
				description: 	"MODIS Scenes",
				base_href: 		"/products/modis/browse/",
				records: records
			})
		})
	},

	// Send back a Landsat-8 Product
	l8_product: function(req, res) {
		var scene 	= req.params['scene']
		var id 		= req.params['id']
	
		var product	= app.root+"/../data/l8/"+scene+"/"+id
		if( !fs.existsSync(product)) {
			if( fs.existsSync(product+".gz")) {
				debug("sending as topojson gzip encoded")
				sendFile(res, product)				
			} else {
				debug("L8 Product does not exist", product)
				return res.send(400)
			}
		} else {
			sendFile(res, product)
		}
	},

	browse_l8: function(req, res) {
		var scene 		= req.params['scene']
		var path		= scene.substring(3,6)
		var row			= scene.substring(6,9)
		var year		= scene.substring(9,13)		
		
		scene_model.getScene('l8', scene, function(err, record) {
			var date    = record.date
			var host = "http://"+req.headers.host
			var region = {
				name: 	"Landsat-8 Flood Map",
				scene: 	scene,
				bbox: 	scene_model.bboxFromGeom(record.g),
				target: [record.center_lat, record.center_lon]
			}
		
			res.render("products/l8", {
				social_envs:	app.social_envs,
				description: 	"Landsat-8 Flood Map",
				image: 			host+"/products/l8/"+scene+"/"+scene+"_watermap_browseimage.thn.png",
				url: 			host+"/products/l8/browse/"+scene,
				date: 			date,
				region: 		region,
				data: 			"http://earthexplorer.usgs.gov/browse/landsat_8/"+year+"/"+path+"/"+row+"/"+record.scene+".jpg",
				topojson: 		host+"/products/l8/"+scene+"/"+scene+"_WATERMAP.tif.hand.tif.pgm.topojson",
				layout: 		false
			})
		})
	},
	
	browse_dfo: function(req, res) {
		var scene 		= req.params['scene']
		var arr			= scene.split("_")
		var dt			= arr[0]
		var eventNum	= arr[2]
		var year		= dt.substring(0,4)	
		
		debug("browse_dfo", eventNum, dt, scene)
		
		scene_model.getScene('dfo', scene, function(err, record) {
			var date    = record.date
			var host 	= "http://"+req.headers.host
			var region 	= {
				name: 	"DFO Flood Map",
				scene: 	scene,
				bbox: 	scene_model.bboxFromGeom(record.g),
				target: [record.center_lat, record.center_lon]
			}
		
			res.render("products/dfo", {
				social_envs:	app.social_envs,
				description: 	"Dartmouth Flood Observatory Map",
				image: 			host+"/products/dfo/"+eventNum+"/"+dt+"/browseimage.png",
				url: 			host+"/products/dfo/browse/"+scene,
				date: 			date,
				region: 		region,
				data: 			"http://floodobservatory.colorado.edu/Version3/"+year+arr[1]+arr[2]+".html",
				topojson: 		host+"/products/dfo/"+eventNum+"/"+dt+"/watermap.topojson",
				layout: 		false
			})
		})
	},
	
	// Send back a dfo Product
	dfo_product: function(req, res) {
		var scene 		= req.params['scene']
		var eventNum	= req.params['event']
		var date		= req.params['date']
	
		var product	= app.root+"/../data/dfo/"+eventNum+"/"+date+"/"+scene
		
		debug("dfo_product", product)
		
		if( (product.indexOf("topojson")>0) || !fs.existsSync(product)) {
			if( fs.existsSync(product+".gz")) {
				debug("sending as topojson gzip encoded")
				sendFile(res, product)				
			} else {
				logger.error("DFO Product does not exist", product)
				return res.send(400)
			}
		} else {
			sendFile(res, product)
		}
	},
	
	mapclassic_l8: function(req,res) {
		map_l8(req, res, render_map)
	},
	mapgl_l8: function(req, res) {
		map_l8(req, res, render_mapgl)
	},
	
	mapclassic_dfo: function(req, res) {
		map_dfo(req, res, render_map)
	}
}
