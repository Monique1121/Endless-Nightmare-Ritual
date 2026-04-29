$(document).ready(function () {

    $("#id1, #id2, #id3, #id4").hide();

    let actual = 1;
    let total = 2;

    $("#id1").show();

    $("#siguiente").click(function () {

        $("#id" + actual).fadeOut();

        actual++;

        if (actual > total) {
            actual = 1;
        }

        $("#id" + actual).fadeIn();

    });

    $("#anterior").click(function () {

        $("#id" + actual).fadeOut();

        actual--;

        if (actual < 1) {
            actual = total;
        }

        $("#id" + actual).fadeIn();

    });

});