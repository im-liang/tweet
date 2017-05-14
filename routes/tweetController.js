var express = require('express');
var tweetDB = require('../database/tweet.js');
var Busboy = require('busboy');
var mongodb = require('mongodb');

module.exports = {
	post_additem: function(req, res){
		if(!req.session.username){
			res.send({status: 'error', error: req.session.username +' is not logged in. Permission denied.'});
		}

		var content = req.body.content;
		var parent = req.body.parent;
		if(parent) {
			parent = mongodb.ObjectId(req.body.parent);
		}
    var media = req.body.media;
    var postedBy = mongodb.ObjectId(req.session.userid);
    var newTweet = {
      timestamp: new Date(),
      content,
      parent,
      media,
      postedBy,
      like: 0,
      interest: (new Date()).getTime()
    };

		tweetDB.addTweet({newTweet: newTweet}, res);
	},

	get_item: function(req, res){
		var id = req.params.id;

		tweetDB.getTweet({id: id}, res);
	},

	delete_item: function(req, res){
		var id = req.params.id;

		tweetDB.deleteTweet({id:id}, res);
	},
	post_likeitem: function(req, res) {
		var like = req.body.like;
		userid = req.session.userid;
		if(like === undefined || like === true) {
			like = 1;
		}else {
			like = -1;
		}

		tweetDB.like({id: userid, like: like}, res);
	},
  post_search: function(req, res) {
		var timestamp = req.body.timestamp;
		var limit = req.body.limit;
		var q = req.body.q;
		var username = req.body.username;
		var following = req.body.following;
		var rank = req.body.rank;
		var parent = req.body.parent;

		tweetDB.searchTweet({}, res);
  },
  get_media: function(req, res) {
		tweetDB.getMedia({id: req.params.id}, res);
  },
  post_addMedia: function(req, res) {
		var boy = new Busboy({
			headers: req.headers,
			limits:{fields:50, fieldSize:40*1024, files:1, fileSize: 10*1024*1024, headerPairs:1}
		});
		boy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			if(filename.length == 0) {
				file.pipe(BlackHole());
				res.status(400).send({status:'error', error:'file size is 0'});
			}
			var fileID = mongodb.ObjectID();
			var uploadStream = tweetDB.getBucket().openUploadStreamWithId(fileID, filename, {metadata:{}, contentType:mimetype});
			file.on('end', function () {
				if(ended) console.error('HELL!!!');
				fields.attachmentList.push({name:filename, id:fileID});
			});
			file.on('limit', function(){
				uploadStream.abort(function () {});
				res.status(400).send({status:'error', error:'file size is too large'});
			});
			file.pipe(uploadStream).once('finish', function () {
				if(ended) return tweetDB.getBucket().delete(fileID);
				function dropFiles(){
						for(var file of fields.attachmentList){
								s.orderFileBucket.delete(file.id);
						}
						fields.attachmentList = [];
						ended = true;
				}
				res.send({status:'OK', id: fields.attachmentList[0].id});
			});
		});
		boy.on('filesLimit', function() {
			res.status(400).send({status:'error', error:'too many files'});
		});
		boy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
			fields[fieldname] = val;
		});
		boy.on('fieldsLimit', function() {
			res.status(400).send({status:'error', error:'too many fields'});
		});
  }
};
