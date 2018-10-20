const electron = require('electron')
const path = require('path')
const sql = require('mssql')

var year = 2017

$( "#menubar" ).mouseover(function() {
  	$( "#menulbl" ).show();
});

$( "#menubar" ).mouseout(function() {
  	$( "#menulbl" ).hide();
});

var email = 'dario.villalta@gmail.com'

const config = {
    user: 'SA',
    password: 'password111!',
    server: 'localhost',
    database: 'CNBS_DEV',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool1 = new sql.ConnectionPool(config, err => {
    // ... error checks
 
    // Query
 
    pool1.request() // or: new sql.Request(pool1)
    .query("select actividad.*, fecha.* from Actividad_FechasFinales fecha right join (select * from Actividad where Anio='"+year+"') actividad on fecha.Actividad = actividad.ID order by FechaFinal", (err, result) => {
        // ... error checks
 
        if(result != undefined){
            arregloActividadesFechas = result.recordset
            arregloActividadesFechas = arregloActividadesFechas.sort(sortByDate)
            getProduct()
            console.log(arregloActividadesFechas)
            getComponents("", year, "")
            getComponentsArray()
            getElementsWithComponentsArray("", "")
            getArrayDepartmentsGraph("")
            getDepartments()
            getArrayComponentesGraph("")
            getArrayDepartmentsAnualGraph1(" where c.Anio = '"+year+"'")
            getArrayDepartmentsAnualGraph2(" where c.Anio = '"+year+"'")
        }
    })
 
})

initSelect2Boxes();
initMonthRange();

function sortByDate(a, b){
    if(a.FechaFinal == null && b.FechaFinal != null)
        return -1;
    if(b.FechaFinal == null && a.FechaFinal != null)
        return 1;
    if(a.FechaFinal == null && b.FechaFinal == null)
        return 1;
    if(a.FechaFinal.getTime() > b.FechaFinal.getTime())
        return 1;
    else
        return -1;
}

function getProduct () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Producto", (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloProductos = result.recordset;
                    loadFlotChart()
                });
            }
        });
    }); // fin transaction
}

//**************************************** PLANEACION VS EJECUCION ****************************************
function loadFlotChart (argument) {
    var chart = $("#actividades");
    if (!$.isFunction($.fn.plot) || chart.length === 0) {
        return;
    }

    var labelColor = chart.css('color');
    moment.lang('es');
    var data = [
        {
            label: 'ejecutada',
            data: [
                /*[moment().subtract(11, 'month').valueOf(), 1100],
                [moment().subtract(10, 'month').valueOf(), 2450],
                [moment().subtract(9, 'month').valueOf(), 3800],
                [moment().subtract(8, 'month').valueOf(), 3400],
                [moment().subtract(7, 'month').valueOf(), 3000],
                [moment().subtract(6, 'month').valueOf(), 5250],
                [moment().subtract(5, 'month').valueOf(), 7500],
                [moment().subtract(4, 'month').valueOf(), 5500],
                [moment().subtract(3, 'month').valueOf(), 3500],
                [moment().subtract(2, 'month').valueOf(), 4000],
                [moment().subtract(1, 'month').valueOf(), 4500],
                [moment().valueOf(), 3000]*/
            ],
            last: true
        },
        {
            label: 'planeada',
            data: [
                /*[moment().subtract(11, 'month').valueOf(), 100],
                [moment().subtract(10, 'month').valueOf(), 450],
                [moment().subtract(9, 'month').valueOf(), 800],
                [moment().subtract(8, 'month').valueOf(), 400],
                [moment().subtract(7, 'month').valueOf(), 2100],
                [moment().subtract(6, 'month').valueOf(), 2440],
                [moment().subtract(5, 'month').valueOf(), 3500],
                [moment().subtract(4, 'month').valueOf(), 2800],
                [moment().subtract(3, 'month').valueOf(), 2500],
                [moment().subtract(2, 'month').valueOf(), 1000],
                [moment().subtract(1, 'month').valueOf(), 500],
                [moment().valueOf(), 1000]*/
            ],
            last: true
        }
    ];
    var lastIndex = 0, firstIndex = 0;
    var primerIndexBandera = false;
    for (var i = 0; i < arregloActividadesFechas.length; i++) {
        var fecha;
        if(arregloActividadesFechas[i].FechaFinal != null){
            var nuevaFecha1 =  arregloActividadesFechas[i].FechaFinal.toISOString().split("-");
            fecha = new Date( nuevaFecha1[0], (nuevaFecha1[1]-1), nuevaFecha1[2].split("T")[0] ).getTime();
        }
        else
            fecha = moment().valueOf();
        if(!primerIndexBandera && arregloActividadesFechas[i].FechaFinal != null){
            firstIndex = i;
            primerIndexBandera = true;
        }
        if(lastIndex < i && arregloActividadesFechas[i].FechaFinal != null)
            lastIndex = i;
        var producto = arregloProductos.filter(function( index ) {
            return arregloActividadesFechas[i].Producto == (index.ID-1);
        });
        data[0].data.push([fecha, arregloActividadesFechas[i].PorcentajeCompletadoEjecucion, producto.Nombre]);
        data[1].data.push([fecha, arregloActividadesFechas[i].PorcentajeCompletadoPlaneacion, producto.Nombre]);
    };
    var textoDates;
    var textoAntes = $('#textDates')[0].innerHTML;
    if(arregloActividadesFechas.length > 0){
        if(arregloActividadesFechas[firstIndex].FechaFinal != null && arregloActividadesFechas[lastIndex].FechaFinal != null)
            textoDates = getMonthTrans(arregloActividadesFechas[firstIndex].FechaFinal.getMonth())+ ' hasta ' + getMonthTrans(arregloActividadesFechas[lastIndex].FechaFinal.getMonth());
        else {
            textoAntes = '';
            textoDates = 'No hay actividades entre las fechas';
        }
        $('#textDates')[0].innerHTML = 'Actividades Ejecutadas vs. Actividades Planeadas en los meses de ' + textoDates;
        if( arregloActividadesFechas.length == 0 ){
            for (var i = 11; i >= 0; i--) {
                if(i == 0){
                    data[0].data.push([moment().valueOf()]);
                    data[1].data.push([moment().valueOf()]);
                } else {
                    data[0].data.push([moment().subtract(i, 'month').valueOf()]);
                    data[1].data.push([moment().subtract(i, 'month').valueOf()]);
                }
            };
        }
    }
    console.log(data);

    var options = {
        colors: chart.data('color').split(','),
        series: {
            shadowSize: 0,
            lines: {
                show: true,
                lineWidth: 2
            },
            points: {
                show: true,
                radius: 3,
                lineWidth: 2
            }
        },
        legend: {
            show: false
        },
        xaxis: {
            mode: "time",
            timeformat: "%b",
            color: 'rgba(0, 0, 0, 0)',
            font: {color: labelColor}
        },
        yaxis: {
            font: {color: labelColor}
        },
        grid: {
            borderWidth: 0,
            color: labelColor,
            hoverable: true
        }
    };

    chart.width('100%');
    var plot = $.plot(chart, data, options);

    var tip, previousPoint = null;
    chart.bind("plothover", function (event, pos, item) {
        if (item) {
            if (previousPoint !== item.dataIndex) {
                previousPoint = item.dataIndex;

                var x = item.datapoint[0];
                var y = item.datapoint[1];
                var producto = item.datapoint[2];
                var tipLabel = '<strong>' + $(this).data('title') + '</strong>';
                var tipContent = y + " " + data[item.seriesIndex].data[item.dataIndex][2] + " de actividad " + item.series.label.toLowerCase() + " el " + moment(x).format('dddd D MMM YYYY');

                if (tip !== undefined) {
                    $(tip).popover('destroy');
                }
                tip = $('<div></div>').appendTo('body').css({left: item.pageX, top: item.pageY - 5, position: 'absolute'});
                tip.popover({html: true, title: tipLabel, content: tipContent, placement: 'top'}).popover('show');
            }
        }
        else {
            if (tip !== undefined) {
                $(tip).popover('destroy');
            }
            previousPoint = null;
        }
    });
}

var arregloActividadesFechas

function getActivitiesEndDates (year, where) {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log("select actividad.*, fecha.* from Actividad_FechasFinales fecha right join (select * from Actividad where Anio='"+year+"') actividad on fecha.Actividad = actividad.ID"+where)
        const request = new sql.Request(transaction);
        request.query("select actividad.*, fecha.* from Actividad_FechasFinales fecha right join (select * from Actividad where Anio='"+year+"') actividad on fecha.Actividad = actividad.ID"+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log(err);
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    if(result != undefined){
                        arregloActividadesFechas = result.recordset
                        arregloActividadesFechas = arregloActividadesFechas.sort(sortByDate)
                        console.log(arregloActividadesFechas)
                        loadFlotChart()
                    }
                });
            }
        });
    }); // fin transaction
}

function filterPlanVSExec () {
    var anio = $('#anio').val();
    var mes1 , mes2, where = '';
    mes1 = $('#mesesActividades1').val();
    mes2 = $('#mesesActividades2').val();
    if(mes1.length == 0)
        console.log(mes2)
    if(mes2.length == 0)
        console.log(mes2)
    if(mes1.length > 0 && mes2.length > 0){
        var fecha1 = new Date( mes1.split("-")[2], (mes1.split("-")[1]-1), mes1.split("-")[0] );
        var fecha2 = new Date( mes2.val().split("-")[2], (mes2.val().split("-")[1]-1), mes2.val().split("-")[0] );
        if(fecha2.getTime() >= fecha1.getTime())
            where = " where ( '"+formatDateCreationSingleDigits(fecha1)+"' <= fecha.FechaFinal and fecha.FechaFinal <= '"+formatDateCreationSingleDigits(fecha2)+"')";
        else{
            toastr.clear();
            toastr.options.positionClass = "toast-top-full-width";
            toastr.options.progressBar = true;
            toastr.options.showEasing = 'swing';
            toastr.options.hideEasing = 'swing';
            toastr.options.showMethod = 'slideDown';
            toastr.options.hideMethod = 'slideUp';
            toastr.warning('Ingrese las fechas en orden cronológico.', 'Advertencia');
        }
    }
    getActivitiesEndDates(anio, where);
}

function initSelect2Boxes () {
    var hoy = new Date();
    var arregloAnios = [];
    for (var i = 2010; i <= hoy.getFullYear(); i++) {
        if(i == hoy.getFullYear())
            arregloAnios.push({"id": i, "text": i, "selected": true});
        else
            arregloAnios.push(i);
    };
    $("#anio").select2({
        data: arregloAnios
    });
}

//**************************************** FIN PLANEACION VS EJECUCION ****************************************

//****************************** COMPONENT TABLE ************************************
var arregloComponentesYElementos = []

function getElementsWithComponentsArray (where, whereCs) {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log('where')
        console.log(where)
        console.log("select c.Descripcion, c.Departamento, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado, c.Nombre, e.Nombre from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs)
        const request = new sql.Request(transaction);
        request.query("select c.Descripcion, c.Departamento, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado, c.Nombre, e.Nombre from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed WOOOO.");
                    console.log(result);
                    arregloComponentesYElementos = result.recordset;
                    loadComponentTable();
                });
            }
        });
    }); // fin transaction
}

function loadComponentTable () {
    var newRowContent = '';
    $("#componentTable > tbody > tr").remove();
    if( $("#departamentoTablaComponentes").val() == 'all'){
        var newArr = [];
        var arrDivisores = [];
        for (var i = 0; i < arregloComponentesYElementos.length; i++) {
            if( inArrayComponentTableE(arregloComponentesYElementos[i].Nombre[1], newArr) >= 0 ){
                arrDivisores[inArrayComponentTableE(arregloComponentesYElementos[i].Nombre[1], newArr)]++;
                newArr[inArrayComponentTableE(arregloComponentesYElementos[i].Nombre[1], newArr)].PorcentajeCompletado[0]+= arregloComponentesYElementos[i].PorcentajeCompletado[0];
                newArr[inArrayComponentTableE(arregloComponentesYElementos[i].Nombre[1], newArr)].PorcentajeCompletado[1]+= arregloComponentesYElementos[i].PorcentajeCompletado[1];
            } else{
                newArr.push({Descripcion: [arregloComponentesYElementos[i].Descripcion[0], arregloComponentesYElementos[i].Descripcion[1]], Departamento: arregloComponentesYElementos[i].Departamento, PorcentajeCompletado:[arregloComponentesYElementos[i].PorcentajeCompletado[0], arregloComponentesYElementos[i].PorcentajeCompletado[1]], Nombre: [arregloComponentesYElementos[i].Nombre[0], arregloComponentesYElementos[i].Nombre[1]] });
                arrDivisores.push(1);
            }
        }
        for (var i = 0; i < newArr.length; i++) {
            newArr[i].PorcentajeCompletado[0]/= arrDivisores[i];
            newArr[i].PorcentajeCompletado[1]/= arrDivisores[i];
        }
        arregloComponentesYElementos = newArr.slice();
    }
    for (var i = 0; i < arregloComponentesYElementos.length; i++) {
        var claseEle = '', claseCom = '';
        if(arregloComponentesYElementos[i].PorcentajeCompletado[1] >= 90)
            claseEle = 'style-success';
        else if(arregloComponentesYElementos[i].PorcentajeCompletado[1] >= 60)
            claseEle = 'style-warning';
        else
            claseEle = 'style-danger';
        if(arregloComponentesYElementos[i].PorcentajeCompletado[0] >= 90)
            claseCom = 'style-success';
        else if(arregloComponentesYElementos[i].PorcentajeCompletado[0] >= 60)
            claseCom = 'style-warning';
        else
            claseCom = 'style-danger';
        var total1, total2;
        if(arregloComponentesYElementos[i].PorcentajeCompletado[1].toString().length>5)
            total1 = arregloComponentesYElementos[i].PorcentajeCompletado[1].toFixed(2);
        else
            total1 = arregloComponentesYElementos[i].PorcentajeCompletado[1]
        if(arregloComponentesYElementos[i].PorcentajeCompletado[0].toString().length>5)
            total2 = arregloComponentesYElementos[i].PorcentajeCompletado[0].toFixed(2);
        else
            total2 = arregloComponentesYElementos[i].PorcentajeCompletado[0]
        newRowContent += '<tr class="tr">'+
                                '<td class="td">'+
                                    arregloComponentesYElementos[i].Descripcion[1]+
                                '</td>'+
                                '<td class="'+claseEle+' text-center td">'+
                                    total1+
                                '</td>'+
                                '<td class="Componente td">'+
                                    arregloComponentesYElementos[i].Descripcion[0]+
                                '</td>'+
                                '<td class="'+claseCom+' text-center td">'+
                                    total2+
                                '</td>'+
                            '</tr>';
    };
    $("#componentTable tbody").append(newRowContent);
    var rows = $("#componentTable")[0].children[1].children;
    for (var i = 0; i < rows.length-1; i++) {
        var ioriginal = i;
        var contador = 1;
        while(rows[i+1] != undefined && rows[ioriginal] != undefined && rows[i+1].children[2] != undefined && rows[ioriginal].children[2] != undefined && rows[i+1].children[2].innerHTML == rows[ioriginal].children[2].innerHTML){
            rows[ioriginal+contador].children[2].remove();
            rows[ioriginal+contador].children[2].remove();
            contador++;
            rows[ioriginal].children[2].rowSpan = contador;
            rows[ioriginal].children[3].rowSpan = contador;
            i++;
        }
    };
}

function filterComponentTable () {
    var anio = $("#anioTablaComponentes").val(), departamento = $("#departamentoTablaComponentes").val();
    var whereA = " where c.Anio = '" + anio + "'";
    var whereD = "";
    if ( departamento != 'all' )
        whereD = " and c.Departamento = '" + departamento + "'";
    var componente1 = $("#checkComponentComponentTable0").is(':checked'),
        componente2 = $("#checkComponentComponentTable1").is(':checked'),
        componente3 = $("#checkComponentComponentTable2").is(':checked'),
        componente4 = $("#checkComponentComponentTable3").is(':checked'),
        componente5 = $("#checkComponentComponentTable4").is(':checked');
    var componente1Query = "", componente2Query = "", componente3Query = "", componente4Query = "", componente5Query = "", componentesQuery = "";
    var textoAntes = "Completación de Elementos vs Componentes: ";
    if(!componente1 && !componente2 && !componente3 && !componente4 && !componente5){
        componentesQuery = "";
        $('#textCompoTable')[0].innerHTML = "Completación de Elementos vs Componentes: Ambiente de Control, Evaluación de Riesgos, Monitoreo , Comunicación , Actividades de Control";
    }else
        componentesQuery = " and (";
    var agregarComa = false;
    if(componente1){
        componente1Query += " c.Nombre='" + $("#checkComponentComponentTable0").val() + "' ";
        textoAntes+=componentes[$("#checkComponentComponentTable0").val()-1].Descripcion;
        agregarComa = true;
    }
    if(agregarComa)
        textoAntes+=", ";
    else
        textoAntes+=" ";
    agregarComa = false;
    if(componente2){
        if(componente1Query.length > 0)
            componente2Query += " or ";
        componente2Query += " c.Nombre='" + $("#checkComponentComponentTable1").val() + "' ";
        textoAntes+=componentes[$("#checkComponentComponentTable1").val()-1].Descripcion;
        agregarComa = true;
    }
    if(agregarComa)
        textoAntes+=", ";
    else
        textoAntes+=" ";
    agregarComa = false;
    if(componente3){
        if(componente1Query.length > 0 || componente2Query.length > 0)
            componente3Query += " or ";
        componente3Query += " c.Nombre='" + $("#checkComponentComponentTable2").val() + "' ";
        textoAntes+=componentes[$("#checkComponentComponentTable2").val()-1].Descripcion;
        agregarComa = true;
    }
    if(agregarComa)
        textoAntes+=", ";
    else
        textoAntes+=" ";
    agregarComa = false;
    if(componente4){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0)
            componente4Query += " or ";
        componente4Query += " c.Nombre='" + $("#checkComponentComponentTable3").val() + "' ";
        textoAntes+=componentes[$("#checkComponentComponentTable3").val()-1].Descripcion;
        agregarComa = true;
    }
    if(agregarComa)
        textoAntes+=", ";
    else
        textoAntes+=" ";
    agregarComa = false;
    if(componente5){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0 || componente4Query.length > 0)
            componente5Query += " or ";
        componente5Query += " c.Nombre='" + $("#checkComponentComponentTable4").val() + "' ";
        textoAntes+=componentes[$("#checkComponentComponentTable4").val()-1].Descripcion;
        agregarComa = true;
    }
    componentesQuery+=componente1Query+componente2Query+componente3Query+componente4Query+componente5Query;
    if(textoAntes.charAt(textoAntes.length-2) == ",")
        textoAntes = textoAntes.substring(0, textoAntes.length-2);
    if(textoAntes.charAt(textoAntes.length-3) == ",")
        textoAntes = textoAntes.substring(0, textoAntes.length-3);
    if(textoAntes.charAt(textoAntes.length-4) == ",")
        textoAntes = textoAntes.substring(0, textoAntes.length-4);
    if(textoAntes.charAt(textoAntes.length-5) == ",")
        textoAntes = textoAntes.substring(0, textoAntes.length-5);
    $('#textCompoTable')[0].innerHTML = textoAntes;
    if(componente1 || componente2 || componente3 || componente4 || componente5)
        componentesQuery+=")";
    getElementsWithComponentsArray(whereA + whereD, componentesQuery);
}

function loadComponentListComponentTable () {
    console.log(componentes)
    var html = '', arregloTemp = []
    for (var i = 0; i < componentes.length; i++) {
        if(inArrayComponentTable(componentes[i].Descripcion, arregloTemp) < 0){
            arregloTemp.push({ID: componentes[i].ID, Descripcion: componentes[i].Descripcion});
            html += '<li class="tile">'+
                        '<div class="checkbox checkbox-styled tile-text">'+
                            '<label>'+
                                '<input id="checkComponentComponentTable'+i+'" value="'+componentes[i].Nombre+'" type="checkbox" checked>'+
                                '<span>'+
                                    componentes[i].Nombre+
                                    '<small>'+
                                        componentes[i].Descripcion+
                                    '</small>'+
                                '</span>'+
                            '</label>'+
                        '</div>'+
                    '</li>';
        }
    }
    $('#componentListComponentTable').append(html)
}

function inArrayComponentTableE (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Nombre[1] == nombre)
            return i;
    };
    return -1;
}

function inArrayComponentTable (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Descripcion == nombre)
            return i;
    };
    return -1;
}

//****************************** FIN COMPONENT TABLE ************************************

//**************************************** BAR COMPONENT GRAPH ****************************************
var arregloComponentesGraph = []

function getArrayComponentesGraph (where) {
    //console.log("select c.Descripcion, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs)
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log("select d.ID, d.Nombre, c.Descripcion, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica"+where)
        const request = new sql.Request(transaction);
        request.query("select d.ID, d.Nombre, c.Descripcion, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica"+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    console.log(err);
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed 70707.");
                    console.log(result);
                    arregloComponentesGraph = result.recordset;
                    graphComponentesGraph();
                });
            }
        });
    }); // fin transaction
}

function graphComponentesGraph () {
    if (typeof Morris !== 'object') {
        return;
    }

    // Morris Donut demo
    var dataC = [];
    if ($('#componentes').length > 0) {
        $("#componentes").empty();
        for (var i = 0; i < arregloComponentesGraph.length; i++) {
            var texto = '';
            if( inArrayComponent(arregloComponentesGraph[i].Descripcion, dataC) >= 0 ){
                if( arregloComponentesGraph[i].PorcentajeCompletado >= 90)
                    dataC[inArrayComponent(arregloComponentesGraph[i].Descripcion, dataC)].completadas++;
                else if( arregloComponentesGraph[i].PorcentajeCompletado >= 80)
                    dataC[inArrayComponent(arregloComponentesGraph[i].Descripcion, dataC)].advertencia++;
                else
                    dataC[inArrayComponent(arregloComponentesGraph[i].Descripcion, dataC)].reprobadas++;
            }
            else
                if( arregloComponentesGraph[i].PorcentajeCompletado >= 90)
                    dataC.push({x: arregloComponentesGraph[i].Descripcion, completadas: 1, advertencia: 0, reprobadas: 0})
                else if( arregloComponentesGraph[i].PorcentajeCompletado >= 80)
                    dataC.push({x: arregloComponentesGraph[i].Descripcion, completadas: 0, advertencia: 1, reprobadas: 0})
                else
                    dataC.push({x: arregloComponentesGraph[i].Descripcion, completadas: 0, advertencia: 0, reprobadas: 1})
        };
        if(arregloComponentesGraph.length == 0)
            dataC.push({x: "No hay actividades registradas", 'completadas': 0, 'advertencia': 0, 'reprobadas': 0});
        Morris.Bar({
            element: 'componentes',
            data: dataC,
            xkey: 'x',
            ykeys: ['completadas', 'advertencia', 'reprobadas'],
            labels: ['Completadas', 'Advertencia', 'Reprobadas'],
            stacked: true,
            barColors: $('#componentes').data('colors').split(','),
            formatter: function (x, data) {
                return data.formatted;
            },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }

   /*

    // Morris stacked bar demo
    if ($('#morris-stacked-bar-graph').length > 0) {
        Morris.Bar({
            element: 'morris-bar-graph',
            data: [
                {x: '2011 Q1', y: 3, z: 2, a: 3},
                {x: '2011 Q2', y: 2, z: null, a: 1},
                {x: '2011 Q3', y: 0, z: 2, a: 4},
                {x: '2011 Q4', y: 2, z: 4, a: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            barColors: $('#morris-bar-graph').data('colors').split(',')
        });
    }*/
}

function filterComponentGraph () {
    var anio = $("#anioComponentesGraph").val(), departamento = $("#departamentoComponentesGraph").val();
    var whereA = " where c.Anio = '" + anio + "'";
    var whereD = "";
    if ( departamento != 'all' )
        whereD = " and c.Departamento = '" + departamento + "'";
    var componente1 = $("#checkComponentComponentesGraph0").is(':checked'),
        componente2 = $("#checkComponentComponentesGraph1").is(':checked'),
        componente3 = $("#checkComponentComponentesGraph2").is(':checked'),
        componente4 = $("#checkComponentComponentesGraph3").is(':checked'),
        componente5 = $("#checkComponentComponentesGraph4").is(':checked');
    var componente1Query = "", componente2Query = "", componente3Query = "", componente4Query = "", componente5Query = "", componentesQuery = "";
    if(!componente1 && !componente2 && !componente3 && !componente4 && !componente5)
        componentesQuery = "";
    else
        componentesQuery = " and (";
    if(componente1)
        componente1Query += " c.Nombre='" + $("#checkComponentComponentesGraph0").val() + "' ";
    if(componente2){
        if(componente1Query.length > 0)
            componente2Query += " or ";
        componente2Query += " c.Nombre='" + $("#checkComponentComponentesGraph1").val() + "' ";
    }
    if(componente3){
        if(componente1Query.length > 0 || componente2Query.length > 0)
            componente3Query += " or ";
        componente3Query += " c.Nombre='" + $("#checkComponentComponentesGraph2").val() + "' ";
    }
    if(componente4){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0)
            componente4Query += " or ";
        componente4Query += " c.Nombre='" + $("#checkComponentComponentesGraph3").val() + "' ";
    }
    if(componente5){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0 || componente4Query.length > 0)
            componente5Query += " or ";
        componente5Query += " c.Nombre='" + $("#checkComponentComponentesGraph4").val() + "' ";
    }
    componentesQuery+=componente1Query+componente2Query+componente3Query+componente4Query+componente5Query;
    if(componente1 || componente2 || componente3 || componente4 || componente5)
        componentesQuery+=")";
    getArrayComponentesGraph(whereA + whereD + componentesQuery);
}

function inArrayComponent (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].x == nombre)
            return i;
    };
    return -1;
}

function loadComponentListComponentesGraph () {
    var html = '', arregloTemp = []
    for (var i = 0; i < componentes.length; i++) {
        if(inArrayComponentTable(componentes[i].Descripcion, arregloTemp) < 0){
            arregloTemp.push({ID: componentes[i].ID, Descripcion: componentes[i].Descripcion});
            html += '<li class="tile">'+
                        '<div class="checkbox checkbox-styled tile-text">'+
                            '<label>'+
                                '<input id="checkComponentComponentesGraph'+i+'" value="'+componentes[i].ID+'" type="checkbox" checked>'+
                                '<span>'+
                                    componentes[i].Nombre+
                                    '<small>'+
                                        componentes[i].Descripcion+
                                    '</small>'+
                                '</span>'+
                            '</label>'+
                        '</div>'+
                    '</li>';
        }
    }
    $('#componentListComponentesGraph').append(html)
}

//****************************** FIN BAR COMPONENT GRAPH ************************************

//**************************************** STACKED DEPARTMENT GRAPH ****************************************
var arregloDepartamentosGraph = []

function getArrayDepartmentsGraph (where) {
    //console.log("select c.Descripcion, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs)
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log("select d.ID, d.Nombre, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica"+where)
        const request = new sql.Request(transaction);
        request.query("select d.ID, d.Nombre, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica"+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    console.log(err);
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed 90909.");
                    console.log(result);
                    arregloDepartamentosGraph = result.recordset;
                    graphDepartamentosTable();
                });
            }
        });
    }); // fin transaction
}

function graphDepartamentosTable () {
    if (typeof Morris !== 'object') {
        return;
    }

    // Morris Donut demo
    var dataC = [];
    if ($('#departamentos').length > 0) {
        $("#departamentos").empty();
        for (var i = 0; i < arregloDepartamentosGraph.length; i++) {
            var texto = '';
            if( inArrayDepartamentos(arregloDepartamentosGraph[i].Nombre[0], dataC) >= 0 ){
                if( arregloDepartamentosGraph[i].PorcentajeCompletado >= 90)
                    dataC[inArrayDepartamentos(arregloDepartamentosGraph[i].Nombre[0], dataC)].completadas++;
                else if( arregloDepartamentosGraph[i].PorcentajeCompletado >= 80)
                    dataC[inArrayDepartamentos(arregloDepartamentosGraph[i].Nombre[0], dataC)].advertencia++;
                else
                    dataC[inArrayDepartamentos(arregloDepartamentosGraph[i].Nombre[0], dataC)].reprobadas++;
            }
            else
                if( arregloDepartamentosGraph[i].PorcentajeCompletado >= 90)
                    dataC.push({x: arregloDepartamentosGraph[i].Nombre[0], completadas: 1, advertencia: 0, reprobadas: 0})
                else if( arregloDepartamentosGraph[i].PorcentajeCompletado >= 80)
                    dataC.push({x: arregloDepartamentosGraph[i].Nombre[0], completadas: 0, advertencia: 1, reprobadas: 0})
                else
                    dataC.push({x: arregloDepartamentosGraph[i].Nombre[0], completadas: 0, advertencia: 0, reprobadas: 1})
        };
        console.log(dataC);
        if(arregloDepartamentosGraph.length == 0)
            dataC.push({x: "No hay actividades registradas", 'completadas': 0, 'advertencia': 0, 'reprobadas': 0});
        Morris.Bar({
            element: 'departamentos',
            data: dataC,
            xkey: 'x',
            ykeys: ['completadas', 'advertencia', 'reprobadas'],
            labels: ['Completadas', 'Advertencia', 'Reprobadas'],
            stacked: true,
            barColors: $('#departamentos').data('colors').split(','),
            formatter: function (x, data) {
                return data.formatted;
            },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }
    console.log($('#optgroup').val())

   /*

    // Morris stacked bar demo
    if ($('#morris-stacked-bar-graph').length > 0) {
        Morris.Bar({
            element: 'morris-stacked-bar-graph',
            data: [
                {x: '2011 Q1', y: 3, z: 2, a: 3},
                {x: '2011 Q2', y: 2, z: null, a: 1},
                {x: '2011 Q3', y: 0, z: 2, a: 4},
                {x: '2011 Q4', y: 2, z: 4, a: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            stacked: true,
            barColors: $('#morris-stacked-bar-graph').data('colors').split(',')
        });
    }*/
}

function filterDepartmentGraph () {
    var anio = $("#anioDepartamentosGraph").val(), departamento = $("#optgroup").val();
    var whereA = " where c.Anio = '" + anio + "'";
    var whereD = "";
    for (var i = 0; i < departamento.length; i++) {
        if(whereD.length == 0)
            whereD+=" and ( d.ID = '"+departamento[i]+"'";
        else
            whereD+=" or d.ID = '"+departamento[i]+"'";
    };
    if(whereD.length > 0)
        whereD += ")";
    getArrayDepartmentsGraph(whereA + whereD);
}

function inArrayDepartamentos (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].x == nombre)
            return i;
    };
    return -1;
}

//****************************** FIN STACKED DEPARTMENT GRAPH ************************************

//**************************************** BAR ANUAL GRAPH ****************************************
var arregloAnualGraph1 = []
var arregloAnualGraph2 = []

function getArrayDepartmentsAnualGraph1(where) {
    //console.log("select c.Descripcion, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs)
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log("select d.ID, d.Nombre, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica join Actividad_FechasFinales f on a.ID = f.Actividad "+where)
        const request = new sql.Request(transaction);
        request.query("select c.Nombre, c.Descripcion, c.PorcentajeCompletado from Componente c "+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    console.log(err);
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed 999999.");
                    console.log(result);
                    arregloAnualGraph1 = result.recordset;
                    graphDepartamentosAnual();
                });
            }
        });
    }); // fin transaction
}

function getArrayDepartmentsAnualGraph2(where) {
    //console.log("select c.Descripcion, e.Descripcion, c.PorcentajeCompletado, e.PorcentajeCompletado from Componente c join Elemento e on e.Componente = c.ID "+where+whereCs)
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        console.log("select d.ID, d.Nombre, c.Nombre, e.Nombre, p.Nombre, a.Nombre, a.PorcentajeCompletado from Departamento d join Componente c on d.ID = c.Departamento join Elemento e on c.ID = e.Componente join Practica p on e.ID = p.Elemento join Actividad a on p.ID = a.Practica"+where)
        const request = new sql.Request(transaction);
        request.query("select c.Nombre, c.Descripcion, c.PorcentajeCompletado from Componente c "+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    console.log(err);
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed 90909.");
                    console.log(result);
                    arregloAnualGraph2 = result.recordset;
                    graphDepartamentosAnual();
                });
            }
        });
    }); // fin transaction
}

function graphDepartamentosAnual () {
    if (typeof Morris !== 'object') {
        return;
    }

    // Morris Donut demo
    var dataC = [];
    if ($('#departamentosComparativa1').length > 0) {
        $("#departamentosComparativa1").empty();
        var arrDivisores = [];
        for (var i = 0; i < arregloAnualGraph1.length; i++) {
            if( inArrayAnual(arregloAnualGraph1[i].Nombre, dataC) >= 0 ){
                arrDivisores[inArrayAnual(arregloAnualGraph1[i].Nombre, dataC)]++;
                dataC[inArrayAnual(arregloAnualGraph1[i].Nombre, dataC)].PorcentajeCompletado+= arregloAnualGraph1[i].PorcentajeCompletado;
            } else{
                dataC.push({PorcentajeCompletado: arregloAnualGraph1[i].PorcentajeCompletado, Nombre: arregloAnualGraph1[i].Nombre, Descripcion: arregloAnualGraph1[i].Descripcion });
                arrDivisores.push(1);
            }
        }
        for (var i = 0; i < dataC.length; i++) {
            dataC[i].PorcentajeCompletado/= arrDivisores[i];
        }
        console.log(dataC);
        if(arregloAnualGraph1.length == 0)
            dataC.push({Descripcion: "No hay componentes registrados", PorcentajeCompletado: 0});
        Morris.Bar({
            element: 'departamentosComparativa1',
            data: dataC,
            xkey: 'Descripcion',
            ykeys: ['PorcentajeCompletado'],
            labels: ['Porcentaje Completado'],
            barGap:4,
            barSizeRatio:0.55,
            hoverCallback: function (index, options, content) {
                var row = options.data[index];
                //assumes you have already calculated the total of your own dataset
                var total1;
                if(row.PorcentajeCompletado.toString().length>5)
                    total1 = row.PorcentajeCompletado.toFixed(2);
                else
                    total1 = row.PorcentajeCompletado
                return '<h4 class="text-light"><strong class="text-accent-dark">'+row.Descripcion+'</strong><br/>Porcentaje Completado: '+ (total1)+'%</h4>';
            },
            barColors: function (row, series, type) {
                var object = arregloAnualGraph1[series.index];
                if(object){
                    if(object.PorcentajeCompletado >= 90) return "#4caf50";
                    else if(object.PorcentajeCompletado >= 80) return "#ff9800";
                    else  return "#f44336";
                } else
                    return;
            },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }
    
    dataC = [];
    if ($('#departamentosComparativa2').length > 0) {
        $("#departamentosComparativa2").empty();
        var arrDivisores = [];
        for (var i = 0; i < arregloAnualGraph2.length; i++) {
            if( inArrayAnual(arregloAnualGraph2[i].Nombre, dataC) >= 0 ){
                arrDivisores[inArrayAnual(arregloAnualGraph2[i].Nombre, dataC)]++;
                dataC[inArrayAnual(arregloAnualGraph2[i].Nombre, dataC)].PorcentajeCompletado+= arregloAnualGraph2[i].PorcentajeCompletado;
            } else{
                dataC.push({PorcentajeCompletado: arregloAnualGraph2[i].PorcentajeCompletado, Nombre: arregloAnualGraph2[i].Nombre, Descripcion: arregloAnualGraph2[i].Descripcion });
                arrDivisores.push(1);
            }
        }
        for (var i = 0; i < dataC.length; i++) {
            dataC[i].PorcentajeCompletado/= arrDivisores[i];
        }
        console.log(dataC);
        if(arregloAnualGraph2.length == 0)
            dataC.push({Descripcion: "No hay componentes registrados", PorcentajeCompletado: 0});
        Morris.Bar({
            element: 'departamentosComparativa2',
            data: dataC,
            xkey: 'Descripcion',
            ykeys: ['PorcentajeCompletado'],
            labels: ['Porcentaje Completado'],
            barGap:4,
            barSizeRatio:0.55,
            hoverCallback: function (index, options, content) {
                var row = options.data[index];
                //assumes you have already calculated the total of your own dataset
                var total1;
                if(row.PorcentajeCompletado.toString().length>5)
                    total1 = row.PorcentajeCompletado.toFixed(2);
                else
                    total1 = row.PorcentajeCompletado
                return '<h4 class="text-light"><strong class="text-accent-dark">'+row.Descripcion+'</strong><br/>Porcentaje Completado: '+ (total1)+'%</h4>';
            },
            barColors: function (row, series, type) {
                var object = arregloAnualGraph1[series.index];
                if(object){
                    if(object.PorcentajeCompletado >= 90) return "#4caf50";
                    else if(object.PorcentajeCompletado >= 80) return "#ff9800";
                    else  return "#f44336";
                } else
                    return;
            },
            formatter: function (value, data) { return value + '%'; },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }

   /*

    // Morris stacked bar demo
    if ($('#morris-stacked-bar-graph').length > 0) {
        Morris.Bar({
            element: 'morris-stacked-bar-graph',
            data: [
                {x: '2011 Q1', y: 3, z: 2, a: 3},
                {x: '2011 Q2', y: 2, z: null, a: 1},
                {x: '2011 Q3', y: 0, z: 2, a: 4},
                {x: '2011 Q4', y: 2, z: 4, a: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            stacked: true,
            barColors: $('#morris-stacked-bar-graph').data('colors').split(',')
        });
    }*/
}

function filterDepartmentAnual () {
    var departamento = $('#departamentoDepartamentosComparativa').val();
    var anio1 = $('#anioDepartamentosComparativa1').val();
    var anio2 = $('#anioDepartamentosComparativa2').val();

    var whereA1 = " where c.Anio = '" + anio1 + "'";
    var whereA2 = " where c.Anio = '" + anio2 + "'";

    if(departamento != 'all')
        departamento = " and c.Departamento = '"+departamento+"'";
    else
        departamento = '';

    var componente1 = $("#checkComponentDepartmentAnual0").is(':checked'),
        componente2 = $("#checkComponentDepartmentAnual1").is(':checked'),
        componente3 = $("#checkComponentDepartmentAnual2").is(':checked'),
        componente4 = $("#checkComponentDepartmentAnual3").is(':checked'),
        componente5 = $("#checkComponentDepartmentAnual4").is(':checked');
    var componente1Query = "", componente2Query = "", componente3Query = "", componente4Query = "", componente5Query = "", componentesQuery = "";
    if(!componente1 && !componente2 && !componente3 && !componente4 && !componente5)
        componentesQuery = "";
    else
        componentesQuery = " and (";

    if(componente1)
        componente1Query += " c.Nombre='" + $("#checkComponentDepartmentAnual0").val() + "' ";
    if(componente2){
        if(componente1Query.length > 0)
            componente2Query += " or ";
        componente2Query += " c.Nombre='" + $("#checkComponentDepartmentAnual1").val() + "' ";
    }
    if(componente3){
        if(componente1Query.length > 0 || componente2Query.length > 0)
            componente3Query += " or ";
        componente3Query += " c.Nombre='" + $("#checkComponentDepartmentAnual2").val() + "' ";
    }
    if(componente4){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0)
            componente4Query += " or ";
        componente4Query += " c.Nombre='" + $("#checkComponentDepartmentAnual3").val() + "' ";
    }
    if(componente5){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0 || componente4Query.length > 0)
            componente5Query += " or ";
        componente5Query += " c.Nombre='" + $("#checkComponentDepartmentAnual4").val() + "' ";
    }

    componentesQuery+=componente1Query+componente2Query+componente3Query+componente4Query+componente5Query;            
    if(componente1 || componente2 || componente3 || componente4 || componente5)
        componentesQuery+=")";
    getArrayDepartmentsAnualGraph1(whereA1 + departamento + componentesQuery);
    getArrayDepartmentsAnualGraph2(whereA2 + departamento + componentesQuery);
    $('#textComparativa1')[0].innerHTML = 'Componentes año ' + anio1;
    $('#textComparativa2')[0].innerHTML = 'Componentes año ' + anio2;
}

function loadComponentDepartmentAnual () {
    var html = '', arregloTemp = []
    for (var i = 0; i < componentes.length; i++) {
        if(inArrayComponentTable(componentes[i].Descripcion, arregloTemp) < 0){
            arregloTemp.push({ID: componentes[i].ID, Descripcion: componentes[i].Descripcion});
            html += '<li class="tile">'+
                        '<div class="checkbox checkbox-styled tile-text">'+
                            '<label>'+
                                '<input id="checkComponentDepartmentAnual'+i+'" value="'+componentes[i].ID+'" type="checkbox" checked>'+
                                '<span>'+
                                    componentes[i].Nombre+
                                    '<small>'+
                                        componentes[i].Descripcion+
                                    '</small>'+
                                '</span>'+
                            '</label>'+
                        '</div>'+
                    '</li>';
        }
    }
    $('#componentListDepartamentosComparativa').append(html)
}

function inArrayAnual (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Nombre == nombre)
            return i;
    };
    return -1;
}

//****************************** FIN BAR ANUAL GRAPH ************************************

//**************************************** DONUT GRAPH COMPONENTS ****************************************
//graphComponents();

var arregloComponentes = []
var arregloElementosDeComponentes = []
var arregloActividadesComponentes = []
var componentes = [] //arreglo sin modificar de los componentes

function getComponents (whereD, year, whereIds) {
    console.log("select e.Descripcion, a.Nombre, f.FechaFinal, f.PorcentajeCompletadoPlaneacion, f.PorcentajeCompletadoEjecucion from Componente c right join Elemento e on e.Componente = c.ID join Practica p on p.Elemento = e.ID join Actividad a on a.Practica = p.ID join Actividad_FechasFinales f on f.Actividad = a.ID where c.Anio = '"+year+"'"+whereD+whereIds)
    /*pool1.request() // or: new sql.Request(pool1)
    .query("select e.Descripcion, a.Nombre, f.FechaFinal, f.PorcentajeCompletadoPlaneacion, f.PorcentajeCompletadoEjecucion from Componente c right join Elemento e on e.Componente = c.ID join Practica p on p.Elemento = e.ID join Actividad a on a.Practica = p.ID join Actividad_FechasFinales f on f.Actividad = a.ID where c.Anio = '"+year+"'"+whereC+whereD, (err, result) => {
        // ... error checks
        if(err)
            console.log(err)
 
        if(result != undefined){
            //arregloActividadesFechas = result.recordset
            //arregloActividadesFechas = arregloActividadesFechas.sort(sortByDate)
            console.log('result.recordset')
            console.log(result.recordset)
            arregloComponentes = result.recordset;
            arregloElementosDeComponentes = [];
            createArrayOfElements();
        }
    });*/

    /*const request = new sql.Request(pool1);
    request.query("select e.Descripcion, a.Nombre, f.FechaFinal, f.PorcentajeCompletadoPlaneacion, f.PorcentajeCompletadoEjecucion from Componente c right join Elemento e on e.Componente = c.ID join Practica p on p.Elemento = e.ID join Actividad a on a.Practica = p.ID join Actividad_FechasFinales f on f.Actividad = a.ID where c.Anio = '"+year+"'"+whereC+whereD, (err, result) => {
        if (err) {
            console.log('error en rolledBack');
            console.log('error en rolledBack');
        } else {
            if(result != undefined){
                //arregloActividadesFechas = result.recordset
                //arregloActividadesFechas = arregloActividadesFechas.sort(sortByDate)
                console.log('result.recordset 888')
                console.log(result.recordset)
                arregloComponentes = result.recordset;
                arregloElementosDeComponentes = [];
                createArrayOfElements();
            }
        }
    });*/

    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select e.Descripcion, a.Nombre, f.FechaFinal, f.PorcentajeCompletadoPlaneacion, f.PorcentajeCompletadoEjecucion from Componente c right join Elemento e on e.Componente = c.ID join Practica p on p.Elemento = e.ID join Actividad a on a.Practica = p.ID join Actividad_FechasFinales f on f.Actividad = a.ID where c.Anio = '"+year+"'"+whereD+whereIds, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    if(result != undefined){
                        //arregloActividadesFechas = result.recordset
                        //arregloActividadesFechas = arregloActividadesFechas.sort(sortByDate)
                        console.log('result.recordset 888')
                        console.log(result.recordset)
                        arregloComponentes = result.recordset;
                        arregloElementosDeComponentes = [];
                        createArrayOfElements();
                    }
                });
            }
        });
    }); // fin transaction
}

function getComponentsFilter () {
    var departamento = $('#departamentoComponentes').val();
    var anio = $('#anioComponentes').val();

    var whereC = '', whereD = '', year = '';
    if(departamento != 'all')
        departamento = " and c.Departamento = '"+departamento+"'";
    else
        departamento = '';

    var componente1 = $("#checkComponentComponentDonut0").is(':checked'),
        componente2 = $("#checkComponentComponentDonut1").is(':checked'),
        componente3 = $("#checkComponentComponentDonut2").is(':checked'),
        componente4 = $("#checkComponentComponentDonut3").is(':checked'),
        componente5 = $("#checkComponentComponentDonut4").is(':checked');
    var componente1Query = "", componente2Query = "", componente3Query = "", componente4Query = "", componente5Query = "", componentesQuery = "";
    if(!componente1 && !componente2 && !componente3 && !componente4 && !componente5)
        componentesQuery = "";
    else
        componentesQuery = " and (";

    if(componente1)
        componente1Query += " c.Nombre='" + $("#checkComponentComponentTable0").val() + "' ";
    if(componente2){
        if(componente1Query.length > 0)
            componente2Query += " or ";
        componente2Query += " c.Nombre='" + $("#checkComponentComponentTable1").val() + "' ";
    }
    if(componente3){
        if(componente1Query.length > 0 || componente2Query.length > 0)
            componente3Query += " or ";
        componente3Query += " c.Nombre='" + $("#checkComponentComponentTable2").val() + "' ";
    }
    if(componente4){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0)
            componente4Query += " or ";
        componente4Query += " c.Nombre='" + $("#checkComponentComponentTable3").val() + "' ";
    }
    if(componente5){
        if(componente1Query.length > 0 || componente2Query.length > 0 || componente3Query.length > 0 || componente4Query.length > 0)
            componente5Query += " or ";
        componente5Query += " c.Nombre='" + $("#checkComponentComponentTable4").val() + "' ";
    }

    componentesQuery+=componente1Query+componente2Query+componente3Query+componente4Query+componente5Query;            
    if(componente1 || componente2 || componente3 || componente4 || componente5)
        componentesQuery+=")";
    getComponents(departamento, anio, componentesQuery);
}

function getComponentsArray () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Componente ", (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    componentes = result.recordset;
                    //initSelect2BoxComponentes();
                    loadComponentListComponentTable();
                    loadComponentListComponentDonut();
                    loadComponentListComponentesGraph();
                    loadComponentDepartmentAnual();
                });
            }
        });
    }); // fin transaction
}

function graphComponents () {
    if (typeof Morris !== 'object') {
        return;
    }

    // Morris Donut demo
    var dataC = [];
    if ($('#componentesPlaneado').length > 0) {
        $("#componentesPlaneado").empty();
        for (var i = 0; i < arregloElementosDeComponentes.length; i++) {
            var texto = '';
            if(arregloElementosDeComponentes[i].Descripcion.length > 60)
                texto = arregloElementosDeComponentes[i].Descripcion.substring(0, 60);
            else
                texto = arregloElementosDeComponentes[i].Descripcion;
            dataC.push({value: parseInt(arregloElementosDeComponentes[i].PorcentajeCompletadoPlaneacion, 10), label: arregloElementosDeComponentes[i].PorcentajeCompletadoPlaneacion, formatted: texto})
        };
        if(arregloElementosDeComponentes.length == 0)
            dataC.push({value: 0, label: "No", formatted: "Hay actividades registradas"});
        Morris.Donut({
            element: 'componentesPlaneado',
            data: dataC,
            colors: $('#componentesPlaneado').data('colors').split(','),
            formatter: function (x, data) {
                return data.formatted;
            },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }

    dataC = [];
    if ($('#componentesEjecutado').length > 0) {
        $("#componentesEjecutado").empty();
        for (var i = 0; i < arregloElementosDeComponentes.length; i++) {
            var texto = '';
            if(arregloElementosDeComponentes[i].Descripcion.length > 60)
                texto = arregloElementosDeComponentes[i].Descripcion.substring(0, 60);
            else
                texto = arregloElementosDeComponentes[i].Descripcion;
            dataC.push({value: parseInt(arregloElementosDeComponentes[i].PorcentajeCompletadoEjecucion, 10), label: arregloElementosDeComponentes[i].PorcentajeCompletadoEjecucion, formatted: texto})
        };
        console.log(dataC);
        if(arregloElementosDeComponentes.length == 0)
            dataC.push({value: 0, label: "No", formatted: "Hay actividades registradas"});
        Morris.Donut({
            element: 'componentesEjecutado',
            data: dataC,
            colors: $('#componentesEjecutado').data('colors').split(','),
            formatter: function (x, data) {
                return data.formatted;
            },
            reset: function(nodeStructure, id, parentId, tree, stackParentId) {
                this.id = id;
                this.parentId = parentId;
                this.X = 0;
                this.Y = 0;

                return this;
            }
        });
    }

    // Morris line demo
   /* if ($('#morris-line-graph').length > 0) {
        var decimal_data = [];
        for (var x = 0; x <= 360; x += 10) {
            decimal_data.push({
                x: x,
                y: 1.5 + 1.5 * Math.sin(Math.PI * x / 180).toFixed(4)
            });
        }
        window.m = Morris.Line({
            element: 'morris-line-graph',
            data: decimal_data,
            xkey: 'x',
            ykeys: ['y'],
            labels: ['sin(x)'],
            parseTime: false,
            resize: true,
            lineColors: $('#morris-line-graph').data('colors').split(','),
            hoverCallback: function (index, options, default_content) {
                var row = options.data[index];
                return default_content.replace("sin(x)", "1.5 + 1.5 sin(" + row.x + ")");
            },
            xLabelMargin: 10,
            integerYLabels: true
        });
    }

    // Morris Bar demo
    if ($('#morris-bar-graph').length > 0) {
        Morris.Bar({
            element: 'morris-bar-graph',
            data: [
                {x: '2011 Q1', y: 3, z: 2, a: 3},
                {x: '2011 Q2', y: 2, z: null, a: 1},
                {x: '2011 Q3', y: 0, z: 2, a: 4},
                {x: '2011 Q4', y: 2, z: 4, a: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            barColors: $('#morris-bar-graph').data('colors').split(',')
        });
    }

    // Morris stacked bar demo
    if ($('#morris-stacked-bar-graph').length > 0) {
        Morris.Bar({
            element: 'morris-stacked-bar-graph',
            data: [
                {x: '2011 Q1', y: 3, z: 2, a: 3},
                {x: '2011 Q2', y: 2, z: null, a: 1},
                {x: '2011 Q3', y: 0, z: 2, a: 4},
                {x: '2011 Q4', y: 2, z: 4, a: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z', 'a'],
            labels: ['Y', 'Z', 'A'],
            stacked: true,
            barColors: $('#morris-stacked-bar-graph').data('colors').split(',')
        });
    }

    // Morris Area demo
    if ($('#morris-area-graph').length > 0) {
        var labelColor = $('#morris-area-graph').css('color');
        Morris.Area({
            element: 'morris-area-graph',
            behaveLikeLine: true,
            data: [
                {x: '2011 Q1', y: 3, z: 3},
                {x: '2011 Q2', y: 2, z: 1},
                {x: '2011 Q3', y: 2, z: 4},
                {x: '2011 Q4', y: 3, z: 3}
            ],
            xkey: 'x',
            ykeys: ['y', 'z'],
            labels: ['Y', 'Z'],
            gridTextColor: labelColor,
            lineColors: $('#morris-area-graph').data('colors').split(',')
        });
    }*/
}

function createArrayOfElements () {
    for (var i = 0; i < arregloComponentes.length; i++) {
        var entro = false;
        for (var j = 0; j < arregloElementosDeComponentes.length; j++) {
            if(arregloElementosDeComponentes[j].Descripcion == arregloComponentes[i].Descripcion){
                arregloElementosDeComponentes[j].PorcentajeCompletadoEjecucion+=arregloComponentes[i].PorcentajeCompletadoEjecucion;
                arregloElementosDeComponentes[j].PorcentajeCompletadoPlaneacion+=arregloComponentes[i].PorcentajeCompletadoPlaneacion;
                entro = true;
            }
            if(arregloElementosDeComponentes.length-1 == j && !entro){
                arregloElementosDeComponentes.push({Nombre: arregloComponentes[i].Nombre, Descripcion: arregloComponentes[i].Descripcion, FechaFinal: arregloComponentes[i].FechaFinal, PorcentajeCompletadoEjecucion: arregloComponentes[i].PorcentajeCompletadoEjecucion, PorcentajeCompletadoPlaneacion: arregloComponentes[i].PorcentajeCompletadoPlaneacion});
                break;
            }
        };
        if(arregloElementosDeComponentes.length == 0)
            arregloElementosDeComponentes.push({Nombre: arregloComponentes[i].Nombre, Descripcion: arregloComponentes[i].Descripcion, FechaFinal: arregloComponentes[i].FechaFinal, PorcentajeCompletadoEjecucion: arregloComponentes[i].PorcentajeCompletadoEjecucion, PorcentajeCompletadoPlaneacion: arregloComponentes[i].PorcentajeCompletadoPlaneacion});
    };
    graphComponents();
}

function loadComponentListComponentDonut () {
    var html = '', arregloTemp = []
    for (var i = 0; i < componentes.length; i++) {
        if(inArrayComponentTable(componentes[i].Descripcion, arregloTemp) < 0){
            arregloTemp.push({ID: componentes[i].ID, Descripcion: componentes[i].Descripcion});
            html += '<li class="tile">'+
                        '<div class="checkbox checkbox-styled tile-text">'+
                            '<label>'+
                                '<input id="checkComponentComponentDonut'+i+'" value="'+componentes[i].ID+'" type="checkbox" checked>'+
                                '<span>'+
                                    componentes[i].Nombre+
                                    '<small>'+
                                        componentes[i].Descripcion+
                                    '</small>'+
                                '</span>'+
                            '</label>'+
                        '</div>'+
                    '</li>';
        }
    }
    $('#componentListDonutGraph').append(html)
}

//**************************************** FIN DONUT GRAPH COMPONENTS ****************************************

//****************************** DEPARTAMENTOS ************************************
var arregloDepartamentos = []
function getDepartments () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Departamento", (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    console.log(err);
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloDepartamentos = result.recordset;
                    initSelect2BoxDepartments();
                });
            }
        });
    }); // fin transaction
}
//****************************** FIN DEPARTAMENTOS ************************************

//****************************** QUERY ************************************

function querySearch () {
    //
}

//****************************** FIN QUERY ************************************

//****************************** SELECT 2 BOXES ************************************

initSelect2BoxYears();

function initSelect2BoxYears () {
    var hoy = new Date();
    var arregloAnios = [];
    for (var i = 2010; i <= hoy.getFullYear(); i++) {
        if(i == hoy.getFullYear())
            arregloAnios.push({"id": i, "text": i, "selected": true});
        else
            arregloAnios.push(i);
    };
    $("#anioTablaComponentes").select2({
        data: arregloAnios
    });
    $("#anioComponentes").select2({
        data: arregloAnios
    });
    $("#anioDepartamentosGraph").select2({
        data: arregloAnios
    });
    $("#anioComponentesGraph").select2({
        data: arregloAnios
    });
    $("#anioDepartamentosComparativa1").select2({
        data: arregloAnios
    });
    $("#anioDepartamentosComparativa2").select2({
        data: arregloAnios
    });
}

function initSelect2BoxDepartments () {
    var arregloPresentarAnios = [];
    $('#optgroup').multiSelect({
        selectableOptgroup: true,
        keepOrder: false
    });
    for (var i = 0; i < arregloDepartamentos.length; i++) {
        arregloPresentarAnios.push({id:arregloDepartamentos[i].ID, text:arregloDepartamentos[i].Nombre});
        $('#optgroup').multiSelect('addOption', {value: arregloDepartamentos[i].ID, text: arregloDepartamentos[i].Nombre});
    };
    $('#optgroup option').each(function(){
        this.selected=true;
    });
    $('#optgroup').multiSelect("refresh");
    $("#departamentoTablaComponentes").select2({
        data: arregloPresentarAnios
    });
    $("#departamentoComponentes").select2({
        data: arregloPresentarAnios
    });
    $("#departamentoComponentesGraph").select2({
        data: arregloPresentarAnios
    });
    $("#departamentoDepartamentosComparativa").select2({
        data: arregloPresentarAnios
    });
}

function initSelect2BoxComponentes () {
    var arregloPresentarAnios = [];
    for (var i = 0; i < componentes.length; i++) {
        arregloPresentarAnios.push({id:componentes[i].ID, text:componentes[i].Descripcion});
    };
    $("#componenteComponentes").select2({
        data: arregloPresentarAnios
    });
}

function initMonthRange () {
    $('#mesesActividades').datepicker({
        todayHighlight: true,
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });

    $('#mesesComponentTable').datepicker({
        todayHighlight: true,
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });

    $('#mesesComponentesGraph').datepicker({
        todayHighlight: true,
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });

    $('#mesesDepartamentosGraph').datepicker({
        todayHighlight: true,
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });

    $('#mesesDepartamentosGraph').datepicker({
        todayHighlight: true,
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });
}

//****************************** FIN SELECT 2 BOXES ************************************

function getMonthTrans (monthIndex) {
    var monthNames = [
        "Enero", "Febrero", "Marzo",
        "Abril", "Mayo", "Junio", "Julio",
        "Agosto", "Septiembre", "Octubre",
        "Noviembre", "Diciembre"
    ];

    return monthNames[monthIndex];
}

function formatDateCreationSingleDigits(date) {
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return year + '-' + (monthIndex+1) + '-' + day;
}
