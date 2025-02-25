// Esta función se encargará de manejar el cambio de vista (Cards o Lista)
function cambiarVista() {
    $('#vistaDropdown .dropdown-item').on('click', function(e) {
        const viewType = $(this).text().toLowerCase();
        console.log(viewType); // Esto es solo para depuración, puedes quitarlo si no es necesario
        if (viewType === 'cards') {
            $('#resultTable').hide();
            $('#cardsView').show();
        } else if (viewType === 'lista vertical') {
            $('#cardsView').hide();
            $('#resultTable').show();
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

        // Extraer elementos <item> del XML
        const items = xmlDoc.querySelectorAll('item');

        if (items.length === 0) {
            resultTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron noticias en el XML proporcionado.</td></tr>';
            return;
        }

        // Procesar y mostrar los resultados en la tabla
        // Modificar el código dentro de forEach cuando mostramos las noticias en cards
    items.forEach((item, index) => {
    const title = item.querySelector('title')?.textContent || 'Sin título';
    const pubDate = item.querySelector('pubDate')?.textContent || 'Fecha no disponible';
    const link = item.querySelector('link')?.textContent || '#';
    
    // Obtener la imagen (o imagen predeterminada si no existe)
    const mediaContent = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content');
    const image = mediaContent[0]?.getAttribute('url') || 'https://via.placeholder.com/150';

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
                    <button class="btn btn-warning ms-2" onclick="toggleFavorite({title: '${title}', pubDate: '${pubDate}', link: '${link}'})">
                        ${isFavorite ? '❤️' : '⭐'}
                    </button>
                </div>
            </div>
        </div>
    `;
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
});

// Llamamos a la función `cambiarVista` para inicializar la lógica cuando el documento esté listo
$(document).ready(function() {
    cambiarVista(); // Ejecutamos la función para habilitar el cambio de vistas
});



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
}


document.getElementById('showFavorites').addEventListener('click', function() {
    displayFavorites(); // Mostrar solo favoritos
});

document.getElementById('showAll').addEventListener('click', function() {
    displayAllNews(); // Mostrar todas las noticias
});

// Función para mostrar solo los favoritos
function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.length === 0) {
        alert("No hay noticias favoritas");
        return;
    }

    // Limpiar las vistas
    cardsView.innerHTML = '';
    resultTable.innerHTML = '';

    // Mostrar solo las noticias favoritas en la vista
    favorites.forEach((fav, index) => {
        // Similar a cómo generas las cards y filas, solo para los favoritos
        console.log(fav);
        cardsView.innerHTML += `
            <div class="col-md-4">
                <div class="card mb-4">
                    <img src="${fav.image || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${fav.title}">
                    <div class="card-body">
                        <h5 class="card-title">${fav.title}</h5>
                        <p class="card-text">${fav.pubDate}</p>
                        <a href="${fav.link}" target="_blank" class="btn btn-primary">Leer más</a>
                        <button class="btn btn-warning ms-2" onclick="toggleFavorite({title: '${fav.title}', pubDate: '${fav.pubDate}', link: '${fav.link}'})">
                            ❤️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Función para mostrar todas las noticias
function displayAllNews() {
    // Aquí llamas al código que muestra todas las noticias como ya lo tienes
}


