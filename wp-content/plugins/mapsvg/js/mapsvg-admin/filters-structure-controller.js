(function($, window){
    var MapSVGAdminFiltersStructureController = function(container, admin, mapsvg, filtersService){
        this.name = 'filters-structure';
        this.scrollable = false;
        MapSVGAdminController.call(this, container, admin, mapsvg);
        this.filtersSchema = this.mapsvg.filtersSchema;
    };
    window.MapSVGAdminFiltersStructureController = MapSVGAdminFiltersStructureController;
    MapSVG.extend(MapSVGAdminFiltersStructureController, window.MapSVGAdminController);


    MapSVGAdminFiltersStructureController.prototype.viewLoaded = function(){
        var _this = this;
    };
    MapSVGAdminFiltersStructureController.prototype.viewDidAppear = function(){
        var _this = this;
        MapSVG.countries = [{"id":"AD","title":"Andorra"},{"id":"AE","title":"United Arab Emirates"},{"id":"AF","title":"Afghanistan"},{"id":"AG","title":"Antigua and Barbuda"},{"id":"AI","title":"Anguilla"},{"id":"AL","title":"Albania"},{"id":"AM","title":"Armenia"},{"id":"AO","title":"Angola"},{"id":"AR","title":"Argentina"},{"id":"AS","title":"American Samoa"},{"id":"AT","title":"Austria"},{"id":"AU","title":"Australia"},{"id":"AW","title":"Aruba"},{"id":"AX","title":"Aland Islands"},{"id":"AZ","title":"Azerbaijan"},{"id":"BA","title":"Bosnia and Herzegovina"},{"id":"BB","title":"Barbados"},{"id":"BD","title":"Bangladesh"},{"id":"BE","title":"Belgium"},{"id":"BF","title":"Burkina Faso"},{"id":"BG","title":"Bulgaria"},{"id":"BH","title":"Bahrain"},{"id":"BI","title":"Burundi"},{"id":"BJ","title":"Benin"},{"id":"BL","title":"Saint Barthelemy"},{"id":"BM","title":"Bermuda"},{"id":"BN","title":"Brunei Darussalam"},{"id":"BO","title":"Bolivia"},{"id":"BQ","title":"Bonaire,  Saint Eustachius and Saba"},{"id":"BR","title":"Brazil"},{"id":"BS","title":"Bahamas"},{"id":"BT","title":"Bhutan"},{"id":"BV","title":"Bouvet Island"},{"id":"BW","title":"Botswana"},{"id":"BY","title":"Belarus"},{"id":"BZ","title":"Belize"},{"id":"CA","title":"Canada"},{"id":"CC","title":"Cocos  (Keeling)  Islands"},{"id":"CD","title":"Democratic Republic of Congo"},{"id":"CF","title":"Central African Republic"},{"id":"CG","title":"Republic of Congo"},{"id":"CH","title":"Switzerland"},{"id":"CI","title":"Côte d'Ivoire"},{"id":"CK","title":"Cook Islands"},{"id":"CL","title":"Chile"},{"id":"CM","title":"Cameroon"},{"id":"CN","title":"China"},{"id":"CO","title":"Colombia"},{"id":"CR","title":"Costa Rica"},{"id":"CU","title":"Cuba"},{"id":"CV","title":"Cape Verde"},{"id":"CW","title":"Curaçao"},{"id":"CX","title":"Christmas Island"},{"id":"CY","title":"Cyprus"},{"id":"CZ","title":"Czech Republic"},{"id":"DE","title":"Germany"},{"id":"DJ","title":"Djibouti"},{"id":"DK","title":"Denmark"},{"id":"DM","title":"Dominica"},{"id":"DO","title":"Dominican Republic"},{"id":"DZ","title":"Algeria"},{"id":"EC","title":"Ecuador"},{"id":"EE","title":"Estonia"},{"id":"EG","title":"Egypt"},{"id":"EH","title":"Western Sahara"},{"id":"ER","title":"Eritrea"},{"id":"ES","title":"Spain"},{"id":"ET","title":"Ethiopia"},{"id":"FI","title":"Finland"},{"id":"FJ","title":"Fiji"},{"id":"FK","title":"Falkland Islands"},{"id":"FM","title":"Federated States of Micronesia"},{"id":"FO","title":"Faroe Islands"},{"id":"FR","title":"France"},{"id":"GA","title":"Gabon"},{"id":"GB","title":"United Kingdom"},{"id":"GD","title":"Grenada"},{"id":"GE","title":"Georgia"},{"id":"GF","title":"French Guiana"},{"id":"GG","title":"Guernsey"},{"id":"GH","title":"Ghana"},{"id":"GI","title":"Gibraltar"},{"id":"GL","title":"Greenland"},{"id":"GM","title":"Gambia"},{"id":"GN","title":"Guinea"},{"id":"GO","title":"Glorioso Islands"},{"id":"GP","title":"Guadeloupe"},{"id":"GQ","title":"Equatorial Guinea"},{"id":"GR","title":"Greece"},{"id":"GS","title":"South Georgia and South Sandwich Islands"},{"id":"GT","title":"Guatemala"},{"id":"GU","title":"Guam"},{"id":"GW","title":"Guinea-Bissau"},{"id":"GY","title":"Guyana"},{"id":"HK","title":"Hong Kong"},{"id":"HM","title":"Heard Island and McDonald Islands"},{"id":"HN","title":"Honduras"},{"id":"HR","title":"Croatia"},{"id":"HT","title":"Haiti"},{"id":"HU","title":"Hungary"},{"id":"ID","title":"Indonesia"},{"id":"IE","title":"Ireland"},{"id":"IL","title":"Israel"},{"id":"IM","title":"Isle of Man"},{"id":"IN","title":"India"},{"id":"IO","title":"British Indian Ocean Territory"},{"id":"IQ","title":"Iraq"},{"id":"IR","title":"Iran"},{"id":"IS","title":"Iceland"},{"id":"IT","title":"Italy"},{"id":"JE","title":"Jersey"},{"id":"JM","title":"Jamaica"},{"id":"JO","title":"Jordan"},{"id":"JP","title":"Japan"},{"id":"JU","title":"Juan De Nova Island"},{"id":"KE","title":"Kenya"},{"id":"KG","title":"Kyrgyzstan"},{"id":"KH","title":"Cambodia"},{"id":"KI","title":"Kiribati"},{"id":"KM","title":"Comoros"},{"id":"KN","title":"Saint Kitts and Nevis"},{"id":"KP","title":"North Korea"},{"id":"KR","title":"South Korea"},{"id":"KW","title":"Kuwait"},{"id":"KY","title":"Cayman Islands"},{"id":"KZ","title":"Kazakhstan"},{"id":"LA","title":"Lao People's Democratic Republic"},{"id":"LB","title":"Lebanon"},{"id":"LC","title":"Saint Lucia"},{"id":"LI","title":"Liechtenstein"},{"id":"LK","title":"Sri Lanka"},{"id":"LR","title":"Liberia"},{"id":"LS","title":"Lesotho"},{"id":"LT","title":"Lithuania"},{"id":"LU","title":"Luxembourg"},{"id":"LV","title":"Latvia"},{"id":"LY","title":"Libya"},{"id":"MA","title":"Morocco"},{"id":"MC","title":"Monaco"},{"id":"MD","title":"Moldova"},{"id":"ME","title":"Montenegro"},{"id":"MF","title":"Saint Martin"},{"id":"MG","title":"Madagascar"},{"id":"MH","title":"Marshall Islands"},{"id":"MK","title":"Macedonia"},{"id":"ML","title":"Mali"},{"id":"MM","title":"Myanmar"},{"id":"MN","title":"Mongolia"},{"id":"MO","title":"Macau"},{"id":"MP","title":"Northern Mariana Islands"},{"id":"MQ","title":"Martinique"},{"id":"MR","title":"Mauritania"},{"id":"MS","title":"Montserrat"},{"id":"MT","title":"Malta"},{"id":"MU","title":"Mauritius"},{"id":"MV","title":"Maldives"},{"id":"MW","title":"Malawi"},{"id":"MX","title":"Mexico"},{"id":"MY","title":"Malaysia"},{"id":"MZ","title":"Mozambique"},{"id":"NA","title":"Namibia"},{"id":"NC","title":"New Caledonia"},{"id":"NE","title":"Niger"},{"id":"NF","title":"Norfolk Island"},{"id":"NG","title":"Nigeria"},{"id":"NI","title":"Nicaragua"},{"id":"NL","title":"Netherlands"},{"id":"NO","title":"Norway"},{"id":"NP","title":"Nepal"},{"id":"NR","title":"Nauru"},{"id":"NU","title":"Niue"},{"id":"NZ","title":"New Zealand"},{"id":"OM","title":"Oman"},{"id":"PA","title":"Panama"},{"id":"PE","title":"Peru"},{"id":"PF","title":"French Polynesia"},{"id":"PG","title":"Papua New Guinea"},{"id":"PH","title":"Philippines"},{"id":"PK","title":"Pakistan"},{"id":"PL","title":"Poland"},{"id":"PM","title":"Saint Pierre and Miquelon"},{"id":"PN","title":"Pitcairn Islands"},{"id":"PR","title":"Puerto Rico"},{"id":"PS","title":"Palestinian Territories"},{"id":"PT","title":"Portugal"},{"id":"PW","title":"Palau"},{"id":"PY","title":"Paraguay"},{"id":"QA","title":"Qatar"},{"id":"RE","title":"Reunion"},{"id":"RO","title":"Romania"},{"id":"RS","title":"Serbia"},{"id":"RU","title":"Russia"},{"id":"RW","title":"Rwanda"},{"id":"SA","title":"Saudi Arabia"},{"id":"SB","title":"Solomon Islands"},{"id":"SC","title":"Seychelles"},{"id":"SD","title":"Sudan"},{"id":"SE","title":"Sweden"},{"id":"SG","title":"Singapore"},{"id":"SH","title":"Saint Helena"},{"id":"SI","title":"Slovenia"},{"id":"SJ","title":"Svalbard and Jan Mayen"},{"id":"SK","title":"Slovakia"},{"id":"SL","title":"Sierra Leone"},{"id":"SM","title":"San Marino"},{"id":"SN","title":"Senegal"},{"id":"SO","title":"Somalia"},{"id":"SR","title":"Suriname"},{"id":"SS","title":"South Sudan"},{"id":"ST","title":"Sao Tome and Principe"},{"id":"SV","title":"El Salvador"},{"id":"SX","title":"Saint Martin"},{"id":"SY","title":"Syria"},{"id":"SZ","title":"Swaziland"},{"id":"TC","title":"Turks and Caicos Islands"},{"id":"TD","title":"Chad"},{"id":"TF","title":"French Southern and Antarctic Lands"},{"id":"TG","title":"Togo"},{"id":"TH","title":"Thailand"},{"id":"TJ","title":"Tajikistan"},{"id":"TK","title":"Tokelau"},{"id":"TL","title":"Timor-Leste"},{"id":"TM","title":"Turkmenistan"},{"id":"TN","title":"Tunisia"},{"id":"TO","title":"Tonga"},{"id":"TR","title":"Turkey"},{"id":"TT","title":"Trinidad and Tobago"},{"id":"TV","title":"Tuvalu"},{"id":"TW","title":"Taiwan"},{"id":"TZ","title":"Tanzania"},{"id":"UA","title":"Ukraine"},{"id":"UG","title":"Uganda"},{"id":"UM-DQ","title":"Jarvis Island"},{"id":"UM-FQ","title":"Baker Island"},{"id":"UM-HQ","title":"Howland Island"},{"id":"UM-JQ","title":"Johnston Atoll"},{"id":"UM-MQ","title":"Midway Islands"},{"id":"UM-WQ","title":"Wake Island"},{"id":"US","title":"United States"},{"id":"UY","title":"Uruguay"},{"id":"UZ","title":"Uzbekistan"},{"id":"VA","title":"Vatican City"},{"id":"VC","title":"Saint Vincent and the Grenadines"},{"id":"VE","title":"Venezuela"},{"id":"VG","title":"British Virgin Islands"},{"id":"VI","title":"US Virgin Islands"},{"id":"VN","title":"Vietnam"},{"id":"VU","title":"Vanuatu"},{"id":"WF","title":"Wallis and Futuna"},{"id":"WS","title":"Samoa"},{"id":"XK","title":"Kosovo"},{"id":"YE","title":"Yemen"},{"id":"YT","title":"Mayotte"},{"id":"ZA","title":"South Africa"},{"id":"ZM","title":"Zambia"},{"id":"ZW","title":"Zimbabwe"}];

        _this.formBuilder = new MapSVG.FormBuilder({
            schema: _this.filtersSchema.getSchema(),
            editMode: true,
            filtersMode: true,
            mapsvg: _this.mapsvg,
            admin: _this.admin,
            container: this.contentView,
            template: 'form-builder-filters',
            types: ['select','radio','checkboxes','distance','search'],
            events: {
                saveSchema: function(options){
                    if(_this.mapsvg.id){
                        _this.filtersSchema.setSchema(options);
                        $.growl.notice({title: '', message: 'Settings saved', duration: 700});
                        _this.admin.save();
                        _this.mapsvg.setFilters();
                    }else{
                        _this.admin.save().done(function(){
                            _this.filtersSchema.setSchema(options);
                            _this.mapsvg.setFilters();
                        });
                    }
                },
                load: function(){
                    setTimeout(function () {
                        $('#mapsvg-btn-filters-structure').tooltip('show').tooltip('hide');
                    }, 200);
                }

            }
        });
    };
    MapSVGAdminFiltersStructureController.prototype.viewDidDisappear = function(){
        MapSVGAdminController.prototype.viewDidDisappear.call(this);
        this.formBuilder && this.formBuilder.destroy();
    };

    MapSVGAdminFiltersStructureController.prototype.setEventHandlers = function(){
        var _this = this;
    };

})(jQuery, window);