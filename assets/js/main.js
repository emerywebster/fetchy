var Fetchy = {
    $content: $('.content'),
    $form: $('form'),
    toggleLoading: function() {
    	// Toggle loading indicator
    	this.$content.toggleClass('content--loading');

		// Toggle the submit button so we don't get double submissions
    	// http://stackoverflow.com/questions/4702000/toggle-input-disabled-attribute-using-jquery
    	this.$form.find('button').prop('disabled', function(i, v) { return !v; });
    },
    userInput: '',
    userInputIsValid: false,
    appId: '',
    validate: function(input) {
        // Use regex to test if input is valid. It's valid if:
        // 1. It begins with 'http://itunes'
        // 2. It has '/id' followed by digits in the string somewhere
        var regUrl = /^(http|https):\/\/itunes/;
        var regId = /\/id(\d+)/i;
        if ( regUrl.test(this.userInput) && regId.test(this.userInput) ) {
            this.userInputIsValid = true;
            var id = regId.exec(this.userInput);
            this.appId = id[1];
        } else {
            this.userInputIsValid = false;
            this.appId = '';
        }
    },
    throwError: function(header, text){
        // Remove animation class
        this.$content.removeClass('content--error-pop');
 
        // Trigger reflow
        // https://css-tricks.com/restart-css-animation/
        this.$content[0].offsetWidth = this.$content[0].offsetWidth;
 
        // Add classes and content
        this.$content
            .html('<p><strong>' + header + '</strong> ' + text + '</p>')
            .addClass('content--error content--error-pop');
 
        this.toggleLoading();
    },
    render: function(response){
        var icon = new Image();
        icon.src = response.artworkUrl512;
        icon.onload = function() {
            Fetchy.$content
                .html(this)
                .addClass('results')
                .append('<p>' + response.trackName + '</p>')
                .removeClass('content--error');
            Fetchy.toggleLoading();

            // If it's an iOS icon, load the mask too
            if(response.kind != 'mac-software') {
                var mask = new Image();
                mask.src = 'assets/img/icon-mask.png';
                mask.onload = function() {
                    Fetchy.$content.prepend(this);
                }
            }
        }
    }
}

$(document).ready(function(){
    Fetchy.$form.on('submit', function(e){
    	e.preventDefault();
    	Fetchy.toggleLoading(); // call the loading function
        Fetchy.userInput = $(this).find('input').val();
    	Fetchy.validate();
    	if( Fetchy.userInputIsValid ) {
        	$.ajax({
        		url: "https://itunes.apple.com/lookup?id=" + Fetchy.appId,
        		dataType: 'JSONP'
    		})
    		.done(function(response) {
        	    // Get the first response and log it
   				 var response = response.results[0];
   				 console.log(response);
   			    // Check to see if request is valid & contains the info we want
   				// If it does, render it. Otherwise throw an error
    			if(response && response.artworkUrl512 != null){
        			Fetchy.render(response);
    			} else {
        		Fetchy.throwError(
            	'Invalid Response',
            	'The request you made appears to not have an associated icon. Please try a different URL.'
        );
    }
    		})
    		.fail(function(data) {
    			Fetchy.throwError(
            		'iTunes API Error',
           			'There was an error retrieving the info. Check the iTunes URL or try again later.'
           		);
    		});
    	} else {
        	Fetchy.throwError(
        	'',
        	'Hmm. That didn\'t work. Please try again with a different URL.'
       		);
    	}
    })
});