var config = {
    client_id: 'HVTT3D12GCM3FF1QJBBBBWRVNS2VSOTR35WYBNXSSBBOXBHB',
    client_secret: 'ZJ5X5EEWZ0ZCGDEMXZKJS0ROWYHDX4H2KINT5OKWCGLOUBMA',
    version: '20170101',
    apiUrl: 'https://api.foursquare.com/'
};

var markers_data = [{
        position: {
            lat: -25.363,
            lng: 131.044
        },
        title: "MA*GA - Museo dell'Arte",
        foursquareId: "4bdc1b28c79cc928773985e9",
    },
    {
        position: {
            lat: -24.363,
            lng: 131.044
        },
        title: "Wen",
        foursquareId: "4d1f7e15f7a9a143a690249f"
    },
    {
        position: {
            lat: -23.363,
            lng: 131.044
        },
        title: "L'Osteria Dei Mercanti",
        foursquareId: "4d39866981258cfa2ede9b5f"
    },
    {
        position: {
            lat: -26.363,
            lng: 131.044
        },
        title: "Il Ragazzo di Campagna",
        foursquareId: "4e0a1ce7d1640223a4af4e64"
    },
    {
        position: {
            lat: -28.363,
            lng: 131.044
        },
        title: "Pasticceria Bianchi Giovanni",
        foursquareId: "4c0f3fbb75f99c74179decc4"
    },
];

var infoWindow = false;
var markers = [];
var map;

function initMap() {
    var bounds = new google.maps.LatLngBounds();
    // Display a map on the page
    map = new google.maps.Map(document.getElementById("map"));
    infoWindow = new google.maps.InfoWindow();

    // Loop through our array of markers_data & place each one on the map
    for (i = 0; i < markers_data.length; i++) {
        var position = new google.maps.LatLng(markers_data[i].position.lat, markers_data[i].position.lng);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: markers_data[i].title,
            animation: google.maps.Animation.DROP,
            foursquareId: markers_data[i].foursquareId
        });


        // Allow each marker to have an info window
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                toggleBounce(marker);
                setMarkerInfo(marker.foursquareId)
                openInfoWindow(marker);
            }
        })(marker, i));

        markers.push(marker);

        // Automatically center the map fitting all markers_data on the screen
        map.fitBounds(bounds);
    }
    vm.loadMarkers();
}

function toggleBounce(marker){
  markers.forEach(function(marker){
    marker.setAnimation(null);
  });

  marker.setAnimation(google.maps.Animation.BOUNCE);
}

function openInfoWindow(marker) {
    if (infoWindow) {
        infoWindow.close();
    }
    infoWindow.open(map, marker);
    map.setCenter({
        lat: marker.position.lat(),
        lng: marker.position.lng()
    });
}

var Location = function(data) {
    this.marker = data;
    this.id = ko.observable(data.foursquareId);
    this.position = ko.observable(data.position);
    this.title = ko.observable(data.title);
}

var ViewModel = function() {
    var self = this;
    var stringStartsWith = function(string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };

    this.showSidebar = ko.observable(false);

    this.locations = ko.observableArray([]);

    this.currentLocation = ko.observable(null);

    this.loadMarkers = function() {
        markers.forEach(function(location_data) {
            self.locations.push(new Location(location_data));
        });
        self.currentLocation(self.locations()[0]);
    }

    this.filterLocations = ko.observable("");

    this.filteredList = ko.computed(function() {
        var filter = self.filterLocations().toLowerCase();
        if (!filter) {
            self.locations().forEach(function(location) {
                location.marker.setVisible(true);
            });
            //self.filterMarkers(filter);
            return self.locations();
        } else {
            self.filterMarkers(filter);
            return ko.utils.arrayFilter(self.locations(), function(location) {
                return stringStartsWith(location.title().toLowerCase(), filter);
            });
        }
    }, self);

    this.filterMarkers = function(filter) {
        ko.utils.arrayFilter(self.locations(), function(location) {
            if (stringStartsWith(location.title().toLowerCase(), filter)) {
                location.marker.setVisible(true);
            } else {
                location.marker.setVisible(false);
            }
        });

    }

    this.setCurrentLocation = function(location) {
        self.currentLocation(location);
        var marker = location.marker;
        toggleBounce(location.marker);
        setMarkerInfo(location.id());
        openInfoWindow(marker);
    }

    this.toggleSidebar = function(){
      if (self.showSidebar() === false) {
        self.showSidebar(true);
      }else {
        self.showSidebar(false);
      }
    }
}

function setMarkerInfo(foursquareId) {
    infoWindow.setContent("Loading Data...")
    $.ajax({
        url: config.apiUrl + 'v2/venues/' + foursquareId + '?v=' + config.version + '&client_id=' + config.client_id + '&client_secret=' + config.client_secret,
        dataType: 'json',
        success: function(data) {
            console.log(data.response);
            var img_prefix = data.response.venue.bestPhoto.prefix;
            var dimension = '100x100'
            var img_suffix = data.response.venue.bestPhoto.suffix;
            var img_link = img_prefix + dimension + img_suffix;
            /*infoWindow.setContent('<div class="container">' +
                                  '<div class="row">' +
                                  '<div class="col-xs-12>"' +
                                  '<img class="img-responsive img-circle" src="'+ img_link +'">' +
                                  '</div>' +
                                  '<div class="col-xs-12>"' +
                                  '<h2 class="text-center">' + data.response.venue.name + '</h2>' +
                                  '</div>' +
                                  '</div>' +
                                  '</div>');*/
            infoWindow.setContent('<img class="img-responsive img-circle center-element" src="' + img_link + '">' +
                '<h2 class="center-elements">' + data.response.venue.name + '</h2>');
        }
    }).fail(function() {
        infoWindow.setContent("Can't retrieve location's data.")
    })
}

var vm = new ViewModel();
ko.applyBindings(vm);
