var config = {
    client_id: 'HVTT3D12GCM3FF1QJBBBBWRVNS2VSOTR35WYBNXSSBBOXBHB',
    client_secret: 'ZJ5X5EEWZ0ZCGDEMXZKJS0ROWYHDX4H2KINT5OKWCGLOUBMA',
    apiKey: 'AIzaSyD8tzpj54ynjNrwKLW0C1bzVaaHrcuG37g',
    version: '20170101',
    places_url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?',
    apiUrl: 'https://api.foursquare.com/'
};

var infoWindow = false;
var markers = [];
var map;

/**
 * @description Initialize the map and loads the data. Called when the Google Maps API has successfully loaded.
 */
function initMap() {
    // Display a map on the page
    map = new google.maps.Map(document.getElementById("map"));
    infoWindow = new google.maps.InfoWindow();
    if (localStorage.getItem('foursquareData')) {
      console.log("Used localStorage");
      loadWithLocalStorage();
    }else {
      console.log("Used API");
      loadDataWithFourSquare();
    }
}

/**
 * @description Populates the markers array and set markers on the map
 */
function loadData(data) {
  var bounds = new google.maps.LatLngBounds();
  var venues = data.response.groups[0].items;
  console.log(venues);
  for (var i = 0; i < venues.length; i++) {
      var newVenue = venues[i].venue;
      var id = newVenue.id;
      var latitude = newVenue.location.lat;
      var longitude = newVenue.location.lng;
      var name = newVenue.name;

      var position = new google.maps.LatLng(latitude, longitude);
      bounds.extend(position);
      var marker = new google.maps.Marker({
          position: position,
          map: map,
          title: name,
          animation: google.maps.Animation.DROP,
          foursquareId: id
      });

      //Set click listener on each marker
      google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
              vm.toggleBounce(marker);
              setMarkerInfo(marker.foursquareId);
              vm.openInfoWindow(marker);
          }
      })(marker, i));

      markers.push(marker);

      // Automatically center the map fitting all markers_data on the screen
      map.fitBounds(bounds);
  }
  localStorage.setItem('foursquareData', JSON.stringify(data));
  vm.loadMarkers();
}

/**
 * @description Retrieves data from localStorage.
 */
function loadWithLocalStorage(){
  var data = JSON.parse(localStorage.getItem('foursquareData'));
  loadData(data);
}


/**
 * @description Retrieves data from foursquare API.
 */
function loadDataWithFourSquare() {
    $.ajax({
        url: config.apiUrl + 'v2/venues/explore' + '?v=' + config.version + '&client_id=' + config.client_id + '&client_secret=' + config.client_secret + '&ll=40.720610,-73.935242' + '&limit=15&radius=1000',
        dataType: 'json',
        success: function(data) {
            loadData(data);
        }
    }).fail(function() {
        window.alert("Failed to load venues. Refresh the page or check your internet connection.");
    });
}

/**
 * @description Retrieves data from foursquare API for the selected location
 * @param {string} foursquareId - id used to retrieve data from the foursquare API
 */
function setMarkerInfo(foursquareId) {
    infoWindow.setContent("Loading Data...");
    $.ajax({
        url: config.apiUrl + 'v2/venues/' + foursquareId + '?v=' + config.version + '&client_id=' + config.client_id + '&client_secret=' + config.client_secret,
        dataType: 'json',
        success: function(data) {
            console.log(data.response);
            var img_prefix = data.response.venue.bestPhoto.prefix;
            var dimension = '80x80';
            var img_suffix = data.response.venue.bestPhoto.suffix;
            var img_link = img_prefix + dimension + img_suffix;
            var img = '<img class="img-responsive img-circle" src="' + img_link + '">';
            var title = '<h2>' + data.response.venue.name + '</h2>';
            var address = '<cite>' + data.response.venue.location.address + ', ' + data.response.venue.location.city + ', '+ data.response.venue.location.state + ', ' +data.response.venue.location.postalCode + '</cite>';
            var newInfowindowHTML = infowindowHTML;

            newInfowindowHTML = newInfowindowHTML.replace('{{title}}', title);
            newInfowindowHTML = newInfowindowHTML.replace('{{img}}', img);
            newInfowindowHTML = newInfowindowHTML.replace('{{address}}', address);

            infoWindow.setContent(newInfowindowHTML);

            // infoWindow.setContent('<img class="img-responsive img-circle center-element" src="' + img_link + '">' +
            //     '<h2 class="center-elements">' + data.response.venue.name + '</h2>');
        }
    }).fail(function() {
        infoWindow.setContent("Can't retrieve location's data.");
    });
}

//HTML for the infoWindow content
var infowindowHTML = `
  <div class="infoWindow">
    <div class="infoWindow-image">
        {{img}}
    </div>
    <div class="infoWindow-body">
      <div class="infoWindow-title">
        {{title}}
      </div>
      <div class="infoWindow-content">
        {{address}}
      </div>
    </div>
  </div>
`;

/**
 * @description User selected location
 * @constructor
 * @param {google.maps.Marker} data - Marker loaded from markers array
 */
var Location = function(data) {
    this.marker = data;
    this.id = ko.observable(data.foursquareId);
    this.position = ko.observable(data.position);
    this.title = ko.observable(data.title);
    this.favorite = ko.observable(false);
};

var ViewModel = function() {
    var self = this;

    this.mapVisible = ko.observable(false);

    this.showSidebar = ko.observable(false);

    this.locations = ko.observableArray([]);

    this.currentLocation = ko.observable(null);

    //filter for the filteredList
    this.filterLocations = ko.observable("");

    /**
     * @description Called when loadDataWithFourSquare is successful. Initialize self.locations.
     */
    this.loadMarkers = function() {
        markers.forEach(function(location_data) {
            self.locations.push(new Location(location_data));
        });
        self.mapVisible(true);
        self.currentLocation(self.locations()[0]);
    };

    /**
     * @description filters the self.locations array
     * @returns {array} Returns self.locations() if a filter is not applied or the filtered observableArray
     */
    this.filteredList = ko.computed(function() {
        var filter = self.filterLocations().toLowerCase();
        if (!filter) {
            self.locations().forEach(function(location) {
                location.marker.setVisible(true);
            });
            return self.locations();
        } else {
            self.filterMarkers(filter);
            return ko.utils.arrayFilter(self.locations(), function(location) {
                return stringStartsWith(location.title().toLowerCase(), filter);
            });
        }
    }, self);

    /**
     * @description Set current location, calls animation function and opens the infoWindow while closing the sidebar
     * @param {Location} location - clicked location
     */
    this.setCurrentLocation = function(location) {
        self.currentLocation(location);
        var marker = location.marker;
        self.toggleBounce(marker);
        setMarkerInfo(location.id());
        self.toggleSidebar();
        self.openInfoWindow(marker);
        self.filterLocations("");
    };

    /**
     * @description Opens the infowindow
     * @param {goggle.maps.Marker} marker - currently selected marker
     */
    this.openInfoWindow = function(marker) {
        if (infoWindow) {
            infoWindow.close();
        }
        infoWindow.open(map, marker);
        map.setCenter({
            lat: marker.position.lat(),
            lng: marker.position.lng()
        });
    };

    /**
     * @description toggles animation for markers
     * @param {goggle.maps.Marker} marker - currently selected marker
     */
    this.toggleBounce = function(marker) {
        markers.forEach(function(marker) {
            marker.setAnimation(null);
        });

        marker.setAnimation(google.maps.Animation.BOUNCE);
    };

    /**
     * @description filters the markers and sets them as visible or not accordingly.
     * @param {string} filter - filter applied by the user
     */
    this.filterMarkers = function(filter) {
        ko.utils.arrayFilter(self.locations(), function(location) {
            if (stringStartsWith(location.title().toLowerCase(), filter)) {
                location.marker.setVisible(true);
            } else {
                location.marker.setVisible(false);
            }
        });

    };

    /**
     * @description Toggles the sidebar
     */
    this.toggleSidebar = function() {
        if (self.showSidebar() === false) {
            self.showSidebar(true);
        } else {
            self.showSidebar(false);
        }
    };

    /**
     * @description Used in filtering the observableArray. Returns those locations that start with the string provided
     * @param {string} string - location.title()
     * @param {string} startsWith - filter applied by the user
     * @returns {boolean} True if the string starts with startsWith
     */
    var stringStartsWith = function(string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };
};


var vm = new ViewModel();
ko.applyBindings(vm);
