(function($){



	/*
		options: {
				render: function(redditpost){},
				subreddits: "funny/todayilearned/wtf/adviceanimals",
				redditSort: "new"
				skipNsfw: true,
				skipGifs: true,
				skipImgurAlbum: true,
				skipYoutube: true,
				skipText: true,
				skipPage: true,
				skipComment: true,
				minDelay: 2000,
				maxImgurAlbumItens: -1
		}
	*/

	var RedditLoader = function($this, options){

		var subreddits;
		var posts;
		var nextlastpostids;
		var s;
		var paused = false;
		var lastloadtime = 0;

		
		var start = function(){

	  		options = $.extend($this.data(), options);

		  	if(!options.render)
		  		options.render = defaultRender;

		  	if(!options.minDelay)
		  		options.minDelay = 3000;

		  	if(!options.maxImgurAlbumItens)
		  		options.maxImgurAlbumItens = 5;

		  	if(options.skipPage===undefined)
		  		options.skipPage = true;

			subreddits = (options.subreddits || "").split("/");
			posts = []; //matriz de posts por subreddit
			nextlastpostids = [];
			s = -1;

			loadNext();
		};

		this.resume = function(){
			paused = false;
			loadNext();
		};
		var resume = this.resume;

		this.pause = function(){
			paused = true;
		};
		var pause = this.pause;

		var loadNext = function(){

			if(paused)
				return;
				
			if(!subreddits || !subreddits.length || s < 0)
				s = 0;
			else
				s = (s+1)%subreddits.length;

			if(posts[s] && posts[s].length > 0){

				var wait = Math.max(options.minDelay + lastloadtime - Date.now(), 1);
				lastloadtime = Date.now();

				setTimeout(function(){

					loadPost(posts[s][0], function(success){
						if(success)
							options.render(posts[s][0].data, defaultRender);
						posts[s].splice(0, 1);
						loadNext();
					});

				}, wait);

			}else{
				var lastpostid = null;
				if(nextlastpostids && nextlastpostids[s])
					lastpostid = nextlastpostids[s];

				loadSubReddit(subreddits[s], lastpostid, function(postsS){
					if(postsS && postsS.length){
						posts[s] = postsS;
						nextlastpostids[s] = postsS[postsS.length-1].data.name;
					}else{
						subreddits.splice(s, 1);
						s--;
					}
					loadNext();
				});
			}
		};
		
		var loadSubReddit = function(reddit, id, callback){

			var url = "http://www.reddit.com/";

			if(reddit)
				url += "r/"+reddit;

			if(options.redditSort)
				url += "/"+options.redditSort;

			url += ".json?jsonp=?";

			if(id)
				url += "&after="+id;
			
			$($this).trigger('beforeSubredditLoad', [url]);
			$.getJSON(url, function(data) {
				$($this).trigger('successSubredditLoad', [url]);
				callback(data.data.children);
			}).error(function(){
				$($this).trigger('errorSubredditLoad', [url]);
				callback(null);
			});
		};

		
		var loadPost = function(post, callback){
			$($this).trigger('beforePostLoad', [post.data.url]);

			var url = post.data.url;

			var loadContent = function(comments){

				post.data.top3comments = comments;

				if(options.skipNsfw && post.data.over_18){
					$($this).trigger('skipPostLoad', [post.data.url, "nsfw"]);
					callback(false);
					return;
				}

				if(post.data.selftext_html){
					if(options.skipText){
						$($this).trigger('skipPostLoad', [post.data.url, "text"]);
						callback(false);
					}else{
						post.data.formated_text = processText(post.data.selftext_html);
						$($this).trigger('successPostLoad', [post.data.url]);
				        callback(true);
					}
					return;
				}

				if(options.skipGifs && url.indexOf(".gif") != -1){
					$($this).trigger('skipPostLoad', [post.data.url, "gif"]);
					callback(false);
					return;
				}

				if(url.indexOf(".jpeg") != -1 
			 		|| url.indexOf(".jpg") != -1 
			 		|| url.indexOf(".png") != -1 
			 		|| url.indexOf(".gif") != -1){

					$('<img />').attr('src', post.data.url).load(function(){
						$($this).trigger('successPostLoad', [post.data.url]);
				        callback(true);
				    }).error(function(){
						$($this).trigger('errorPostLoad', [post.data.url]);
						callback(false);
				    });

				    return;

				}

				if(url.indexOf("imgur.com/a/") != -1){
					if(options.skipImgurAlbum){
						$($this).trigger('skipPostLoad', [post.data.url, "imgur"]);
						callback(false);
					}else{
						loadImgurAlbum(post, url, callback);
					}
					return;
				}

				if(url.indexOf("imgur") != -1){
					loadImgurImg(post, url, callback);
					return;
				}

				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
				var match = url.match(regExp);
				if (match && match[2].length==11){
					if(options.skipYoutube){
						$($this).trigger('skipPostLoad', [post.data.url, "youtube"]);
						callback(false);
					}else{
						post.data.youtube = match[2];
						callback(true);
						return;
					}
				}

				if(options.skipPage){
					$($this).trigger('skipPostLoad', [post.data.url, "page"]);
					callback(false);
				}else{
			        post.data.page = true;
					$($this).trigger('successPostLoad', [post.data.url]);
			        callback(true);
					//loadPage(post, post.data.url, callback)
				}

			};

			loadComments(post, loadContent);

		};

		var loadComments = function(post, callback){

			if(options.skipComment){
				callback([]);
				return;
			}

			var url = "http://www.reddit.com" + post.data.permalink + ".json?sort=top&limit=20&depth=2&jsonp=?";

			$.getJSON(url, function(data) {
				var top3comments = [];
				
				for(var i in data){
					if(top3comments.length >= 3){
						break;
					}
					for(var j in data[i].data.children){
						if(top3comments.length >= 3){
							break;
						}

						var child = data[i].data.children[j];
						if(child.kind == "t1"){

							var html = $("<span />", { html: child.data.body_html }).text();
							var htmlTopReply = null;

							if(child.data.replies.data){

								var topReply = null;
								var j = 0;

								do{
									topReply = child.data.replies.data.children[j++];
								}while(topReply && topReply.kind != "t1");

								if(topReply && topReply.kind == "t1"){
									htmlTopReply = $("<span />", { html: topReply.data.body_html }).text();
								}
								
							}

							top3comments.push({
								comment: processLinks(html),
								reply: processLinks(htmlTopReply)
							});
						}
					}
				}

				callback(top3comments);
			}).error(function(){
				callback([]);
			});

		};

		var loadImgurImg = function(post, url, callback){
			var urlsplit = url.split("/");
			var imageId = urlsplit[urlsplit.length-1];
			var apiUrl = "http://api.imgur.com/2/image/"+imageId+".json";

			$.getJSON(apiUrl, function(data) {

				$('<img />').attr('src', data.image.links.original).load(function(){
					post.data.url = data.image.links.original;
					$($this).trigger('successPostLoad', [data.image.links.original]);
			        callback(true);
			    }).error(function(){
					$($this).trigger('errorPostLoad', [data.image.links.original]);
					callback(false);
			    });

			}).error(function(){
				$($this).trigger('errorPostLoad', [apiUrl]);
				callback(false);
			});

		}

		var loadImgurAlbum = function(post, url, callback){
			var urlsplit = url.split("/");
			var albumId = urlsplit[urlsplit.length-1];
			var apiUrl = "http://api.imgur.com/2/album/"+albumId+".json";

			$.getJSON(apiUrl, function(data) {
				post.data.imgur = [];

				if(options.maxImgurAlbumItens > -1 && options.maxImgurAlbumItens < data.album.images.length){
					$($this).trigger('skipPostLoad', [url, "imgur max"]);
					callback(false);
					return;
				}

				loadNextImgurItem(post.data.imgur, data.album.images, 0, callback);

			}).error(function(){
				$($this).trigger('errorImgurLoad', [url]);
				callback(false);
			});
		};

		var loadNextImgurItem = function(loadeds, images, i, callback){
			loadImgurItem(images[i].links.original, function(success){
				if(success){
					loadeds.push(images[i].links.original);
					i++;
					if(i>images.length-1)
						callback(true);
					else
						loadNextImgurItem(loadeds, images, i, callback);
				}else{
					callback(false);
				}
			});
		};

		var loadImgurItem = function(url, callback){

			$('<img />').attr('src', url).load(function(){
				$($this).trigger('successImgurItemLoad', [url]);
		        callback(true);
		    }).error(function(){
				$($this).trigger('errorImgurItemLoad', [url]);
				callback(false);
		    });
		};

		/*
		var loadPage = function(post, url, callback){
			ajaxYahoo({
				url: url,
				success: function(data){
					post.data.page = data.responseText;
					if(post.data.page){
						$($this).trigger('successPostLoad', [url]);
				        callback(true);
				    }else{
						$($this).trigger('errorPostLoad', [url]);
						callback(false);
				    }
				}
			});
		};

		var ajaxYahoo = function(o) {

			var YQL = 'http' + (/^https/.test(location.protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?callback=?',
		        query = 'select * from html where url="{URL}" and xpath="*"';
		    
		    
		    var url = o.url;
		        
		        o.url = YQL;
		        o.dataType = 'json';
		        
		        o.data = {
		            q: query.replace(
		                '{URL}',
		                url + (o.data ?
		                    (/\?/.test(url) ? '&' : '?') + jQuery.param(o.data)
		                : '')
		            ),
		            format: 'xml'
		        };
		        
		        // Since it's a JSONP request
		        // complete === success
		        if (!o.success && o.complete) {
		            o.success = o.complete;
		            delete o.complete;
		        }
		        
		        o.success = (function(_success){
		            return function(data) {
		                
		                if (_success) {
		                    // Fake XHR callback.
		                    _success.call(this, {
		                        responseText: (data.results[0] || '')
		                            // YQL screws with <script>s
		                            // Get rid of them
		                            .replace(/<script[^>]+?\/>|<script(.|\s)*?\/script>/gi, '')
		                    }, 'success');
		                }
		                
		            };
		        })(o.success);
		    
		    return $.ajax.apply(this, arguments);
		    
		};
		*/

		var processText = function(pretext){
			return processLinks($("<div/>").html(pretext).text());
		}

		var processLinks = function(pretext){
			var contentEl = $("<div/>").html(pretext);

			contentEl.find("a").each(function(){
				$(this).attr("target", "_blank");
				var href = $(this).attr("href");
				if(href.indexOf("http://") === -1){
					$(this).attr("href", "http://reddit.com"+href);
				}
			});

			return contentEl.html();
		};

		var defaultRender = function(data){

			if(data.youtube){
				$($this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1><iframe type='text/html' width='640' height='390' src='http://www.youtube.com/embed/"+data.youtube+"' frameborder='0'/><hr/>");
				 pause();
				 setTimeout(resume, 6000);

			}else if(data.imgur){

				$($this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1>");
				for(var i in data.imgur){
					$($this).append("<img src='"+data.imgur[i]+"'/><br/>");
				}
				$($this).append("<hr/>");

			}else if(data.formated_text){

				$($this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1>"+data.formated_text+"<hr/>");

			}else if(data.page){

				$($this).append("<h1><span class='subreddit'>"+data.subreddit+"</span><a href='"+data.url+"' target='_blank'>"+data.title+"</a></h1>");

			}else{

				$($this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1><img src='"+data.url+"'/><hr/>");
			
			}

			for(var i in data.top3comments){
				var c = data.top3comments[i];

				$($this).append(c.comment);

				if(c.reply){
					$($this).append("<div class='reply'>" + c.reply + "<div>");
				}
			}
		};

		start();

	};


  	$.fn.redditloader = function(options) {

		this.each(function(){

			var rl = $(this).data("redditloader");

			if(!rl)
				rl = new RedditLoader($(this), options);

			if(options===true)
				rl.resume();
			else if(options===false)
				rl.pause();

			$(this).data("redditloader", rl);

		});


  	};

})(jQuery);
