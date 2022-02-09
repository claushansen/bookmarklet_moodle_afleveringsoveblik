/*Scrol to top */
window.scrollTo({top: 0, behavior: 'smooth'});

/*Loading Google chart js */
var googlescript = document.createElement("script");
googlescript.type = "text/javascript";
googlescript.src = "https://www.gstatic.com/charts/loader.js";
$("head").append(googlescript);

/*Loading filesaverJS js */

var filesavescript = document.createElement("script");
filesavescript.type = "text/javascript";
filesavescript.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js";
$("head").append(filesavescript);

require.config({paths: {
    xlsx: "https://cdn.jsdelivr.net/gh/sheetjs/sheetjs/dist/xlsx.full.min"
}
});
/*Loading SheetJS js with requireJS*/
require(["xlsx"], function (XLSX) {
/* use XLSX here */
console.log('SheetJS loaded..');
});

/*Loading SheetJS js with requireJS*/
//require(["https://cdn.jsdelivr.net/gh/sheetjs/sheetjs/dist/xlsx.full.min.js"], function (XLSX) {
    /* use XLSX here */
  //  console.log('SheetJS loaded..');
//});


setTimeout(function () {
    google.charts.load('current', { 'packages': ['corechart'] });
    //google.charts.setOnLoadCallback(drawChart);


    /*Setting up UI and loaddiv */
    var elevstatUI = `
        <div id="elevstatWrapper" class="shadow p-3 mb-5 bg-dark rounded " style="z-index: 1000; ">
            <div class="row text-light p-3">
                <h4 class="text-white">Elevstatistik overblik</h4>
                <div class="spinner-border mx-auto" role="status"></div>
                <button class="elevstat-download-all btn btn-light text-dark ml-auto " type="button" data-toggle="tooltip" data-placement="top" title="Download alle data som Excel fil" disabled><i class="fa fa-download"></i> Download</button>
                <button id="elevstatCloseButton" class="btn btn-danger text-white ml-2" aria-label="luk elevstatistik" data-toggle="tooltip" data-placement="top" title="Luk statistikken" disabled><i class="fa fa-times-circle"></i> Afslut</button>
            </div>
            <div id="elevstatCards" class="row">
                <!--Elevcards-->     
            </div>
        </div>
        `;
    $('div#page').prepend(elevstatUI);
    var loadElevPage = `<div id="loadelevpage" class="invisible"></div>`;
    $('body').append(loadElevPage);

    /*Processing students */
    var elever = $('#participants tbody tr:not(.emptyrow) th.c1');
    for (i = 0; i < elever.length; i++) {
        var elevnavn = $(elever[i]).text();
        var elevlink = $(elever[i]).find('a').attr('href');
        var elevurl = new URL(elevlink);
        var elevparams = new window.URLSearchParams(elevurl.search);
        var elevid = elevparams.get('id');
        var kursusid = elevparams.get('course');

        /*Loading student detailpage and extracts data */
        var loadingCounter = elever.length;

        $("#loadelevpage").load("/report/outline/user.php?id=" + elevid + "&course=" + kursusid + "&mode=complete #region-main-box", function () {

            var student = $('#loadelevpage .page-header-headings h2').text();
            var studentid = $('#loadelevpage #message-user-button').data('userid');
            var opgaveresult = [];
            var alleOpgaver = $('#loadelevpage .submissionstatustable');
            var antalOpgaver = alleOpgaver.length;
            var antalAfleverede = $('#loadelevpage .submissionstatussubmitted').length;
            var afleveringsprocent = Math.floor((antalAfleverede / antalOpgaver) * 100);
            $('#loadelevpage .submissionstatustable').parent('ul').prev('h4').each(function (index) {
                let obj = {};
                obj.titel = $(this).text();
                let findSubmitted = $(alleOpgaver[index]).find('.submissionstatussubmitted');
                if (findSubmitted.length < 1) {
                    obj.afleveret = 'Nej';
                } else {
                    obj.afleveret = 'Ja';
                }
                opgaveresult.push(obj);
            }
            );
            /*Localstorage- saving data for later export*/
            localStorage.setItem('elevstat-' + studentid, JSON.stringify(opgaveresult));

            /*creating assignmentlist */
            var assignmentlist = '';
            for (var i = 0; i < opgaveresult.length; i++) {
                let labelclass = opgaveresult[i].afleveret == 'Ja' ? 'badge-success' : 'badge-warning';
                assignmentlist += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                ${opgaveresult[i].titel}
                <span class="badge ${labelclass} badge-pill">${opgaveresult[i].afleveret}</span>
                </li>`;
            }

            var elevcard = `
            <div class="col-12 col-sm-6 col-md-4 col-xl-2 px-2">
                <div id="elevcard-${studentid}" class="elevcard card bg-white border rounded">
                    <div class="card-header">
                    ${student} 
                    </div>
                    <div id="chart-${studentid}">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <div class="card-body">                        
                        <p class="text-right"><button class="show-details btn btn-secondary " type="button" data-toggle="collapse" data-userid="${studentid}" data-target="#elevstatDetaljer-${studentid}" aria-expanded="false" aria-controls="elevstatDetaljer-${studentid}" disabled><i class="fa fa-spinner fa-spin"></i> Henter Data</button>
                        <button class="elevstat-download btn btn-secondary " type="button" data-userid="${studentid}" data-user="${student}" data-toggle="tooltip" data-placement="top" title="Download elevens data som Excel fil" disabled><i class="fa fa-download"></i></button>
                        </p>
                        <div class="collapse" id="elevstatDetaljer-${studentid}">
                            <p class="card-text">${student} har afleveret ${antalAfleverede} ud af ${antalOpgaver} og har derfor en afleveringsprocent på ${afleveringsprocent}%.</p>
                            <ul class="list-group">
                                ${assignmentlist}
                            </ul>
                        </div>                        
                    </div>
                </div>
            </div>` ;
            $('#elevstatCards').append(elevcard);
            /* creating chart */
            var chartdata = google.visualization.arrayToDataTable([
                ['Opgaver', 'Afleverede'],
                ['Afleveret', antalAfleverede],
                ['Ikke Afleveret', antalOpgaver - antalAfleverede]
            ]);

            var options = {
                title: 'Afleveringer',
                backgroundColor: '#f2f2f2',
                width: 'auto',
                height: 'auto',
                legend: {
                    position: 'bottom'
                }
            };
            var chartdiv = `chart-${studentid}`;
            var chart = new google.visualization.PieChart(document.getElementById(chartdiv));
            chart.draw(chartdata, options);

            /*Card created - subtracting from counter */
            loadingCounter--;

            if (loadingCounter == 0) {
                $(".show-details").removeAttr("disabled");
                $(".elevstat-download-all").removeAttr("disabled");
                $(".elevstat-download").removeAttr("disabled");
                $("#elevstatCloseButton").removeAttr("disabled");
                $(".show-details").text("Se Detaljer");
                $(".fa-spinner").remove();
                $('.spinner-border').remove();
                $(".show-details").click(function () {
                    var $el = $(this);
                    $el.text($el.text() == "Se Detaljer" ? "Skjul Detaljer" : "Se Detaljer");
                });
                $('#elevstatCloseButton').click(function () {
                    if (confirm("Er du sikker på at du vil lukke statistikken?")) {
                        /*Cleanup LocalStorage */
                        $('.elevstat-download').each(function (index) {
                            let studentid = $(this).data('userid');
                            console.log(studentid);
                            localStorage.removeItem('elevstat-' + studentid);
                        });
                        $('#elevstatWrapper').remove();
                        $('#loadelevpage').remove();
                        $("script[src='https://www.gstatic.com/charts/loader.js']").remove();
                        $("script[src='https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js']").remove();
                        $("script[src='https://cdn.jsdelivr.net/gh/sheetjs/sheetjs/dist/xlsx.full.min.js']").remove();
                        $("script[src='https://www.gstatic.com/charts/51/loader.js']").remove();
                        $("script[src='https://www.gstatic.com/charts/51/js/jsapi_compiled_default_module.js']").remove();
                        $("script[src='https://www.gstatic.com/charts/51/js/jsapi_compiled_graphics_module.js']").remove();
                        $("script[src='https://www.gstatic.com/charts/51/js/jsapi_compiled_ui_module.js']").remove();
                        $("script[src='https://www.gstatic.com/charts/51/js/jsapi_compiled_corechart_module.js']").remove();
                        $("link[href='https://www.gstatic.com/charts/51/css/core/tooltip.css']").remove();
                        $("link[href='https://www.gstatic.com/charts/51/css/util/util.css']").remove();
                    }
                });
                $(".elevstat-download").click(function () {
                    var opgaveresult = JSON.parse(localStorage.getItem('elevstat-' + $(this).data('userid')));
                    var student = $(this).data('user');
                    console.log(opgaveresult);
                    var csvArray = [];
                    csvArray.push(["Opgave", "Afleveret"]);

                    for (i = 0; opgaveresult.length > i; i++) {
                        let titel = opgaveresult[i].titel;
                        let afleveret = opgaveresult[i].afleveret;
                        let resultArray = [titel, afleveret];
                        csvArray.push(resultArray);
                    }

                    var wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: "Elev Statistik",
                        Subject: "Elevstatistik",
                        Author: "Claus Hansen - clh@zbc.dk",
                        CreatedDate: new Date()
                    };
                    wb.SheetNames.push("Afleveringer");
                    var ws_data = csvArray;
                    var ws = XLSX.utils.aoa_to_sheet(ws_data);
                    wb.Sheets["Afleveringer"] = ws;
                    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

                    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), 'afleveringer-' + student + '.xlsx');
                });
                $(".elevstat-download-all").click(function () {
                    var wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: "Elev afleveringer Statistik",
                        Subject: "Elevstatistik",
                        Author: "Claus Hansen - clh@zbc.dk",
                        CreatedDate: new Date()
                    };
                    $('.elevstat-download').each(function (index) {
                        var opgaveresult = JSON.parse(localStorage.getItem('elevstat-' + $(this).data('userid')));
                        var student = $(this).data('user');
                        student = student.substring(0,30);
                        //console.log(opgaveresult);
                        var csvArray = [];
                        csvArray.push(["Opgave", "Afleveret"]);

                        for (i = 0; opgaveresult.length > i; i++) {
                            let titel = opgaveresult[i].titel;
                            let afleveret = opgaveresult[i].afleveret;
                            let resultArray = [titel, afleveret];
                            csvArray.push(resultArray);
                        }
                        wb.SheetNames.push(student);
                        var ws_data = csvArray;
                        var ws = XLSX.utils.aoa_to_sheet(ws_data);
                        wb.Sheets[student] = ws;
                    });
                    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

                    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), 'samlet-afleverings-statistik-.xlsx');
                });

            }

        });

    }

}, 1000);

/*Export Functions */
function s2ab(s) {

    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;

}