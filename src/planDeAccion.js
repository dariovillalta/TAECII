const electron = require('electron')
const path = require('path')
const sql = require('mssql')

var email = 'dario.villalta@gmail.com'
var year =  2017

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
 
    pool1.request() // or: new sql.Request(pool1)
    .query("select actividad.*, fecha.* from Actividad_FechasFinales fecha right join (select * from Actividad where CorreoResponsable='"+email+"' and Anio='"+year+"') actividad on fecha.Actividad = actividad.ID order by FechaFinal", (err, result) => {
        // ... error checks
 
        arregloActividades = result.recordset
        console.log(arregloActividades)
        arregloActividades = arregloActividades.sort(sortByDate)
        console.log(arregloActividades)
        displayActivities()
        getProduct()
        getEvidence()
    })
 
})

var arregloActividades = []
var arregloFechasFinales = []
var arregloActividadesFechasFinales = []
var actividadSeleccionada
var arregloFechasSeleccionadas
var indexSeleccionadoGlobal
var actividadSeleccionadaAntigua
var arregloUnidadMedida
var arregloProductos

function hideEditComp (event) {
    var tocoCarta = false;
    var id = event;
    console.log(id.target);
    var x = document.getElementById("actividadSeleccionada");
    if(id.target.className == '' || id.target.className == 'timeline-inverted')
        x.style.display = "none";
}

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

function displayActivities () {
    var html = ''
    var currentDate = new Date()
    for (var i = 0; i < arregloActividades.length; i++) {
        var fechaText
        var classText
        if(arregloActividades[i].FechaFinal != null)
            fechaText = formatDate(arregloActividades[i].FechaFinal)
        else
            fechaText = 'No tiene fecha final'
        var className = ''
        if(i%2 == 0)
            className = 'timeline-inverted'
        if(arregloActividades[i].FechaFinal != null) {
            if(arregloActividades[i].FechaFinal.getTime() >= currentDate.getTime())
                classText = 'style-primary'
            else
                classText = 'style-default-dark'
        } else
            classText = 'style-primary'
        html += '<div onclick="hideEditComp(event)">'+
                    '<li class="'+className+'">'+
                        '<div class="timeline-circ circ-xl '+classText+'"><span class="glyphicon glyphicon-leaf"></span></div>'+
                        '<div class="timeline-entry" onclick="selectActivity('+i+')" data-toggle="tooltip" data-placement="top" title="" data-original-title="Click dos veces para cerrar ventana.">'+
                            '<div class="card '+classText+'">'+
                                '<div class="card-body small-padding">'+
                                    '<div class="text-divider">'+
                                        '<p class="text-center">'+
                                            '<span class="text-xxl">'+fechaText+'</span>'+
                                        '</p>'+
                                    '</div>'+
                                    '<span class="text-medium text-xl">'+arregloActividades[i].Nombre+'</span><br/>'+
                                    '<span class="opacity-50 text-lg">'+arregloActividades[i].Descripcion+'</span>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</li>'+
                '</div>'
    };
    if(arregloActividades.length == 0){
        $('#contenedorActividades').removeClass('collapse-xs')
        $('#contenedorActividades').addClass('collapse-lg')
        html = '<div>'+
                    '<li>'+
                        '<div class="timeline-circ circ-xl style-primary"><span class="glyphicon glyphicon-leaf"></span></div>'+
                        '<div class="timeline-entry">'+
                            '<div class="card style-primary">'+
                                '<div class="card-body small-padding">'+
                                    '<div class="text-divider">'+
                                        '<p class="text-center">'+
                                            '<span class="text-xxl">No hay Actividades creadas</span>'+
                                        '</p>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</li>'+
                    '</div>'
    }
    $('#contenedorActividades').append(html);
}

function clearDisplayActivities () {
    for(var i = 0; i < document.getElementById("contenedorActividades").getElementsByTagName("div").length; i++){
        var node = document.getElementById("contenedorActividades").getElementsByTagName("div")[i]
        node.parentNode.removeChild(node)
    }
}

function formatDate(dateO) {
    var date = dateO.toUTCString().split(" ");
    var monthNames = [
        "Ene", "Feb", "Mar",
        "Abr", "May", "Jun", "Jul",
        "Ago", "Sep", "Oct",
        "Nov", "Dic"
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

function formatDateCreation(dateO) {
    var date = dateO.toUTCString().split(" ");
    var monthIndex;

    switch(date[2]){
        case "Jan": monthIndex = 1;
            break;
        case "Feb": monthIndex = 2;
            break;
        case "Mar": monthIndex = 3;
            break;
        case "Apr": monthIndex = 4;
            break;
        case "May": monthIndex = 5;
            break;
        case "Jun": monthIndex = 6;
            break;
        case "Jul": monthIndex = 7;
            break;
        case "Aug": monthIndex = 8;
            break;
        case "Sep": monthIndex = 9;
            break;
        case "Oct": monthIndex = 10;
            break;
        case "Nov": monthIndex = 11;
            break;
        case "Dec": monthIndex = 12;
            break;
    }

    var day = date[1];
    var year = date[3];

    if (day.toString().length == 1)
        day = '0'+day
    if (monthIndex.toString().length == 1)
        monthIndex = '0'+monthIndex

    return year + '-' + monthIndex + '-' + day;
}

function formatDateCreationSingleDigits(date) {
    var monthNames = [
        "Ene", "Feb", "Mar",
        "Abr", "May", "Jun", "Jul",
        "Ago", "Sep", "Oct",
        "Nov", "Dec"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return year + '-' + (monthIndex+1) + '-' + day;
}

function selectActivity (index) {
    indexSeleccionadoGlobal = index;
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Actividad where ID='"+arregloActividades[index].ID[0]+"'", (err, result) => {
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
                    actividadSeleccionada = result.recordset[0];
                    const transaction1 = new sql.Transaction( pool1 );
                    transaction1.begin(err => {
                        var rolledBack = false
                 
                        transaction1.on('rollback', aborted => {
                            // emited with aborted === true
                     
                            rolledBack = true
                        })
                        const request1 = new sql.Request(transaction1);
                        request1.query("select * from Actividad_FechasFinales where Actividad='"+actividadSeleccionada.ID+"'", (err, result) => {
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
                                    arregloFechasSeleccionadas = result.recordset;
                                    arregloFechasSeleccionadas = arregloFechasSeleccionadas.sort(sortBySelection);
                                    if(arregloFechasSeleccionadas.length != 0)
                                        loadEditComponent()
                                    else{
                                        toastr.clear();
                                        toastr.options.positionClass = "toast-top-full-width";
                                        toastr.options.progressBar = true;
                                        toastr.options.showEasing = 'swing';
                                        toastr.options.hideEasing = 'swing';
                                        toastr.options.showMethod = 'slideDown';
                                        toastr.options.hideMethod = 'slideUp';
                                        toastr.warning('La actividad seleccionada no tiene fecha final. Agregue una fecha desde la pestaña de los Componentes de Control Interno', 'Advertencia');
                                        var x = document.getElementById("actividadSeleccionada");
                                        x.style.display = "none";
                                    }
                                });
                            }
                        });
                    }); // fin transaction interna
                });
            }
        });
    }); // fin transaction
}

function sortBySelection(a, b){
    // a is future, b is past, so a shows above b = -1
    if (a.FechaFinal.getTime() == arregloActividades[indexSeleccionadoGlobal].FechaFinal.getTime()) return -1;
    // b is future, a is past, so b shows above a = -1
    if (b.FechaFinal.getTime() == arregloActividades[indexSeleccionadoGlobal].FechaFinal.getTime()) return 1;
    // both a and b are similarly future or past so compare on their values alone, in ascending order
    if (a.FechaFinal >= b.FechaFinal)
        return -1;
    else
        return 1;
}

function sortByDate(a, b){
    if (b.FechaFinal == null && a.FechaFinal != null)
        return -1;
    else if(a.FechaFinal == null && b.FechaFinal != null)
        return 1;
    else if(a.FechaFinal == null && b.FechaFinal == null)
        return 1;
    var currentDate = new Date();
    // a is future, b is past, so a shows above b = -1
    if (a.FechaFinal.getTime() >= currentDate.getTime() && b.FechaFinal.getTime() < currentDate.getTime()) return -1;
    // a is past, b is future, so a shows below b = 1
    if (a.FechaFinal.getTime() < currentDate.getTime() && b.FechaFinal.getTime() >= currentDate.getTime()) return 1;
    // both a and b are similarly future or past so compare on their values alone, in ascending order
    // if a > b then it should show below b, = positive result
    if (a.FechaFinal.getTime() >= currentDate.getTime() && b.FechaFinal.getTime() >= currentDate.getTime()){
        if(a.FechaFinal.getTime() > b.FechaFinal.getTime())
            return 1;
        else
            return -1;
    }
    return b.FechaFinal.getTime() - a.FechaFinal.getTime();
}

function loadEditComponent () {
    /*$(".slide").each(function() {
        console.log($(this));
        console.log($(this).attr('value'));
        (<any>$(this)).slider({
          value: parseInt($(this).attr('value')),
          slide: function(event, ui) {
            var id = event.target.id;
            console.log(id);
            $('#slider-value'+id).empty().append(ui.value);
          },
          create: function(event, ui) {
            var id = event.target.id;
            console.log(id);
            $('#slider-value'+id).empty().append(ui.value);
            (<any>$(this)).slider( "max", parseInt($(this).attr('max')) );
            console.log('.......');
            console.log(parseInt($(this).attr('max')));
          }
        });
      });*/
    resetSlidersUpdate()
    //Cargando Componente de vista de actividad
    var fueSeleccionadaOtra = false;
    if($('#Nombre').val() != actividadSeleccionada.Nombre)
        fueSeleccionadaOtra = true;
    var textoDescripcion = '', textoNombre = '', textoFechaInicio = '', textoUnidadMedida = '', textoEvidencia2 = '', textoProducto = '';
    if(actividadSeleccionada.Descripcion != null)
        textoDescripcion = actividadSeleccionada.Descripcion;
    if(actividadSeleccionada.FechaInicio != null)
        textoFechaInicio = actividadSeleccionada.FechaInicio;
    if(actividadSeleccionada.Nombre != null)
        textoNombre = actividadSeleccionada.Nombre;
    if(actividadSeleccionada.UnidadMedida != null)
        textoUnidadMedida = arregloUnidadMedida.filter(function( index ) {
            return actividadSeleccionada.UnidadMedida == (index.ID);
        });
    /*if(actividadSeleccionada.Evidencia2 != null)
        textoEvidencia2 = arregloEvidencia.filter(function( index ) {
            return actividadSeleccionada.Evidencia2 == (index.ID-1);
        });*/
    if(actividadSeleccionada.Producto != null)
        textoProducto = arregloProductos.filter(function( index ) {
            return actividadSeleccionada.Producto == (index.ID);
        });
    $('#Descripcion').val(textoDescripcion);
    $('#Nombre').val(textoNombre);
    $('#FechaInicio').val( formatDate(textoFechaInicio) );
    if(textoUnidadMedida)
        $('#UnidadMedida').val(textoUnidadMedida[0].Nombre);
    /*if(textoEvidencia2)
        $('#Evidencia2').val(textoEvidencia2[0].Nombre);*/
    if(textoProducto)
        $('#Producto').val(textoProducto[0].Nombre);
    $('#success').hide(0);
    $('#error').hide(0);
    fixingFloatingLabels();
    if(actividadSeleccionadaAntigua == arregloActividades [indexSeleccionadoGlobal].FechaFinal.getTime() || actividadSeleccionadaAntigua == null || (actividadSeleccionadaAntigua != arregloActividades[indexSeleccionadoGlobal].FechaFinal.getTime() && document.getElementById("actividadSeleccionada").style.display == "none")) {
        var x = document.getElementById("actividadSeleccionada");
        if (x.style.display === "none")
            x.style.display = "block";
        else
            x.style.display = "none";
    }
    actividadSeleccionadaAntigua = arregloActividades[indexSeleccionadoGlobal].FechaFinal.getTime();
}

loadDatePicker()

function loadDatePicker () {
    $('.datepicker').datepicker({
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es',
        todayHighlight: true
    });
    //$('#newDate').datepicker("setDate", 'today' );
}

function resetSlidersUpdate () {
    for(var i = 0; i < document.getElementById("contenedorFechasFinalesUpdate").getElementsByTagName("div").length; i++){
        var node = document.getElementById("contenedorFechasFinalesUpdate").getElementsByTagName("div")[i]
        node.parentNode.removeChild(node)
    }

    for (var i = 0; i < arregloFechasSeleccionadas.length; i++) {
        var div1 = document.createElement('div');
        if(i == arregloFechasSeleccionadas.length-1){
            div1.style.display = 'flex';
            div1.style.justifyContent = 'center';
        } else{
            div1.style.float = 'left'
            div1.style.marginLeft = '13%'
        }
        div1.innerHTML = '<div class="form-group control-width-normal">'+
                            '<div class="input-group date" id="demo-date-month">'+
                                '<div class="input-group-content">'+
                                    '<input id="fecha'+i+'" type="text" class="form-control datepicker" required>'+
                                    '<label for="fecha'+i+'">Fecha de entrega:</label>'+
                                '</div>'+
                                '<span class="input-group-addon"><i class="fa fa-calendar"></i></span>'+
                            '</div>'+
                            '<div class="form-group">'+
                                '<textarea name="comentario'+i+'" id="comentario'+i+'" class="form-control"></textarea>'+
                                '<label for="comentario'+i+'" class="textSize">Comentario: </label>'+
                            '</div>'+
                            '<br/>'+
                            '<br/>'+
                            '<div class="input-group">'+
                                '<div class="slide" id="'+i+'" max="'+arregloFechasSeleccionadas[i].PorcentajeCompletadoPlaneacion+'" value="'+arregloFechasSeleccionadas[i].PorcentajeCompletadoEjecucion+'"></div>'+
                                '<div class="input-group-addon" style="font-size: 26px;" id="slider-value'+i+'" max="'+arregloFechasSeleccionadas[i].PorcentajeCompletadoPlaneacion+'" value="'+arregloFechasSeleccionadas[i].PorcentajeCompletadoEjecucion+'">'+arregloFechasSeleccionadas[i].PorcentajeCompletadoEjecucion+'</div>'+
                            '</div>'+
                            '<br/>'+
                            '<div class="text-center">'+
                                '<button type="button" class="btn ink-reaction btn-raised btn-primary text-center" onclick="terminarActividad('+i+')">Terminado!</button>'+
                            '</div>'+
                        '</div>'
        document.getElementById("contenedorFechasFinalesUpdate").appendChild(div1);

        $('#'+i).slider({
            value: arregloFechasSeleccionadas[i].PorcentajeCompletadoEjecucion,
            slide: function(event, ui) {
                var id = event.target.id;
                $('#slider-value'+id).empty().append(ui.value);
            },
            create: function(event, ui) {
                var id = event.target.id;
                $('#slider-value'+id).empty().append(ui.value);
            },
            max: arregloFechasSeleccionadas[i].PorcentajeCompletadoPlaneacion
        });

        $('#slider-value'+i).empty().append(arregloFechasSeleccionadas[i].PorcentajeCompletadoEjecucion);
    };


    //arreglando bug floating label
    fixingFloatingLabels();
    //fin arreglando bug floating label

    //iniciando datepicker(todos)
    /*$('.datepicker').datepicker({
        format: "mm-yyyy",
        viewMode: "months", 
        minViewMode: "months"
    });*/
    $('.datepicker').datepicker({
        format: "dd-mm-yyyy",
        viewMode: "days", 
        minViewMode: "days",
        language: 'es'
    });
    var primerDiaAnio = new Date(year, 0, 1);
    var ultimoDiaAnio = new Date(year, 11, 31);
    for (var i = 0; i < arregloFechasSeleccionadas.length; i++) {
        $('#fecha'+i).datepicker("setDate", new Date( $.datepicker.parseDate('yy-mm-dd',formatDateCreation(arregloFechasSeleccionadas[i].FechaFinal)) ) );
        $('#fecha'+i).datepicker('setStartDate', primerDiaAnio );
        $('#fecha'+i).datepicker('setEndDate', ultimoDiaAnio );
        $('#comentario'+i).val(arregloFechasSeleccionadas[i].Comentario);
    }
}

function fixingFloatingLabels () {
    //arreglando bug floating label
    $('.floating-label .form-control').on('keyup change', function (e) {
        var input = $(e.currentTarget);

        if ($.trim(input.val()) !== '') {
            input.addClass('dirty').removeClass('static');
        } else {
            input.removeClass('dirty').removeClass('static');
        }
    });

    $('.floating-label .form-control').each(function () {
        var input = $(this);

        if ($.trim(input.val()) !== '') {
            input.addClass('static').addClass('dirty');
        }
    });

    $('.form-horizontal .form-control').each(function () {
        $(this).after('<div class="form-control-line"></div>');
    });
}

//Update Activity 
function updateActivity() {
    //var descripcion = $('#Descripcion').val();
    //var nombre = $('#Nombre').val();
    //var fechainicio = $('#FechaInicio').val();
    var evidencia = $('#Evidencia').val();
    var producto = $('#Producto').val();
    $('#update').click(function(){
        var button = $(this);
        button.attr('disabled', 'disabled');
        setTimeout(function() {
             button.removeAttr('disabled');
        } , 4000);
    });
    const transaction1 = new sql.Transaction( pool1 );
    transaction1.begin(err => {
        var rolledBack = false
 
        transaction1.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request1 = new sql.Request(transaction1);
        request1.query("update Actividad set Evidencia='"+evidencia+"', Producto='"+producto+"' where ID='"+actividadSeleccionada.ID+"'", (err, result) => {
            if (err) {
                if (!rolledBack) {
                    console.log('error en rolledBack');
                    $('#error').show("slow");
                    setTimeout(function(){
                        $('#error').hide("slow");
                    }, 3000);
                    transaction1.rollback(err => {
                        // ... error checks
                    });
                }
            }  else {
                transaction1.commit(err => {
                    // ... error checks
                    $('#success').show("slow");
                    setTimeout(function(){
                        $('#success').hide("slow");
                    }, 3000);
                });
            }
        });
    }); // fin transaction
}

//add final date
function addFinalDate () {
    var nuevaFecha = new Date( $('#newDate').val().split("-")[2], ($('#newDate').val().split("-")[1]-1), $('#newDate').val().split("-")[0] );
    var porcentajeCompletacion = $('#porcentajeCompletacion').val();
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
                request1.query("insert into Actividad_FechasFinales (Actividad, FechaFinal, PorcentajeCompletadoPlaneacion, PorcentajeCompletadoEjecucion) values ("+actividadSeleccionada.ID+", '"+formatDateCreationSingleDigits(nuevaFecha)+"', "+porcentajeCompletacion+", "+0+")", (err, result) => {
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
                            pool1.request().query("select actividad.*, fecha.* from Actividad_FechasFinales fecha right join (select * from Actividad where CorreoResponsable='"+email+"' and Anio='"+year+"') actividad on fecha.Actividad = actividad.ID order by FechaFinal", (err, result) => {
                                arregloActividades = result.recordset;
                                arregloActividades = arregloActividades.sort(sortByDate)
                                clearDisplayActivities()
                                displayActivities()
                            })
                            var x = document.getElementById("actividadSeleccionada");
                            x.style.display = "none";
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

function terminarActividad(index) {
    var porcentajeCompletadoEjecucion = $('#'+index).slider("option", "value");;
    var fecha = new Date( $('#fecha'+index).val().split("-")[2], ($('#fecha'+index).val().split("-")[1]-1), $('#fecha'+index).val().split("-")[0] );
    var comentario = $('#comentario'+index).val();
    if(comentario == null || comentario == undefined || comentario.length == 0)
        comentario = '';
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("update Actividad_FechasFinales set PorcentajeCompletadoEjecucion = '"+porcentajeCompletadoEjecucion+"', FechaFinal = '"+formatDateCreationSingleDigits(fecha)+"', Comentario = '"+comentario+"' where ID = '"+arregloFechasSeleccionadas[index].ID+"'", (err, result) => {
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
                    updateComponents(index);
                });
            }
        });
    }); // fin transaction fechas finales
}

function updateComponents(index) {
    var arregloFechas = [];
    const transaction = new sql.Transaction( pool1 );
    transaction.begin(err => {
        var rolledBack = false
 
        transaction.on('rollback', aborted => {
            // emited with aborted === true
     
            rolledBack = true
        })
        const request = new sql.Request(transaction);
        request.query("select * from Actividad_FechasFinales where Actividad = '"+arregloFechasSeleccionadas[index].Actividad+"'", (err, result) => {
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
                    console.log("Transaction committed FECHAS.");
                    arregloFechas = result.recordset;
                    //          ***** INICIO tran Activi **********
                    var numerador = 0, denominador = 0;
                    for (var i = 0; i < arregloFechas.length; i++) {
                        numerador += arregloFechas[i].PorcentajeCompletadoEjecucion;
                        denominador += arregloFechas[i].PorcentajeCompletadoPlaneacion;
                    };
                    var porcentajeActividad = (numerador / denominador) * 100;
                    transaction.begin(err => {
                        var rolledBack = false
                 
                        transaction.on('rollback', aborted => {
                            // emited with aborted === true
                     
                            rolledBack = true
                        })
                        const request1 = new sql.Request(transaction);
                        //Actualizando el porcentaje de fecha final a la actividad
                        console.log("Porcentaje actividad = " + porcentajeActividad)
                        request1.query("update Actividad set PorcentajeCompletado = "+porcentajeActividad+" where ID = '"+actividadSeleccionada.ID+"'", (err, result) => {
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
                                    console.log("Transaction committed ACTIVIDAD UPDATe.");
                                    //          ***** INICIO tran Pract **********
                                    transaction.begin(err => {
                                        var rolledBack = false
                                 
                                        transaction.on('rollback', aborted => {
                                            // emited with aborted === true
                                     
                                            rolledBack = true
                                        })
                                        const request2 = new sql.Request(transaction);
                                        //Trayendo todas las actividades asociadas a la practica
                                        request2.query("select * from Actividad where Practica = '"+actividadSeleccionada.Practica+"'", (err, result) => {
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
                                                    console.log("Transaction committed ACTIVIDAD.");
                                                    var arregloDeActividades = result.recordset;
                                                    var numerador = 0, denominador = 0;
                                                    for (var i = 0; i < arregloDeActividades.length; i++) {
                                                        numerador += arregloDeActividades[i].PorcentajeCompletado;
                                                        denominador += 100;
                                                    };
                                                    var porcentajePractica = (numerador / denominador) * 100;
                                                    console.log(porcentajePractica);
                                                    transaction.begin(err => {
                                                        var rolledBack = false
                                                 
                                                        transaction.on('rollback', aborted => {
                                                            // emited with aborted === true
                                                     
                                                            rolledBack = true
                                                        })
                                                        const request3 = new sql.Request(transaction);
                                                        //Actualizando la practica
                                                        console.log("Porcentaje Practica = " + porcentajePractica)
                                                        request3.query("update Practica set PorcentajeCompletado = '"+porcentajePractica+"' where ID = '"+actividadSeleccionada.Practica+"'", (err, result) => {
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
                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                    transaction.begin(err => {
                                                                        var rolledBack = false
                                                                 
                                                                        transaction.on('rollback', aborted => {
                                                                            // emited with aborted === true
                                                                     
                                                                            rolledBack = true
                                                                        })
                                                                        const request4 = new sql.Request(transaction);
                                                                        //Trayendo la practica para poder buscar las demas practicas asociadas con ese elemento
                                                                        request4.query("select * from Practica where ID = '"+actividadSeleccionada.Practica+"'", (err, result) => {
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
                                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                                    var practica = result.recordset[0];
                                                                                    transaction.begin(err => {
                                                                                        var rolledBack = false
                                                                                 
                                                                                        transaction.on('rollback', aborted => {
                                                                                            // emited with aborted === true
                                                                                     
                                                                                            rolledBack = true
                                                                                        })
                                                                                        const request5 = new sql.Request(transaction);
                                                                                        //Trayendo todas las practicas asociadas al elemento
                                                                                        request5.query("select * from Practica where Elemento = '"+practica.Elemento+"'", (err, result) => {
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
                                                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                                                    var arregloDePracticas = result.recordset;
                                                                                                    var numerador = 0, denominador = 0;
                                                                                                    var numerador = 0, denominador = 0;
                                                                                                    for (var i = 0; i < arregloDePracticas.length; i++) {
                                                                                                        numerador += arregloDePracticas[i].PorcentajeCompletado;
                                                                                                        denominador += 100;
                                                                                                    };
                                                                                                    var porcentajeElemento = (numerador / denominador) * 100;
                                                                                                    transaction.begin(err => {
                                                                                                        var rolledBack = false
                                                                                                 
                                                                                                        transaction.on('rollback', aborted => {
                                                                                                            // emited with aborted === true
                                                                                                     
                                                                                                            rolledBack = true
                                                                                                        })
                                                                                                        const request6 = new sql.Request(transaction);
                                                                                                        //Actualizando el elemento
                                                                                                        console.log("Porcentaje Elemento = " + porcentajeElemento)
                                                                                                        request6.query("update Elemento set PorcentajeCompletado = '"+porcentajeElemento+"' where ID = '"+practica.Elemento+"'", (err, result) => {
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
                                                                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                                                                    transaction.begin(err => {
                                                                                                                        var rolledBack = false
                                                                                                                 
                                                                                                                        transaction.on('rollback', aborted => {
                                                                                                                            // emited with aborted === true
                                                                                                                     
                                                                                                                            rolledBack = true
                                                                                                                        })
                                                                                                                        const request7 = new sql.Request(transaction);
                                                                                                                        //Trayendo el elemento para poder buscar los demas elemento asociadas con ese componente
                                                                                                                        request7.query("select * from Elemento where ID = '"+practica.Elemento+"'", (err, result) => {
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
                                                                                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                                                                                    var elemento = result.recordset[0];
                                                                                                                                    transaction.begin(err => {
                                                                                                                                        var rolledBack = false
                                                                                                                                 
                                                                                                                                        transaction.on('rollback', aborted => {
                                                                                                                                            // emited with aborted === true
                                                                                                                                     
                                                                                                                                            rolledBack = true
                                                                                                                                        })
                                                                                                                                        const request8 = new sql.Request(transaction);
                                                                                                                                        //Trayendo todos los elemento asociados al componente
                                                                                                                                        request8.query("select * from Elemento where Componente = '"+elemento.Componente+"'", (err, result) => {
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
                                                                                                                                                    console.log("Transaction committed ACTIVIDAD.");
                                                                                                                                                    var arregloDeElementos = result.recordset;
                                                                                                                                                    var numerador = 0, denominador = 0;
                                                                                                                                                    for (var i = 0; i < arregloDeElementos.length; i++) {
                                                                                                                                                        numerador += arregloDeElementos[i].PorcentajeCompletado;
                                                                                                                                                        denominador += 100;
                                                                                                                                                    };
                                                                                                                                                    var porcentajeComponente = (numerador / denominador) * 100;
                                                                                                                                                    transaction.begin(err => {
                                                                                                                                                        var rolledBack = false
                                                                                                                                                 
                                                                                                                                                        transaction.on('rollback', aborted => {
                                                                                                                                                            // emited with aborted === true
                                                                                                                                                     
                                                                                                                                                            rolledBack = true
                                                                                                                                                        })
                                                                                                                                                        const request9 = new sql.Request(transaction);
                                                                                                                                                        console.log("Porcentaje Componente = " + porcentajeComponente)
                                                                                                                                                        request9.query("update Componente set PorcentajeCompletado = '"+porcentajeComponente+"' where ID = '"+elemento.Componente+"'", (err, result) => {
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
                                                                                                                                                                    console.log("FIIIIIIIIN.");
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
                                                                                                                                                        //          ***** FIN tran Activi **********
                                                                                                                                                    });
                                                                                                                                                });
                                                                                                                                            }
                                                                                                                                        });
                                                                                                                                        //          ***** FIN Trayendo todos los elemento asociados al componente **********
                                                                                                                                    });
                                                                                                                                });
                                                                                                                            }
                                                                                                                        });
                                                                                                                        //          ***** FIN Trayendo el elemento para poder buscar los demas elemento asociadas con ese componente **********
                                                                                                                    });
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                        //          ***** FIN Actualizando el elemento **********
                                                                                                    });
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                        //          ***** FIN Trayendo todas las practicas asociadas al elemento **********
                                                                                    });
                                                                                });
                                                                            }
                                                                        });
                                                                        //          ***** FIN Trayendo la practica para poder buscar las demas practicas asociadas con ese elemento **********
                                                                    });
                                                                });
                                                            }
                                                        });
                                                        //          ***** FIN Actualizando la practica **********
                                                    });
                                                });
                                            }
                                        });
                                        //          ***** FIN Trayendo todas las actividades asociadas a la practica **********
                                    });
                                });
                            }
                        });
                        //          ***** FIN Actualizando el porcentaje de fecha final a la actividad **********
                    });
                });
            }
        });
    }); // fin transaction fechas finales
}