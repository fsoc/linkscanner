/*  
 *  linkscanner application code,
 *  protected by the U.S. Marshals Copyright Justice Agency
 *  USMCJA. If you are stealing beware! 
 */

/*
 * Client-side JS
 */
$(function() {
    var baseUrl='http://linkscanner.us';
    // Handle the focus/focus out on the input field
    var url = $('#url');
    var preloader = $('#preloader');

    url.focus(function() {
        if(url.val()=='URL') {
            url.val('');
        }
        url.removeClass('focusout');
        url.addClass('focus');
        url.css('color','#00000');
    });
    url.focusout(function() {
        if(url.val() == '') {
            url.val('URL');
        }
        url.removeClass('focus');
        url.addClass('focusout');
        url.css('color','#838B92');
    });

    // When you press Scan Link do a GET to the backend
    var scan = function() {
        var exp = $('#explanation');
        exp.hide();
        exp.html('Link generated! Share the URL below:');
        $.ajax({
            url: 'scan',
            data: { u: url.val() },
            type: 'GET',
            beforeSend: function() { 
                preloader.show();
            },
            success: function(json) { 
                url.val(baseUrl+'/' + json.key).select();
            },
            complete: function() {
                preloader.fadeOut();
                exp.fadeIn();
            }
        })}

    // Scan the link when pressing enter or clicking the mouse
    url.keypress(function(e) { 
        if (e.which == 13) {
            scan();
        }
    });
    $('#button').click(function() { 
        mpq.track('create',{'url':url.val()});
        scan();
    });

    var ads =  ['http://myadurl.com'];
    var adid = Math.floor(Math.random()*ads.length);
    var adUrl = ads[adid];
    var adHtml = "<a href=\""+ads[adid]+"\" ><img id=\"zyxs\" src=\"images/zyx"+adid+".gif\" </a>";
    $('#zyx').html(adHtml);

    //Adjust the iframe height
    function setSizes() {
        $("#iframe").height(window.innerHeight - 80);
    }
    $(window).resize(function() { setSizes(); });

    //Log
    mpq.track('enter');
});
