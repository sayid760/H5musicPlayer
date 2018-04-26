var musicRender = (function () {
    var $header = $('.header'),
        $main = $('.main'),
        $footer = $('.footer'),
        $wrapper = $main.find('.wrapper'),
        musicAudio = $('#musicAudio')[0],
        $musicBtn = $footer.find('.musicBtn'),
        $current = $footer.find('.current'),
        $duration = $footer.find('.duration'),
        $already = $footer.find('.already'),
        $dragCircle = $footer.find('.dragCircle'),
        $proBg = $footer.find('.proBg');

    var audio=document.getElementById('musicAudio')
    var $plan = $.Callbacks(),
        autoTimer = null,
        step = 0,
        curTop = 0;

    //->绑定歌词
    $plan.add(function (lyric) {
        var ary = [],
            reg = /\[(\d+):((\d+)\.(\d+))]([^&#\:\[]+)/g;
        lyric.replace(reg, function (res, minute, second) {
            ary.push({
            	res:res,
                minute: minute,
                second: Math.ceil(second),
                value: arguments[5]
            });
        });

        //放歌词
        let str='';
        for(var i=0;i<ary.length;i++){
        	str+=`<p data-minute="${ary[i].minute}" data-second="${ary[i].second}">${ary[i].value}</p>`
        }
        $wrapper.html(str);
    });

    //->音乐播放
    $plan.add(function () {
        musicAudio.play();
		console.dir(musicAudio);
		$musicBtn.css('display','block').addClass('move');
		musicAudio.addEventListener('canplay',function(){
			//->计算播放量
            computedAlready(); 
            autoTimer = setInterval(computedAlready, 1000);
		})
       musicAudio.addEventListener("timeupdate", function(){
	        clearInterval(autoTimer);
       	    setTimeout(computedAlready, 1000);
       });
    });

    //->控制音乐的暂停或者播放
    $plan.add(function () {
       $musicBtn.tap(function(){
       	    if(musicAudio.paused) {
                musicAudio.play();
                $musicBtn.addClass('move');
                autoTimer = setInterval(computedAlready, 1000);
                return;
            }
            musicAudio.pause();
            $musicBtn.removeClass('move');
            clearInterval(autoTimer);
       })
    });

        

    //->计算当前播放量
    function computedAlready() {
    	var curTime = musicAudio.currentTime,
            durTime = musicAudio.duration;
        if (curTime >= durTime) {
            clearInterval(autoTimer);
            console.log(autoTimer)
            $duration.html(formatTime(durTime));
            $current.html(formatTime(durTime));
            $already.css('width', '100%');
            $dragCircle.css('left', '96%');
            $musicBtn.removeClass('move');
            return;
        }
        if (curTime==0){
        	 $wrapper.css('top','0px')
        }
        $duration.html(formatTime(durTime));
        $current.html(formatTime(curTime));
        $already.css('width', curTime / durTime * 100 + '%');
        $dragCircle.css('left',(curTime/durTime)*100-4+'%');
    	
    	
        //->歌词对应
        let ary=formatTime(curTime).split(':'), //以：为分割界
            minute=ary[0],
            second=ary[1];
        let $curLyric=$wrapper.find('p').filter('[data-minute="'+minute+'"]').filter('[data-second="'+second+'"]');
        //如果存在$curLyric
        if($curLyric.length>0){
        	$curLyric.addClass('select').siblings().removeClass('select');
           if($wrapper.find('p').hasClass("select")){
            	 curTop=$(".select")[0].offsetTop-$main.height()/2+$wrapper.find('p').height()/2;
            	 $wrapper.css('top',-curTop+'px')
           }
        }        
    }

    //拖拽播放条
    $plan.add(function () {
    	 let disX=null,disY=null,Left=null;
    	 $dragCircle.on("touchstart",function(ev){
             disX = ev.targetTouches[0].pageX - $(this).position().left;    
         });
    	 $dragCircle.on("touchmove",function(ev){
    	 	ev.preventDefault();  
    	 	Left=ev.targetTouches[0].pageX - disX
    	 	//边界
    	    Left=Math.min(Math.max(Left,0),$proBg[0].offsetWidth-$dragCircle[0].offsetWidth);
         });

         $dragCircle.on("touchend",function(){
         	play_ctrl(Left);
            $(this).off('touchstart','touchmove');  
         }); 
    	
    });
    
    
    function play_ctrl(x){
    	clearInterval(autoTimer);
		let timego=x/$proBg.width()*musicAudio.duration;
		musicAudio.currentTime=timego;
	}
  
  
    //->格式化时间
    function formatTime(time) {
        let minute=Math.floor(time/60),
            second=Math.ceil(time%60);
			minute<10 ? minute = '0'+ minute:null;
			second<10? second = '0'+ second :null;
			return minute+':'+second;
    }

    return {
        init: function () {
            //->获取歌词,然后依次做后续的操作
            $.ajax({
                url: 'json/lyric.json',
                method: 'GET',
                dataType: 'json',
                cache: false,
                success: function (result) {
                    var lyric = result['lyric'];
                    $plan.fire(lyric);
                }
            });
        }
    }
})();
musicRender.init();
