// Esta función se encargará de manejar el cambio de vista (Cards o Lista)
function cambiarVista() {
    $('#vistaDropdown .dropdown-item').on('click', function(e) {
        const viewType = $(this).text().toLowerCase();
        console.log(viewType); // Esto es solo para depuración, puedes quitarlo si no es necesario
        if (viewType === 'cards') {
            $('#resultList').hide();
            $('#cardsView').show();
        } else if (viewType === 'lista vertical') {
            $('#cardsView').hide();
            $('#resultList').show();
        }
    });
}

// Evento cuando se envía el formulario
document.getElementById('atomForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const atomInput = document.getElementById('atomInput').value;
    const resultTable = document.getElementById('resultTable');
    const cardsView = document.getElementById('cardsView');

    if (!atomInput.trim()) {
        alert('Por favor, introduce una URL o el contenido XML para procesar.');
        return;
    }

    try {
        let xmlContent;

        // Verificar si el input es una URL o contenido XML
        if (isValidURL(atomInput)) {
            const response = await fetch(atomInput);
            if (!response.ok) {
                throw new Error('No se pudo obtener el XML desde la URL proporcionada.');
            }
            xmlContent = await response.text();
        } else {
            xmlContent = atomInput;
        }

        // Parsear el XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

        // Verificar si hay errores en el XML
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('El XML proporcionado no es válido.');
        }

        // Limpiar la tabla de resultados y las cards
        resultTable.innerHTML = '';
        cardsView.innerHTML = '';

        // Extraer elementos <entry> del XML (ATOM usa 'entry' en lugar de 'item')
        const entries = xmlDoc.querySelectorAll('entry');
        
        // Si no hay elementos entry, buscar elementos item (por si es RSS)
        const items = entries.length > 0 ? entries : xmlDoc.querySelectorAll('item');

        if (items.length === 0) {
            resultTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron noticias en el XML proporcionado.</td></tr>';
            return;
        }

        // Guardar las noticias actuales para poder mostrarlas después
        window.currentNews = [];

        // Procesar y mostrar los resultados
        items.forEach((item, index) => {
            // En ATOM, los elementos principales tienen nombres diferentes que en RSS
            const isAtom = entries.length > 0;
            
            const title = isAtom 
                ? (item.querySelector('title')?.textContent || 'Sin título')
                : (item.querySelector('title')?.textContent || 'Sin título');
                
            const pubDate = isAtom 
                ? (item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent || 'Fecha no disponible')
                : (item.querySelector('pubDate')?.textContent || 'Fecha no disponible');
                
            const link = isAtom 
                ? (item.querySelector('link[rel="alternate"]')?.getAttribute('href') || item.querySelector('link')?.getAttribute('href') || '#')
                : (item.querySelector('link')?.textContent || '#');
            
            // Obtener la imagen (o imagen predeterminada si no existe)
            let image = 'https://via.placeholder.com/150';
            
            // Buscar imagen en varios formatos posibles
            const mediaContent = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content');
            if (mediaContent.length > 0 && mediaContent[0].getAttribute('url')) {
                image = mediaContent[0].getAttribute('url');
            } else if (item.querySelector('enclosure')) {
                image = item.querySelector('enclosure').getAttribute('url');
            } else if (isAtom && item.querySelector('content[type="html"]')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.querySelector('content[type="html"]').textContent;
                const firstImg = tempDiv.querySelector('img');
                if (firstImg && firstImg.src) {
                    image = firstImg.src;
                }
            }

            // Guardar la información actual
            const newsItem = {
                title: title,
                pubDate: pubDate,
                link: link,
                image: image
            };
            
            window.currentNews.push(newsItem);

            // Revisar si es favorito
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const isFavorite = favorites.some(fav => fav.link === link);

            // Mostrar en la tabla
            resultTable.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${title}</td>
                    <td>${pubDate}</td>
                    <td><a href="${link}" target="_blank">Leer más</a></td>
                </tr>
            `;

            // Mostrar como card
            cardsView.innerHTML += `
                <div class="col-md-4">
                    <div class="card mb-4">
                        <img src="${image}" class="card-img-top" alt="${title}">
                        <div class="card-body">
                            <h5 class="card-title">${title}</h5>
                            <p class="card-text">${pubDate}</p>
                            <a href="${link}" target="_blank" class="btn btn-primary">Leer más</a>
                            <button class="btn btn-warning ms-2 favorite-btn" data-index="${index}">
                                ${isFavorite ? '❤️' : '⭐'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Agregar eventos a los botones de favoritos
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                toggleFavorite(window.currentNews[index]);
                this.innerHTML = isFavorite(window.currentNews[index].link) ? '❤️' : '⭐';
            });
        });

    } catch (error) {
        console.error('Error procesando el XML:', error);
        alert('Hubo un error procesando el XML. Por favor, verifica la entrada e inténtalo de nuevo.');
    }
});

// Función para validar si el input es una URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Detectar el cambio en el interruptor de Modo Oscuro
document.getElementById('darkModeToggle').addEventListener('change', function(e) {
    const isDarkMode = e.target.checked; // Detecta si el interruptor está activado
    if (isDarkMode) {
        document.body.classList.add('dark-mode'); // Añade la clase de Modo Oscuro
    } else {
        document.body.classList.remove('dark-mode'); // Quita la clase de Modo Oscuro
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', isDarkMode);
});

// Cargar preferencia de modo oscuro al iniciar
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.getElementById('darkModeToggle').checked = darkMode;
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}

// Función para verificar si un elemento es favorito
function isFavorite(link) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(fav => fav.link === link);
}

// Función para guardar/eliminar favorito en localStorage
function toggleFavorite(itemData) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    const index = favorites.findIndex(fav => fav.link === itemData.link);
    if (index === -1) {
        // Si no está en favoritos, lo agregamos
        favorites.push(itemData);
    } else {
        // Si ya está en favoritos, lo eliminamos
        favorites.splice(index, 1);
    }

    // Guardamos los favoritos actualizados en localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Refrescar la vista si estamos en modo favoritos
    if (window.currentView === 'favorites') {
        displayFavorites();
    }
}

// Variable para rastrear la vista actual
window.currentView = 'all';

document.getElementById('showFavorites').addEventListener('click', function(e) {
    e.preventDefault();
    window.currentView = 'favorites';
    displayFavorites(); // Mostrar solo favoritos
});

document.getElementById('showAll').addEventListener('click', function(e) {
    e.preventDefault();
    window.currentView = 'all';
    displayAllNews(); // Mostrar todas las noticias
});

// Función para mostrar solo los favoritos
function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const resultTable = document.getElementById('resultTable');
    const cardsView = document.getElementById('cardsView');
    
    if (favorites.length === 0) {
        alert("No hay noticias favoritas");
        return;
    }

    // Limpiar las vistas
    cardsView.innerHTML = '';
    resultTable.innerHTML = '';

    // Mostrar solo las noticias favoritas en ambas vistas
    favorites.forEach((fav, index) => {
        // Tabla
        resultTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${fav.title}</td>
                <td>${fav.pubDate}</td>
                <td><a href="${fav.link}" target="_blank">Leer más</a></td>
            </tr>
        `;
        
        // Cards
        cardsView.innerHTML += `
            <div class="col-md-4">
                <div class="card mb-4">
                    <img src="${fav.image || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${fav.title}">
                    <div class="card-body">
                        <h5 class="card-title">${fav.title}</h5>
                        <p class="card-text">${fav.pubDate}</p>
                        <a href="${fav.link}" target="_blank" class="btn btn-primary">Leer más</a>
                        <button class="btn btn-warning ms-2 favorite-btn-fav" data-index="${index}">
                            ❤️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Agregar eventos a los botones de favoritos
    document.querySelectorAll('.favorite-btn-fav').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            toggleFavorite(favorites[index]);
            displayFavorites(); // Actualizar la vista
        });
    });
}

// Función para mostrar todas las noticias
function displayAllNews() {
    if (!window.currentNews || window.currentNews.length === 0) {
        // Si no hay noticias cargadas, no hacer nada
        return;
    }
    
    const resultTable = document.getElementById('resultTable');
    const cardsView = document.getElementById('cardsView');
    
    // Limpiar las vistas
    cardsView.innerHTML = '';
    resultTable.innerHTML = '';
    
    // Mostrar todas las noticias
    window.currentNews.forEach((news, index) => {
        const isFav = isFavorite(news.link);
        
        // Tabla
        resultTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${news.title}</td>
                <td>${news.pubDate}</td>
                <td><a href="${news.link}" target="_blank">Leer más</a></td>
            </tr>
        `;
        
        // Cards
        cardsView.innerHTML += `
            <div class="col-md-4">
                <div class="card mb-4">
                    <img src="${news.image}" class="card-img-top" alt="${news.title}">
                    <div class="card-body">
                        <h5 class="card-title">${news.title}</h5>
                        <p class="card-text">${news.pubDate}</p>
                        <a href="${news.link}" target="_blank" class="btn btn-primary">Leer más</a>
                        <button class="btn btn-warning ms-2 favorite-btn-all" data-index="${index}">
                            ${isFav ? '❤️' : '⭐'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Agregar eventos a los botones de favoritos
    document.querySelectorAll('.favorite-btn-all').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            toggleFavorite(window.currentNews[index]);
            this.innerHTML = isFavorite(window.currentNews[index].link) ? '❤️' : '⭐';
        });
    });
}

// Llamamos a las funciones de inicialización cuando el documento esté listo
$(document).ready(function() {
    cambiarVista(); // Inicializar cambio de vistas
    loadDarkModePreference(); // Cargar preferencia de modo oscuro
    
    // Verificar si hay un hash en la URL para mostrar directamente los favoritos
    if (window.location.hash === '#favorites') {
        window.currentView = 'favorites';
        displayFavorites();
    }
});