$(document).ready(function () {

    // Este slider solo va moviendo las pantallas del tutorial sin meter logica rara.

    let actual = 1;
    let total = 11;

    $(".info").hide();
    $("#id1").show();

    // Aqui cambiamos entre tarjetas y damos vuelta al inicio/final para que no se atore.
    function cambiar(direccion) {

        let siguiente = actual + direccion;

        if (siguiente > total) siguiente = 1;
        if (siguiente < 1) siguiente = total;

        $(".info").stop(true, true);

        $("#id" + actual).fadeOut(200, function () {
            $("#id" + siguiente).fadeIn(300);
        });

        actual = siguiente;
    }

    $("#siguiente").click(function () {
        cambiar(1);
    });

    $("#anterior").click(function () {
        cambiar(-1);
    });

});