# JQuery RedditLoader 2.1.1 [Download](https://raw.github.com/melanke/Jquery-RedditLoader/master/src/jquery.redditloader-2.1.1.js)

## About
Load images, Imgur Albuns, Youtube videos, Texts and Links of Reddit Posts, loading only when the previous content was loaded

###Livedemo
http://redditmobile.blogspot.com.br

###Dependencies
* JQuery

##Loading with default config
```javascript
$("#posts").redditloader();
```

##Optional full config
```javascript
$("#posts").redditloader({
				subreddits: "funny/todayilearned/wtf/adviceanimals", //subreddits to load separated by "/", default is all
				redditSort: "new", //sort method (new, controversial, top), default is front page
				skipNsfw: true, //if you dont want nsfw
				skipGifs: true, //if you dont want gifs
				skipImgurAlbum: true, //if you dont want to load imgur albuns
				skipYoutube: true, //if yout dont want to load youtube videos
				skipText: true, //(beta - default is true) if you dont want to load articles (text)
				minDelay: 2000, //mininum delay, in miliseconds, between loading posts (default is 1500)
				maxImgurAlbumItens: -1, //only load album if it contains less itens than this attribute (-1 if you want to load it anyway. default is 5)

				render: function(redditpost){
					//here is an example for a custom render
					if(data.youtube){
						$(this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1><iframe type='text/html' width='640' height='390' src='http://www.youtube.com/embed/"+data.youtube+"' frameborder='0'/><hr/>");
					}else if(data.imgur){
						$(this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1>");
						for(var i in data.imgur){
							$(this).append("<img src='"+data.imgur[i]+"'/><br/>");
						}
						$(this).append("<hr/>");
					}else if(data.text){
						$(this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1>"+data.text+"<hr/>");
					}else{
						$(this).append("<h1><span class='subreddit'>"+data.subreddit+"</span>"+data.title+"</h1><img src='"+data.url+"'/><hr/>");
					}
				},
});
```

##Optional full config by HTML element
```html
<div 
        id='posts' 
        data-subreddits='funny/todayilearned/wtf/adviceanimals'
        data-redditSort='new'
        data-skipNsfw='true'
        data-skipGifs='true'
        data-skipImgurAlbum='true'
        data-skipYoutube='true'
        minDelay='2000'
        maxImgutAlbumItens='-1'>
</div>
```
```javascript
$("#posts").redditloader();
```


to know more about attributes to the render visit https://github.com/reddit/reddit/wiki/API%3A-info.json
full list:

                "domain": "blog.reddit.com",
                "media_embed": {},
                "levenshtein": null,
                "subreddit": "blog",
                "selftext_html": null,
                "selftext": "",
                "likes": true,
                "saved": true,
                "id": "i0jf9",
                "clicked": false,
                "author": "hueypriest",
                "media": null,
                "score": 1520,
                "over_18": false,
                "hidden": false,
                "thumbnail": "http://thumbs.reddit.com/t3_i0jf9.png",
                "subreddit_id": "t5_2qh49",
                "downs": 2381,
                "is_self": false,
                "permalink": "/r/blog/comments/i0jf9/reddit_levels_up_with_three_new_programmers/",
                "name": "t3_i0jf9",
                "created": 1308164715.0,
                "url": "http://blog.reddit.com/2011/06/reddit-levels-up-with-three-new.html",
                "title": "reddit Levels Up with Three New Programmers",
                "created_utc": 1308164715.0,
                "num_comments": 533,
                "ups": 3901

##Pause/Resume Loading
```javascript
$("#posts").redditloader(false); //pause
$("#posts").redditloader(true); //resume