<template>
    <div class="container">
      <section class="ui two column centered grid" style="position: relative; z-index: 1">
        <div class="column">
          <form class="ui segment large form">
            <div class="ui message red" v-show="error">{{ error }}</div>
            <div class="ui segment">
              <div class="field">
                <div class="ui right icon input large" :class="{ loading: spinner }">
                  <input
                    type="text"
                    placeholder="Enter your address"
                    v-model="address"
                    ref="autocomplete"
                  />
                  <i class="dot circle link icon" @click="locatorButtonPressed"></i>
                </div>
                <div class="suggestions" v-if="suggestions.length > 0">
                  <div
                    class="suggestion"
                    v-for="(suggestion, index) in suggestions"
                    :key="index"
                    @click="selectSuggestion(suggestion)"
                  >
                    {{ suggestion.description }}
                  </div>
                </div>
              </div>
              <button class="ui button" @click.prevent="goButtonPressed">Go</button>
            </div>
          </form>
        </div>
      </section>
  
      <div id="map-container">
        <section id="map" ref="map"></section>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        address: "",
        error: "",
        spinner: false,
        suggestions: [],
        map: null,
        marker: null,
        google: null,
      };
    },
  
    mounted() {
      this.initGoogleMaps();
    },
  
    methods: {
      initGoogleMaps() {
        const googleMapsScript = document.createElement("script");
        googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        googleMapsScript.async = true;
  
        window.initGoogleMapsCallback = () => {
          this.google = window.google;
          this.initAutocomplete();
        };
  
        googleMapsScript.addEventListener("load", () => {
          window.initGoogleMapsCallback();
        });
  
        document.head.appendChild(googleMapsScript);
      },
  
      initAutocomplete() {
        const autocomplete = new this.google.maps.places.Autocomplete(
          this.$refs["autocomplete"],
          {
            bounds: new this.google.maps.LatLngBounds(
              new this.google.maps.LatLng(45.4215296, -75.6971931)
            ),
          }
        );
  
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
  
          if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
          }
  
          this.address = place.formatted_address;
          this.showLocationOnTheMap(place.geometry.location.lat(), place.geometry.location.lng());
        });
  
        autocomplete.addListener("place_changed", () => {
          this.suggestions = [];
        });
      },
  
      locatorButtonPressed() {
        this.spinner = true;
  
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.getAddressFrom(position.coords.latitude, position.coords.longitude);
              this.showLocationOnTheMap(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              this.error = "Locator is unable to find your address. Please type your address manually.";
              this.spinner = false;
              console.log(error.message);
            }
          );
        } else {
          this.error = "Your browser does not support geolocation API";
          this.spinner = false;
          console.log("Your browser does not support geolocation API ");
        }
      },
  
      getAddressFrom(lat, long) {
        axios
          .get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}`
          )
          .then((response) => {
            if (response.data.error_message) {
              this.error = response.data.error_message;
              console.log(response.data.error_message);
            } else {
              this.address = response.data.results[0].formatted_address;
            }
            this.spinner = false;
          })
          .catch((error) => {
            this.error = error.message;
            this.spinner = false;
            console.log(error.message);
          });
      },
  
      showLocationOnTheMap(latitude, longitude) {
        if (!this.map) {
          this.map = new this.google.maps.Map(this.$refs["map"], {
            zoom: 15,
            center: new this.google.maps.LatLng(latitude, longitude),
            mapTypeId: this.google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            zoomControl: true,
          });
        } else {
          this.map.setCenter(new this.google.maps.LatLng(latitude, longitude));
        }
  
        if (this.marker) {
          this.marker.setMap(null);
        }
  
        this.marker = new this.google.maps.Marker({
          position: new this.google.maps.LatLng(latitude, longitude),
          map: this.map,
        });
      },
  
      goButtonPressed() {
        if (this.address) {
          const geocoder = new this.google.maps.Geocoder();
          geocoder.geocode({ address: this.address }, (results, status) => {
            if (status === "OK") {
              this.showLocationOnTheMap(results[0].geometry.location.lat(), results[0].geometry.location.lng());
            } else {
              console.log("Geocode was not successful for the following reason: " + status);
            }
          });
        }
      },
  
      selectSuggestion(suggestion) {
        this.address = suggestion.description;
        this.suggestions = [];
  
        // Geocode the selected suggestion to get the latitude and longitude
        const geocoder = new this.google.maps.Geocoder();
        geocoder.geocode({ address: suggestion.description }, (results, status) => {
          if (status === 'OK') {
            const latitude = results[0].geometry.location.lat();
            const longitude = results[0].geometry.location.lng();
            this.showLocationOnTheMap(latitude, longitude);
          } else {
            console.log('Geocode was not successful for the following reason: ' + status);
          }
        });
      },
    },
  
    watch: {
      address(newValue) {
        if (newValue && this.google) {
          const autocomplete = new this.google.maps.places.Autocomplete(
            this.$refs["autocomplete"],
            {
              bounds: new this.google.maps.LatLngBounds(
                new this.google.maps.LatLng(45.4215296, -75.6971931)
              ),
            }
          );
  
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            this.suggestions = place.address_components
              ? place.address_components.map((component) => component.long_name).join(", ")
              : "";
          });
        } else {
          this.suggestions = [];
        }
      },
    },
  };
  </script>
  
  <style>
  .ui.button,
  .dot.circle.icon {
    background-color: #ff5a5f;
    color: white;
  }
  
  .pac-icon {
    display: none;
  }
  
  .suggestions {
    position: absolute;
    background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion {
  padding: 10px;
  cursor: pointer;
}

.suggestion:hover {
  background-color: #f5f5f5;
}

#map-container {
  position: relative;
  height: 500px;
  width: 100%;
  margin-top: 20px;
}

#map {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>

  