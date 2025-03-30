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
    /*Checking if any students are selected*/
    var selectedStudents = $('#participants tbody tr:not(.emptyrow)').has('input.usercheckbox:checked').length;
    
    if (selectedStudents === 0) {
        alert('Du skal vælge mindst én elev før du kan køre statistikken!');
        return;
    }
    
    google.charts.load('current', { 'packages': ['corechart'] });
    //google.charts.setOnLoadCallback(drawChart);


    /*Setting up UI and loaddiv */
    var elevstatUI = `
        <div id="elevstatWrapper" class="shadow p-3 mb-5 bg-dark rounded " style="z-index: 1000; ">
            <div class="row text-light p-3">
                <h4 class="text-white">Elevstatistik overblik</h4>
                <div class="spinner-border mx-auto" role="status"></div>
                <div class="dropdown ml-auto">
                    <button class="elevstat-download-all btn btn-light dropdown-toggle" type="button" data-toggle="dropdown" disabled>
                        <i class="fa fa-download"></i> Download alle
                    </button>
                    <div class="dropdown-menu download-all-menu">
                        <a class="dropdown-item download-all-excel" href="#"><i class="fa fa-file-excel-o"></i> Excel (.xlsx)</a>
                        <a class="dropdown-item download-all-csv" href="#"><i class="fa fa-file-text-o"></i> CSV (.csv)</a>
                        <a class="dropdown-item download-all-json" href="#"><i class="fa fa-file-code-o"></i> JSON (.json)</a>
                    </div>
                </div>
                <button id="elevstatCloseButton" class="btn btn-danger text-white ml-2" aria-label="luk elevstatistik" data-toggle="tooltip" data-placement="top" title="Luk statistikken" disabled>
                    <i class="fa fa-times-circle"></i> Afslut
                </button>
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
    var elever = $('#participants tbody tr:not(.emptyrow)')
               .has('input.usercheckbox:checked')
               .find('th.c1');
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
            
            // Find alle sektioner
            $('#loadelevpage .section').each(function() {
                var emne = $(this).find('h2').first().text();
                
                // Find alle opgaver i denne sektion
                $(this).find('.submissionstatustable').parent('ul').prev('h4').each(function(index) {
                    let obj = {};
                    obj.emne = emne;
                    obj.titel = $(this).text();
                    let findSubmitted = $(this).next('ul').find('.submissionstatussubmitted');
                    obj.afleveret = findSubmitted.length < 1 ? 'Nej' : 'Ja';
                    opgaveresult.push(obj);
                });
            });

            // Beregn statistik
            var antalOpgaver = opgaveresult.length;
            var antalAfleverede = opgaveresult.filter(opgave => opgave.afleveret === 'Ja').length;
            var afleveringsprocent = Math.floor((antalAfleverede / antalOpgaver) * 100);

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
            <div class="col-12 col-sm-6 col-md-4 mt-2">
                <div id="elevcard-${studentid}" class="elevcard card bg-white border rounded">
                    <div class="card-header">
                    ${student} 
                    </div>
                    <div id="chart-${studentid}">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <div class="card-body">                        
                        <div class="d-flex justify-content-end align-items-center">
                            <button class="show-details btn btn-secondary mr-2" type="button" data-toggle="collapse" data-userid="${studentid}" data-target="#elevstatDetaljer-${studentid}" aria-expanded="false" aria-controls="elevstatDetaljer-${studentid}" disabled>
                                <i class="fa fa-spinner fa-spin"></i> Henter Data
                            </button>
                            <div class="btn-group">
                                <button class="elevstat-download btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" data-userid="${studentid}" data-user="${student}" disabled>
                                    <i class="fa fa-download"></i>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item download-excel" href="#"><i class="fa fa-file-excel-o"></i> Excel</a>
                                    <a class="dropdown-item download-csv" href="#"><i class="fa fa-file-text-o"></i> CSV</a>
                                    <a class="dropdown-item download-json" href="#"><i class="fa fa-file-code-o"></i> JSON</a>
                                </div>
                            </div>
                        </div>
                        <div class="collapse mt-3" id="elevstatDetaljer-${studentid}">
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

                // Tilføj console.log for debugging
                console.log("Loading complete, setting up event handlers");

                // Event handler for "Se Detaljer" knappen
                $(".show-details").click(function () {
                    var $el = $(this);
                    $el.text($el.text() == "Se Detaljer" ? "Skjul Detaljer" : "Se Detaljer");
                });

                // Individual student download handlers
                $(document).on('click', '.elevcard .dropdown-item', function(e) {
                    e.preventDefault();
                    console.log("Download clicked for individual student");
                    
                    const button = $(this).closest('.card-body').find('.elevstat-download');
                    const userid = button.data('userid');
                    const username = button.data('user');
                    const data = JSON.parse(localStorage.getItem('elevstat-' + userid));
                    
                    if (!data) {
                        alert('Ingen data fundet for denne elev');
                        return;
                    }

                    if ($(this).hasClass('download-excel')) {
                        console.log("Downloading Excel");
                        var wb = XLSX.utils.book_new();
                        wb.Props = {
                            Title: "Elev Statistik",
                            Subject: "Elevstatistik",
                            Author: "Claus Hansen - clh@zbc.dk",
                            CreatedDate: new Date()
                        };
                        wb.SheetNames.push("Afleveringer");
                        var ws_data = [["Emne", "Opgave", "Afleveret"]];  // Ændret fra Sektion til Emne
                        data.forEach(item => {
                            ws_data.push([item.emne, item.titel, item.afleveret]);
                        });
                        var ws = XLSX.utils.aoa_to_sheet(ws_data);
                        wb.Sheets["Afleveringer"] = ws;
                        var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
                        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), 'afleveringer-' + username + '.xlsx');
                    } 
                    else if ($(this).hasClass('download-csv')) {
                        console.log("Downloading CSV");
                        let csvContent = "Emne,Opgave,Afleveret\n";  // Ændret fra Sektion til Emne
                        data.forEach(row => {
                            csvContent += `"${row.emne}","${row.titel}","${row.afleveret}"\n`;
                        });
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        saveAs(blob, 'afleveringer-' + username + '.csv');
                    } 
                    else if ($(this).hasClass('download-json')) {
                        console.log("Downloading JSON");
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        saveAs(blob, 'afleveringer-' + username + '.json');
                    }
                });

                // Download all handlers
                $(document).on('click', '.download-all-excel', function(e) {
                    e.preventDefault();
                    console.log("Downloading all Excel");
                    var wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: "Elev afleveringer Statistik",
                        Subject: "Elevstatistik",
                        Author: "Claus Hansen - clh@zbc.dk",
                        CreatedDate: new Date()
                    };
                    
                    $('.elevstat-download').each(function(index) {
                        var userid = $(this).data('userid');
                        var student = $(this).data('user');
                        student = student.substring(0,30);
                        var opgaveresult = JSON.parse(localStorage.getItem('elevstat-' + userid));
                        
                        if (opgaveresult) {
                            var ws_data = [["Emne", "Opgave", "Afleveret"]];  // Ændret fra Sektion til Emne
                            opgaveresult.forEach(item => {
                                ws_data.push([item.emne, item.titel, item.afleveret]);
                            });
                            wb.SheetNames.push(student);
                            var ws = XLSX.utils.aoa_to_sheet(ws_data);
                            wb.Sheets[student] = ws;
                        }
                    });
                    
                    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
                    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), 'samlet-afleverings-statistik.xlsx');
                });

                $(document).on('click', '.download-all-csv', function(e) {
                    e.preventDefault();
                    console.log("Downloading all CSV");
                    let allData = [];
                    $('.elevstat-download').each(function() {
                        const userid = $(this).data('userid');
                        const username = $(this).data('user');
                        const data = JSON.parse(localStorage.getItem('elevstat-' + userid));
                        if (data) {
                            data.forEach(item => {
                                allData.push([username, item.titel, item.afleveret]);
                            });
                        }
                    });
                    
                    let csvContent = "Elev,Opgave,Afleveret\n";
                    allData.forEach(row => {
                        csvContent += `"${row[0]}","${row[1]}","${row[2]}"\n`;
                    });
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    saveAs(blob, 'samlet-afleverings-statistik.csv');
                });

                $(document).on('click', '.download-all-json', function(e) {
                    e.preventDefault();
                    console.log("Downloading all JSON");
                    let jsonData = {};
                    $('.elevstat-download').each(function() {
                        const userid = $(this).data('userid');
                        const username = $(this).data('user');
                        const data = JSON.parse(localStorage.getItem('elevstat-' + userid));
                        if (data) {
                            jsonData[username] = data;
                        }
                    });
                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                    saveAs(blob, 'samlet-afleverings-statistik.json');
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

function exportToCSV(data, filename) {
    let csvContent = "Emne,Opgave,Afleveret\n";  // Ændret fra Sektion til Emne
    data.forEach(row => {
        csvContent += `"${row.emne}","${row.titel}","${row.afleveret}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename + '.csv');
}

function exportToJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, filename + '.json');
}