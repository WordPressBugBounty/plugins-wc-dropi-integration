
(function ($) {



  // wc_city_select_params is required to continue, ensure the object exists
  // wc_country_select_params is used for select2 texts. This one is added by WC
  if (typeof wc_country_select_params === 'undefined' || typeof wc_city_select_params === 'undefined') {

    return false;
  }


  function getEnhancedSelectFormatString() {
    return {
      formatMatches: function (matches) {
        if (1 === matches) {
          return wc_country_select_params.i18n_matches_1;
        }

        return wc_country_select_params.i18n_matches_n.replace('%qty%', matches);
      },
      formatNoMatches: function () {
        return wc_country_select_params.i18n_no_matches;
      },
      formatAjaxError: function () {
        return wc_country_select_params.i18n_ajax_error;
      },
      formatInputTooShort: function (input, min) {
        var number = min - input.length;

        if (1 === number) {
          return wc_country_select_params.i18n_input_too_short_1;
        }

        return wc_country_select_params.i18n_input_too_short_n.replace('%qty%', number);
      },
      formatInputTooLong: function (input, max) {
        var number = input.length - max;

        if (1 === number) {
          return wc_country_select_params.i18n_input_too_long_1;
        }

        return wc_country_select_params.i18n_input_too_long_n.replace('%qty%', number);
      },
      formatSelectionTooBig: function (limit) {
        if (1 === limit) {
          return wc_country_select_params.i18n_selection_too_long_1;
        }

        return wc_country_select_params.i18n_selection_too_long_n.replace('%qty%', limit);
      },
      formatLoadMore: function () {
        return wc_country_select_params.i18n_load_more;
      },
      formatSearching: function () {
        return wc_country_select_params.i18n_searching;
      }
    };
  }

  // Select2 Enhancement if it exists
  //Commented by Diana, 23 august 2023... it is bringing two inputs at the time and doesn't update the cities.
  // if ($().select2) {
  //   var wc_city_select_select2 = function () {
  //     $('select.city_select:visible').each(function () {
  //       var select2_args = $.extend({
  //         placeholderOption: 'first',
  //         width: '100%'
  //       }, getEnhancedSelectFormatString());

  //       $(this).select2(select2_args);
  //     });
  //   };

  //   wc_city_select_select2();

  //   $(document.body).bind('city_to_select', function () {

  //     wc_city_select_select2();
  //   });
  // }

  /* City select boxes */

  var cities_json = wc_city_select_params.cities.replace(/&quot;/g, '"');
  var cities = $.parseJSON(cities_json);

  var elBodyDPWoo = $('body');

  elBodyDPWoo.on('country_to_state_changing', function (e, country, $container) {

    var $statebox = $container.find('#billing_state, #shipping_state, #calc_shipping_state');
    var state = $statebox.val();
    $(document.body).trigger('state_changing', [country, state, $container]);
  });

  elBodyDPWoo.on('change', 'select.state_select, #calc_shipping_state', function () {
    var $container = $(this).closest('div');
    var country = $container.find('#billing_country, #shipping_country, #calc_shipping_country').val();
    var state = $(this).val();


    $(document.body).trigger('state_changing', [country, state, $container]);
  });


  elBodyDPWoo.on('state_changing', function (e, country, state, $container) {

    var $citybox = '';
    var send_to_other_address = $('#ship-to-different-address-checkbox').is(':checked');

    console.log('type', $('#billing_city').attr('type'));
    console.log('send_to_other_address', send_to_other_address);
    if (send_to_other_address == false && $('#billing_city').attr('type')!='hidden') {
      $citybox = $('#billing_city');
    }
    else {
      $citybox = $('#shipping_city');
    }
    if ($citybox.length == 0) {
      $citybox = $('#calc_shipping_city');
    }

    if (cities != null && cities[country]) {

      /* if the country has no states */
      if (cities[country] instanceof Array) {
        cityToSelect($citybox, cities[country]);
      } else if (state) {
        if (cities[country][state]) {
          cityToSelect($citybox, cities[country][state]);
          if (send_to_other_address == true  && $('#billing_city').attr('type')!='hidden') {
            $citybox = $('#billing_city');
            cityToSelect($citybox, cities[country][state]);
          }
        } else {
          cityToInput($citybox);
        }
      } else {
        disableCity($citybox);
      }
    } else {
      cityToInput($citybox);
    }
  });



  setTimeout(function () {
    var $container = $(this).closest('div');
    var country = $('#billing_country, #shipping_country, #calc_shipping_country').val();
    var state = $('select.state_select, #calc_shipping_state').val();
    $(document.body).trigger('state_changing', [country, state, $container]);

  }, 500)


  /* Ajax replaces .cart_totals (child of .cart-collaterals) on shipping calculator */
  if ($('.cart-collaterals').length && $('#calc_shipping_state').length) {
    var calc_observer = new MutationObserver(function () {
      $('#calc_shipping_state').change();
    });
    calc_observer.observe(document.querySelector('.cart-collaterals'), { childList: true });
  }

  function cityToInput($citybox) {
    if ($citybox.is('input')) {
      $citybox.prop('disabled', false);
      return;
    }

    var input_name = $citybox.attr('name');
    var input_id = $citybox.attr('id');
    var placeholder = $citybox.attr('placeholder');

    // $citybox.parent().find('.select2-container').remove();

    $citybox.replaceWith('<input type="text" class="input-text" name="' + input_name + '" id="' + input_id + '" placeholder="' + placeholder + '" />');
  }

  function disableCity($citybox) {
    $citybox.val('').change();
    $citybox.prop('disabled', true);
  }

  function cityToSelect($citybox, current_cities) {
    var value = $citybox.val();

    $citybox.val('');
    if (!$citybox.is('select')) {

      var input_name = $citybox.attr('name');
      var input_id = $citybox.attr('id');
      var placeholder = $citybox.attr('placeholder');

      $citybox.replaceWith('<select name="' + input_name + '" id="' + input_id + '" class="city_select" placeholder="' + placeholder + '"></select>');
      //we have to assign the new object, because of replaceWith
      $citybox = $('#' + input_id);
    } else {
      $citybox.prop('disabled', false);
    }

    var options = '';
    for (var index in current_cities) {
      if (current_cities.hasOwnProperty(index)) {
        var cityName = current_cities[index];
        options = options + '<option value="' + cityName + '">' + cityName + '</option>';
      }
    }

    $citybox.html('<option value="">' + wc_city_select_params.i18n_select_city_text + '</option>' + options);

    if ($('option[value="' + value + '"]', $citybox).length) {
      $citybox.val(value).change();
    } else {
      $citybox.val('').change();
    }

    // $(document.body).trigger('city_to_select');
  }
})(jQuery);