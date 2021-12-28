jQuery(document).ready(function($) {
  if( acf.fields.color_picker ) {
    // custom colors
    var palette = ['#FFA300', '#211551', '#0047BB', '#753BBD', '#DB0A5B', '#43B02A','#4E5B73'];

    // when initially loaded find existing colorpickers and set the palette
    acf.add_action('load', function() {
      $('input.wp-color-picker').each(function() {
        $(this).iris('option', 'palettes', palette);
      });
    });

    // if appended element only modify the new element's palette
    acf.add_action('append', function(el) {
      $(el).find('input.wp-color-picker').iris('option', 'palettes', palette);
    });
  }
});
