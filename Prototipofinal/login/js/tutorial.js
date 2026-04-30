$(document).ready(function () {

    let actual = 1;
    let total = 13;

    $(".info").hide();
    $("#id1").show();

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