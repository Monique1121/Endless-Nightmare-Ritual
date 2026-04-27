$(document).ready(function () {
    $(".row").hide();
    $(".row").slideDown("slow");

    fetch('http://127.0.0.1:3000/mangas')
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar mangas');
            return res.json();
        })
        .then(mangas => {
            let html = '';
            mangas.forEach((manga, index) => {
                const num = index + 1;
                html += `
                <div class="row mt-5 mb-5 align-items-center">
                    <div class="col-md-4 linea d-flex align-items-center">
                        <img class="img-fluid rounded d-block mx-auto"
                            src="../assets/${manga.imagen}"
                            alt="${manga.titulo}" width="250"/>
                    </div>
                    <div class="col-md-8">
                        <p class="mangas ms-5 me-5">${manga.titulo}</p>
                        <div id="m${num}" class="info col-md-8 text-white cursor-pointer ms-5 me-5">
                            <h3>Más información 🡣</h3>
                        </div>
                        <p id="id${num}" class="id ms-5 me-5">
                            Año de publicación: ${manga.anio}<br><br>
                            Autor: ${manga.autor}<br><br>
                            Género: ${manga.genero}<br><br>
                            Sinopsis:<br><br>${manga.sinopsis}<br><br>
                        </p>
                    </div>
                </div>`;
            });

            document.getElementById('seccion-mangas').innerHTML = html;

            mangas.forEach((manga, index) => {
                const num = index + 1;
                $(`#id${num}`).hide();
                let contador = 0;

                $(`#m${num}`).click(function () {
                    if (contador == 0) {
                        $(`#id${num}`).slideDown("slow");
                        contador++;
                    } else {
                        $(`#id${num}`).fadeOut();
                        contador = 0;
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('seccion-mangas').innerHTML = 
                '<p class="text-white text-center mt-5">Error al cargar los mangas. Verifica que el servidor esté corriendo.</p>';
        });

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    function cargarMenu(dia, idDiv) {
        fetch(`http://127.0.0.1:3000/menu/${dia}`)
            .then(res => {
                if (!res.ok) throw new Error('Error al cargar menú');
                return res.json();
            })
            .then(items => {
                let html = `Menú del día ${dia}<br><br>`;
                items.forEach(item => {
                    html += `
                        <div class="platillo">
                            ○ ${item.nombre_item}
                            <img class="img-hover" src="../assets/${item.imagen}">
                        </div>
                    `;
                });
                html += `<div class="dias"><br><br><br><br>Ven a disfrutar con tu familia o amigos<br><br></div>`;
                $(`#${idDiv}`).html(html);
            })
            .catch(error => {
                console.error('Error:', error);
                $(`#${idDiv}`).html('<p class="text-white">Error al cargar menú</p>');
            });
    }

    dias.forEach((dia, index) => {
        const idDiv = `id${index + 7}`;
        const idBtn = `m${index + 7}`;

        if ($(`#seccion-menu`).length) {
            $(`#seccion-menu`).append(`<div id="${idDiv}" class="dias"></div>`);
        }

        cargarMenu(dia, idDiv);

        $(`#${idDiv}`).hide();
    });

    $('#m7').click(function() { mostrarDia('id7'); });
    $('#m8').click(function() { mostrarDia('id8'); });
    $('#m9').click(function() { mostrarDia('id9'); });
    $('#m10').click(function() { mostrarDia('id10'); });
    $('#m11').click(function() { mostrarDia('id11'); });
    $('#m12').click(function() { mostrarDia('id12'); });
    $('#m13').click(function() { mostrarDia('id13'); });

    function mostrarDia(id) {
        // Ocultar todos
        for (let i = 7; i <= 13; i++) {
            $(`#id${i}`).fadeOut();
        }
        // Mostrar el seleccionado
        $(`#${id}`).slideDown("slow");
    }
});