var https = require('https');
var config = require('../config');

function parseMatchHistory(summonerName, renderCallback) {
	var summonerReqOptions = {
		host: config.RIOT_API.API_HOST,
		path: config.RIOT_API.SUMMONER_PATH + encodeURIComponent(summonerName) + '?api_key=' + config.RIOT_API.API_KEY
	}
	var summonerData = "";
	var summonerId;
	https.get(summonerReqOptions, function(summonerRes) {
		//TODO: handle error codes, custom error pages?
		if(summonerRes.statusCode != 200){
			renderCallback(summonerRes.statusCode, {});
			return;
		}
		summonerRes.setEncoding('utf8');
		summonerRes.on('data', function(summonerChunk) {
			//gather data from response parts
			summonerData += summonerChunk;
		});
		summonerRes.on('end', function() {
			//parse JSON, get summoner id
			if(summonerRes != ""){
				summonerData = JSON.parse(summonerData);
			}else{
				renderCallback(null, {});
			}
			summonerId = summonerData[summonerName.toLowerCase().replace(/ /g,'')].id;

			var matchHistoryReqOptions = {
				host: config.RIOT_API.API_HOST,
				path: config.RIOT_API.MH_PATH + summonerId + '?beginIndex=0&api_key=' + config.RIOT_API.API_KEY
			}
			var matchesData = "";
			var matchesJSON;
			https.get(matchHistoryReqOptions, function(mhRes) {
				if(mhRes.statusCode != 200){
					renderCallback(mhRes.statusCode, {});
					return;
				}
				//parse match history json
				mhRes.setEncoding('utf8');
				mhRes.on('data', function(mhChunk) {
					matchesData += mhChunk;
				});
				mhRes.on('end', function() {
					matchesJSON = JSON.parse(matchesData);
					//pull out the information that we want
					var reducedJSON = [];
					for(var i = 0; i < matchesJSON.matches.length; i++){
						var curr = matchesJSON.matches[i];
						var newJSON = {
							mapId: curr.mapId,
							queueType: curr.queueType,
							matchDuration: curr.matchDuration,
							matchType: curr.matchType,
							matchId: curr.matchId,
							items: {
								item0: curr.participants[0].stats.item0,
								item1: curr.participants[0].stats.item1,
								item2: curr.participants[0].stats.item2,
								item3: curr.participants[0].stats.item3,
								item4: curr.participants[0].stats.item4,
								item5: curr.participants[0].stats.item5,
								item6: curr.participants[0].stats.item6
							},
							stats: {
								winner: curr.participants[0].stats.winner,
								largestMultiKill: curr.participants[0].stats.largestMultiKill,
								kills: curr.participants[0].stats.kills,
								deaths: curr.participants[0].stats.deaths,
								assists: curr.participants[0].stats.assists,
								minionsKilled: curr.participants[0].stats.minionsKilled,
								goldEarned: curr.participants[0].stats.goldEarned
							},
							spell1Id: curr.participants[0].spell1Id,
							spell2Id: curr.participants[0].spell2Id,
							championId: curr.participants[0].championId,
							matchMode: curr.matchMode,
						};

						reducedJSON.push(newJSON);
					}
					renderCallback(null, reducedJSON);
				});
			}).on('error', function(e) {
				//implement file logging
				console.log('Problem with match history request: ' + e.message);
			});
		});
	}).on('error', function(e) {
		//implement file logging
		console.log('Problem with summoner name request: ' + e.message);
	});
}

module.exports = parseMatchHistory;
