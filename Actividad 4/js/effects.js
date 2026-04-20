$(document).ready(function () {
    $(".row").hide();
    $(".row").slideDown("slow");
    $("#id1").hide();
    $("#id2").hide();
    $("#id3").hide();
    $("#id4").hide();
    $("#id5").hide();
    $("#id6").hide();
    $("#id7").hide();
    $("#id8").hide();
    $("#id9").hide();
    $("#id10").hide();
    $("#id11").hide();
    $("#id12").hide();
    $("#id13").hide();
    
    
    let c1 = 0;
    let c2 = 0;
    let c3 = 0;
    let c4 = 0;
    let c5 = 0;
    let c6 = 0;
    let c7 = 0;
    let c8 = 0;
    let c9 = 0;
    let c10 = 0;
    let c11 = 0;
    let c12 = 0;
    let c13 = 0;
    $("#m1").click(function () {
        if (c1 == 0) {
            $("#id1").slideDown("slow");
            c1++;
        }

        else {
            $("#id1").fadeOut();
            c1 = 0;
        }

    });

    $("#m2").click(function () {
        if (c2 == 0) {
            $("#id2").slideDown("slow");
            c2++;
        }

        else {
            $("#id2").fadeOut();
            c2 = 0;
        }

    });

    $("#m3").click(function () {
        if (c3 == 0) {
            $("#id3").slideDown("slow");
            c3++;
        }

        else {
            $("#id3").fadeOut();
            c3 = 0;
        }

    });

        $("#m4").click(function () {
        if (c4 == 0) {
            $("#id4").slideDown("slow");
            c4++;
        }

        else {
            $("#id4").fadeOut();
            c4 = 0;
        }

    });


        $("#m5").click(function () {
        if (c5 == 0) {
            $("#id5").slideDown("slow");
            c5++;
        }

        else {
            $("#id5").fadeOut();
            c5 = 0;
        }

    });

        $("#m6").click(function () {
        if (c6 == 0) {
            $("#id6").slideDown("slow");
            c6++;
        }

        else {
            $("#id6").fadeOut();
            c6 = 0;
        }

    });

    $("#m7").click(function () {
        if (c7 == 0) {
            $("#id7").slideDown("slow");
            c7++;
            $("#id8").fadeOut();
            $("#id9").fadeOut();
            $("#id10").fadeOut();
            $("#id11").fadeOut();
            $("#id12").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id7").fadeOut();
            c7 = 0;
        }

    });

    $("#m8").click(function () {
        if (c8 == 0) {
            $("#id8").slideDown("slow");
            c8++;
            $("#id7").fadeOut();
            $("#id9").fadeOut();
            $("#id10").fadeOut();
            $("#id11").fadeOut();
            $("#id12").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id8").fadeOut();
            c8 = 0;
        }

    });

    $("#m9").click(function () {
        if (c9 == 0) {
            $("#id9").slideDown("slow");
            c9++;
            $("#id7").fadeOut();
            $("#id8").fadeOut();
            $("#id10").fadeOut();
            $("#id11").fadeOut();
            $("#id12").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id9").fadeOut();
            c9 = 0;
        }

    });

    $("#m10").click(function () {
        if (c10 == 0) {
            $("#id10").slideDown("slow");
            c10++;
            $("#id7").fadeOut();
            $("#id8").fadeOut();
            $("#id9").fadeOut();
            $("#id11").fadeOut();
            $("#id12").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id10").fadeOut();
            c10 = 0;
        }

    });

    $("#m11").click(function () {
        if (c11 == 0) {
            $("#id11").slideDown("slow");
            c11++;
            $("#id7").fadeOut();
            $("#id8").fadeOut();
            $("#id9").fadeOut();
            $("#id10").fadeOut();
            $("#id12").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id11").fadeOut();
            c11 = 0;
        }


    });

        $("#m12").click(function () {
        if (c12 == 0) {
            $("#id12").slideDown("slow");
            c12++;
            $("#id7").fadeOut();
            $("#id8").fadeOut();
            $("#id9").fadeOut();
            $("#id10").fadeOut();
            $("#id11").fadeOut();
            $("#id13").fadeOut();
        }

        else {
            $("#id12").fadeOut();
            c12 = 0;
        }


    });

        $("#m13").click(function () {
        if (c13 == 0) {
            $("#id13").slideDown("slow");
            c13++;
            $("#id7").fadeOut();
            $("#id8").fadeOut();
            $("#id9").fadeOut();
            $("#id10").fadeOut();
            $("#id11").fadeOut();
            $("#id12").fadeOut();
        }

        else {
            $("#id13").fadeOut();
            c13 = 0;
        }


    });

    






});
