(function($) {
	'use strict';
	
	jQuery(document).on('ready', function(){
	
		/*PRELOADER JS*/
		jQuery(window).on('load',function() {
		  setTimeout(function() {
				$('body').addClass('loaded');
			}, 500);
		});
		/*END PRELOADER JS*/	
		
		/*START VIDEO JS*/
		if ($.fn.magnificPopup) {
			$('.video-play').magnificPopup({
				type: 'iframe'
			});
			$('.co-video-play').magnificPopup({
				type: 'iframe'
			});
			$('.magnific_popup').magnificPopup({
				disableOn: 700,
				type: 'iframe',
				mainClass: 'mfp-fade',
				removalDelay: 160,
				preloader: false,
				fixedContentPos: false,
				disableOn: 300
			});	
		}
		/*END VIDEO JS*/	
			
	}); 		
	
})(jQuery);
