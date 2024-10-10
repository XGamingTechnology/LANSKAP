(function() {
  "use strict";

  // Helper functions
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach(e => e.addEventListener(type, listener))
    } else {
      select(el, all).addEventListener(type, listener)
    }
  }

  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  // Sidebar toggle
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function(e) {
      select('body').classList.toggle('toggle-sidebar')
    })
  }

  // Search bar toggle
  if (select('.search-bar-toggle')) {
    on('click', '.search-bar-toggle', function(e) {
      select('.search-bar').classList.toggle('search-bar-show')
    })
  }

  // Navbar links active state on scroll
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  // Toggle .header-scrolled class to #header when page is scrolled
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  // Back to top button
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  // Other Bootstrap-related scripts

  // Peta functionality
  document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi peta dengan basemap OSM sebagai default
    var map = L.map('map').setView([-2.3813569, 107.2213108], 5);

    // Basemap options
    const basemaps = {
        osm: L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(map), // Default
        satellite: L.tileLayer.provider('Esri.WorldImagery'),
        topo: L.tileLayer.provider('OpenTopoMap'),
        imagery: L.tileLayer.provider('Esri.WorldImagery'),
        outdoors: L.tileLayer.provider('Thunderforest.Outdoors')
    };

    // Fungsi untuk mengubah basemap berdasarkan pilihan radio button
    function switchBasemap(basemap) {
        map.eachLayer(layer => {
            if (layer.options && layer.options.attribution) {
                map.removeLayer(layer);
            }
        });
        basemaps[basemap].addTo(map);
    }

    // Event listener untuk radio buttons
    document.querySelectorAll('input[name="basemap"]').forEach(radio => {
        radio.addEventListener('change', function () {
            switchBasemap(this.value);
        });
    });

    var markerLayer, overallMarkerLayer, kecamatanLayer, Lokasi, kabupatenLayer; // Declare variables for layers

    // Fungsi untuk memberi style pada polygon berdasarkan kategori
    function style_data_0_0(feature) {
        switch(String(feature.properties['Kategori'])) {
            case 'Rendah/Tidak banjir':
                return {
                    color: 'yellow',  // Outline color for 'Rendah/Tidak banjir'
                    weight: 1.0, 
                    fill: true,
                    fillOpacity: 0.7,
                    fillColor: 'grey',  // Fill color for 'Rendah/Tidak banjir'
                    interactive: true,
                };
            case 'Sedang':
                return {
                    color: 'grey',  // Outline color for 'Sedang'
                    weight: 1.0, 
                    fill: true,
                    fillOpacity: 0.7,
                    fillColor: 'yellow',  // Fill color for 'Sedang'
                    interactive: true,
                };
            case 'Tinggi':
                return {
                    color: 'yellow',  // Outline color for 'Tinggi'
                    weight: 1.0, 
                    fill: true,
                    fillOpacity: 0.7,
                    fillColor: 'red',  // Fill color for 'Tinggi'
                    interactive: true,
                };
            default:
                return {
                    color: 'yellow',  // Outline color for default case
                    weight: 2.0, 
                    fill: true,
                    fillOpacity: 0.7,
                    fillColor: 'rgba(218,178,35,1.0)',  // Default fill color
                    interactive: true,
                };
        }
    }

    // Fungsi untuk menambahkan pop-up dan label pada setiap fitur
    function onEachFeature(feature, layer) {
        const wadmkk = feature.properties.WADMKK || 'Tidak tersedia';
       

        const popupContent = `
            <style>
                .popup-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .popup-table th, .popup-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .popup-table th {
                    background-color: #f2f2f2;
                }
            </style>
            <table class="popup-table">
                <tr>
                    <th>Nama Kabupaten</th>
                    <td>${wadmkk}</td>
                </tr>
            </table>
        `;

        layer.bindPopup(popupContent);

        // Tambahkan label dengan nama kecamatan
        layer.bindTooltip(feature.properties.WADMKK, {
            permanent: true,
            direction: 'center',
            className: 'polygon-label'
        }).openTooltip();
    }

    // Fungsi untuk membuat marker layer dengan pop-up khusus
    function onEachMarkerFeature(feature, layer) {
        const Wilayah = feature.properties.Wilayah || 'Tidak tersedia';
        const Cakupan= feature.properties.Cakupan|| 'Tidak tersedia';
        const Signifikan = feature.properties.Signifikan|| 'Tidak tersedia';
        const Masalah = feature.properties.LUASAN_GEN ? `${feature.properties.Masalah_Ko} ` : 'Tidak tersedia';
        const Peran = feature.properties.Peran ? `${feature.properties.Peran} ` : 'Tidak tersedia';
        const fotoUrl = feature.properties.FOTO || 'Tidak ada foto';
    
        let popupContent = `
            <style>
                .popup-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .popup-table th, .popup-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .popup-table th {
                    background-color: #f2f2f2;
                }
            </style>
            <table class="popup-table">
                <tr>
                    <th>Nama Lanskap</th>
                    <td>${Wilayah}</td>
                </tr>
                <tr>
                    <th>Luas Are</th>
                    <td>${Cakupan}</td>
                </tr>
                <tr>
                    <th>Signifikan</th>
                    <td>${Signifikan}</td>
                </tr>
                <tr>
                    <th>Masalah</th>
                    <td>${Masalah}</td>
                </tr>
                <tr>
                    <th>Peran Konservasi</th>
                    <td>${Peran}</td> <!-- Gunakan nilai yang sesuai dari GeoJSON -->
                </tr>
                <tr>
                    <th>Foto</th>
                    <td>${fotoUrl !== 'Tidak ada foto' ? `<img src="${fotoUrl}" alt="Foto Genangan" style="width:100px;height:auto;">` : 'Tidak tersedia'}</td>
                </tr>
            </table>
        `;
    
        layer.bindPopup(popupContent);
    }
    
// Memuat data GeoJSON dan menambahkan ke peta
function loadlokasi() {
    fetch('assets/data/kabupaten.geojson')
        .then(response => response.json())
        .then(data => {
            Lokasi = L.geoJSON(data, {
                style: style_data_0_0,
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON data:', error));
}

// Call the function to load the kabupaten layer initially
loadlokasi();
    // Memuat data GeoJSON dan menambahkan ke peta
    function loadKabupatenLayer() {
        fetch('assets/data/data.geojson')
            .then(response => response.json())
            .then(data => {
                kabupatenLayer = L.geoJSON(data, {
                    style: style_data_0_0,
                    onEachFeature: onEachFeature
                }).addTo(map);
            })
            .catch(error => console.error('Error loading the GeoJSON data:', error));
    }

    // Call the function to load the kabupaten layer initially
    loadKabupatenLayer();

    

    // Fungsi untuk menambahkan marker berdasarkan Polygon_id yang dipilih
    function fetchMarkersForPolygon(polygonId) {
        // Hapus marker layer kecamatan sebelumnya jika ada
        if (markerLayer) {
            map.removeLayer(markerLayer);
            markerLayer = null;
        }

        // Muat dan filter marker berdasarkan Polygon_id yang dipilih
        fetch('assets/data/Titik.geojson')
            .then(response => response.json())
            .then(data => {
                const markerData = data.features.filter(feature => feature.properties.Polygon_id === polygonId);

                markerLayer = L.geoJSON(markerData, {
                    pointToLayer: function (feature, latlng) {
                        return L.marker(latlng);
                    },
                    onEachFeature: onEachMarkerFeature
                }).addTo(map);

                if (markerData.length > 0) {
                    const bounds = markerLayer.getBounds();
                    map.fitBounds(bounds);
                }
            })
            .catch(error => console.error('Error loading the marker data:', error));
    }

    // Fungsi untuk menambahkan polygon kecamatan ke peta berdasarkan Polygon_id yang dipilih
    function fetchPolygonForKecamatan(polygonId) {
        // Hapus layer kecamatan sebelumnya jika ada
        if (kecamatanLayer) {
            map.removeLayer(kecamatanLayer);
            kecamatanLayer = null;
        }

        // Muat dan filter polygon berdasarkan Polygon_id yang dipilih
        fetch('assets/data/data.geojson')
            .then(response => response.json())
            .then(data => {
                const kecamatanData = data.features.filter(feature => feature.properties.Polygon_id === polygonId);

                kecamatanLayer = L.geoJSON(kecamatanData, {
                    style: style_data_0_0,
                    onEachFeature: onEachFeature
                }).addTo(map);

                if (kecamatanData.length > 0) {
                    const bounds = kecamatanLayer.getBounds();
                    map.fitBounds(bounds);
                }
            })
            .catch(error => console.error('Error loading the GeoJSON data:', error));
    }

    document.getElementById('layer1').addEventListener('change', function(e) {
        if (this.checked) {
            if (!Lokasi) {
                loadlokasi();
            }
        } else {
            if (Lokasi) {
                map.removeLayer(Lokasi);
                Lokasi = null;
            }
        }
    });

    // Menghubungkan checkbox Layer Kabupaten dengan layer kabupaten
    document.getElementById('layer4').addEventListener('change', function(e) {
        if (this.checked) {
            if (!kabupatenLayer) {
                loadKabupatenLayer();
            }
        } else {
            if (kabupatenLayer) {
                map.removeLayer(kabupatenLayer);
                kabupatenLayer = null;
            }
        }
    });

    // Menghubungkan checkbox Layer Marker dengan marker layer keseluruhan
    document.getElementById('layer2').addEventListener('change', function(e) {
        if (this.checked) {
            fetch('assets/data/Titik.geojson')
                .then(response => response.json())
                .then(data => {
                    overallMarkerLayer = L.geoJSON(data, {
                        pointToLayer: function (feature, latlng) {
                            return L.marker(latlng);
                        },
                        onEachFeature: onEachMarkerFeature
                    }).addTo(map);
                })
                .catch(error => console.error('Error loading the marker data:', error));
        } else {
            if (overallMarkerLayer) {
                map.removeLayer(overallMarkerLayer);
                overallMarkerLayer = null;
            }
        }
    });

    // Fungsi untuk mengisi dropdown dengan kecamatan dan menambahkan event listener
    fetch('assets/data/data.geojson')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('layer1-dropdown');
            const wadmkcList = [...new Set(data.features.map(feature => feature.properties.WADMKC))];

            wadmkcList.forEach(wadmkc => {
                const option = document.createElement('option');
                option.value = wadmkc;
                option.text = wadmkc;
                select.add(option);
            });

            // Event listener untuk dropdown
            select.addEventListener('change', function() {
                const selectedWadmkc = this.value;

                // Filter data berdasarkan kecamatan yang dipilih
                const selectedData = data.features.filter(feature => feature.properties.WADMKC === selectedWadmkc);
                if (selectedData.length > 0) {
                    const polygonId = selectedData[0].properties.Polygon_id;

                    fetchPolygonForKecamatan(polygonId);
                    fetchMarkersForPolygon(polygonId);
                }
            });
        })
        .catch(error => console.error('Error loading the GeoJSON data:', error));
});

})();
