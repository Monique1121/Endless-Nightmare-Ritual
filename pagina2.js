$(document).ready(function () {
    $(".row").hide();
    $(".row").slideDown("slow");
    $("#marid").hide();
    $("#marid2").hide();
    $("#marid3").hide();
    $("#opcion4").hide();
    $("#marid4").hide();
    
    let control = 0;
    $("#opcion1").click(function () {
        if (control == 0) {
            $("#marid").slideDown("slow");
            control++;
        }

        else {
            $("#marid").fadeOut();
            control = 0;
        }

    });

    $("#opcion2").click(function () {
        if (control == 0) {
            $("#marid2").slideDown("slow");
            control++;
        }

        else {
            $("#marid2").fadeOut();
            control = 0;
        }

    });

    $("#opcion3").click(function () {
        if (control == 0) {
            $("#marid3").slideDown("slow");
            control++;
        }

        else {
            $("#marid3").fadeOut();
            control = 0;
        }

    });


});
