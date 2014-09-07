$(document).ready(function() {
             SetupChromeExtension();
             console.log("INITIATED");
         });

var companyTooltipInfo = {};

var apiKey = 'a554e04effee9e09ee61679a344041c2';
var lookupUrlPrefix = 'http://api.crunchbase.com/v/2/organization/';
          
         function SetupChromeExtension() {
            console.log('started setup');
              // Load company info for company names on page from Crunchbase 
            for (i = 0; i < 100; i++) { 
              console.log('looping');
               company = companyNames[i];
               var foundin = $('p:contains(' + company + ')');
               /*if (foundin.length) {

                  var replaced = $("body").html()
                     .replace(new RegExp(company, 'g'), '<span class="CompanyExt" CompanyName="' + company + '"><u>' + company + '</u></span>');
                  $("body").html(replaced);
                  LoadCompanyInfo(company);
               }
               */
               foundin.each(function(index, value){
                console.log(value);
                  var replaced = $(value).html()
                       .replace(new RegExp(company, 'g'), '<span class="CompanyExt" CompanyName="' + company + '"><u>' + company + '</u></span>');
                  $(value).html(replaced);
                  LoadCompanyInfo(company);
               });
            }

            console.log('finished looping');

            // Load tooltip with company info for each company
            $('.CompanyExt').hover(
               function(event) {
                  console.log('hovering');
                  $('.companyTooltip').remove(); 
                  var companyName = $(this).attr('CompanyName');
                  $('<span class="companyTooltip"></span>').html(companyTooltipInfo[companyName])
                     .appendTo('body')
                     .css('top', (event.pageY-10) + 'px')
                     .css('left', (event.pageX-30) + 'px')
                     .fadeIn('fast');
                   
                   // tooltip will appear under mouse.  when mouse moves off of tooltip it will disappear.. this allows link to be clickable
                   $('.companyTooltip').hover(function(event) {console.log('hovering 2');}, function(event) {
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

                var html = '<center><p><div class="companyImgdiv"><img src=' + companyObj['imageURL'] + '></div></p>'; 
                html += '<p><b><font size="+1">' + companyName + '</font></b></p>';
                html += '<p><a href="' + companyObj['homepageURL'] + '">' + companyObj['homepageURL'] + '</a></p>';
                html += '<p>"' + companyObj['description'] + '"</p></center>';
                html += '<table cellspacing=8>';
                if (companyObj['numberOfEmployees'])
                   html += '<tr><td width=100><p><b>Employees</b></p></td><td>' + companyObj['numberOfEmployees'] + '</td></tr>';
                html += '<tr><td><b>Founded On </b></td><td>' + companyObj['foundedOn'] + '</td></tr>';
                html += '<tr><td><b>Funding (USD) </b></td><td>' + companyObj['totalFundingUSD'] + '</td></tr>';
                html += '<tr><td><b>Headquarters </b></td><td> ' + companyObj['hqLocation'] + '</td></tr>';
                html += '<tr><td><b>Categories </b></td><td> ' + companyObj['categories'] + '</td></tr>';
                html += '</table>';

                companyTooltipInfo[companyName] = html;
               }
            });
         }
          
         function ParseCrunchbaseData(data) {
             var c = {};
             
             var properties = data['data']['properties']; 

             c['name'] = properties['name'];
             c['description'] =  properties['short_description'];
             c['homepageURL'] =  properties['homepage_url'];
             c['foundedOn'] =  properties['founded_on'];
             c['numberOfEmployees'] = properties['number_of_employees'];
             if (c['numberOfEmployees']) {
                c['numberOfEmployees'] = c['numberOfEmployees'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
             }
             c['totalFundingUSD'] = properties['total_funding_usd'];
             if (c['totalFundingUSD']) {
                c['totalFundingUSD'] = c['totalFundingUSD'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
             }
             c['imageURL'] = data['metadata']['image_path_prefix'] + data['data']['relationships']['primary_image']['items'][0]['path'];
             var hq = data['data']['relationships']['headquarters']['items'][0];
             c['hqLocation'] = hq['city'] + ', ' + hq['region'];
             var categories = data['data']['relationships']['categories']['items'];
             c['categories'] = $.map(categories, function (val, i) { return val['name']; }).join(', ');
             
             return c;
         }
