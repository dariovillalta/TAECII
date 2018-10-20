const electron = require('electron')
const path = require('path')
const sql = require('mssql')

var year = '2017'

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
}

var primerDia = new Date(year, 0, 1)
var hoy = new Date()
var fechaCalFinal
if(primerDia.getFullYear() == hoy.getFullYear())
    fechaCalFinal = hoy
else
    fechaCalFinal = new Date(year, 11, 31)

$('#fechaInicial').datepicker({
    onSelect: function(date) {
        primerDia = date;
    },
    format: "dd-mm-yyyy",
    viewMode: "days", 
    minViewMode: "days",
    language: 'es'
});
$('#fechaInicial').datepicker('setStartDate', primerDia );
$('#fechaInicial').datepicker('setEndDate', fechaCalFinal );
$("#fechaInicial").datepicker( "setDate" , primerDia );
$('#fechaFinal').datepicker({
    onSelect: function(date) {
        fechaCalFinal = date;
    },
    format: "dd-mm-yyyy",
    viewMode: "days", 
    minViewMode: "days",
    language: 'es'
});
$('#fechaFinal').datepicker('setStartDate', primerDia );
$('#fechaFinal').datepicker('setEndDate', fechaCalFinal );
$("#fechaFinal").datepicker( "setDate" , fechaCalFinal );

$(".select2NoSearch").select2({
    minimumResultsForSearch: -1
});

const pool1 = new sql.ConnectionPool(config, err => {
    // ... error checks
    pool1.request() // or: new sql.Request(pool1)
    .query("select c.*, e.*, p.*, a.*, f.PorcentajeCompletadoEjecucion, f.PorcentajeCompletadoPlaneacion from Componente c join Elemento e on e.Componente = c.ID join Practica p on p.Elemento = e.ID join Actividad a on a.Practica = p.ID left join Actividad_FechasFinales f on f.Actividad = a.ID and (f.FechaFinal >= '"+formatDateCreationSingleDigits(primerDia)+"' and f.FechaFinal <= '"+formatDateCreationSingleDigits(fechaCalFinal)+"') where c.Anio = '"+year+"' and c.Departamento = '2'", (err, result) => {
        // ... error checks
 
        console.dir(result);
        console.dir('ana');
        if(result)
            arregloConTodo = result.recordset;
        getDepartments();
    })
 
})

var arregloConTodo = []
var arregloComponentes = []
var arregloElementos = []
var arregloPracticas = []
var arregloActividades = []
var arregloDepartamentos = []
var arregloComponentesFiltrados = []
var arregloElementosFiltrados = []
var arregloPracticasFiltrados = []
var arregloActividadesFiltrados = []
var arregloDepartamentosFiltrados = []

var componenteSeleccionado
var elementoSeleccionado
var practicaSeleccionada

var dontShowLoadScreenOnPageLoad = true
var dontShowLoadScreen = false
var dontShowLoadScreenRepeatedTimes = false

//****************************** COMPONENTES ************************************

function getComponents (where) {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Componente "+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloComponentes = result.recordset;
                    processComponentsArray();
                });
            }
        });
    }); // fin transaction
}

/*"select c.ID, c.Descripcion, c.Nombre f.PorcentajeCompletadoEjecucion from Componente c
join Elemento e on e.Componente = c.ID
join Practica p on p.Elemento = e.ID
join Actividad a on a.Practica = p.ID
join Actividad_FechasFinales f on f.Actividad = a.ID
where c.Anio = '+year+' and (f.FechaFinal >= primerDia and f.FechaFinal <= fechaCalFinal)"*/

function processComponentsArray () {
    var newArr = [];
    var arrDivisores1 = [];
    for (var i = 0; i < arregloComponentes.length; i++) {
        for (var j = 0; j < arregloElementos.length; j++) {
            if( inArrayComponentTableComEle(arregloComponentes[i].Nombre, arregloElementos[j].Nombre, arregloConTodo) >= 0 && arregloElementos[j].PorcentajeCompletado > 0){
                if(arrDivisores1[i] != undefined)
                    arrDivisores1[i]++;
                else
                    arrDivisores1[i] = 1;
                console.log('EEENTROOOOO')
                var tot = 0;
                if(arregloElementos[j].PorcentajeCompletado != null)
                    tot = arregloElementos[j].PorcentajeCompletado;
                console.log(arregloComponentes[i].PorcentajeCompletado)
                arregloComponentes[i].PorcentajeCompletado+= tot;
                console.log(arregloComponentes[i].PorcentajeCompletado)
            }
        };
    };
    for (var i = 0; i < arregloComponentes.length; i++) {
        if(arrDivisores1[i] != null && arrDivisores1[i] != undefined){
            console.log(arregloComponentes[i])
            console.log(arrDivisores1[i])
            console.log('i='+i)
            arregloComponentes[i]/=arrDivisores1[i];
            console.log(arregloComponentes[i])
        }
    };
    /*for (var i = 0; i < arregloComponentes.length; i++) {
        if( inArrayComponentTableE(arregloComponentes[i].Nombre, newArr) >= 0 ){
            if(arregloComponentes[i].PorcentajeCompletadoEjecucion != null){
                arrDivisores[inArrayComponentTableE(arregloComponentes[i].Nombre, newArr)]++;
                //console.log(newArr[inArrayComponentTableE(arregloComponentes[i].Nombre, newArr)].PorcentajeCompletado)
                var num = arregloComponentes[i].PorcentajeCompletadoEjecucion;
                var den = arregloComponentes[i].PorcentajeCompletadoPlaneacion;
                var tot = num/den;
                console.log(num)
                console.log(den)
                console.log(tot)
                newArr[inArrayComponentTableE(arregloComponentes[i].Nombre, newArr)].PorcentajeCompletado+= tot;
                console.log(newArr[inArrayComponentTableE(arregloComponentes[i].Nombre, newArr)].PorcentajeCompletado)
                console.log(arregloComponentes[i])
            }
        } else{
            if(arregloComponentes[i].PorcentajeCompletadoEjecucion != null){
                var num = arregloComponentes[i].PorcentajeCompletadoEjecucion;
                var den = arregloComponentes[i].PorcentajeCompletadoPlaneacion;
                var tot = num/den;
                newArr.push({ID: arregloComponentes[i].ID, Descripcion: arregloComponentes[i].Descripcion, Departamento: arregloComponentes[i].Departamento, PorcentajeCompletado: tot, Nombre: arregloComponentes[i].Nombre });
            } else
                newArr.push({ID: arregloComponentes[i].ID, Descripcion: arregloComponentes[i].Descripcion, Departamento: arregloComponentes[i].Departamento, PorcentajeCompletado: 0, Nombre: arregloComponentes[i].Nombre });
            arrDivisores.push(1);
        }
    }*/
    //arregloComponentes = newArr.slice();
    console.log('arregloComponentes')
    console.log(arregloComponentes)
    console.log(arrDivisores)

    arregloComponentesFiltrados = JSON.parse(JSON.stringify(arregloComponentes));
    listComponents();
    addNoResults(0);
}

function inArrayComponentTableE (nombre, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Nombre == nombre)
            return i;
    };
    return -1;
}

function inArrayComponentTableElePra (nombre1, nombre2, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Nombre[1] == nombre1 && data[i].Nombre[2] == nombre2)
            return i;
    };
    return -1;
}

function inArrayComponentTableComEle (nombre1, nombre2, data) {
    for (var i = 0; i < data.length; i++) {
        if(data[i].Nombre[0] == nombre1 && data[i].Nombre[1] == nombre2)
            return i;
    };
    return -1;
}

function listComponents () {
    var percentage = $('#porcentaje').val();
    var percentageOption = $('#porcentajeOpcion').val();
    for (var i = 0; i < arregloComponentesFiltrados.length; i++) {
        console.log(arregloComponentesFiltrados[i].PorcentajeCompletado)
        if(arregloComponentesFiltrados[i]!= null || arregloComponentesFiltrados[i]!= undefined)
            arregloComponentesFiltrados[i].PorcentajeCompletado*=100;
        console.log(arregloComponentesFiltrados[i].PorcentajeCompletado)
    }
    if( !isNaN(percentage) && percentage.length>0 ){
        if(percentageOption == "higher")
            arregloComponentesFiltrados = arregloComponentesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado > percentage)
                                        return index;
                                });
        else if(percentageOption == "higherEq")
            arregloComponentesFiltrados = arregloComponentesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado >= percentage)
                                        return index;
                                });
        else if(percentageOption == "lesser")
            arregloComponentesFiltrados = arregloComponentesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado < percentage)
                                        return index;
                                });
        else
            arregloComponentesFiltrados = arregloComponentesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado <= percentage)
                                        return index;
                                });
    }
    var booleanAgregarRow = false;
    var div;
    var booleanAcabaDeEntrar = false;
    var html = '';
    var nivel = 0;
    for (var i = 0; i < arregloComponentesFiltrados.length; i++) {
        //agregar .row si i%4==0
        if( i%4 == 0 && !booleanAgregarRow){
            booleanAgregarRow = true;
            html = '';
            booleanAcabaDeEntrar = true;
        }
        if (i == 0)
            html += '<h1 class="text-light">'+
                        'Componentes'+
                    '<br/></h1>';
        var colorCarta;
        if(arregloComponentesFiltrados[i].PorcentajeCompletado >= 80)
            colorCarta = 'style-success';
        else if(arregloComponentesFiltrados[i].PorcentajeCompletado >= 60)
            colorCarta = 'style-warning';
        else
            colorCarta = 'style-danger';
        var total1;
        if( arregloComponentesFiltrados[i].PorcentajeCompletado!= null || arregloComponentesFiltrados[i].PorcentajeCompletado!= undefined && arregloComponentesFiltrados[i].PorcentajeCompletado.toString().length>5)
            total1 = arregloComponentesFiltrados[i].PorcentajeCompletado.toFixed(1);
        else if( arregloComponentesFiltrados[i].PorcentajeCompletado!= null || arregloComponentesFiltrados[i].PorcentajeCompletado!= undefined)
            total1 = arregloComponentesFiltrados[i].PorcentajeCompletado;
        html += '<div class="col-md-3">'+
                    '<div class="card card-type-pricing text-center makeHover" onclick="selectComponent('+i+')" style="overflow: hidden;">'+
                        '<div class="card-body '+colorCarta+' cartas'+nivel+'">'+
                            '<h2 class="text-light">'+arregloComponentesFiltrados[i].Descripcion+'</h2>'+
                            '<div class="price">'+
                                '<h2><span class="text-xxxl">'+total1+'</span></h2> <span class="text-lg">%</span>'+
                            '</div>'+
                            '<br/>'+
                            '<p class="opacity-50"><em>Nombre: '+arregloComponentesFiltrados[i].Nombre+'</em></p>'+
                        '</div>'+
                    '</div>'+
                '</div>';
        //agregar fin .row si i%3==0
        if( (i%3 == 0 || i == arregloComponentesFiltrados.length-1) && booleanAgregarRow && (!booleanAcabaDeEntrar || i == arregloComponentesFiltrados.length-1) ){
            nivel++;
            booleanAgregarRow = false;
            div = document.createElement('div');
            div.className = 'row style-default-light text-center';
            div.style.padding = '3%';
            div.innerHTML = html;
            document.getElementById("contenedorPuntaje").appendChild(div);
        }
        booleanAcabaDeEntrar = false;
    };
    nivel = 0;
    for (var i = 0; i < arregloComponentesFiltrados.length; i++) {
        if( (i%3 == 0 && i != 0) || i == arregloComponentesFiltrados.length-1)
            nivel++;
        var altura = 0;
        $( ".cartas"+nivel ).each(function() {
            if(altura < $( this ).height())
                altura = $( this ).height();
        });

        $( ".cartas"+nivel ).each(function() {
            $( this ).height(altura);
        });

        var alturaContent = 0;
        $( ".cartas"+nivel+" > div > h2 > span" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas"+nivel+" > div > h2 > span" ).each(function() {
            $( this ).height(alturaContent);
        });

        alturaContent = 0;
        $( ".cartas"+nivel+" > h2" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas"+nivel+" > h2" ).each(function() {
            $( this ).height(alturaContent);
        });
    };
}

function selectComponent (index) {
    $('#dim_wrapper').show();
    setTimeout("", 350);
    clearElements();
    clearPractice();
    clearActivity();
    if(componenteSeleccionado == null || componenteSeleccionado.ID != arregloComponentes[index].ID){
        componenteSeleccionado = arregloComponentes[index];
        /*var where = "";
        var department = $('#departamento').val();
        if(department != 'all')
            where = " where Componente = "+componenteSeleccionado.ID+" and Departamento = "+department;
        else
            where = " where Componente = "+componenteSeleccionado.ID;*/
        var mes1 = $("#fechaInicial").val(), mes2 = $("#fechaFinal").val();
        var fecha1 = new Date( mes1.split("-")[2], (mes1.split("-")[1]-1), mes1.split("-")[0] );
        var fecha2 = new Date( mes2.split("-")[2], (mes2.split("-")[1]-1), mes2.split("-")[0] );

        toastr.clear();
        toastr.options.positionClass = "toast-top-full-width";
        toastr.options.progressBar = true;
        toastr.options.showEasing = 'swing';
        toastr.options.hideEasing = 'swing';
        toastr.options.showMethod = 'slideDown';
        toastr.options.hideMethod = 'slideUp';
        
        var whereFechas = "";
        if(fecha1.getTime() <= fecha2.getTime()){
            whereFechas += " and ( '"+formatDateCreationSingleDigits(fecha1)+"' <= f.FechaFinal and f.FechaFinal <= '"+formatDateCreationSingleDigits(fecha2)+"') ";
        } else
            toastr.warning('Ingrese las fechas en orden. No se tomarón en cuenta para el filtro.', 'Advertencia');
        listElements();
        //alert(arregloElementos.length);
        addNoResults(1);
        //getElements(where, whereFechas);

    }
    else if(componenteSeleccionado.ID == arregloComponentes[index].ID){
        componenteSeleccionado = null;
        $("#dim_wrapper").animate({
            'opacity':0.85,
            height: 'toggle'
        }, 700);
        $('#dim_wrapper').hide(800);
    }
}

//****************************** FIN COMPONENTES ************************************

//****************************** ELEMENTOS ************************************

function getElements (where, whereFechas) {
    pool1.request().query("select * from Elemento "+whereFechas+where, (err, result) => {
        if (err) {
            console.log(err)
        }  else {
            console.log("Transaction committed Evidencia.");
            console.log(result);
            arregloElementos = result.recordset;
            processElementsArray();
        }
    });
}

function processElementsArray () {
    var newArr = [];
    var arrDivisores = [];

    for (var i = 0; i < arregloElementos.length; i++) {
        console.log(arregloElementos[i].PorcentajeCompletado)
        for (var j = 0; j < arregloPracticas.length; j++) {
            if( inArrayComponentTableElePra(arregloElementos[i].Nombre, arregloPracticas[j].Nombre, arregloConTodo) >= 0 && arregloPracticas[j].PorcentajeCompletado > 0){
                if(arrDivisores[i] != undefined)
                    arrDivisores[i]++;
                else
                    arrDivisores[i] = 1;
                var tot = 0;
                console.log('////////');
                console.log(arregloElementos[i].Nombre);
                console.log(arregloPracticas[j].Nombre);
                console.log(arregloPracticas[j].PorcentajeCompletado);
                console.log('////////');
                if(arregloPracticas[j].PorcentajeCompletado != null)
                    tot = arregloPracticas[j].PorcentajeCompletado;
                arregloElementos[i].PorcentajeCompletado+= tot;
            }
        };
        /*if( inArrayComponentTableE(arregloComponentes[i].Nombre[1], arregloElementos) >= 0 ){
            if(arrDivisores[inArrayComponentTableE(arregloComponentes[i].Nombre[1], arregloElementos)] != undefined)
                arrDivisores[inArrayComponentTableE(arregloComponentes[i].Nombre[1], arregloElementos)]++;
            else
                arrDivisores.push(1);
            var num = 0, den = 1, tot;
            if(arregloComponentes[i].PorcentajeCompletadoEjecucion != null)
                num = arregloComponentes[i].PorcentajeCompletadoEjecucion;
            if(arregloComponentes[i].PorcentajeCompletadoPlaneacion != null)
                den = arregloComponentes[i].PorcentajeCompletadoPlaneacion;
            tot = num/den;
            arregloElementos[inArrayComponentTableE(arregloComponentes[i].Nombre[1], arregloElementos)].PorcentajeCompletado+= tot;
        } else{
            newArr.push({ID: arregloElementos[i].ID, Descripcion: arregloElementos[i].Descripcion, Departamento: arregloElementos[i].Departamento, PorcentajeCompletado:arregloElementos[i].PorcentajeCompletado, Nombre: arregloElementos[i].Nombre });
            arrDivisores.push(1);
        }*/
    }
    for (var i = 0; i < arregloElementos.length; i++) {
        if(arrDivisores[i]!= null || arrDivisores[i]!= undefined)
            arregloElementos[i].PorcentajeCompletado/= arrDivisores[i];
    }
    getComponents("where Departamento = '1'")
    console.log('arregloElementos')
    console.log(arregloElementos)
    console.log(arrDivisores)
    arregloElementosFiltrados = arregloElementos.slice();
}

function listElements () {
    var percentage = $('#porcentaje').val();
    var percentageOption = $('#porcentajeOpcion').val();
    for (var i = 0; i < arregloElementosFiltrados.length; i++) {
        if(arregloElementosFiltrados[i]!= null || arregloElementosFiltrados[i]!= undefined)
            arregloElementosFiltrados[i].PorcentajeCompletado*=100;
    }
    if( !isNaN(percentage) && percentage.length>0 ){
        if(percentageOption == "higher")
            arregloElementosFiltrados = arregloElementosFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado > percentage)
                                        return index;
                                });
        else if(percentageOption == "higherEq")
            arregloElementosFiltrados = arregloElementosFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado >= percentage)
                                        return index;
                                });
        else if(percentageOption == "lesser")
            arregloElementosFiltrados = arregloElementosFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado < percentage)
                                        return index;
                                });
        else
            arregloElementosFiltrados = arregloElementosFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado <= percentage)
                                        return index;
                                });
    }
    var booleanAgregarRow = false;
    var div;
    var booleanAcabaDeEntrar = false;
    var html = '';
    var nivel = 0;
    var br = document.createElement('br');
    if(document.getElementById("contenedorPuntaje").getElementsByTagName("div").length > 0){
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
    }
    for (var i = 0; i < arregloElementosFiltrados.length; i++) {
        //agregar .row si i%4==0
        if( i%4 == 0 && !booleanAgregarRow){
            booleanAgregarRow = true;
            html = '';
            booleanAcabaDeEntrar = true;
        }
        if (i == 0)
            html += '<h1 class="text-light">'+
                        'Elementos de '+
                    '<strong class="text-accent-dark">'+
                        componenteSeleccionado.Descripcion+
                    '</strong><br/></h1>';
        var colorCarta;
        if(arregloElementosFiltrados[i].PorcentajeCompletado >= 80)
            colorCarta = 'style-success';
        else if(arregloElementosFiltrados[i].PorcentajeCompletado >= 60)
            colorCarta = 'style-warning';
        else
            colorCarta = 'style-danger';
        var total1;
        if(arregloElementosFiltrados[i].PorcentajeCompletado.toString().length>5)
            total1 = arregloElementosFiltrados[i].PorcentajeCompletado.toFixed(1);
        else
            total1 = arregloElementosFiltrados[i].PorcentajeCompletado;
        html += '<div class="col-md-3">'+
                    '<div class="card card-type-pricing text-center makeHover" onclick="selectElement('+i+')" style="overflow: hidden;">'+
                        '<div class="card-body '+colorCarta+' cartas2'+nivel+'">'+
                            '<h2 class="text-light">'+arregloElementosFiltrados[i].Descripcion+'</h2>'+
                            '<div class="price">'+
                                '<h2><span class="text-xxxl">'+total1+'</span></h2> <span class="text-lg">%</span>'+
                            '</div>'+
                            '<br/>'+
                            '<p class="opacity-50"><em>Nombre: '+arregloElementosFiltrados[i].Nombre+'</em></p>'+
                        '</div>'+
                    '</div>'+
                '</div>';
        //agregar fin .row si i%3==0
        if( ((i+1%4 == 0 && i > 0) || i == arregloElementosFiltrados.length-1) && booleanAgregarRow && (!booleanAcabaDeEntrar || i == arregloElementosFiltrados.length-1) ){
            nivel++;
            booleanAgregarRow = false;
            div = document.createElement('div');
            div.className = 'row style-primary-bright text-center';
            div.style.padding = '3%';
            div.innerHTML = html;
            document.getElementById("contenedorPuntaje").appendChild(div);
        }
        booleanAcabaDeEntrar = false;
    };
    nivel = 0;
    for (var i = 0; i < arregloElementosFiltrados.length; i++) {
        if( (i%3 == 0 && i != 0) || i == arregloElementosFiltrados.length-1)
            nivel++;
        var altura = 0;
        $( ".cartas2"+nivel ).each(function() {
            if(altura < $( this ).height())
                altura = $( this ).height();
        });

        $( ".cartas2"+nivel ).each(function() {
            $( this ).height(altura);
        });

        var alturaContent = 0;
        $( ".cartas2"+nivel+" > div > h2 > span" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas2"+nivel+" > div > h2 > span" ).each(function() {
            $( this ).height(alturaContent);
        });

        alturaContent = 0;
        $( ".cartas2"+nivel+" > h2" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas2"+nivel+" > h2" ).each(function() {
            $( this ).height(alturaContent);
        });
    };
}

function selectElement (index) {
    $('#dim_wrapper').show();
    setTimeout("", 350);
    clearPractice();
    clearActivity();
    if(elementoSeleccionado == null || elementoSeleccionado != arregloElementos[index]){
        elementoSeleccionado = arregloElementos[index];
        /*var where = "";
        var department = $('#departamento').val();
        if(department != 'all')
            where = "where Elemento = "+elementoSeleccionado.ID;
        else
            where = "";
        getPractices(where);*/
        listPractices();
        addNoResults(2);
    }
    else if(elementoSeleccionado == arregloElementos[index]){
        elementoSeleccionado = null;
        $("#dim_wrapper").animate({
            'opacity':0.85,
            height: 'toggle'
        }, 700);
        $('#dim_wrapper').hide(800);
    }
}

//****************************** FIN ELEMENTOS ************************************

//****************************** PRACTICAS ************************************

function getPractices (where) {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Practica "+where, (err, result) => {
        if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloPracticas = result.recordset;
                    processPracticesArray();
                });
            }
        });
    }); // fin transaction
}

function processPracticesArray () {
    var newArr = [];
    var arrDivisores = [];
    for (var i = 0; i < arregloConTodo.length; i++) {
        if( inArrayComponentTableE(arregloConTodo[i].Nombre[2], arregloPracticas) >= 0 ){
            if(arregloConTodo[i].PorcentajeCompletadoEjecucion != null && arregloConTodo[i].PorcentajeCompletadoEjecucion > 0){
                if(arrDivisores[inArrayComponentTableE(arregloConTodo[i].Nombre[2], arregloPracticas)] != undefined)
                    arrDivisores[inArrayComponentTableE(arregloConTodo[i].Nombre[2], arregloPracticas)]++;
                else
                    arrDivisores[i] = 1;
                var num = 0, den = 1, tot;
                if(arregloConTodo[i].PorcentajeCompletadoEjecucion != null)
                    num = arregloConTodo[i].PorcentajeCompletadoEjecucion;
                if(arregloConTodo[i].PorcentajeCompletadoPlaneacion != null)
                    den = arregloConTodo[i].PorcentajeCompletadoPlaneacion;
                tot = num/den;
                arregloPracticas[inArrayComponentTableE(arregloConTodo[i].Nombre[2], arregloPracticas)].PorcentajeCompletado+= tot;
            }
        }/* else{
            newArr.push({ID: arregloPracticas[i].ID, Descripcion: arregloPracticas[i].Descripcion, Departamento: arregloPracticas[i].Departamento, PorcentajeCompletado:arregloPracticas[i].PorcentajeCompletado, Nombre: arregloPracticas[i].Nombre });
            arrDivisores.push(1);
        }*/
    }
    for (var i = 0; i < arregloPracticas.length; i++) {
        if(arrDivisores[i]!= null || arrDivisores[i]!= undefined)
            arregloPracticas[i].PorcentajeCompletado/= arrDivisores[i];
    }
    //arregloPracticas = newArr.slice();
    console.log('arregloPracticas')
    console.log(arregloPracticas)
    console.log(arrDivisores)
    getElements(" where Departamento = 1","");
    arregloPracticasFiltrados = arregloPracticas.slice();
}

function listPractices () {
    var percentage = $('#porcentaje').val();
    var percentageOption = $('#porcentajeOpcion').val();
    for (var i = 0; i < arregloPracticasFiltrados.length; i++) {
        if(arregloPracticasFiltrados[i]!= null || arregloPracticasFiltrados[i]!= undefined)
            arregloPracticasFiltrados[i].PorcentajeCompletado*=100;
    }
    if( !isNaN(percentage) && percentage.length>0 ){
        if(percentageOption == "higher")
            arregloPracticasFiltrados = arregloPracticasFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado > percentage)
                                        return index;
                                });
        else if(percentageOption == "higherEq")
            arregloPracticasFiltrados = arregloPracticasFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado >= percentage)
                                        return index;
                                });
        else if(percentageOption == "lesser")
            arregloPracticasFiltrados = arregloPracticasFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado < percentage)
                                        return index;
                                });
        else
            arregloPracticasFiltrados = arregloPracticasFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado <= percentage)
                                        return index;
                                });
    }
    var booleanAgregarRow = false;
    var div;
    var booleanAcabaDeEntrar = false;
    var html = '';
    var nivel = 0;
    var br = document.createElement('br');
    if(document.getElementById("contenedorPuntaje").getElementsByTagName("div").length > 0){
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
    }
    for (var i = 0; i < arregloPracticasFiltrados.length; i++) {
        //agregar .row si i%4==0
        if( i%4 == 0 && !booleanAgregarRow){
            booleanAgregarRow = true;
            html = '';
            booleanAcabaDeEntrar = true;
        }
        if (i == 0)
            html += '<h1 class="text-light">'+
                        'Practicas de '+
                    '<strong class="text-accent-dark">'+
                        elementoSeleccionado.Descripcion+
                    '</strong><br/></h1>';
        var colorCarta;
        if(arregloPracticasFiltrados[i].PorcentajeCompletado >= 90)
            colorCarta = 'style-success';
        else if(arregloPracticasFiltrados[i].PorcentajeCompletado >= 60)
            colorCarta = 'style-warning';
        else
            colorCarta = 'style-danger';
        var total1;
        if(arregloPracticasFiltrados[i].PorcentajeCompletado.toString().length>5)
            total1 = arregloPracticasFiltrados[i].PorcentajeCompletado.toFixed(1);
        else
            total1 = arregloPracticasFiltrados[i].PorcentajeCompletado;
        html += '<div class="col-md-3">'+
                    '<div class="card card-type-pricing text-center makeHover" onclick="selectPractice('+i+')" style="overflow: hidden;">'+
                        '<div class="card-body '+colorCarta+' cartas3'+nivel+'">'+
                            '<h2 class="text-light text-lg">'+arregloPracticasFiltrados[i].Descripcion+'</h2>'+
                            '<div class="price">'+
                                '<h2><span class="text-xxxl">'+total1+'</span></h2> <span class="text-lg">%</span>'+
                            '</div>'+
                            '<br/>'+
                            '<p class="opacity-50"><em>Nombre: '+arregloPracticasFiltrados[i].Nombre+'</em></p>'+
                        '</div>'+
                    '</div>'+
                '</div>';
        //agregar fin .row si i%3==0
        if( ((i+1%4 == 0 && i > 0) || i == arregloPracticasFiltrados.length-1) && booleanAgregarRow && (!booleanAcabaDeEntrar || i == arregloPracticasFiltrados.length-1) ){
            nivel++;
            booleanAgregarRow = false;
            div = document.createElement('div');
            div.className = 'row style-accent-bright text-center';
            div.style.padding = '3%';
            div.innerHTML = html;
            document.getElementById("contenedorPuntaje").appendChild(div);
            console.log('cambio en i = '+i)
        }
        booleanAcabaDeEntrar = false;
    };
    nivel = 0;
    for (var i = 0; i < arregloPracticasFiltrados.length; i++) {
        if( (i%3 == 0 && i != 0) || i == arregloPracticasFiltrados.length-1)
            nivel++;
        var altura = 0;
        $( ".cartas3"+nivel ).each(function() {
            if(altura < $( this ).height())
                altura = $( this ).height();
        });

        $( ".cartas3"+nivel ).each(function() {
            $( this ).height(altura);
        });

        var alturaContent = 0;
        $( ".cartas3"+nivel+" > div > h2 > span" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas3"+nivel+" > div > h2 > span" ).each(function() {
            $( this ).height(alturaContent);
        });

        alturaContent = 0;
        $( ".cartas3"+nivel+" > h2" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas3"+nivel+" > h2" ).each(function() {
            $( this ).height(alturaContent);
        });
    };
}

function selectPractice (index) {
    $('#dim_wrapper').show();
    setTimeout("", 350);
    clearActivity();
    if(practicaSeleccionada == null || practicaSeleccionada != arregloPracticas[index]){
        practicaSeleccionada = arregloPracticas[index];
        /*var where = "";
        var department = $('#departamento').val();
        if(department != 'all')
            where = "where Actividad = "+practicaSeleccionada.ID;
        else
            where = "";
        getActivities(where);*/
        listActivities();
        addNoResults(3);
    }
    else if(practicaSeleccionada == arregloPracticas[index]){
        practicaSeleccionada = null;
        $("#dim_wrapper").animate({
            'opacity':0.85,
            height: 'toggle'
        }, 700);
        $('#dim_wrapper').hide(800);
    }
}

//****************************** FIN PRACTICAS ************************************

//****************************** ACTIVIDADES ************************************

function getActivities (where) {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Actividad "+where, (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloActividades = result.recordset;
                    processActivitiesArray();
                });
            }
        });
    }); // fin transaction
}

function processActivitiesArray () {
    var newArr = [];
    var arrDivisores = [];
    for (var i = 0; i < arregloConTodo.length; i++) {
        if( inArrayComponentTableE(arregloConTodo[i].Nombre[3], arregloActividades) >= 0 ){
            if(arrDivisores[inArrayComponentTableE(arregloConTodo[i].Nombre[3], arregloActividades)] != undefined)
                arrDivisores[inArrayComponentTableE(arregloConTodo[i].Nombre[3], arregloActividades)]++;
            else
                arrDivisores[i] = 1;
            var num = 0, den = 1, tot;
            if(arregloConTodo[i].PorcentajeCompletadoEjecucion != null)
                num = arregloConTodo[i].PorcentajeCompletadoEjecucion;
            if(arregloConTodo[i].PorcentajeCompletadoPlaneacion != null)
                den = arregloConTodo[i].PorcentajeCompletadoPlaneacion;
            tot = num/den;
            arregloActividades[inArrayComponentTableE(arregloConTodo[i].Nombre[3], arregloActividades)].PorcentajeCompletado+= tot;
        }
        /*} else{
            newArr.push({ID: arregloActividades[i].ID, Descripcion: arregloActividades[i].Descripcion, Departamento: arregloActividades[i].Departamento, PorcentajeCompletado:arregloActividades[i].PorcentajeCompletado, Nombre: arregloActividades[i].Nombre, Responsable: arregloActividades[i].Responsable });
            arrDivisores.push(1);
        }*/
    }
    for (var i = 0; i < arregloActividades.length; i++) {
        if(arrDivisores[i]!= null || arrDivisores[i]!= undefined)
            arregloActividades[i].PorcentajeCompletado/= arrDivisores[i];
    }
    console.log('arregloActividades')
    console.log(arregloActividades)
    console.log(arrDivisores)
    //arregloActividades = newArr.slice();
    getPractices(" where Departamento = '1'")
    arregloActividadesFiltrados = arregloActividades.slice();
}

function listActivities () {
    var percentage = $('#porcentaje').val();
    var percentageOption = $('#porcentajeOpcion').val();
    for (var i = 0; i < arregloActividadesFiltrados.length; i++) {
        if(arregloActividadesFiltrados[i]!= null || arregloActividadesFiltrados[i]!= undefined)
            arregloActividadesFiltrados[i].PorcentajeCompletado*=100;
    }
    if( !isNaN(percentage) && percentage.length>0 ){
        if(percentageOption == "higher")
            arregloActividadesFiltrados = arregloActividadesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado > percentage)
                                        return index;
                                });
        else if(percentageOption == "higherEq")
            arregloActividadesFiltrados = arregloActividadesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado >= percentage)
                                        return index;
                                });
        else if(percentageOption == "lesser")
            arregloActividadesFiltrados = arregloActividadesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado < percentage)
                                        return index;
                                });
        else
            arregloActividadesFiltrados = arregloActividadesFiltrados.filter(function( index ) {
                                    if(index.PorcentajeCompletado <= percentage)
                                        return index;
                                });
    }
    var booleanAgregarRow = false;
    var div;
    var booleanAcabaDeEntrar = false;
    var html = '';
    var nivel = 0;
    var br = document.createElement('br');
    if(document.getElementById("contenedorPuntaje").getElementsByTagName("div").length > 0){
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
        document.getElementById("contenedorPuntaje").appendChild(br);
    }
    for (var i = 0; i < arregloActividadesFiltrados.length; i++) {
        //agregar .row si i%4==0
        if( i%4 == 0 && !booleanAgregarRow){
            booleanAgregarRow = true;
            html = '';
            booleanAcabaDeEntrar = true;
        }
        if (i == 0)
            html += '<h1 class="text-light">'+
                        'Actividades de '+
                    '<strong class="text-accent-dark">'+
                        practicaSeleccionada.Descripcion+
                    '</strong><br/></h1>';
        var colorCarta;
        if(arregloActividadesFiltrados[i].PorcentajeCompletado >= 80)
            colorCarta = 'style-success';
        else if(arregloActividadesFiltrados[i].PorcentajeCompletado >= 60)
            colorCarta = 'style-warning';
        else
            colorCarta = 'style-danger';
        var total1;
        if(arregloActividadesFiltrados[i].PorcentajeCompletado.toString().length>5)
            total1 = arregloActividadesFiltrados[i].PorcentajeCompletado.toFixed(1);
        else
            total1 = arregloActividadesFiltrados[i].PorcentajeCompletado;
        html += '<div class="col-md-3">'+
                    '<div class="card card-type-pricing text-center" style="overflow: hidden;">'+
                        '<div class="card-body '+colorCarta+' cartas4'+nivel+'">'+
                            '<h2 class="text-light text-lg">'+arregloActividadesFiltrados[i].Descripcion+'</h2>'+
                            '<div class="price">'+
                                '<h2><span class="text-xxxl">'+total1+'</span></h2> <span class="text-lg">%</span>'+
                            '</div>'+
                            '<br/>'+
                            '<p class="opacity-50"><em>Nombre: '+arregloActividadesFiltrados[i].Nombre+'</em></p>'+
                        '</div>'+
                        '<div class="card-body no-padding">'+
                            '<ul class="list-unstyled">'+
                                '<li>'+arregloActividadesFiltrados[i].Responsable+'</li>'+
                            '</ul>'+
                        '</div>'+
                    '</div>'+
                '</div>';
        //agregar fin .row si i%3==0
        if( ((i+1%4 == 0 && i > 0) || i == arregloActividadesFiltrados.length-1) && booleanAgregarRow && (!booleanAcabaDeEntrar || i == arregloActividadesFiltrados.length-1) ){
            nivel++;
            booleanAgregarRow = false;
            div = document.createElement('div');
            div.className = 'row style-gray-bright text-center';
            div.style.padding = '3%';
            div.innerHTML = html;
            document.getElementById("contenedorPuntaje").appendChild(div);
        }
        booleanAcabaDeEntrar = false;
    };
    nivel = 0;
    for (var i = 0; i < arregloActividadesFiltrados.length; i++) {
        if( (i%3 == 0 && i != 0) || i == arregloActividadesFiltrados.length-1)
            nivel++;
        var altura = 0;
        $( ".cartas4"+nivel ).each(function() {
            if(altura < $( this ).height())
                altura = $( this ).height();
        });

        $( ".cartas4"+nivel ).each(function() {
            $( this ).height(altura);
        });

        var alturaContent = 0;
        $( ".cartas4"+nivel+" > div > h2 > span" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas4"+nivel+" > div > h2 > span" ).each(function() {
            $( this ).height(alturaContent);
        });

        alturaContent = 0;
        $( ".cartas4"+nivel+" > h2" ).each(function() {
            if(alturaContent < $( this ).height())
                alturaContent = $( this ).height();
        });

        $( ".cartas4"+nivel+" > h2" ).each(function() {
            $( this ).height(alturaContent);
        });
    };
}

//****************************** FIN ACTIVIDADES ************************************

//****************************** DEPARTAMENTOS ************************************
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
                    initSelect2Boxes();
                    //processComponentsArray();
                    getActivities(" where Departamento = '1'");
                });
            }
        });
    }); // fin transaction
}
//****************************** FIN DEPARTAMENTOS ************************************

$("#porcentaje").tooltip("disable");

//****************************** QUERY ************************************
function filter () {
    $("#porcentaje").tooltip("enable");
    var year = $('#anio').val();
    var department = $('#departamento').val();
    var percentage = $('#porcentaje').val();
    var percentageOption = $('#porcentajeOpcion').val();
    var field = $('#campo').val();
    var fieldOption = $('#campoOpcion').val();
    var buscarComponentes = document.getElementById("contenedorPuntaje").getElementsByClassName("style-default-light").length > 0;
    var buscarElementos =  document.getElementById("contenedorPuntaje").getElementsByClassName("style-primary-bright").length > 0;
    var buscarPracticas =  document.getElementById("contenedorPuntaje").getElementsByClassName("style-accent-bright").length > 0;
    var buscarActividades =  document.getElementById("contenedorPuntaje").getElementsByClassName("style-gray-bright").length > 0;

    toastr.clear();
    toastr.options.positionClass = "toast-top-full-width";
    toastr.options.progressBar = true;
    toastr.options.showEasing = 'swing';
    toastr.options.hideEasing = 'swing';
    toastr.options.showMethod = 'slideDown';
    toastr.options.hideMethod = 'slideUp';

    var stringSearch = "where Anio = "+year;
    var stringSearchAll = stringSearch, stringSearchAllConResponsale = stringSearch;
    if(department != 'all')
        stringSearch+=" and Departamento = "+department;
    if( !isNaN(percentage) && percentage.length>0 ){
        if(percentageOption == "higher")
            stringSearch+=" and PorcentajeCompletado > "+percentage;
        else if(percentageOption == "higherEq")
            stringSearch+=" and PorcentajeCompletado >= "+percentage;
        else if(percentageOption == "lesser")
            stringSearch+=" and PorcentajeCompletado < "+percentage;
        else
            stringSearch+=" and PorcentajeCompletado <= "+percentage;
        $("#porcentaje").tooltip("disable");
    } else if(percentage.length>0){
        toastr.error('Ingrese un porcentaje de completación válido.', 'Error');
        $("#porcentaje").tooltip("disable");
    }
    else if(percentage.length==0){
        $('#porcentaje').tooltip("show");
        setTimeout('$("#porcentaje").tooltip("hide");', 1000);
        setTimeout('$("#porcentaje").tooltip("disable");', 1200);
    }
    var stringSearchConResponsale = stringSearch;
    if(field.length>0){
        if(fieldOption == "name"){
            stringSearch+=" and Nombre = '"+field+"'";
            stringSearchConResponsale+=" and Nombre = '"+field+"'";
            stringSearchAll+=" and Nombre = '"+field+"'";
            stringSearchAllConResponsale+=" and Nombre = '"+field+"'";
        }
        else if(fieldOption == "desc"){
            stringSearch+=" and Descripcion = '"+field+"'";
            stringSearchConResponsale+=" and Descripcion = '"+field+"'";
            stringSearchAll+=" and Descripcion = '"+field+"'";
            stringSearchAllConResponsale+=" and Descripcion = '"+field+"'";
        }
        else{
            stringSearchConResponsale+=" and Responsable = '"+field+"'";
            stringSearchAllConResponsale+=" and Responsable = '"+field+"'";
        }
    } else if(field.length>0)
        toastr.error('Ingrese un texto de campo válido.', 'Error');

    clearContent ();
    dontShowLoadScreen = true;

    var newStringSearch1 =  stringSearchAll;
    if(componenteSeleccionado != null && department != 'all')
        newStringSearch1 = stringSearch+" and Componente = "+componenteSeleccionado.ID;
    var newStringSearch2 =  stringSearchAll;
    if(elementoSeleccionado != null && department != 'all')
        newStringSearch2 =  stringSearch+" and Elemento = "+elementoSeleccionado.ID;
    var newStringSearch3 =  stringSearchAll;
    if(practicaSeleccionada != null && department != 'all')
        newStringSearch3 =  stringSearchConResponsale+" and Practica = "+practicaSeleccionada.ID;
    if(department != 'all')
        querySearch(stringSearch, newStringSearch1, newStringSearch2, newStringSearch3, buscarComponentes, buscarElementos, buscarPracticas, buscarActividades);
    else
        querySearch(stringSearchAll, newStringSearch1, newStringSearch2, stringSearchAllConResponsale, buscarComponentes, buscarElementos, buscarPracticas, buscarActividades);
    setTimeout("dontShowLoadScreen = false;", 1500);
    setTimeout(function(){
        $('#dim_wrapper').is(":visible"); 
            $('#dim_wrapper').hide(800);
    }, 1520);
}


function querySearch (whereC, whereE, whereP, whereA, buscarC, buscarE, buscarP, buscarA) {
    const transactionC = new sql.Transaction( pool1 );
    transactionC.begin(err => {
        var rolledBack = false
 
        transactionC.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const requestC = new sql.Request(transactionC);
        requestC.query("select * from Componente "+whereC, (err, result) => {
            if (err) {
                console.log(err)
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transactionC.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transactionC.commit(err => {
                    // ... error checks
                    console.log("Transaction committed Evidencia.");
                    console.log(result);
                    arregloComponentes = result.recordset;
                    processComponentsArray();
                    if(buscarE){
                        const transactionE = new sql.Transaction( pool1 );
                        transactionE.begin(err => {
                            var rolledBack = false
                     
                            transactionE.on('rollback', aborted => {
                                // emited with aborted === true
                         
                                rolledBack = true
                            })
                            const requestE = new sql.Request(transactionE);
                            requestE.query("select * from Elemento "+whereE, (err, result) => {
                                if (err) {
                                    console.log(err)
                                    if (!rolledBack) {
                                        console.log('error en rolledBack');
                                        transactionE.rollback(err => {
                                            // ... error checks
                                        });
                                    }
                                }  else {
                                    transactionE.commit(err => {
                                        // ... error checks
                                        console.log("Transaction committed Evidencia.");
                                        console.log(result);
                                        arregloElementos = result.recordset;
                                        processElementsArray();
                                        if(buscarP){
                                            const transactionP = new sql.Transaction( pool1 );
                                            transactionP.begin(err => {
                                                var rolledBack = false
                                         
                                                transactionP.on('rollback', aborted => {
                                                    // emited with aborted === true
                                             
                                                    rolledBack = true
                                                })
                                                const requestP = new sql.Request(transactionP);
                                                requestP.query("select * from Practica "+whereP, (err, result) => {
                                                    if (err) {
                                                        console.log(err)
                                                        if (!rolledBack) {
                                                            console.log('error en rolledBack');
                                                            transactionP.rollback(err => {
                                                                // ... error checks
                                                            });
                                                        }
                                                    }  else {
                                                        transactionP.commit(err => {
                                                            // ... error checks
                                                            console.log("Transaction committed Evidencia.");
                                                            console.log(result);
                                                            arregloPracticas = result.recordset;
                                                            processPracticesArray();
                                                            if(buscarA){
                                                                const transactionA = new sql.Transaction( pool1 );
                                                                transactionA.begin(err => {
                                                                    var rolledBack = false
                                                             
                                                                    transactionA.on('rollback', aborted => {
                                                                        // emited with aborted === true
                                                                 
                                                                        rolledBack = true
                                                                    })
                                                                    const requestA = new sql.Request(transactionA);
                                                                    requestA.query("select * from Actividad "+whereA, (err, result) => {
                                                                        if (err) {
                                                                            console.log(err)
                                                                            if (!rolledBack) {
                                                                                console.log('error en rolledBack');
                                                                                transactionA.rollback(err => {
                                                                                    // ... error checks
                                                                                });
                                                                            }
                                                                        }  else {
                                                                            transactionA.commit(err => {
                                                                                // ... error checks
                                                                                console.log("Transaction committed Evidencia.");
                                                                                console.log(result);
                                                                                arregloActividades = result.recordset;
                                                                                processActivitiesArray();
                                                                            });
                                                                        }
                                                                    });
                                                                }); // fin transaction
                                                            }
                                                        });
                                                    }
                                                });
                                            }); // fin transactionP
                                        }
                                    });
                                }
                            });
                        }); // fin transactionE
                    }
                });
            }
        });
    }); // fin transactionC
}

//****************************** FIN QUERY ************************************

function initSelect2Boxes () {
    var arregloPresentarAnios = [];
    for (var i = 0; i < arregloDepartamentos.length; i++) {
        arregloPresentarAnios.push({id:arregloDepartamentos[i].ID, text:arregloDepartamentos[i].Nombre});
    };
    $("#departamento").select2({
        data: arregloPresentarAnios
    });
    var hoy = new Date();
    var arregloAnios = [];
    for (var i = 2000; i <= hoy.getFullYear(); i++) {
        if(i == hoy.getFullYear())
            arregloAnios.push({"id": i, "text": i, "selected": true});
        else
            arregloAnios.push(i);
    };
    $("#anio").select2({
        data: arregloAnios
    });
    $('#anio').val(year).trigger('change'); 
    $("#anio").on("select2:select", function (e) {
        var anio = e.currentTarget.value;
        $('#fechaInicial').datepicker('setStartDate', new Date(anio, 0, 1) );
        $('#fechaInicial').datepicker('setEndDate', new Date(anio, 11, 31) );
        $("#fechaInicial").datepicker( "setDate" , new Date(anio, 0, 1) );
        primerDia = new Date(anio, 0, 1);
        var fechaCalFinal = new Date();
        if(anio == fechaCalFinal.getFullYear())
            fechaCalFinal = fechaCalFinal;
        else
            fechaCalFinal = new Date(anio, 11, 31);
        $('#fechaFinal').datepicker('setStartDate', new Date(anio, 0, 1) );
        $('#fechaFinal').datepicker('setEndDate', new Date(anio, 11, 31) );
        $("#fechaFinal").datepicker( "setDate" , new Date(fechaCalFinal.getFullYear(), fechaCalFinal.getMonth(), fechaCalFinal.getDate()) );
    });
}

function clearContent () {
    var tam = document.getElementById("contenedorPuntaje").getElementsByTagName("div").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByTagName("div")[i]
        node.parentNode.removeChild(node)
    }
    var tam2 = document.getElementById("contenedorPuntaje").getElementsByTagName("br").length;
    for(var i = tam2-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByTagName("br")[i]
        if(i > 2)
            node.parentNode.removeChild(node)
    }
}

function clearElements () {
    //arregloElementos = [];
    var tam = document.getElementById("contenedorPuntaje").getElementsByClassName("style-primary-bright").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByClassName("style-primary-bright")[i]
        node.parentNode.removeChild(node)
    }

    var tam2 = document.getElementById("contenedorPuntaje").getElementsByTagName("br").length;
    for(var i = tam2-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByTagName("br")[i]
        if(i > 3)
            node.parentNode.removeChild(node)
    }
}

function clearPractice () {
    //arregloPracticas = [];
    var tam = document.getElementById("contenedorPuntaje").getElementsByClassName("style-accent-bright").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByClassName("style-accent-bright")[i]
        node.parentNode.removeChild(node)
    }

    var tam2 = document.getElementById("contenedorPuntaje").getElementsByTagName("br").length;
    for(var i = tam2-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByTagName("br")[i]
        if(i > 6)
            node.parentNode.removeChild(node)
    }
}

function clearActivity () {
    //arregloActividades = [];
    var tam = document.getElementById("contenedorPuntaje").getElementsByClassName("style-gray-bright").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByClassName("style-gray-bright")[i]
        node.parentNode.removeChild(node)
    }

    var tam2 = document.getElementById("contenedorPuntaje").getElementsByTagName("br").length;
    for(var i = tam2-1; i >= 0; i--){
        var node = document.getElementById("contenedorPuntaje").getElementsByTagName("br")[i]
        if(i > 9)
            node.parentNode.removeChild(node)
    }
}

function addNoResults (option) {
    /*if(arregloComponentes.length == 0 && arregloElementos.length == 0 && arregloPracticas.length == 0 && arregloActividades.length == 0 && document.getElementById("contenedorPuntaje").getElementsByTagName("div").length == 0){
        div = document.createElement('div');
        div.className = 'row style-default-light';
        div.style.padding = '3%';
        div.innerHTML = '<h2 class="text-ultra-bold text-xxxl text-center">No hay resultados<br/></h2>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    }*/

    console.log("!dontShowLoadScreenOnPageLoad");
    console.log(dontShowLoadScreenOnPageLoad);
    console.log(dontShowLoadScreen);
    console.log(!dontShowLoadScreenOnPageLoad && !dontShowLoadScreen);
    if(!dontShowLoadScreenOnPageLoad && !dontShowLoadScreen){
        $("#dim_wrapper").animate({
            'opacity':0.85,
            height: 'toggle'
        }, 700);
        $('#dim_wrapper').hide(800);
        console.log('me apago');
    }

    if(arregloComponentes.length == 0 && option == 0){
        var div = document.createElement('div');
        div.className = 'row style-default-light';
        div.style.padding = '3%';
        div.innerHTML = '<h1 class="text-light">'+
                            'Componentes '+
                        '<strong class="text-accent-dark">'+
                            'No hay resultados'+
                        '</strong><br/></h1>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    } else if(arregloElementos.length == 0 && option == 1){
        var div = document.createElement('div');
        div.className = 'row style-primary-bright';
        div.style.padding = '3%';
        div.innerHTML = '<h1 class="text-light">'+
                            'Elementos de '+componenteSeleccionado.Descripcion+
                        '<strong class="text-accent-dark">'+
                            ' No hay resultados'+
                        '</strong><br/></h1>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    } else if(arregloPracticas.length == 0 && option == 2){
        var div = document.createElement('div');
        div.className = 'row style-accent-bright';
        div.style.padding = '3%';
        div.innerHTML = '<h1 class="text-light">'+
                            'Practicas de '+elementoSeleccionado.Descripcion+
                        '<strong class="text-accent-dark">'+
                            ' No hay resultados'+
                        '</strong><br/></h1>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    } else if(arregloActividades.length == 0 && option == 3){
        var div = document.createElement('div');
        div.className = 'row style-gray-bright';
        div.style.padding = '3%';
        div.innerHTML = '<h1 class="text-light">'+
                            'Actividades de '+practicaSeleccionada.Descripcion+
                        '<strong class="text-accent-dark">'+
                            ' No hay resultados'+
                        '</strong><br/></h1>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    } else if(document.getElementById("contenedorPuntaje").getElementsByTagName("div").length == 0){
        var div = document.createElement('div');
        div.className = 'row style-default-light';
        div.style.padding = '3%';
        div.innerHTML = '<h2 class="text-ultra-bold text-xxxl text-center">No hay resultados<br/></h2>';
        document.getElementById("contenedorPuntaje").appendChild(div);
    }
    dontShowLoadScreenOnPageLoad = false;
}

function formatDateCreationSingleDigits(date) {
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return year + '-' + (monthIndex+1) + '-' + day;
}

//********************************
//***   Separar por         ******
//***   secciones:          ******
//***   complementos        ******
//***   elementos--en HTML  ******
//********************************