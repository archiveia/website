function docReady(fn) {
  // see if DOM is already available
  if (document.readyState === "complete" || document.readyState === "interactive") {
      // call on next available tick
      setTimeout(fn, 1);
  } else {
      document.addEventListener("DOMContentLoaded", fn);
  }
}   


docReady(function() {
  var root = document.getElementsByTagName( 'html' )[0]; // '0' to assign the first (and only `HTML` tag)
  root.setAttribute( 'class', 'js js-ready page-ready' );
  
}),

docReady(function() {
  var toggleSwitch = document.querySelector(
    '.theme-switch input[type="checkbox"]'
  );
  
  function switchTheme(e) {
    if (e.target.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }
  
  toggleSwitch.addEventListener("change", switchTheme, false);
  
  var currentTheme = localStorage.getItem("theme")
    ? localStorage.getItem("theme")
    : null;
  
  if (
    !currentTheme &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    currentTheme = "dark";
  }
  
  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      toggleSwitch.checked = true;
    }
  }
})







docReady(function() {
  // YouTube Video Img Fetch
  (function() {
    var v = document.getElementsByClassName("youtube-player");
    for (var n = 0; n < v.length; n++) {
        var p = document.createElement("div");
        p.innerHTML = labnolThumb(v[n].dataset.id);
        p.onclick = labnolIframe;
        v[n].appendChild(p);
    }
  })();
  
  function labnolThumb(id) {
      return '<img class="youtube-thumb" src="//i.ytimg.com/vi/' + id + '/sddefault.jpg"><div class="play-button"></div>';
  }
  
  
  function labnolIframe() {
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", "//www.youtube.com/embed/" + this.parentNode.dataset.id + "?autoplay=1&autohide=2&border=0&wmode=opaque&enablejsapi=1&controls=1&showinfo=1");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("id", "youtube-iframe");
      this.parentNode.replaceChild(iframe, this);
  }
  
  
  });
  
  

  
  jQuery(document).ready(function($){
   /*Google Maps ACF Action */
  
      
    /*
    *  new_map
    *
    *  This function will render a Google Map onto the selected jQuery element
    *
    *  @type	function
    *  @date	8/11/2013
    *  @since	4.3.0
    *
    *  @param	$el (jQuery element)
    *  @return	n/a
    */
    
    function new_map( $el ) {
      
      // var
      var $markers = $el.find('.marker');
      
      
      // vars
      var args = {
        zoom		: 10,
        disableDefaultUI:   true,
        scrollwheel:        false,
        center		: new google.maps.LatLng(0, 0),
        mapTypeId	: google.maps.MapTypeId.ROADMAP
      };
      
      
      // create map	        	
      var map = new google.maps.Map( $el[0], args);
      
      
      // add a markers reference
      map.markers = [];
      
      
      // add markers
      $markers.each(function(){
        
          add_marker( $(this), map );
        
      });
      
      
      // center map
      center_map( map );
      
      
      // return
      return map;
      
    }
    
    /*
    *  add_marker
    *
    *  This function will add a marker to the selected Google Map
    *
    *  @type	function
    *  @date	8/11/2013
    *  @since	4.3.0
    *
    *  @param	$marker (jQuery element)
    *  @param	map (Google Map object)
    *  @return	n/a
    */
    
    function add_marker( $marker, map ) {
    
      // var
      var latlng = new google.maps.LatLng( $marker.attr('data-lat'), $marker.attr('data-lng') );
    
      // create marker
      var marker = new google.maps.Marker({
        position	: latlng,
        map			: map
      });
    
      // add to array
      map.markers.push( marker );
    
      // if marker contains HTML, add it to an infoWindow
      if( $marker.html() )
      {
        // create info window
        var infowindow = new google.maps.InfoWindow({
          content		: $marker.html()
        });
    
        // show info window when marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
    
          infowindow.open( map, marker );
    
        });
      }
    
    }
    
    /*
    *  center_map
    *
    *  This function will center the map, showing all markers attached to this map
    *
    *  @type	function
    *  @date	8/11/2013
    *  @since	4.3.0
    *
    *  @param	map (Google Map object)
    *  @return	n/a
    */
    
    function center_map( map ) {
    
      // vars
      var bounds = new google.maps.LatLngBounds();
    
      // loop through all markers and create bounds
      $.each( map.markers, function( i, marker ){
    
        var latlng = new google.maps.LatLng( marker.position.lat(), marker.position.lng() );
    
        bounds.extend( latlng );
    
      });
    
      // only 1 marker?
      if( map.markers.length == 1 )
      {
        // set center of map
          map.setCenter( bounds.getCenter() );
          map.setZoom( 16 );
      }
      else
      {
        // fit to bounds
        map.fitBounds( bounds );
      }
    
    }
    
    /*
    *  document ready
    *
    *  This function will render each map when the document is ready (page has loaded)
    *
    *  @type	function
    *  @date	8/11/2013
    *  @since	5.0.0
    *
    *  @param	n/a
    *  @return	n/a
    */
    // global var
    var map = null;
    
    $(document).ready(function(){
    
      $('.acf-map').each(function(){
    
        // create map
        map = new_map( $(this) );
    
      });
    
    });
  
  




  
  
    });
  