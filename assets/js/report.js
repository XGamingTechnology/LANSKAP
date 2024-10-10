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
  
document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggleBtn = document.querySelector('#dropdown-toggle');
    const dropdownsContainer = document.querySelector('#dropdowns-container');
    const kabupatenDropdown = document.querySelector('#kabupaten-dropdown');
    const kecamatanDropdown = document.querySelector('#kecamatan-dropdown');
    const imageContainer = document.querySelector('#image-container');
    const selectedImage = document.querySelector('#selected-image');
    const dataTableBody = document.querySelector('#data-table tbody');
    const dataTableHead = document.querySelector('#data-table thead'); // Added reference to the table head
    const downloadButton = document.getElementById('download-pdf');

    let kecamatanData = {};
    let geoJsonData = []; // Menyimpan data dari GeoJSON
    let titikGeoJsonData = []; // For storing the data from Titik.geojson

    // Inisialisasi Zooming pada gambar
    const zooming = new Zooming({
        scaleBase: 0.9, // Ukuran skala awal untuk zoom
        scaleExtra: 1.5, // Besar perbesaran zoom
    });
    zooming.listen('#selected-image'); // Aktifkan zooming pada gambar

    // Toggle dropdowns display
    dropdownToggleBtn.addEventListener('click', () => {
        dropdownsContainer.style.display = 
            (dropdownsContainer.style.display === 'none' || dropdownsContainer.style.display === '') ? 'block' : 'none';
        
        // Isi tabel dengan seluruh data kabupaten saat tombol ditekan
        populateKabupatenTable();
    });

    // Fetch JSON data untuk dropdown kabupaten dan kecamatan
    fetch('assets/data/kecamatan.json')
        .then(response => response.json())
        .then(data => {
            // Populate kabupaten dropdown
            for (const kabupaten in data) {
                const option = document.createElement('option');
                option.value = kabupaten;
                option.textContent = kabupaten;
                kabupatenDropdown.appendChild(option);
            }

            // Store kecamatan data for each kabupaten
            kecamatanData = data;
        })
        .catch(error => console.error('Error loading JSON:', error));

    // Fetch GeoJSON data untuk populasi tabel
    fetch('assets/data/Titik.geojson')
        .then(response => response.json())
        .then(data => {
            geoJsonData = data.features;
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    // Fetch Titik GeoJSON data
    fetch('assets/data/Titik.geojson')
        .then(response => response.json())
        .then(data => {
            titikGeoJsonData = data.features;
        })
        .catch(error => console.error('Error loading Titik GeoJSON:', error));

    // Populate kecamatan dropdown based on selected kabupaten
    kabupatenDropdown.addEventListener('change', function() {
        const selectedKabupaten = this.value;
        kecamatanDropdown.innerHTML = '<option value="">Pilih lanskap</option>'; // Reset kecamatan dropdown
    
        if (selectedKabupaten && kecamatanData[selectedKabupaten]) {
            const kabupatenImage = kecamatanData[selectedKabupaten].image;
            
            // Check if the image URL is valid before setting
            fetch(kabupatenImage, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        selectedImage.src = kabupatenImage; // Set kabupaten image
                        selectedImage.onload = () => imageContainer.style.display = 'block';
                    } else {
                        throw new Error('Image not found');
                    }
                })
                .catch(error => {
                    console.error('Error loading kabupaten image:', error);
                    selectedImage.src = ''; // Clear image source
                    imageContainer.style.display = 'none';
                });
    
            const kecamatanOptions = kecamatanData[selectedKabupaten].kecamatan;
            kecamatanOptions.forEach(function(item) {
                const option = document.createElement('option');
                option.value = item.image; // Set image path as value
                option.textContent = item.name;
                kecamatanDropdown.appendChild(option);
            });
    
            // Populate table with data from selected kabupaten
            populateKabupatenTable(selectedKabupaten);
        }
    
        // Reset image container if no kabupaten selected
        if (!selectedKabupaten) {
            selectedImage.src = '';
            imageContainer.style.display = 'none';
            dataTableBody.innerHTML = ''; // Clear table
        }
    });
    

    // Populate table with data from selected kecamatan
    kecamatanDropdown.addEventListener('change', function() {
        const selectedImageSrc = this.value; // This should be the image path
        const selectedKecamatan = this.options[this.selectedIndex].text;
        const selectedKabupaten = kabupatenDropdown.value;

        if (selectedKecamatan) {
            selectedImage.src = selectedImageSrc;
            selectedImage.onload = () => imageContainer.style.display = 'block';
            selectedImage.onerror = () => {
                console.error('Error loading image:', selectedImageSrc);
                imageContainer.style.display = 'none';
            };

            // Change table headers for kecamatan
            updateTableHeadersForKecamatan();

            // Populate table with data from selected kecamatan
            populateKecamatanTable(selectedKabupaten, selectedKecamatan);
        } else {
            resetTableHeaders(); // Reset table headers if no kecamatan selected
            imageContainer.style.display = 'none';
            dataTableBody.innerHTML = '';
        }
    });

        // Function to update table headers for 'Kecamatan'
    function updateTableHeadersForKecamatan() {
        dataTableHead.innerHTML = `
            <tr>
                <th>No</th>
                <th>Nama Lanskap</th>
                <th>Cakupan</th>
                <th>Singinifikan</th>
                <th>Masalah Konservasi</th>
                <th>Peran</th>
            </tr>
        `;
    }

    // Function to populate table with all kabupaten data
    function populateKabupatenTable(selectedKabupaten = '') {
        dataTableBody.innerHTML = ''; // Clear table

        let filteredData = geoJsonData;

        if (selectedKabupaten) {
            filteredData = geoJsonData.filter(feature => feature.properties.Wilayah === selectedKabupaten);
        }

        filteredData.forEach((feature, index) => {
            const wilayah = feature.properties.Wilayah || 'Tidak tersedia'; // Nama Lanskap
            const cakupan = feature.properties.Cakupan || 'Tidak tersedia'; // Cakupan
            const signifikan = feature.properties.Signifikan || 'Tidak tersedia'; // Signifikan
            const masalah = feature.properties.Masalah_Ko || 'Tidak tersedia'; // Masalah Konservasi
            const peran = feature.properties.Peran || 'Tidak tersedia'; // Peran

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${wilayah}</td>
                    <td>${cakupan}</td>
                    <td>${signifikan}</td>
                    <td>${masalah}</td>
                    <td>${peran}</td>
                </tr>
            `;

            dataTableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Function to populate table with data from selected kecamatan
    function populateKecamatanTable(selectedKabupaten, selectedKecamatan) {
        dataTableBody.innerHTML = ''; // Clear table

        // Filter data based on selected kecamatan
        const filteredData = titikGeoJsonData.filter(feature =>
            feature.properties.Wilayah === selectedKabupaten && feature.properties.Wilayah === selectedKecamatan
        );

        if (filteredData.length === 0) {
            // No data found in Titik.geojson, use data from geojson
            const defaultData = titikGeoJsonData.find(feature =>
                feature.properties.Wilayah === selectedKabupaten && feature.properties.Wilayah === selectedKecamatan
            );

            // Display default data if available
            if (defaultData) {
                const wilayah = defaultData.properties.Wilayah || 'Tidak tersedia'; // Nama Lanskap
                const cakupan = defaultData.properties.Cakupan || 'Tidak tersedia'; // Cakupan
                const signifikan = defaultData.properties.Signifikan || 'Tidak tersedia'; // Signifikan
                const masalah = defaultData.properties.Masalah_Ko || 'Tidak tersedia'; // Masalah Konservasi
                const peran = defaultData.properties.Peran || 'Tidak tersedia'; // Peran

                const row = `
                    <tr>
                        <td>1</td>
                        <td>${wilayah}</td>
                        <td>${cakupan}</td>
                        <td>${signifikan}</td>
                        <td>${masalah}</td>
                        <td>${peran}</td>
                    </tr>
                `;
                dataTableBody.insertAdjacentHTML('beforeend', row);
            }
        } else {
            // Populate table with data from Titik.geojson
            filteredData.forEach((feature, index) => {
                const wilayah = feature.properties.Wilayah|| 'Tidak tersedia'; // Nama Lanskap
                const cakupan = feature.properties.Cakupan || 'Tidak tersedia'; // Cakupan
                const signifikan = feature.properties.Signifikan || 'Tidak tersedia'; // Signifikan
                const masalah = feature.properties.Masalah_Ko || 'Tidak tersedia'; // Masalah Konservasi
                const peran = feature.properties.Peran || 'Tidak tersedia'; // Peran

                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${wilayah}</td>
                        <td>${cakupan}</td>
                        <td>${signifikan}</td>
                        <td>${masalah}</td>
                        <td>${peran}</td>
                    </tr>
                `;

                dataTableBody.insertAdjacentHTML('beforeend', row);
            });
        }
    }

    

    // Event listener untuk tombol unduh PDF
    downloadButton.addEventListener('click', function() {
        const imgUrl = selectedImage.src;
        if (imgUrl && selectedImage.complete && selectedImage.naturalWidth !== 0) {
            const { jsPDF } = window.jspdf; // Proper initialization of jsPDF using UMD
            const pdf = new jsPDF();
            const img = new Image();
            img.src = imgUrl;
            img.crossOrigin = 'Anonymous'; // Enable cross-origin request
            img.onload = function() {
                // Menggunakan ukuran gambar asli
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let imgWidth = img.width;
                let imgHeight = img.height;

                // Set canvas size to the original image size
                canvas.width = imgWidth;
                canvas.height = imgHeight;
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

                // Use PNG format without compression to maintain quality
                const compressedImgUrl = canvas.toDataURL('image/png');

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                const x = (pageWidth - imgWidth * ratio) / 2;
                const y = (pageHeight - imgHeight * ratio) / 2;

                pdf.addImage(compressedImgUrl, 'PNG', x, y, imgWidth * ratio, imgHeight * ratio);
                pdf.save('download.pdf');
            };

            img.onerror = function() {
                console.error('Error loading image for PDF:', imgUrl);
                alert('Error loading image. Please try again.');
            };
        } else {
            alert('Gambar belum dimuat sepenuhnya. Silakan tunggu hingga gambar selesai dimuat.');
        }
    });
});

})();
