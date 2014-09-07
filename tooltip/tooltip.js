$(document).ready(function() {
             SetupChromeExtension();
             console.log("INITIATED");
         });

var companyTooltipInfo = {};

var apiKey = 'a554e04effee9e09ee61679a344041c2';
var lookupUrlPrefix = 'http://api.crunchbase.com/v/2/organization/';
          
         function SetupChromeExtension() {
            var final_company_names_on_page = []
            console.log('started setup');
              // Load company info for company names on page from Crunchbase 

            var page_text = $('body').text();

            //console.log(page_text);

            var all_words_on_page = getText("p");
            //console.log(all_words_on_page);
            $.each(all_words_on_page, function(index, value){
              //console.log(value);
              var is_in_array = companyNames.indexOf(value);
              if (is_in_array != -1) {
                //console.log(is_in_array);
                //console.log(value);
                var is_in_final_co_array = final_company_names_on_page.indexOf(value);
                if (is_in_final_co_array == -1) {
                  final_company_names_on_page.push(value);
                }
              }
            });

            console.log(final_company_names_on_page);

            $.each(final_company_names_on_page, function(index, value) { 
              console.log('looping');
               company = value;
               var foundin = $('p:contains(' + company + ')');
               /*if (foundin.length) {

                  var replaced = $("body").html()
                     .replace(new RegExp(company, 'g'), '<span class="CompanyExt" CompanyName="' + company + '"><u>' + company + '</u></span>');
                  $("body").html(replaced);
                  LoadCompanyInfo(company);
               }
               */
               foundin.each(function(index, value){
                //console.log(value);
                  var replaced = $(value).html()
                       .replace(new RegExp(' ' + company + ' ', 'g'), '<span class="CompanyExt" CompanyName="' + company + '">' + company + '</span>');
                  $(value).html(replaced);
               });
               LoadCompanyInfo(company);
            });

            console.log('finished looping');

            // Load tooltip with company info for each company
            $('.CompanyExt').hover(
               function(event) {
                  //console.log('hovering');
                  $('.companyTooltip').remove(); 
                  var companyName = $(this).attr('CompanyName');
                  $('<span class="companyTooltip companyTooltipInner"></span>').html(companyTooltipInfo[companyName])
                     .appendTo('body')
                     .css('top', (event.pageY-10) + 'px')
                     .css('left', (event.pageX-30) + 'px')
                     .fadeIn('fast');
                   
                   // tooltip will appear under mouse.  when mouse moves off of tooltip it will disappear.. this allows link to be clickable
                   $('.companyTooltip').hover(function(event) {}, function(event) {
                      $('.companyTooltip').remove(); // called on hoverOut
                   });   
               });
         }     
    
          
         // calls crunchbase API, and builds HTML for the tooltip, placing it into the 
         function LoadCompanyInfo(companyName) {
            var url = lookupUrlPrefix + companyName + '?user_key=' + apiKey;
            $.ajax({ 
               url: url,
               type: 'GET',
               dataType: 'json',
               success: function(data) {
                // Build HTML for modal, or plug values into template 
                var companyObj = ParseCrunchbaseData(data);
                var companyName = companyObj['name'];
                console.log(companyName + ' info finished loading');

                var html = CreateCrunchbaseHTML(companyObj);

                companyTooltipInfo[companyName] = html;
               }
            });
         }
          

function CreateCrunchbaseHTML(companyObj){
  var html = '<center><p class="cb-title-info"><div class="companyImgdiv"><img src=' + companyObj['imageURL'] + '></div></p>'; 
                html += '<p class="cb-title-info"><b><font size="+1">' + companyObj['name'] + '</font></b>' + '&nbsp;&nbsp;&nbsp;&nbsp;<a href="' + companyObj['crunchbaseLink'] + '" target="_blank">(CB)</a>' + '</p>';
                html += '<p class="cb-title-info"><a href="' + companyObj['homepageURL'] + '" target="_blank">' + companyObj['homepageURL'] + '</a></p>';
                html += '<p class="cb-description-text">"' + companyObj['description'] + '"</p></center>';
                html += '<table cellspacing=8>';
                if (companyObj['numberOfEmployees'])
                   html += '<tr><td><b>Employees</b></td><td class="pull-right">' + companyObj['numberOfEmployees'] + '</td></tr>';
                html += '<tr><td><b>Founded On </b></td><td class="pull-right">' + companyObj['foundedOn'] + '</td></tr>';
                html += '<tr><td><b>Funding (USD) </b></td><td class="pull-right">' + companyObj['totalFundingUSD'] + '</td></tr>';
                html += '<tr><td><b>Headquarters </b></td><td class="pull-right"><div class="cb-hq-text"> ' + companyObj['hqLocation'] + '</div></td></tr>';
                html += '<tr><td><b>Categories </b></td><td class="pull-right"> ' + companyObj['categories'] + '</td></tr>';
                html += '</table>';

                return html;
}         


function getText(target) {
    var wordArr = [];
    $('*',target).add(target).each(function(k,v) {
        var words  = $('*',v.cloneNode(true)).remove().end().text().split(/(\s+|\n)/);
        wordArr = wordArr.concat(words.filter(function(n){
          return n.trim()}));
    });
    return wordArr;
}


function ParseCrunchbaseData(data) {
             var c = {};
             
             var properties = data['data']['properties']; 

             try {
             c['name'] = properties['name'];
             } catch(err) {
               c['name'] = '';
             }
             
             try {
             c['description'] =  properties['short_description'];
             } catch(err) {
               c['description'] = '';
             }
             
             try {
             c['homepageURL'] =  properties['homepage_url'];
             } catch(err) {
               c['homepageURL'] = '';
             }
             
             try {
             c['foundedOn'] =  properties['founded_on'];
             } catch(err) {
               c['foundedOn'] = '';
             }
             
             try {
             c['numberOfEmployees'] = properties['number_of_employees'];
             } catch(err) {
               c['numberOfEmployees'] = '';
             }
             
             try {
             if (c['numberOfEmployees']) {
                c['numberOfEmployees'] = c['numberOfEmployees'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
             }
              } catch(err) {
               c['numberOfEmployees'] = '';
             }

             
             try {
             c['totalFundingUSD'] = properties['total_funding_usd'];
             } catch(err) {
               c['totalFundingUSD'] = '';
             }
             
             try {
             if (c['totalFundingUSD']) {
                c['totalFundingUSD'] = c['totalFundingUSD'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
             }
             } catch(err) {
               c['totalFundingUSD'] = '';
             }

             try {
             c['imageURL'] = data['metadata']['image_path_prefix'] + data['data']['relationships']['primary_image']['items'][0]['path'];
             } catch(err) {
               c['imageURL'] = '';
             }

             c['crunchbaseLink'] = data['metadata']['www_path_prefix'] + "organization/" + data['data']['properties']['permalink'];


             try {
               var hq = data['data']['relationships']['headquarters']['items'][0];
             } catch(err) {
              var hq = '';
             }

             try {
             c['hqLocation'] = hq['city'] + ', ' + hq['region'];
             } catch(err) {
               c['hqLocation'] = '';
             }
             
             var categories = data['data']['relationships']['categories']['items'];
             
             c['categories'] = $.map(categories, function (val, i) { return val['name']; }).join(', ');
             
             return c;
         }