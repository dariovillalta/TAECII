const electron = require('electron')
const path = require('path')
const sql = require('mssql')

var year = 2017
var componente

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

const pool1 = new sql.ConnectionPool(config, err => {
    // ... error checks
 
    // Query
    /*$( window ).resize(function() {
        if( $( window ).width() < 1200){
            console.log('1')
            //$('#contenedorGeneralPracticas').attr("class", "col-md-5 col-lg-4 height-6 scroll-sm");
            $('#contenedorGeneralPracticas').addClass("height-6");
            $('#contenedorGeneralPracticas').addClass("scroll-sm");
        }
        else{
            console.log('2')
            $('#contenedorGeneralPracticas').attr("class", "col-md-5 col-lg-4");
            $('#contenedorGeneralPracticas').removeClass("height-6");
            $('#contenedorGeneralPracticas').removeClass("scroll-sm");
        }
    });*/
 
    pool1.request() // or: new sql.Request(pool1)
    .query("select * from Componente where Descripcion='Ambiente de Control' and Anio='"+year+"' ", (err, result) => {
        // ... error checks
 
        console.dir(result);
        console.dir('ana');
        componente = result.recordset[1];
        getElements();
        getEvidence();
        getProduct();
        /*arreglo = result.recordset
        loadListUserTable()*/
    })
 
})

function sortByPriority1(a, b){
    // a is future, b is past, so a shows above b = -1
    if ((a.ID) == actividadSeleccionada.UnidadMedida) return -1;
    else return 1;
}

function sortByPriority2(a, b){
    // a is future, b is past, so a shows above b = -1
    if ((a.ID) == actividadSeleccionada.Evidencia2) return -1;
    else return 1;
}

function sortByProduct(a, b){
    // a is future, b is past, so a shows above b = -1
    if ((a.ID) == actividadSeleccionada.Producto) return -1;
    else return 1;
}

var arregloElemen = []
var arregloPracticas = [{Descripcion: "Seleccione un elemento."}]
var actividadSeleccionada
var arregloUnidadMedida = []
var arregloFechas = []
var arregloPosiblesActividades = []
var arregloProductos = []
var evidenciaSeleccionada
var productoSeleccionado

function getEvidence () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from UnidadMedida", (err, result) => {
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
                    arregloUnidadMedida = result.recordset;
                });
            }
        });
    }); // fin transaction
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
                });
            }
        });
    }); // fin transaction
}

function getElements(){
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Elemento where Componente='"+componente.ID+"'", (err, result) => {
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
                    console.log("Transaction committed.");
                    console.log(result);
                    arregloElemen = result.recordset;
                    loadListElements();
                });
            }
        });
    }); // fin transaction
}

function loadListElements(){
	var html = ''
    for(var i = 0; i < arregloElemen.length; i++){
        html += '<li class= "li" style="margin-top: 10%;" onclick="selectElement('+i+')"><a><span class="fa fa-chevron-right fa-2x"></span>'+arregloElemen[i].Nombre+'<p style="margin: 0% 10%;">'+arregloElemen[i].Descripcion+'</p></a></li>'
    }
	$('#elementsList li').first().after(html)
}

function selectElement (index) {
	for(var i = 0; i < document.getElementById("elementsList").getElementsByTagName("li").length-1; i++){
		var node = document.getElementById("elementsList").getElementsByTagName("li")[i+1]
        if(i != index)
        	node.setAttribute("class", "")
        else
        	node.setAttribute("class", "active")
    }
    clearPractice();
    clearActivity();
    //arregloPracticas = [{Descripcion: "Seleccione un elemento."}]
    var element = arregloElemen[index]
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Practica where Elemento='"+element.ID+"'", (err, result) => {
            if (err) {
                loadListPractices();
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction.commit(err => {
                    // ... error checks
                    console.log("Transaction committed Practicas.");
                    console.log('buscando Practica con =');
                    console.log(element);
                    console.log(result);
                    arregloPracticas = result.recordset;
                    if(arregloPracticas.length == 0)
                        arregloPracticas = [{Descripcion: "Seleccione otro elemento."}]
                    loadListPractices();
                });
            }
        });
    }); // fin transaction
    //loadListPractices();
}

loadListPractices()

function loadListPractices(){
    clearPractice();
    if(arregloPracticas[0].Descripcion != "Seleccione un elemento." && arregloPracticas[0].Descripcion != "Seleccione otro elemento.")
        for(var i = 0; i < arregloPracticas.length; i++){
            var aTag = '<a class="list-group-item" onclick="selectPractice('+i+')"><h5>'+arregloPracticas[i].Responsable+'</h5>'
                        +'<h4>'+arregloPracticas[i].Nombre+'</h4>'
                        +'<p class="hidden-xs hidden-sm">'+arregloPracticas[i].Descripcion+'</p>'
                        +'<div class="stick-top-right small-padding text-default-light text-sm">'+formatDate(new Date(arregloPracticas[i].FechaFinal))+'</div>'
                        +'<div class="stick-bottom-right btn btn-flat ink-reaction fa fa-circle"></div></a>'
            $('#contenedorPracticas').append(aTag);
        }
    else{
        var aTag = document.createElement('a');
        aTag.className = 'list-group-item';
        aTag.innerHTML = arregloPracticas[0].Descripcion
        document.getElementById('contenedorPracticas').appendChild(aTag);
    }
}

function selectPractice (index) {
    for(var i = 0; i < document.getElementById("contenedorPracticas").getElementsByTagName("a").length; i++){
        var node = document.getElementById("contenedorPracticas").getElementsByTagName("a")[i]
        if(i ==  index)
            node.className = 'list-group-item focus'
        else
            node.className = 'list-group-item'
    }
    clearActivity();
    var practice = arregloPracticas[index]
    var actividad
    const transaction = new sql.Transaction( pool1 );
    console.log('antes de transac Actividad')
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Actividad where Practica='"+practice.ID+"'", (err, result) => {
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
                    encontroPracticas = true;
                    console.log("Transaction committed Actividad.");
                    console.log(result);
                    actividad = result.recordset[0];
                    console.log('buscando Actividad con =');
                    console.log(practice);
                    //loadListPractices();
                    var div1 = document.createElement('div');
                    div1.className = 'col-md-12 col-lg-12';
                    div1.style.height = '100%';
                    //div1.style.overflowY = "scroll";
                    if(result.recordset.length > 1){
                        arregloPosiblesActividades = result.recordset;
                        for (var i = 0; i < arregloPosiblesActividades.length; i++) {
                            var aTag = '<a class="list-group-item" onclick="loadOneActivity('+i+')"><h5></h5>'
                                        +'<h4>'+arregloPosiblesActividades[i].Nombre+'</h4>'
                                        +'<p class="hidden-xs hidden-sm">'+arregloPosiblesActividades[i].Descripcion+'</p>'
                                        +'<div class="stick-top-right small-padding text-default-light text-sm"></div>'
                                        +'<div class="stick-bottom-right btn btn-flat ink-reaction fa fa-circle"></div></a>'
                            $('#contenedorActividadesASeleccionar').append(aTag);
                        };
                        $('#modalElegirAct').modal('show');
                    }
                    else if(actividad != undefined){
                        const transaction = new sql.Transaction( pool1 );
                        transaction.begin(err => {
                            var rolledBack = false
                     
                            transaction.on('rollback', aborted => {
                                // emited with aborted === true
                         
                                rolledBack = true
                            })
                            const request = new sql.Request(transaction);
                            request.query("select * from Actividad_FechasFinales where Actividad='"+actividad.ID+"'", (err, result) => {
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
                                        console.log("Transaction committed Fechas.");
                                        console.log(result);
                                        arregloFechas = result.recordset;
                                        var tam = document.getElementById("contenedorFechas").getElementsByTagName("div").length;
                                        for(var i = tam-1; i >= 0; i--){
                                            var node = document.getElementById("contenedorFechas").getElementsByTagName("div")[i]
                                            node.parentNode.removeChild(node)
                                        }
                                        var html = '';
                                        for (var i = 0; i < arregloFechas.length; i++) {
                                            html += '<div style="float: none; display: inline-block; margin: 0% 2%;">'+
                                                        '<div class="well">'+
                                                            '<div class="clearfix">'+
                                                                '<div class="pull-left"> FECHA DE PRODUCCIÓN : &nbsp;&nbsp;</div>'+
                                                                '<div class="pull-right"> '+formatDate(arregloFechas[i].FechaFinal)+' </div>'+
                                                            '</div>'+
                                                            '<div class="clearfix">'+
                                                            '</div>'+
                                                            '<div class="clearfix">'+
                                                                '<div class="pull-left"> PRODUCCIÓN : </div>'+
                                                                '<div class="pull-right"> '+arregloFechas[i].PorcentajeCompletadoPlaneacion+' </div>'+
                                                            '</div>'+
                                                        '</div>'+
                                                    '</div>'
                                        };
                                        $('#contenedorFechas').append(html);
                                    });
                                }
                            });
                        });
                        actividadSeleccionada = actividad;
                        arregloPosiblesActividades = result.recordset;
                        var dropdownEvidencia1 = '';
                        var arregloUnidadMedida1 = arregloUnidadMedida.sort(sortByPriority1);
                        for (var i = 0; i < arregloUnidadMedida1.length; i++)
                            dropdownEvidencia1 += '<option value="'+arregloUnidadMedida1[i].ID+'">'+arregloUnidadMedida1[i].Nombre+'</option>';
                        /*var dropdownEvidencia2 = '';
                        var arregloEvidencia22 = arregloEvidencia2.sort(sortByPriority2);
                        for (var i = 0; i < arregloEvidencia22.length; i++)
                            dropdownEvidencia2 += '<option value="'+arregloEvidencia22[i].ID+'">'+arregloEvidencia22[i].Nombre+'</option>';*/
                        var dropdownProducto = '';
                        var arregloProducto = arregloProductos.sort(sortByProduct);
                        for (var i = 0; i < arregloProducto.length; i++)
                            dropdownProducto += '<option value="'+arregloProducto[i].ID+'">'+arregloProducto[i].Nombre+'</option>';
                        div1.innerHTML = '<br>'+
                                            '<h1 class="no-margin">'+actividad.Nombre+'</h1>'+
                                            '<div class="btn-group stick-top-right">'+
                                                '<br>'+
                                                '<button class="btn btn-default" type="button" onclick="updateActivity('+0+')">Seleccionar Actividad</button>'+
                                            '</div>'+
                                            '<strong style="font-size: 18px; margin: 0%;">'+actividad.Responsable+'</strong>'+
                                            '<hr/>'+
                                            '<p class="lead">'+actividad.Descripcion+'</p>'+
                                            '<form id="myform" class="form">'+
                                                '<div class="form-group col-xs-6">'+
                                                    '<select id="unidadMedida" name="unidadMedida" class="form-control">'+
                                                        dropdownEvidencia1+
                                                    '</select>'+
                                                    '<label for="evidencia">Unidad de Medida</label>'+
                                                    '<button class="btn btn-default" style="width: 100%;" type="button" onclick="updateUnidadMedida()">Seleccionar evidencia</button>'+
                                                '</div>'+
                                                /*'<div class="form-group col-xs-6">'+
                                                    '<select id="evidencia2" name="evidencia2" class="form-control">'+
                                                        dropdownEvidencia2+
                                                    '</select>'+
                                                    '<label for="evidencia">Evidencia 2</label>'+
                                                    '<button class="btn btn-default" style="width: 100%;" type="button" onclick="updateEvidence2()">Seleccionar evidencia</button>'+
                                                '</div>'+*/
                                                '<div class="row">'+
                                                    '<div class="form-group col-xs-6">'+
                                                        '<input type="text" class="form-control" id="porcentajeCompletacion" required>'+
                                                        '<label for="porcentajeCompletacion">Producción</label>'+
                                                    '</div>'+
                                                    '<div class="form-group col-xs-6">'+
                                                        '<select id="producto" name="producto" class="form-control">'+
                                                            dropdownProducto+
                                                        '</select>'+
                                                        '<label for="producto">Producto</label>'+
                                                        '<button class="btn btn-default" type="button" style="width: 100%;" onclick="updateProduct()">Seleccionar producto</button>'+
                                                    '</div>'+
                                                '</div>'+
                                                '<div class="form-group" style="margin: 0%;">'+
                                                    '<div class="input-group date" id="demo-date-month">'+
                                                        '<div class="input-group-content">'+
                                                            '<input id="newDate" type="text" class="form-control datepicker" >'+
                                                            '<label>Fecha de Produccci&oacute;n Nueva</label>'+
                                                        '</div>'+
                                                        '<span class="input-group-addon"><i class="fa fa-calendar"></i></span>'+
                                                    '</div>'+
                                                '</div>'+
                                                '<div class="form-group text-center" style="margin: 0%;">'+
                                                    '<button class="btn btn-default" type="button" onclick="addFinalDate('+0+')">Agregar Fecha de Producción</button>'+
                                                '</div>'+
                                                '<div class="form-group">'+
                                                    '<label style="margin: 0%;">Fechas de Producción:</label>'+
                                                '</div>'+
                                                '<div id="contenedorFechas" class="text-center" style="overflow-y: hidden; white-space: nowrap; height: 100px;  width: 100%;">'+
                                                '</div>'+
                                            '</form>';
                        document.getElementById("contenedorActividad").appendChild(div1);
                    }
                    loadDatePicker();
                });
            }
        });
    }); // fin transaction
}

$('#modalElegirAct').on('hidden.bs.modal', function () {
    var tam = document.getElementById("contenedorActividadesASeleccionar").getElementsByTagName("a").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorActividadesASeleccionar").getElementsByTagName("a")[i]
        node.parentNode.removeChild(node)
    }
});


function loadOneActivity (index) {
    var tam = document.getElementById("contenedorActividadesASeleccionar").getElementsByTagName("a").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorActividadesASeleccionar").getElementsByTagName("a")[i]
        node.parentNode.removeChild(node)
    }
    actividadSeleccionada = arregloPosiblesActividades[index];
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Actividad_FechasFinales where Actividad='"+actividadSeleccionada.ID+"'", (err, result) => {
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
                    console.log("Transaction committed Fechas.");
                    console.log(result);
                    arregloFechas = result.recordset;
                    var tam = document.getElementById("contenedorFechas").getElementsByTagName("div").length;
                    for(var i = tam-1; i >= 0; i--){
                        var node = document.getElementById("contenedorFechas").getElementsByTagName("div")[i]
                        node.parentNode.removeChild(node)
                    }
                    var html = '';
                    for (var i = 0; i < arregloFechas.length; i++) {
                        html += '<div style="float: none; display: inline-block; margin: 0% 2%;">'+
                                    '<div class="well">'+
                                        '<div class="clearfix">'+
                                            '<div class="pull-left"> FECHA PRODUCCIÓN : &nbsp;&nbsp;</div>'+
                                            '<div class="pull-right"> '+formatDate(arregloFechas[i].FechaFinal)+' </div>'+
                                        '</div>'+
                                        '<div class="clearfix">'+
                                        '</div>'+
                                        '<div class="clearfix">'+
                                            '<div class="pull-left"> PRODUCCIÓN : </div>'+
                                            '<div class="pull-right"> '+arregloFechas[i].PorcentajeCompletadoPlaneacion+' </div>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'
                    };
                    $('#contenedorFechas').append(html);
                });
            }
        });
    });

    var div1 = document.createElement('div');
    div1.className = 'col-md-12 col-lg-12';
    var dropdownEvidencia1 = '';
    var arregloUnidadMedida1 = arregloUnidadMedida.sort(sortByPriority1);
    for (var i = 0; i < arregloUnidadMedida1.length; i++)
        dropdownEvidencia1 += '<option value="'+arregloUnidadMedida1[i].ID+'">'+arregloUnidadMedida1[i].Nombre+'</option>';
    /*var dropdownEvidencia2 = '';
    var arregloEvidencia22 = arregloEvidencia2.sort(sortByPriority2);
    for (var i = 0; i < arregloEvidencia22.length; i++)
        dropdownEvidencia2 += '<option value="'+arregloEvidencia22[i].ID+'">'+arregloEvidencia22[i].Nombre+'</option>';*/
    var dropdownProducto = '';
    var arregloProducto = arregloProductos.sort(sortByProduct);
    for (var i = 0; i < arregloProducto.length; i++)
        dropdownProducto += '<option value="'+arregloProducto[i].ID+'">'+arregloProducto[i].Nombre+'</option>';
    div1.innerHTML = '<br>'+
                        '<h1 class="no-margin">'+actividadSeleccionada.Nombre+'</h1>'+
                        '<div class="btn-group stick-top-right">'+
                            '<br>'+
                            '<button class="btn btn-default" type="button" onclick="updateActivity('+index+')">Seleccionar Actividad</button>'+
                        '</div>'+
                        '<strong style="font-size: 18px; margin: 0%;">'+actividadSeleccionada.Responsable+'</strong>'+
                        '<hr/>'+
                        '<p class="lead">'+actividadSeleccionada.Descripcion+'</p>'+
                        '<form class="form">'+
                            '<div class="form-group col-xs-6">'+
                                '<select id="unidadMedida" name="unidadMedida" class="form-control">'+
                                    dropdownEvidencia1+
                                '</select>'+
                                '<label for="evidencia">Unidad de Medida</label>'+
                                '<button class="btn btn-default" style="width: 100%;" type="button" onclick="updateUnidadMedida()">Seleccionar evidencia</button>'+
                            '</div>'+
                            /*'<div class="form-group col-xs-6">'+
                                '<select id="evidencia2" name="evidencia2" class="form-control">'+
                                    dropdownEvidencia2+
                                '</select>'+
                                '<label for="evidencia">Evidencia 2</label>'+
                                '<button class="btn btn-default" style="width: 100%;" type="button" onclick="updateEvidence2()">Seleccionar evidencia</button>'+
                            '</div>'+*/
                            '<div class="row">'+
                                '<div class="form-group col-xs-6">'+
                                    '<input type="text" class="form-control" id="porcentajeCompletacion">'+
                                    '<label for="porcentajeCompletacion">Producción</label>'+
                                '</div>'+
                                '<div class="form-group col-xs-6">'+
                                    '<select id="producto" name="producto" class="form-control">'+
                                        dropdownProducto+
                                    '</select>'+
                                    '<label for="producto">Producto</label>'+
                                    '<button class="btn btn-default" type="button" style="width: 100%;" onclick="updateProduct()">Seleccionar producto</button>'+
                                '</div>'+
                            '</div>'+
                            '<div class="form-group" style="margin: 0%;">'+
                                '<div class="input-group date" id="demo-date-month">'+
                                    '<div class="input-group-content">'+
                                        '<input id="newDate" type="text" class="form-control datepicker" >'+
                                        '<label>Fecha de Producci&oacute;n Nueva</label>'+
                                    '</div>'+
                                    '<span class="input-group-addon"><i class="fa fa-calendar"></i></span>'+
                                '</div>'+
                            '</div>'+
                            '<div class="form-group text-center" style="margin: 0%;">'+
                                '<button class="btn btn-default" type="button" onclick="addFinalDate('+index+')">Agregar Fecha Final de Actividad</button>'+
                            '</div>'+
                            '<div class="form-group">'+
                                '<label style="margin: 0%;">Fechas Finales:</label>'+
                            '</div>'+
                            '<div id="contenedorFechas" class="text-center" style="overflow-y: hidden; white-space: nowrap; height: 100px;  width: 100%;">'+
                            '</div>'+
                        '</form>';
    document.getElementById("contenedorActividad").appendChild(div1);
    loadDatePicker();
    $('#modalElegirAct').modal('hide');
}

function formatDate(dateO) {
    var date = dateO.toUTCString().split(" ");
    var monthNames = [
        "ENE", "FEB", "MAR",
        "ABR", "MAY", "JUN", "JUL",
        "AGO", "SEP", "OCT",
        "NOV", "DIC"
    ];

    var monthIndex;

    switch(date[2]){
        case "Jan": monthIndex = 0;
            break;
        case "Feb": monthIndex = 1;
            break;
        case "Mar": monthIndex = 2;
            break;
        case "Apr": monthIndex = 3;
            break;
        case "May": monthIndex = 4;
            break;
        case "Jun": monthIndex = 5;
            break;
        case "Jul": monthIndex = 6;
            break;
        case "Aug": monthIndex = 7;
            break;
        case "Sep": monthIndex = 8;
            break;
        case "Oct": monthIndex = 9;
            break;
        case "Nov": monthIndex = 10;
            break;
        case "Dec": monthIndex = 11;
            break;
    }

    var day = date[1];
    var year = date[3];

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

function formatDateCreationSingleDigits(date) {
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return year + '-' + (monthIndex+1) + '-' + day;
}

function loadDatePicker () {
    $('.datepicker').datepicker({
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es',
        todayHighlight: true
    });
    var primerDiaAnio = new Date(year, 0, 1);
    var ultimoDiaAnio = new Date(year, 11, 31);
    $('#newDate').datepicker('setStartDate', primerDiaAnio );
    $('#newDate').datepicker('setEndDate', ultimoDiaAnio );
    //$('#newDate').datepicker("setDate", 'today' );
}

function clearActivity () {
    var tam = document.getElementById("contenedorActividad").getElementsByTagName("div").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorActividad").getElementsByTagName("div")[i]
        node.parentNode.removeChild(node)
    }
}

function clearPractice () {
    var tam = document.getElementById("contenedorPracticas").getElementsByTagName("a").length;
    for(var i = tam-1; i >= 0; i--){
        var node = document.getElementById("contenedorPracticas").getElementsByTagName("a")[i]
        node.parentNode.removeChild(node)
    }
}

function updateActivity (index) {
    var responsable = 'Darayo';
    const transaction1 = new sql.Transaction( pool1 );
    transaction1.begin(err => {
        var rolledBack = false
 
        transaction1.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request1 = new sql.Request(transaction1);
        request1.query("update Actividad set Responsable = '"+responsable+"' where ID = '"+actividadSeleccionada.ID+"'", (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    transaction1.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction1.commit(err => {
                    // ... error checks
                    arregloPosiblesActividades[index].Responsable = responsable;
                    clearActivity();
                    loadOneActivity(index);
                    toastr.success('Se ha añadido un responsable satisfactoriamente para la actividad '+actividadSeleccionada.Nombre+'.', 'Éxito');
                });
            }
        });
    }); // fin transaction
}

function addFinalDate (index) {
    var nuevaFecha = new Date( $('#newDate').val().split("-")[2], ($('#newDate').val().split("-")[1]-1), $('#newDate').val().split("-")[0] );
    if(nuevaFecha != 'Invalid Date')
        nuevaFecha = nuevaFecha.toISOString();
    var porcentajeCompletacion = $('#porcentajeCompletacion').val();
    var comentario = '';
    toastr.clear();
    toastr.options.positionClass = "toast-top-full-width";
    toastr.options.progressBar = true;
    toastr.options.showEasing = 'swing';
    toastr.options.hideEasing = 'swing';
    toastr.options.showMethod = 'slideDown';
    toastr.options.hideMethod = 'slideUp';
    if(nuevaFecha != 'Invalid Date'){
        if(!isNaN(porcentajeCompletacion) && porcentajeCompletacion.length>0){
            const transaction1 = new sql.Transaction( pool1 );
            transaction1.begin(err => {
                var rolledBack = false
         
                transaction1.on('rollback', aborted => {
                    // emited with aborted === true
             
                    rolledBack = true
                })
                const request1 = new sql.Request(transaction1);
                request1.query("insert into Actividad_FechasFinales (Actividad, FechaFinal, PorcentajeCompletadoPlaneacion, PorcentajeCompletadoEjecucion, Anio, Comentario) values ("+actividadSeleccionada.ID+", '"+nuevaFecha+"', "+porcentajeCompletacion+", "+0+", "+year+", '"+comentario+"')", (err, result) => {
                    if (err) {
                        if (!rolledBack) {
                            console.log('error en rolledBack');
                            console.log(err);
                            transaction1.rollback(err => {
                                // ... error checks
                            });
                        }
                    }  else {
                        transaction1.commit(err => {
                            // ... error checks
                            clearActivity();
                            loadOneActivity(index);
                            toastr.success('Se ha añadido una nueva fecha para la actividad '+actividadSeleccionada.Nombre+'.', 'Éxito');
                        });
                    }
                });
            }); // fin transaction
        } else
            toastr.error('Ingrese un porcentaje de completación válido.', 'Error');
    } else
        toastr.error('Ingrese una fecha válida.', 'Error');
}

function updateUnidadMedida () {
    var evidenciaText = arregloUnidadMedida.filter(function( index ) {
        return $('#unidadMedida').val() == index.ID;
    });
    evidenciaSeleccionada = evidenciaText[0];
    $('#textUnidadMedida').text("¿Desea cambiar la unidad de medida a "+evidenciaText[0].Nombre+"?");
    $('#modalUnidadMedida').modal('show');
}

function saveUpdateUnidadMedida () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("update Actividad set UnidadMedida = '"+evidenciaSeleccionada.ID+"' where ID = '"+actividadSeleccionada.ID+"'", (err, result) => {
            if (err) {
                console.log(err)
                $('#modalUnidadMedida').modal('hide');
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
                    $('#modalUnidadMedida').modal('hide');
                    toastr.clear();
                    toastr.options.positionClass = "toast-top-full-width";
                    toastr.options.progressBar = true;
                    toastr.options.showEasing = 'swing';
                    toastr.options.hideEasing = 'swing';
                    toastr.options.showMethod = 'slideDown';
                    toastr.options.hideMethod = 'slideUp';
                    toastr.success('La actividad seleccionada fue modificada exitosamente!', 'Éxito');
                });
            }
        });
    }); // fin transaction
}

function updateEvidence2 () {
    var evidenciaText = arregloEvidencia2.filter(function( index ) {
        return $('#evidencia2').val() == index.ID;
    });
    evidenciaSeleccionada = evidenciaText[0];
    $('#textEvidence2').text("¿Desea cambiar la evidencia 2 a "+evidenciaText[0].Nombre+"?");
    $('#modalEvidence2').modal('show');
}

function saveUpdateEvidence2 () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("update Actividad set Evidencia2 = '"+(evidenciaSeleccionada.ID-1)+"' where ID = '"+actividadSeleccionada.ID+"'", (err, result) => {
            if (err) {
                console.log(err)
                $('#modalEvidence2').modal('hide');
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
                    $('#modalEvidence2').modal('hide');
                    toastr.clear();
                    toastr.options.positionClass = "toast-top-full-width";
                    toastr.options.progressBar = true;
                    toastr.options.showEasing = 'swing';
                    toastr.options.hideEasing = 'swing';
                    toastr.options.showMethod = 'slideDown';
                    toastr.options.hideMethod = 'slideUp';
                    toastr.success('La actividad seleccionada fue modificada exitosamente!', 'Éxito');
                });
            }
        });
    }); // fin transaction
}

function updateProduct () {
    var evidenciaText = arregloProductos.filter(function( index ) {
        return $('#producto').val() == index.ID;
    });
    productoSeleccionado = evidenciaText[0];
    $('#textProduct').text("¿Desea cambiar el producto a "+evidenciaText[0].Nombre+"?");
    $('#modalProducto').modal('show');
}

function saveUpdateProduct () {
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("update Actividad set Producto = '"+productoSeleccionado.ID+"' where ID = '"+actividadSeleccionada.ID+"'", (err, result) => {
            if (err) {
                console.log(err)
                $('#modalProducto').modal('hide');
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
                    $('#modalProducto').modal('hide');
                    toastr.clear();
                    toastr.options.positionClass = "toast-top-full-width";
                    toastr.options.progressBar = true;
                    toastr.options.showEasing = 'swing';
                    toastr.options.hideEasing = 'swing';
                    toastr.options.showMethod = 'slideDown';
                    toastr.options.hideMethod = 'slideUp';
                    toastr.success('La actividad seleccionada fue modificada exitosamente!', 'Éxito');
                });
            }
        });
    }); // fin transaction
}