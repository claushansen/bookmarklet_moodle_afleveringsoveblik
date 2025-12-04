(function() {
    const data = {
        timestamp: new Date().toISOString(),
        students: [],
        missing: []
    };

    // 1. Hent elevdata fra fraværstabellen
    const table = document.getElementById('s_m_Content_Content_fravaertbl');
    if (table) {
        const rows = table.querySelectorAll('tr');
        for (let i = 3; i < rows.length; i++) {
            const cells = rows[i].cells;
            if (cells.length > 2) {
                const nameLink = cells[1].querySelector('a');
                if (nameLink) {
                    data.students.push({
                        name: nameLink.innerText.trim(),
                        id: nameLink.href.split('elevid=')[1] || '',
                        period: { pct: cells[2].innerText.trim(), mod: cells[3].innerText.trim() },
                        settled: { pct: cells[4].innerText.trim(), mod: cells[5].innerText.trim() },
                        year: { pct: cells[6].innerText.trim(), mod: cells[7].innerText.trim() }
                    });
                }
            }
        }
    }

    // 2. Hent manglende registreringer fra tabellen med manglende registreringer
    const missingTable = document.getElementById('s_m_Content_Content_MissingAbsenceRegistrationGV');
    if (missingTable) {
        const rows = missingTable.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].cells;
            if (cells.length > 1) {
                const contentDiv = cells[1].querySelector('.s2skemabrikcontent.OnlyDesktop');
                data.missing.push({
                    week: cells[0].innerText.trim(),
                    activity: contentDiv ? contentDiv.innerText.trim() : cells[1].innerText.trim()
                });
            }
        }
    }

    // 3. Opret og download fil
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    // Filnavn med dato, fx lectio_fravaer_2025-12-04.json
    a.download = "lectio_fravaer_" + new Date().toISOString().slice(0,10) + ".json";
    
    document.body.appendChild(a);
    a.click();
    
    // Ryd op
    document.body.removeChild(a);
})();